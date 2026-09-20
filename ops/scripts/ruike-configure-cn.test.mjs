import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import test from 'node:test'

const script = readFileSync(new URL('./ruike-configure-cn', import.meta.url), 'utf8')
const http = readFileSync(new URL('../nginx/ruike-lighting-cn.http.conf', import.meta.url), 'utf8')
const https = readFileSync(new URL('../nginx/ruike-lighting-cn.conf', import.meta.url), 'utf8')
const primary = readFileSync(new URL('../nginx/ruike-lighting.conf.template', import.meta.url), 'utf8')
  .replaceAll('__PRIMARY_DOMAIN__', 'ruikelight.com').replaceAll('__WWW_DOMAIN__', 'www.ruikelight.com')

test('alias installer syntax and reviewed configuration hashes match', () => {
  execFileSync('bash', ['-n', fileURLToPath(new URL('./ruike-configure-cn', import.meta.url))])
  for (const content of [http, https, primary]) {
    assert.ok(script.includes(createHash('sha256').update(content).digest('hex')))
  }
})

test('alias serves no duplicate content and preserves the complete request URI', () => {
  assert.equal((https.match(/return 301 https:\/\/ruikelight\.com\$request_uri;/g) || []).length, 2)
  assert.equal((https.match(/server_name ruikelight\.cn www\.ruikelight\.cn;/g) || []).length, 2)
  assert.doesNotMatch(https, /root \/srv|proxy_pass|default_server|__|\$host/)
  assert.match(https, /ssl_certificate \/etc\/letsencrypt\/live\/ruikelight\.cn\/fullchain\.pem;/)
  assert.match(https, /ssl_protocols TLSv1\.2 TLSv1\.3;/)
})

test('HTTP bootstrap and final configuration both preserve ACME webroot', () => {
  for (const content of [http, https]) {
    assert.match(content, /location \^~ \/\.well-known\/acme-challenge\/ \{\s+root \/var\/www\/letsencrypt;\s+try_files \$uri =404;/)
  }
  assert.doesNotMatch(http, /listen 443|ssl_certificate/)
})

test('administrator script has rollback, a bounded reload retry, and no main-site deployment', () => {
  assert.match(script, /trap cleanup EXIT/)
  assert.match(script, /cp -p "\$config" "\$backup\/cn\.conf"/)
  assert.match(script, /cp -p "\$backup\/cn\.conf" "\$config"/)
  assert.match(script, /--retry 8 --retry-all-errors --retry-delay 1/)
  assert.match(script, /Main site health changed/)
  assert.match(script, /do not downgrade/)
  assert.doesNotMatch(script, /systemctl (?:stop|restart)|--agree-tos|--force-renewal|sudoers|rm -rf|certbot certonly/)
})
