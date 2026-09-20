// Read-only public verification. No cookies, credentials, or TLS bypasses.
import assert from 'node:assert/strict'
import { Resolver } from 'node:dns/promises'
import { writeFile } from 'node:fs/promises'
import tls from 'node:tls'

const primary = 'https://ruikelight.com'
const domains = ['ruikelight.cn', 'www.ruikelight.cn']
const request = (url, redirect = 'manual') => fetch(url, { redirect, signal: AbortSignal.timeout(20_000) })
const certificate = hostname => new Promise((resolve, reject) => {
  const socket = tls.connect({ host: hostname, port: 443, servername: hostname, rejectUnauthorized: true })
  socket.setTimeout(15_000, () => socket.destroy(new Error('TLS timeout')))
  socket.once('error', reject)
  socket.once('secureConnect', () => {
    const cert = socket.getPeerCertificate()
    const result = { hostname, authorized: socket.authorized, subject: cert.subject.CN, sans: cert.subjectaltname, issuer: cert.issuer.CN, validFrom: cert.valid_from, validTo: cert.valid_to, fingerprint256: cert.fingerprint256 }
    socket.end()
    resolve(result)
  })
})
const report = { checkedAt: new Date().toISOString(), dns: [], certificates: [], redirects: [], finalPages: [], primaryHealth: null }
const beforeHealth = await (await request(primary + '/healthz')).json()
assert.equal(beforeHealth.status, 'ok')
for (const server of ['223.5.5.5', '1.1.1.1']) {
  const resolver = new Resolver({ timeout: 5000, tries: 2 })
  resolver.setServers([server])
  for (const hostname of domains) {
    const addresses = await resolver.resolve4(hostname)
    assert.deepEqual(addresses, ['124.220.205.94'])
    report.dns.push({ server, hostname, addresses })
  }
}
for (const hostname of domains) {
  const cert = await certificate(hostname)
  assert.equal(cert.authorized, true)
  report.certificates.push(cert)
  for (const protocol of ['http', 'https']) {
    for (const path of ['/', '/about/?source=cn-check&next=%2Fstart']) {
      const url = `${protocol}://${hostname}${path}`
      const response = await request(url)
      assert.equal(response.status, 301, url)
      assert.equal(response.headers.get('location'), primary + path, url)
      report.redirects.push({ url, status: response.status, destination: response.headers.get('location') })
      await response.arrayBuffer()
    }
  }
  const acme = await request(`http://${hostname}/.well-known/acme-challenge/no-such-cn-verification-token`)
  assert.equal(acme.status, 404, 'ACME must remain local, not redirect to .com')
  await acme.arrayBuffer()
  const page = await request(`https://${hostname}/`, 'follow')
  assert.equal(page.status, 200)
  assert.equal(page.url, primary + '/')
  const html = await page.text()
  assert.match(html, /沪ICP备2024099975号-5/)
  assert.match(html, /rel="canonical" href="https:\/\/ruikelight\.com\/"/)
  report.finalPages.push({ hostname, url: page.url, status: page.status, canonical: primary + '/' })
}
report.primaryHealth = await (await request(primary + '/healthz')).json()
assert.deepEqual(report.primaryHealth, beforeHealth, 'The main release must not change during alias verification')
report.status = 'passed'
if (process.argv[2]) await writeFile(process.argv[2], JSON.stringify(report, null, 2) + '\n')
process.stdout.write(JSON.stringify(report, null, 2) + '\n')
