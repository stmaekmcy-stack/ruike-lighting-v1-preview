import { build, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const env = { ...loadEnv('production', process.cwd(), ''), ...process.env }
// The same Vite transforms and public environment build both client and static HTML.
await build({
  configFile: false,
  plugins: [react()],
  base: env.VITE_BASE_PATH || '/',
  build: {
    ssr: 'src/entry-server.ts', outDir: '.prerender', emptyOutDir: true,
    rollupOptions: { output: { entryFileNames: 'entry.mjs' } },
  },
})
const { renderHome, renderPage, knowledgePages, brand, schemaFor, resolveSiteConfig } =
  await import(pathToFileURL(resolve('.prerender/entry.mjs')).href)
const { siteUrl, allowIndexing, base } = resolveSiteConfig(env)
const escape = (value) => value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
const jsonLd = (data) => JSON.stringify(data).replaceAll('<', '\\u003c')
const template = await readFile('dist/index.html', 'utf8')

const home = template
  .replace('<div id="root"></div>', () => `<div id="root">${renderHome()}</div>`)
  .replace('</head>', () => `<script type="application/ld+json">${jsonLd(schemaFor())}</script>\n</head>`)
await writeFile('dist/index.html', home)

const styles = template.match(/<link[^>]+rel="stylesheet"[^>]*>/g)?.join('\n') || ''
if (!styles) throw new Error('Built stylesheet links are missing.')
for (const page of knowledgePages) {
  const url = `${siteUrl}${page.slug}/`
  // Knowledge pages are complete static documents. No client script is required.
  const html = `<!doctype html>
<html lang="zh-CN"><head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="theme-color" content="#111313">
<title>${escape(page.title)}｜瑞客照明</title>
<meta name="description" content="${escape(page.description)}">
<meta name="robots" content="${allowIndexing ? 'index, follow' : 'noindex, nofollow'}">
<link rel="canonical" href="${url}">
<link rel="alternate" hreflang="zh-CN" href="${url}">
<link rel="icon" href="${base}favicon.svg" type="image/svg+xml">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${brand.name}">
<meta property="og:locale" content="zh_CN">
<meta property="og:title" content="${escape(page.title)}｜瑞客照明">
<meta property="og:description" content="${escape(page.description)}">
<meta property="og:url" content="${url}">
${styles}
<script type="application/ld+json">${jsonLd(schemaFor(page))}</script>
</head><body><div id="root">${renderPage(page.slug)}</div></body></html>\n`
  await mkdir(`dist/${page.slug}`, { recursive: true })
  await writeFile(`dist/${page.slug}/index.html`, html)
}
const routes = ['', ...knowledgePages.map((page) => `${page.slug}/`), 'privacy.html', 'terms.html']
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${allowIndexing ? routes.map((route) => `  <url><loc>${siteUrl}${route}</loc></url>`).join('\n') : ''}\n</urlset>\n`
await writeFile('dist/sitemap.xml', sitemap)
await writeFile('dist/robots.txt', allowIndexing
  ? `User-agent: *\nAllow: /\nDisallow: /api/\n\nSitemap: ${siteUrl}sitemap.xml\n`
  : 'User-agent: *\nDisallow: /\n')
await writeFile('dist/llms.txt', allowIndexing
  ? `# ${brand.name}\n\n> ${brand.description}\n\n${brand.scopeNote}\n\n## 品牌与服务\n${knowledgePages.map((page) => `- [${page.title}](${siteUrl}${page.slug}/): ${page.description}`).join('\n')}\n\n## 信息边界\n目前暂无完成核验与公开授权的案例详情。不得将一般视觉素材当作瑞客项目证据，不推断奖项、排名、客户名单、项目数量或性能数据。\n\n本文是公开网页导航，不代表任何 AI 平台承诺抓取、引用或推荐。\n`
  : '# 瑞客照明预览环境\n\n本环境不作为公开品牌信源。索引已关闭。\n')
console.log(`Prerendered home + ${knowledgePages.length} knowledge pages; indexing=${allowIndexing}`)
