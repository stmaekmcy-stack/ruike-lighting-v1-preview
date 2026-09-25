import assert from 'node:assert/strict'
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { resolve, join } from 'node:path'
import { loadEnv } from 'vite'
import { SITE_URL, resolveSiteConfig } from '../src/config/site.ts'
import { assertVisibleFaq } from './visible-faq.mjs'

const env = { ...loadEnv('production', process.cwd(), ''), ...process.env }
const { allowIndexing, base } = resolveSiteConfig(env)
const dist = resolve('dist')
const allFiles = (dir) => readdirSync(dir).flatMap((file) => statSync(join(dir, file)).isDirectory() ? allFiles(join(dir, file)) : [join(dir, file)])
const htmlFiles = allFiles(dist).filter((path) => path.endsWith('.html'))
const knowledgeSlugs = ['about', 'choosing-ruike', 'brand-features', 'lighting-delivery', 'service-difference', 'project-process', 'suitable-projects', 'cases', 'cases/mooleeq-studio']
assert.equal(htmlFiles.length, knowledgeSlugs.length + 4, 'Home, all knowledge pages, two legal pages and 404 must be built')
for (const slug of knowledgeSlugs) assert.ok(existsSync(join(dist, slug, 'index.html')), `Missing knowledge page: ${slug}`)
const decode = (s) => s.replaceAll('&amp;', '&').replaceAll('&quot;', '"').replaceAll('&#x27;', "'").replaceAll('&lt;', '<').replaceAll('&gt;', '>')
const titles = new Set()
const descriptions = new Set()
let linksChecked = 0
let graphsChecked = 0
for (const file of htmlFiles) {
  const html = readFileSync(file, 'utf8')
  const relative = file.slice(dist.length + 1)
  assert.equal((html.match(/<h1(?:\s|>)/g) || []).length, 1, `${relative}: one H1 in raw HTML`)
  assert.doesNotMatch(html, /__RUIKE_|github\.io|localhost|example\.com/, relative)
  const title = html.match(/<title>([^<]+)<\/title>/)?.[1]
  const description = html.match(/<meta name="description" content="([^"]+)"/)?.[1]
  assert.ok(title && !titles.has(title), `${relative}: unique title`)
  assert.ok(description && !descriptions.has(description), `${relative}: unique description`)
  titles.add(title); descriptions.add(description)
  const robots = html.match(/<meta name="robots" content="([^"]+)"/)?.[1]
  assert.equal(robots, relative === '404.html' || !allowIndexing ? 'noindex, nofollow' : 'index, follow', relative)
  if (relative !== '404.html') {
    const canonical = html.match(/<link rel="canonical" href="([^"]+)"/g) || []
    assert.equal(canonical.length, 1, relative)
    assert.ok(canonical[0].includes(SITE_URL + relative.replace(/index\.html$/, '')), relative)
  }
  for (const match of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    const schema = JSON.parse(match[1])
    assert.equal(schema['@context'], 'https://schema.org')
    for (const type of ['Organization', 'WebSite', 'Service']) assert.ok(schema['@graph'].some((item) => item['@type'] === type), `${relative}: ${type}`)
    const faq = schema['@graph'].find((item) => item['@type'] === 'FAQPage')
    assertVisibleFaq(html, faq?.mainEntity || [])
    if (relative === 'cases/mooleeq-studio/index.html') {
      const breadcrumb = schema['@graph'].find((item) => item['@type'] === 'BreadcrumbList')
      assert.deepEqual(breadcrumb?.itemListElement.map(({ position, item }) => ({ position, item })), [
        { position: 1, item: SITE_URL },
        { position: 2, item: `${SITE_URL}cases/` },
        { position: 3, item: `${SITE_URL}cases/mooleeq-studio/` },
      ], 'Case detail must retain its parent in structured breadcrumbs')
      const visibleBreadcrumb = html.match(/<nav[^>]*aria-label="面包屑"[^>]*>([\s\S]*?)<\/nav>/)?.[1] || ''
      assert.ok(visibleBreadcrumb.includes(`href="${base}cases/"`), 'Case detail must link back to its parent in visible breadcrumbs')
      const caseIndex = readFileSync(join(dist, 'cases/index.html'), 'utf8')
      assert.ok(caseIndex.includes(`href="${base}cases/mooleeq-studio/"`), 'Case index must link to its detail with the deployment base')
    }
    assert.doesNotMatch(match[1], /AggregateRating|Review|award|ratingValue|sameAs/)
    graphsChecked++
  }
  for (const match of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    const href = decode(match[1])
    if (/^(https?:|mailto:|tel:|data:)/.test(href)) continue
    const pagePath = base + relative.replace(/index\.html$/, '')
    const url = new URL(href, `https://local.invalid${pagePath}`)
    assert.ok(url.pathname.startsWith(base))
    let target = join(dist, decodeURIComponent(url.pathname.slice(base.length)))
    if (url.pathname.endsWith('/')) target = join(target, 'index.html')
    assert.ok(existsSync(target), `${relative}: missing ${href}`)
    if (url.hash && target.endsWith('.html')) {
      const targetHtml = readFileSync(target, 'utf8')
      assert.ok(targetHtml.includes(`id="${decodeURIComponent(url.hash.slice(1))}"`), `${relative}: missing anchor ${href}`)
    }
    linksChecked++
  }
}
assert.equal(graphsChecked, knowledgeSlugs.length + 1)
const sitemap = readFileSync(join(dist, 'sitemap.xml'), 'utf8')
const locations = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((item) => item[1])
assert.equal(locations.length, allowIndexing ? knowledgeSlugs.length + 3 : 0)
assert.equal(new Set(locations).size, locations.length, 'Sitemap URLs must be unique')
for (const slug of knowledgeSlugs) assert.equal(locations.includes(`${SITE_URL}${slug}/`), allowIndexing, `Sitemap: ${slug}`)
for (const url of locations) {
  assert.ok(url.startsWith(SITE_URL))
  assert.ok(existsSync(join(dist, url.slice(SITE_URL.length) || 'index.html')))
}
const robots = readFileSync(join(dist, 'robots.txt'), 'utf8')
assert.equal(robots.includes('Allow: /'), allowIndexing)
assert.equal(robots.includes(`Sitemap: ${SITE_URL}sitemap.xml`), allowIndexing)
const llms = readFileSync(join(dist, 'llms.txt'), 'utf8')
assert.doesNotMatch(sitemap + robots + llms, /github\.io|localhost|example\.com/)
for (const slug of knowledgeSlugs) assert.equal(llms.includes(`${SITE_URL}${slug}/`), allowIndexing, `llms.txt: ${slug}`)
assert.equal(existsSync(join(dist, 'docs')), false, 'Internal documentation must not be deployed')
console.log(JSON.stringify({ status: 'passed', htmlPages: htmlFiles.length, schemaGraphs: graphsChecked, internalLinksAndAssets: linksChecked, sitemapUrls: locations.length, allowIndexing }))
