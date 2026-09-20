import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, symlinkSync, existsSync, readlinkSync, realpathSync, readdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'

// Only this test copy is path-rewritten and given mocked system commands.
// The deployable script has fixed paths, a fixed PATH, and no test switches.
const source = readFileSync(new URL('./ruike-prepare-https', import.meta.url), 'utf8')
const nginx = readFileSync(new URL('../nginx/ruike-lighting.conf.template', import.meta.url), 'utf8')
  .replaceAll('__PRIMARY_DOMAIN__', 'ruikelight.com').replaceAll('__WWW_DOMAIN__', 'www.ruikelight.com')
const originalRenewal = 'version = 2.9.0\n[renewalparams]\nauthenticator = standalone\n'
const approvedHash = createHash('sha256').update(nginx).digest('hex')

const mockSource = String.raw`
import { appendFileSync, existsSync, readFileSync, writeFileSync, rmSync, realpathSync, readlinkSync, statSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { join } from 'node:path'
const [command, ...args] = process.argv.slice(2)
const root = process.env.RUIKE_TLS_TEST_ROOT
const mode = process.env.RUIKE_TLS_TEST_MODE
const state = join(root, 'acme-running')
appendFileSync(join(root, 'trace'), command + ' ' + args.join(' ') + '\n')
const out = value => process.stdout.write(String(value) + '\n')
const reject = () => { process.stderr.write('Simulated failure: ' + mode + '\n'); process.exit(1) }
switch (command) {
  case 'id': out(mode === 'not-root' ? '1001' : '0'); break
  case 'stat': out(args[1] === '%u' ? '0' : (statSync(args[2]).mode & 0o777).toString(8)); break
  case 'readlink': out(args[0] === '-f' ? realpathSync(args[1]) : readlinkSync(args[0])); break
  case 'sha256sum': out(createHash('sha256').update(readFileSync(args[0])).digest('hex') + '  ' + args[0]); break
  case 'getent': out((mode === 'wrong-dns' ? '192.0.2.4' : '124.220.205.94') + ' STREAM ' + args[1]); break
  case 'flock': break
  case 'ss': if (existsSync(state)) out('LISTEN 0 511 0.0.0.0:80 0.0.0.0:*'); break
  case 'systemctl':
    if (args.includes('nginx')) process.exit(mode === 'running-site' ? 0 : 3)
    if (!['is-active', 'is-enabled'].includes(args[0])) throw new Error('Unexpected service mutation')
    process.exit(0)
    break
  case 'openssl':
    if (args[0] === 'sha256') out(createHash('sha256').update(readFileSync(0)).digest('hex'))
    else if (args[0] === 'pkey') out(mode === 'key-mismatch' ? 'wrong public key' : 'public key')
    else if (args.includes('-pubkey')) out('public key')
    else if (args.includes('-checkend') && mode === 'expired-cert') reject()
    else if (args[0] === 'verify' && mode === 'untrusted-cert') reject()
    else if (args.includes('-verify_hostname') && mode === 'wrong-cert-host') reject()
    else if (args.includes('-dates')) out('notBefore=Sep 20 00:00:00 2026 GMT\nnotAfter=Dec 19 00:00:00 2026 GMT\nissuer=TEST MOCK')
    break
  case 'nginx': {
    const config = args.includes('-c') ? args[args.indexOf('-c') + 1] : null
    if (args.includes('-t')) {
      if (!config && mode === 'bad-final-nginx') reject()
      break
    }
    if (!config) throw new Error('Must not start the system Nginx')
    const pid = readFileSync(config, 'utf8').match(/^pid (.+);$/m)[1]
    if (args.includes('-s')) { rmSync(pid, { force: true }); rmSync(state, { force: true }) }
    else { writeFileSync(pid, '999999\n'); writeFileSync(state, 'running') }
    break
  }
  case 'curl':
    if (args.at(-1).includes('/.well-known/acme-challenge/')) out('ruike-acme-preflight')
    else out(mode === 'homepage-leak' ? '200' : '404')
    break
  case 'certbot':
    if (args[0] !== 'reconfigure' || args.includes('--agree-tos') || args.includes('--force-renewal')) throw new Error('Unsafe certificate action')
    if (!existsSync(state)) throw new Error('No temporary ACME listener')
    writeFileSync(join(root, 'etc/letsencrypt/renewal/ruikelight.com.conf'),
      'authenticator = webroot\nwebroot_path = ' + join(root, 'var/www/letsencrypt') + ',\nrenew_hook = /usr/bin/systemctl reload nginx\n')
    if (mode === 'renewal-failure') reject()
    break
  case 'mv': execFileSync('/bin/mv', args.filter(arg => arg !== '-T')); break
  default: throw new Error('Unexpected mock command: ' + command)
}
`

