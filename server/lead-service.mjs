import crypto from 'node:crypto'
import http from 'node:http'
import { fileURLToPath } from 'node:url'
import nodemailer from 'nodemailer'

const SPACE_LABELS = Object.freeze({
  residential: '居住空间',
  commercial: '商业空间',
  hospitality: '酒店 / 餐饮',
  other: '其他空间',
})

const REQUEST_HEADER = 'website-v1'
const DEFAULT_BODY_LIMIT = 16 * 1024
const DEFAULT_RATE_LIMIT_MAX = 3
const DEFAULT_RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000

const stripUnsafeCharacters = (value, allowLineBreaks = false) => Array.from(String(value ?? ''))
  .filter((character) => {
    if (character === '<' || character === '>') return false
    if (allowLineBreaks && character === '\n') return true
    const codePoint = character.codePointAt(0)
    return codePoint >= 32 && codePoint !== 127
  })
  .join('')

const cleanSingleLine = (value, maxLength) => stripUnsafeCharacters(value)
  .replace(/\s+/g, ' ')
  .trim()
  .slice(0, maxLength)

const cleanMultiline = (value, maxLength) => stripUnsafeCharacters(
  String(value ?? '').replace(/\r\n?/g, '\n'),
  true,
)
  .trim()
  .slice(0, maxLength)

const parsePositiveInteger = (value, fallback) => {
  const parsed = Number.parseInt(String(value ?? ''), 10)
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback
}

const parseBoolean = (value, fallback = false) => {
  if (value == null || value === '') return fallback
  return String(value).toLowerCase() === 'true'
}

const isEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)

const parseAllowedOrigins = (value) => {
  const origins = String(value ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)

  return new Set(origins.map((origin) => {
    const parsed = new URL(origin)
    if (parsed.origin !== origin || !['http:', 'https:'].includes(parsed.protocol)) {
      throw new Error(`Invalid ALLOWED_ORIGINS entry: ${origin}`)
    }
    return origin
  }))
}

export function validateLeadPayload(input, now = Date.now()) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return { kind: 'invalid', message: '请求内容格式不正确。' }
  }
  const limits = { name: 60, contact: 120, space: 60, brief: 1_200 }
  if (Object.entries(limits).some(([field, limit]) => typeof input[field] !== 'string' || input[field].length > limit)) {
    return { kind: 'invalid', message: '请检查必填信息的格式与长度。' }
  }

  const website = cleanSingleLine(input.website, 120)
  const startedAt = Number(input.startedAt)
  if (website || (Number.isFinite(startedAt) && startedAt > 0 && now - startedAt >= 0 && now - startedAt < 1_200)) {
    return { kind: 'spam' }
  }

  const lead = {
    name: cleanSingleLine(input.name, 60),
    contact: cleanSingleLine(input.contact, 120),
    space: cleanSingleLine(input.space, 60),
    brief: cleanMultiline(input.brief, 1_200),
  }

  if (lead.name.length < 2) {
    return { kind: 'invalid', message: '请填写至少 2 个字的称呼。' }
  }
  if (lead.contact.length < 4) {
    return { kind: 'invalid', message: '请填写可用于回复的电话、微信或邮箱。' }
  }
  if (!Object.hasOwn(SPACE_LABELS, lead.space)) {
    return { kind: 'invalid', message: '请选择空间类型。' }
  }
  if (lead.brief.length < 8) {
    return { kind: 'invalid', message: '请简要说明空间、阶段或正在遇到的问题。' }
  }

  return {
    kind: 'valid',
    lead: {
      ...lead,
      spaceLabel: SPACE_LABELS[lead.space],
      receivedAt: new Date(now).toISOString(),
    },
  }
}

export class SlidingWindowRateLimiter {
  constructor({ max = DEFAULT_RATE_LIMIT_MAX, windowMs = DEFAULT_RATE_LIMIT_WINDOW_MS, maxKeys = 5_000 } = {}) {
    this.max = max
    this.windowMs = windowMs
    this.maxKeys = maxKeys
    this.entries = new Map()
  }

  consume(key, now = Date.now()) {
    if (this.entries.size >= this.maxKeys && !this.entries.has(key)) {
      for (const [entryKey, timestamps] of this.entries) {
        if (timestamps.at(-1) < now - this.windowMs) this.entries.delete(entryKey)
      }
      if (this.entries.size >= this.maxKeys) {
        const oldestKey = this.entries.keys().next().value
        if (oldestKey) this.entries.delete(oldestKey)
      }
    }

    const recent = (this.entries.get(key) ?? []).filter((timestamp) => timestamp > now - this.windowMs)
    if (recent.length >= this.max) {
      const retryAfterMs = Math.max(1_000, recent[0] + this.windowMs - now)
      this.entries.set(key, recent)
      return { allowed: false, retryAfterSeconds: Math.ceil(retryAfterMs / 1_000) }
    }

    recent.push(now)
    this.entries.set(key, recent)
    return { allowed: true, retryAfterSeconds: 0 }
  }
}

