import test from 'node:test'
import assert from 'node:assert/strict'
import { SITE_URL, resolveSiteConfig } from '../src/config/site.ts'

test('preview metadata uses only the verified canonical origin', () => {
  assert.deepEqual(resolveSiteConfig({}), { siteUrl: SITE_URL, deploymentTarget: 'preview', allowIndexing: false, base: '/' })
})
test('preview origins and malformed canonical URLs fail closed', () => {
  for (const url of ['https://stmaekmcy-stack.github.io/ruike-lighting-v1-preview/', 'http://ruikelight.com/', 'https://ruikelight.com/?x=1', 'https://www.ruikelight.com/', 'https://ruikelight.com/example/', 'https://ruikelight.com/#x', 'https://user:password@ruikelight.com/']) {
    assert.throws(() => resolveSiteConfig({ VITE_SITE_URL: url }))
  }
})
test('only production can turn on indexing', () => {
  assert.throws(() => resolveSiteConfig({ VITE_ALLOW_INDEXING: 'true' }))
  assert.equal(resolveSiteConfig({ VITE_DEPLOYMENT_TARGET: 'production', VITE_ALLOW_INDEXING: 'true' }).allowIndexing, true)
  assert.equal(resolveSiteConfig({ VITE_DEPLOYMENT_TARGET: 'production', VITE_ALLOW_INDEXING: 'false' }).allowIndexing, false)
})
test('base path cannot escape to another host or directory', () => {
  for (const base of ['//evil.example/', '/foo/../', '/foo', '/?x/']) {
    assert.throws(() => resolveSiteConfig({ VITE_BASE_PATH: base }))
  }
  assert.throws(() => resolveSiteConfig({ VITE_DEPLOYMENT_TARGET: 'production', VITE_BASE_PATH: '/preview/' }))
  assert.equal(resolveSiteConfig({ VITE_BASE_PATH: '/ruike-lighting-v1-preview/' }).base, '/ruike-lighting-v1-preview/')
})
