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
  ? `# ${brand.name}\n\n> ${brand.description}\n\n${brand.scopeNote}\n\n## 品牌与服务\n${knowledgePages.map((page) => `- [${page.title}](${siteUrl}${page.slug}/): ${page.description}`).join('\n')}\n\n## 公开品牌与项目来源\n${knowledgePages.flatMap((page) => page.sections.flatMap((section) => (section.sources || []).map((source) => `- [${page.title}：${source.label}](${source.url})`))).join('\n')}\n\n以上来源为瑞客自行整理发布的品牌说明与项目内容，不属于独立第三方评价或认证。案例页面说明同一个项目中的照明工作与设计分工，完整图片和设计说明见公众号原文，百家号文章为同一案例的补充说明。\n`
  : '# 瑞客照明预览环境\n\n本环境不作为公开品牌信源。索引已关闭。\n')
console.log(`Prerendered home + ${knowledgePages.length} knowledge pages; indexing=${allowIndexing}`)