export function loadLeadServiceConfig(env = process.env) {
  const smtpPort = parsePositiveInteger(env.SMTP_PORT, 0)
  const config = {
    port: parsePositiveInteger(env.PORT, 8787),
    trustProxy: parseBoolean(env.TRUST_PROXY),
    allowedOrigins: parseAllowedOrigins(env.ALLOWED_ORIGINS),
    maxBodyBytes: parsePositiveInteger(env.MAX_BODY_BYTES, DEFAULT_BODY_LIMIT),
    rateLimitMax: parsePositiveInteger(env.RATE_LIMIT_MAX, DEFAULT_RATE_LIMIT_MAX),
    rateLimitWindowMs: parsePositiveInteger(env.RATE_LIMIT_WINDOW_MS, DEFAULT_RATE_LIMIT_WINDOW_MS),
    receiverEmail: cleanSingleLine(env.CONTACT_RECEIVER_EMAIL, 254),
    smtp: {
      host: cleanSingleLine(env.SMTP_HOST, 255),
      port: smtpPort,
      secure: parseBoolean(env.SMTP_SECURE, smtpPort === 465),
      user: cleanSingleLine(env.SMTP_USER, 255),
      password: String(env.SMTP_PASSWORD ?? ''),
      from: cleanSingleLine(env.SMTP_FROM, 254),
      verifyOnStart: parseBoolean(env.SMTP_VERIFY_ON_START, true),
    },
  }

  const missing = []
  if (config.allowedOrigins.size === 0) missing.push('ALLOWED_ORIGINS')
  if (!isEmail(config.receiverEmail)) missing.push('CONTACT_RECEIVER_EMAIL')
  if (!config.smtp.host) missing.push('SMTP_HOST')
  if (!config.smtp.port) missing.push('SMTP_PORT')
  if (!isEmail(config.smtp.from)) missing.push('SMTP_FROM')
  if (Boolean(config.smtp.user) !== Boolean(config.smtp.password)) missing.push('SMTP_USER/SMTP_PASSWORD')
  if (missing.length > 0) {
    throw new Error(`Lead service configuration is incomplete: ${missing.join(', ')}`)
  }

  return config
}

export function createSmtpDelivery(config) {
  const transport = nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: config.smtp.secure,
    auth: config.smtp.user
      ? { user: config.smtp.user, pass: config.smtp.password }
      : undefined,
    requireTLS: !config.smtp.secure,
    connectionTimeout: 5_000,
    greetingTimeout: 5_000,
    socketTimeout: 10_000,
  })

  return {
    verify: () => transport.verify(),
    deliver: async (lead) => {
      const replyTo = isEmail(lead.contact) ? lead.contact : undefined
      const result = await transport.sendMail({
        from: config.smtp.from,
        to: config.receiverEmail,
        replyTo,
        subject: '瑞客官网项目咨询',
        text: [
          '瑞客官网收到一条项目咨询。',
          '',
          `称呼：${lead.name}`,
          `联系方式：${lead.contact}`,
          `空间类型：${lead.spaceLabel}`,
          `项目描述：${lead.brief}`,
          '',
          `接收时间：${lead.receivedAt}`,
        ].join('\n'),
      })
      if (!result.accepted?.some((address) => String(address).toLowerCase() === config.receiverEmail.toLowerCase())) {
        throw new Error('The configured recipient was not accepted by the mail server.')
      }
    },
  }
}

const readJsonBody = (request, limit) => new Promise((resolve, reject) => {
  let body = ''
  let size = 0
  let tooLarge = false

  request.setEncoding('utf8')
  request.on('data', (chunk) => {
    size += Buffer.byteLength(chunk)
    if (size > limit) {
      tooLarge = true
      return
    }
    body += chunk
  })
  request.on('end', () => {
    if (tooLarge) {
      reject(Object.assign(new Error('Payload too large'), { statusCode: 413 }))
      return
    }
    try {
      resolve(JSON.parse(body || '{}'))
    } catch {
      reject(Object.assign(new Error('Invalid JSON'), { statusCode: 400 }))
    }
  })
  request.on('error', reject)
})

const responseHeaders = (origin) => ({
  'Cache-Control': 'no-store',
  'Content-Type': 'application/json; charset=utf-8',
  'Referrer-Policy': 'no-referrer',
  'X-Content-Type-Options': 'nosniff',
  ...(origin ? { 'Access-Control-Allow-Origin': origin, Vary: 'Origin' } : {}),
})

const sendJson = (response, statusCode, body, origin, extraHeaders = {}) => {
  response.writeHead(statusCode, { ...responseHeaders(origin), ...extraHeaders })
  response.end(JSON.stringify(body))
}

const clientKey = (request, trustProxy) => {
  if (trustProxy) {
    const forwarded = String(request.headers['x-forwarded-for'] ?? '').split(',')[0].trim()
    if (forwarded) return forwarded.slice(0, 80)
    const realIp = String(request.headers['x-real-ip'] ?? '').trim()
    if (realIp) return realIp.slice(0, 80)
  }
  return String(request.socket.remoteAddress ?? 'unknown').slice(0, 80)
}