function fixture(mode = 'success') {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'ruike-https-test-')))
  const path = value => join(root, value)
  const put = (name, value) => writeFileSync(path(name), value, { mode: 0o644 })
  for (const dir of ['bin', 'etc/nginx/sites-available', 'etc/nginx/sites-enabled', 'etc/letsencrypt/renewal', 'etc/letsencrypt/live/ruikelight.com', 'etc/ruike-lighting', 'var/www', 'var/lib', 'srv/ruike-lighting', 'run/lock']) {
    mkdirSync(path(dir), { recursive: true, mode: 0o755 })
  }
  put('etc/nginx/sites-available/ruike-lighting.conf.pending', mode === 'config-drift' ? 'unreviewed' : nginx)
  put('etc/nginx/sites-available/default', 'original default')
  put('etc/letsencrypt/renewal/ruikelight.com.conf', originalRenewal)
  for (const part of ['cert', 'chain', 'fullchain', 'privkey']) put('etc/letsencrypt/live/ruikelight.com/' + part + '.pem', 'MOCK ONLY')
  if (mode === 'unknown-default') put('etc/nginx/sites-enabled/default', 'user config')
  else symlinkSync(path('etc/nginx/sites-available/default'), path('etc/nginx/sites-enabled/default'))
  if (mode === 'unknown-vhost') put('etc/nginx/sites-enabled/unrelated', 'user config')
  if (mode === 'existing-release') mkdirSync(path('srv/ruike-lighting/current'))
  put('mock.mjs', mockSource)
  for (const command of ['id', 'stat', 'readlink', 'sha256sum', 'getent', 'flock', 'ss', 'systemctl', 'openssl', 'nginx', 'curl', 'certbot', 'mv']) {
    writeFileSync(path('bin/' + command), '#!/bin/sh\nexec "' + process.execPath + '" "' + path('mock.mjs') + '" ' + command + ' "$@"\n', { mode: 0o755 })
  }
  const variant = source.replace(/\/(etc|var|srv|run)\//g, (_, area) => root + '/' + area + '/')
    .replace('export PATH=/usr/sbin:/usr/bin:/sbin:/bin', 'export PATH="' + path('bin') + ':/usr/sbin:/usr/bin:/sbin:/bin"')
  put('prepare.sh', variant)
  const run = () => {
    try {
      const stdout = execFileSync('bash', [path('prepare.sh')], {
        env: { ...process.env, RUIKE_TLS_TEST_ROOT: root, RUIKE_TLS_TEST_MODE: mode },
        encoding: 'utf8', timeout: 20000, stdio: ['ignore', 'pipe', 'pipe'],
      })
      return { status: 0, stdout }
    } catch (error) {
      return { status: error.status, stdout: String(error.stdout), stderr: String(error.stderr) }
    }
  }
  return { root, path, run, close: () => rmSync(root, { recursive: true, force: true }) }
}

test('pinned pending configuration matches the unchanged production template', () => {
  assert.ok(source.includes('approved_sha=' + approvedHash))
  execFileSync('bash', ['-n', fileURLToPath(new URL('./ruike-prepare-https', import.meta.url))])
})

