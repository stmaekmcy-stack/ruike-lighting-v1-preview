import assert from 'node:assert/strict'
import { once } from 'node:events'
import test from 'node:test'
import nodemailer from 'nodemailer'
import {
  SlidingWindowRateLimiter,
  createLeadServer,
  createSmtpDelivery,
  loadLeadServiceConfig,
  validateLeadPayload,
} from './lead-service.mjs'

const NOW = Date.parse('2026-09-03T08:00:00.000Z')

const validPayload = (overrides = {}) => ({
  name: '官网测试',
  contact: 'test-contact',
  space: 'commercial',
  brief: '瑞客官网 V1.0 表单接收测试',
  website: '',
  startedAt: NOW - 5_000,
  ...overrides,
})

test('validates and normalizes a complete lead', () => {
  const result = validateLeadPayload(validPayload({ name: '  官网  测试  ' }), NOW)
  assert.equal(result.kind, 'valid')
  assert.equal(result.lead.name, '官网 测试')
  assert.equal(result.lead.spaceLabel, '商业空间')
})

test('rejects incomplete data and silently accepts honeypot traffic', () => {
  assert.equal(validateLeadPayload(validPayload({ contact: '' }), NOW).kind, 'invalid')
  assert.equal(validateLeadPayload(validPayload({ space: 'unknown' }), NOW).kind, 'invalid')
  assert.equal(validateLeadPayload(validPayload({ brief: '太短' }), NOW).kind, 'invalid')
  assert.equal(validateLeadPayload(validPayload({ website: 'spam.example' }), NOW).kind, 'spam')
  assert.equal(validateLeadPayload(validPayload({ startedAt: NOW - 200 }), NOW).kind, 'spam')
})

test('limits repeated delivery attempts inside one window', () => {
  const limiter = new SlidingWindowRateLimiter({ max: 2, windowMs: 10_000 })
  assert.equal(limiter.consume('client', NOW).allowed, true)
  assert.equal(limiter.consume('client', NOW + 1).allowed, true)
  assert.equal(limiter.consume('client', NOW + 2).allowed, false)
  assert.equal(limiter.consume('client', NOW + 10_001).allowed, true)
})

test('rejects non-string and oversized fields instead of storing coerced values', () => {
  assert.equal(validateLeadPayload(validPayload({ contact: { phone: 'invalid' } }), NOW).kind, 'invalid')
  assert.equal(validateLeadPayload(validPayload({ brief: 'x'.repeat(1_201) }), NOW).kind, 'invalid')
})

test('refuses to start without a real receiver configuration', () => {
  assert.throws(() => loadLeadServiceConfig({}), /configuration is incomplete/)
})

test('mail delivery requires the configured recipient to be accepted', async (context) => {
  const receiverEmail = 'receiver@example.test'
  let accepted = []
  let transportOptions
  context.mock.method(nodemailer, 'createTransport', (options) => {
    transportOptions = options
    return { verify: async () => true, sendMail: async () => ({ accepted }) }
  })
  const smtp = createSmtpDelivery({ receiverEmail, smtp: { secure: false } })
  const lead = validateLeadPayload(validPayload(), NOW).lead
  await assert.rejects(() => smtp.deliver(lead), /recipient was not accepted/)
  assert.equal(transportOptions.requireTLS, true)
  accepted = [receiverEmail]
  await smtp.deliver(lead)
})

test('delivery errors return 503 without leaking submitted contact information', async (context) => {
  const logs = []
  const server = createLeadServer({
    config: { trustProxy: false, allowedOrigins: new Set(['https://ruikelight.com']), maxBodyBytes: 1_024, rateLimitMax: 3, rateLimitWindowMs: 600_000 },
    deliverLead: async () => { throw new Error('SMTP password or receiver details must never appear') },
    logger: (record) => logs.push(record),
    now: () => NOW,
  })
  server.listen(0, '127.0.0.1')
  await once(server, 'listening')
  context.after(() => server.close())
  const url = `http://127.0.0.1:${server.address().port}/api/project-leads`
  const headers = { 'Content-Type': 'application/json', Origin: 'https://ruikelight.com', 'X-Ruike-Form': 'website-v1' }
  const response = await fetch(url, { method: 'POST', headers, body: JSON.stringify(validPayload()) })
  assert.equal(response.status, 503)
  const body = await response.json()
  assert.equal(body.ok, false)
  assert.match(body.message, /暂未提交成功/)
  assert.doesNotMatch(JSON.stringify(logs) + JSON.stringify(body), /test-contact|官网测试|SMTP password/)
  const invalid = await fetch(url, { method: 'POST', headers, body: '{invalid' })
  assert.equal(invalid.status, 400)
  const oversized = await fetch(url, { method: 'POST', headers, body: JSON.stringify(validPayload({ brief: 'x'.repeat(2_048) })) })
  assert.equal(oversized.status, 413)
})

test('serves health checks and delivers one valid project request', async (context) => {
  const delivered = []
  const config = {
    trustProxy: true,
    allowedOrigins: new Set(['https://ruikelight.com']),
    maxBodyBytes: 16 * 1024,
    rateLimitMax: 2,
    rateLimitWindowMs: 10 * 60 * 1_000,
  }
  const server = createLeadServer({
    config,
    deliverLead: async (lead) => delivered.push(lead),
    logger: () => {},
    now: () => NOW,
  })
  server.listen(0, '127.0.0.1')
  await once(server, 'listening')
  context.after(() => server.close())

  const address = server.address()
  const baseUrl = `http://127.0.0.1:${address.port}`
  const health = await fetch(`${baseUrl}/healthz`)
  assert.equal(health.status, 200)
  assert.deepEqual(await health.json(), { status: 'ok' })

  const submit = (payload, ip = '203.0.113.10') => fetch(`${baseUrl}/api/project-leads`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Origin': 'https://ruikelight.com',
      'X-Forwarded-For': ip,
      'X-Ruike-Form': 'website-v1',
    },
    body: JSON.stringify(payload),
  })

  const success = await submit(validPayload())
  assert.equal(success.status, 202)
  assert.equal(delivered.length, 1)

  const spam = await submit(validPayload({ website: 'bot.example' }), '203.0.113.11')
  assert.equal(spam.status, 202)
  assert.equal(delivered.length, 1)

  await submit(validPayload(), '203.0.113.12')
  await submit(validPayload(), '203.0.113.12')
  const limited = await submit(validPayload(), '203.0.113.12')
  assert.equal(limited.status, 429)
  assert.equal(limited.headers.get('retry-after'), '600')

  const invalidOrigin = await fetch(`${baseUrl}/api/project-leads`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Origin': 'https://example.com',
      'X-Ruike-Form': 'website-v1',
    },
    body: JSON.stringify(validPayload()),
  })
  assert.equal(invalidOrigin.status, 403)

  const missingOrigin = await fetch(`${baseUrl}/api/project-leads`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Ruike-Form': 'website-v1',
    },
    body: JSON.stringify(validPayload()),
  })
  assert.equal(missingOrigin.status, 403)
})