const defaultLogger = (record) => process.stdout.write(`${JSON.stringify(record)}\n`)

export function createLeadServer({ config, deliverLead, logger = defaultLogger, now = () => Date.now() }) {
  const limiter = new SlidingWindowRateLimiter({
    max: config.rateLimitMax,
    windowMs: config.rateLimitWindowMs,
  })

  const server = http.createServer(async (request, response) => {
    const started = now()
    const requestId = crypto.randomUUID()
    const requestPath = cleanSingleLine(String(request.url ?? '/').split('?')[0], 255)
    const origin = cleanSingleLine(request.headers.origin, 255)
    const allowedOrigin = origin && config.allowedOrigins.has(origin) ? origin : ''
    let statusCode = 500

    response.setHeader('X-Request-Id', requestId)

    try {
      if (origin && !allowedOrigin) {
        statusCode = 403
        sendJson(response, statusCode, { ok: false, message: '请求来源不被允许。' }, '')
        return
      }

      const url = new URL(request.url ?? '/', 'http://localhost')
      if (request.method === 'GET' && url.pathname === '/healthz') {
        statusCode = 200
        sendJson(response, statusCode, { status: 'ok' }, allowedOrigin)
        return
      }

      if (request.method === 'OPTIONS' && url.pathname === '/api/project-leads') {
        statusCode = 204
        response.writeHead(statusCode, {
          ...responseHeaders(allowedOrigin),
          'Access-Control-Allow-Headers': 'Content-Type, X-Ruike-Form',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Max-Age': '600',
        })
        response.end()
        return
      }

      if (url.pathname !== '/api/project-leads') {
        statusCode = 404
        sendJson(response, statusCode, { ok: false, message: '未找到请求地址。' }, allowedOrigin)
        return
      }
      if (!allowedOrigin) {
        statusCode = 403
        sendJson(response, statusCode, { ok: false, message: '请求来源不被允许。' }, '')
        return
      }
      if (request.method !== 'POST') {
        statusCode = 405
        sendJson(response, statusCode, { ok: false, message: '请求方式不被允许。' }, allowedOrigin, { Allow: 'POST, OPTIONS' })
        return
      }
      if (!String(request.headers['content-type'] ?? '').toLowerCase().startsWith('application/json')) {
        statusCode = 415
        sendJson(response, statusCode, { ok: false, message: '请使用 JSON 格式提交。' }, allowedOrigin)
        return
      }
      if (request.headers['x-ruike-form'] !== REQUEST_HEADER) {
        statusCode = 403
        sendJson(response, statusCode, { ok: false, message: '请求校验失败。' }, allowedOrigin)
        return
      }

      const payload = await readJsonBody(request, config.maxBodyBytes)
      const validation = validateLeadPayload(payload, now())
      if (validation.kind === 'spam') {
        statusCode = 202
        sendJson(response, statusCode, { ok: true, message: '项目需求已收到。' }, allowedOrigin)
        return
      }
      if (validation.kind === 'invalid') {
        statusCode = 422
        sendJson(response, statusCode, { ok: false, message: validation.message }, allowedOrigin)
        return
      }

      const rate = limiter.consume(clientKey(request, config.trustProxy), now())
      if (!rate.allowed) {
        statusCode = 429
        sendJson(
          response,
          statusCode,
          { ok: false, message: '提交较频繁，请稍后再试，或直接通过电话、微信联系瑞客。' },
          allowedOrigin,
          { 'Retry-After': String(rate.retryAfterSeconds) },
        )
        return
      }

      await deliverLead(validation.lead)
      statusCode = 202
      sendJson(response, statusCode, { ok: true, message: '项目需求已收到。' }, allowedOrigin)
    } catch (error) {
      statusCode = Number(error?.statusCode) || 503
      const message = statusCode === 413
        ? '提交内容过长。'
        : statusCode === 400
          ? '请求内容格式不正确。'
          : '暂未提交成功，请稍后重试，或直接通过电话、微信联系瑞客。'
      sendJson(response, statusCode, { ok: false, message }, allowedOrigin)
    } finally {
      logger({
        event: 'lead_request',
        requestId,
        method: request.method,
        path: requestPath,
        statusCode,
        durationMs: Math.max(0, now() - started),
      })
    }
  })

  server.requestTimeout = 15_000
  server.headersTimeout = 10_000
  server.keepAliveTimeout = 5_000
  return server
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]

if (isMain) {
  const config = loadLeadServiceConfig()
  const smtp = createSmtpDelivery(config)
  if (config.smtp.verifyOnStart) await smtp.verify()
  const server = createLeadServer({ config, deliverLead: smtp.deliver })

  server.listen(config.port, '127.0.0.1', () => {
    defaultLogger({ event: 'lead_service_started', port: config.port })
  })

  const shutdown = (signal) => {
    defaultLogger({ event: 'lead_service_stopping', signal })
    server.close(() => process.exit(0))
    setTimeout(() => process.exit(1), 10_000).unref()
  }
  process.on('SIGINT', () => shutdown('SIGINT'))
  process.on('SIGTERM', () => shutdown('SIGTERM'))
}