test('prepares TLS and webroot renewal without starting the production website', () => {
  const f = fixture()
  try {
    const result = f.run()
    assert.equal(result.status, 0, result.stderr)
    const report = readFileSync(f.path('var/lib/ruike-lighting/https-readiness.txt'), 'utf8')
    assert.match(report, /status=prepared_not_published/)
    assert.match(report, /renewal_staging_test=passed/)
    assert.match(report, /website_active=false/)
    assert.doesNotMatch(report, /MOCK ONLY|PRIVATE KEY|@/)
    assert.equal(readFileSync(f.path('etc/nginx/sites-available/ruike-lighting.conf'), 'utf8'), nginx)
    assert.equal(readlinkSync(f.path('etc/nginx/sites-enabled/ruike-lighting.conf')), f.path('etc/nginx/sites-available/ruike-lighting.conf'))
    assert.equal(existsSync(f.path('etc/nginx/sites-enabled/default')), false)
    assert.equal(existsSync(f.path('acme-running')), false)
    assert.equal(existsSync(f.path('srv/ruike-lighting/current')), false)
    const backups = readdirSync(f.path('etc/ruike-lighting/ops-backups'))
    assert.equal(readFileSync(f.path('etc/ruike-lighting/ops-backups/' + backups[0] + '/renewal.conf'), 'utf8'), originalRenewal)
    const trace = readFileSync(f.path('trace'), 'utf8')
    assert.doesNotMatch(trace, /^systemctl (start|enable|restart|reload)\b/m)
    assert.doesNotMatch(trace, /--agree-tos|--force-renewal/)
  } finally { f.close() }
})

const failures = {
  'not-root': 'Run from the existing administrator terminal',
  'config-drift': 'Pending Nginx configuration does not match',
  'wrong-dns': 'Unexpected IPv4 DNS',
  'unknown-default': 'Unknown default virtual host',
  'unknown-vhost': 'Unrelated enabled virtual host',
  'existing-release': 'A release already exists',
  'running-site': 'A web service is already running',
  'expired-cert': 'Simulated failure: expired-cert',
  'untrusted-cert': 'Simulated failure: untrusted-cert',
  'wrong-cert-host': 'Simulated failure: wrong-cert-host',
  'key-mismatch': 'Certificate and private key do not match',
  'homepage-leak': 'Temporary listener must not expose a homepage',
  'renewal-failure': 'Simulated failure: renewal-failure',
  'bad-final-nginx': 'Simulated failure: bad-final-nginx',
}

for (const [mode, expectedFailure] of Object.entries(failures)) {
  test('safe stop and restore: ' + mode, () => {
    const f = fixture(mode)
    try {
      const result = f.run()
      assert.notEqual(result.status, 0, result.stdout)
      assert.ok(result.stderr.includes(expectedFailure), result.stderr)
      assert.equal(existsSync(f.path('var/lib/ruike-lighting/https-readiness.txt')), false)
      assert.equal(existsSync(f.path('etc/nginx/sites-available/ruike-lighting.conf')), false)
      assert.equal(existsSync(f.path('etc/nginx/sites-enabled/ruike-lighting.conf')), false)
      assert.equal(existsSync(f.path('acme-running')), false)
      assert.equal(readFileSync(f.path('etc/letsencrypt/renewal/ruikelight.com.conf'), 'utf8'), originalRenewal)
      if (mode === 'unknown-default') assert.equal(readFileSync(f.path('etc/nginx/sites-enabled/default'), 'utf8'), 'user config')
      else assert.equal(readlinkSync(f.path('etc/nginx/sites-enabled/default')), f.path('etc/nginx/sites-available/default'))
      if (mode === 'unknown-vhost') assert.equal(readFileSync(f.path('etc/nginx/sites-enabled/unrelated'), 'utf8'), 'user config')
    } finally { f.close() }
  })
}
