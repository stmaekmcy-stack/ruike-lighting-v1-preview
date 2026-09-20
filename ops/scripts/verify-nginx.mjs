// Run as an ordinary user on Ubuntu with nginx, openssl and curl installed.
// Tests the production template using only loopback listeners and temporary files.
import assert from 'node:assert/strict'
import { spawn, spawnSync } from 'node:child_process'
import { once } from 'node:events'
import { cpSync, mkdtempSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs'
import net from 'node:net'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { setTimeout as pause } from 'node:timers/promises'

const repo = resolve(process.argv[2] || '.')
const temporary = mkdtempSync(join(tmpdir(), 'ruike-nginx-check-'))
const run = (command, args) => {
  const result = spawnSync(command, args, { encoding: 'utf8', timeout: 20_000 })
  if (result.status !== 0) throw new Error(`${command}: ${result.stderr || result.error}`)
  return result.stdout
}
const freePort = async () => {
  const server = net.createServer()
  server.listen(0, '127.0.0.1')
  await once(server, 'listening')
  const port = server.address().port
  await new Promise((done) => server.close(done))
  return port
}
let nginx
let exit
try {
  cpSync(join(repo, 'dist'), join(temporary, 'dist'), { recursive: true })
  const httpPort = await freePort()
  const httpsPort = await freePort()
  const unusedApiPort = await freePort()
  const certificate = join(temporary, 'certificate.pem')
  const key = join(temporary, 'key.pem')
  run('openssl', ['req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-days', '1', '-subj', '/CN=ruikelight.com', '-addext', 'subjectAltName=DNS:ruikelight.com,DNS:www.ruikelight.com', '-keyout', key, '-out', certificate])
  const template = readFileSync(join(repo, 'ops/nginx/ruike-lighting.conf.template'), 'utf8')
  assert.doesNotMatch(template, /__CN_|ruikelight\.cn/)
  const config = template
    .replaceAll('__PRIMARY_DOMAIN__', 'ruikelight.com')
    .replaceAll('__WWW_DOMAIN__', 'www.ruikelight.com')
    .replace(/listen \[::\]:[^;]+;/g, '')
    .replace(/listen 80/g, `listen 127.0.0.1:${httpPort}`)
    .replace(/listen 443/g, `listen 127.0.0.1:${httpsPort}`)
    .replaceAll('/srv/ruike-lighting/current/dist', join(temporary, 'dist'))
    .replaceAll('/etc/letsencrypt/live/ruikelight.com/fullchain.pem', certificate)
    .replaceAll('/etc/letsencrypt/live/ruikelight.com/privkey.pem', key)
    .replaceAll('127.0.0.1:8787', `127.0.0.1:${unusedApiPort}`)
  const configPath = join(temporary, 'nginx.conf')
  writeFileSync(configPath, `pid ${temporary}/nginx.pid;\nerror_log ${temporary}/error.log;\nevents { worker_connections 64; }\nhttp { include /etc/nginx/mime.types; access_log off; client_body_temp_path ${temporary}/body; proxy_temp_path ${temporary}/proxy; ${config} }\n`)
  run('nginx', ['-t', '-p', temporary, '-c', configPath])
  nginx = spawn('nginx', ['-p', temporary, '-c', configPath, '-g', 'daemon off;'], { stdio: 'ignore' })
  exit = once(nginx, 'exit')
  const request = (path, { domain = 'ruikelight.com', secure = true, method = 'GET' } = {}) => {
    const port = secure ? httpsPort : httpPort
    return run('curl', ['--noproxy', '*', '--silent', '--show-error', '--max-time', '5', '--cacert', certificate, '--resolve', `${domain}:${port}:127.0.0.1`, '-X', method, '-i', `${secure ? 'https' : 'http'}://${domain}:${port}${path}`])
  }
  for (let attempt = 0; attempt < 30; attempt++) {
    try { request('/healthz'); break } catch (error) {
      if (attempt === 29) throw error
      await pause(100)
    }
  }
  const home = request('/')
  assert.match(home, /HTTP\/(?:1\.1|2) 200/)
  assert.match(home, /瑞客照明/)
  assert.match(home, /Cache-Control: no-cache/i)
  for (const name of ['Content-Security-Policy', 'Strict-Transport-Security', 'X-Content-Type-Options', 'Permissions-Policy']) {
    assert.match(home, new RegExp(`${name}:`, 'i'))
  }
  for (const path of ['/about/', '/lighting-delivery/', '/service-difference/', '/project-process/', '/suitable-projects/', '/cases/', '/privacy.html', '/terms.html', '/favicon.svg', '/robots.txt', '/sitemap.xml', '/llms.txt', '/assets/hero-architecture.webp', '/assets/ruike-wechat-official.jpg']) {
    assert.match(request(path), /HTTP\/(?:1\.1|2) 200/, path)
  }
  const missing = request('/page-does-not-exist')
  assert.match(missing, /HTTP\/(?:1\.1|2) 404/)
  assert.match(missing, /返回瑞客首页/)
  assert.match(request('/.env'), /HTTP\/(?:1\.1|2) 403/)
  assert.match(request('/#start', { secure: false }), /Location: https:\/\/ruikelight\.com\//i)
  assert.match(request('/privacy.html', { domain: 'www.ruikelight.com' }), /Location: https:\/\/ruikelight\.com\/privacy\.html/i)
  const health = request('/healthz')
  assert.match(health, /"status":"ok"/)
  const expected = JSON.parse(readFileSync(join(temporary, 'dist/healthz.json'), 'utf8'))
  assert.equal(JSON.parse(health.split('\r\n\r\n').at(-1)).release, expected.release)
  renameSync(join(temporary, 'dist/healthz.json'), join(temporary, 'healthz.backup'))
  assert.match(request('/healthz'), /HTTP\/(?:1\.1|2) 503/)
  renameSync(join(temporary, 'healthz.backup'), join(temporary, 'dist/healthz.json'))
  const failedLead = request('/api/project-leads', { method: 'POST' })
  assert.match(failedLead, /HTTP\/(?:1\.1|2) 503/)
  assert.match(failedLead, /"ok":false/)
  process.stdout.write(JSON.stringify({ status: 'passed', release: expected.release, checks: ['https', 'homepage', 'legal-pages', 'images', '404', 'headers', 'redirects', 'health-fails-closed', 'lead-unavailable'], publicListenersOpened: false }) + '\n')
} finally {
  if (nginx && nginx.exitCode === null) {
    nginx.kill('SIGQUIT')
    await Promise.race([exit, pause(5_000)])
    if (nginx.exitCode === null) { nginx.kill('SIGTERM'); await exit }
  }
  rmSync(temporary, { recursive: true, force: true })
}
