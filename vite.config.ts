import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const previewSiteUrl = 'https://stmaekmcy-stack.github.io/ruike-lighting-v1-preview/'

const normalizeSiteUrl = (value: string | undefined) => {
  const url = new URL(value?.trim() || previewSiteUrl)
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) {
    throw new Error('VITE_SITE_URL must be a public HTTP(S) URL without credentials.')
  }
  url.hash = ''
  url.search = ''
  if (!url.pathname.endsWith('/')) url.pathname += '/'
  return url.toString()
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '')
  const siteUrl = normalizeSiteUrl(env.VITE_SITE_URL)
  const deploymentTarget = env.VITE_DEPLOYMENT_TARGET || 'preview'
  const allowIndexing = env.VITE_ALLOW_INDEXING === 'true'
  const publicPhone = env.VITE_COMPANY_PHONE?.trim()
  const publicEmail = env.VITE_COMPANY_EMAIL?.trim()
  const publicLegalName = env.VITE_COMPANY_LEGAL_NAME?.trim()
  const publicAddress = env.VITE_COMPANY_ADDRESS?.trim()
  const publicIcpNumber = env.VITE_COMPANY_ICP_NUMBER?.trim()
  const formEndpoint = env.VITE_PROJECT_FORM_ENDPOINT?.trim()
  const releaseId = env.RUIKE_RELEASE_ID?.trim() || 'local'
  const hostname = new URL(siteUrl).hostname
  const isReservedHostname = hostname === 'localhost'
    || hostname === '127.0.0.1'
    || hostname === '::1'
    || hostname === 'example.com'
    || hostname.endsWith('.example')
    || hostname.endsWith('.invalid')
    || hostname.endsWith('.test')

  if (!['preview', 'production'].includes(deploymentTarget)) {
    throw new Error('VITE_DEPLOYMENT_TARGET must be preview or production.')
  }

  if (deploymentTarget === 'production') {
    if (!siteUrl.startsWith('https://') || isReservedHostname || hostname.endsWith('.github.io') || new URL(siteUrl).pathname !== '/') {
      throw new Error('Production builds require a final root-level HTTPS domain.')
    }
    if ((env.VITE_BASE_PATH || '/') !== '/') {
      throw new Error('Production builds require VITE_BASE_PATH=/.')
    }
    if (!publicIcpNumber) {
      throw new Error('Production builds require the verified full website ICP record number.')
    }
  }

  if (allowIndexing) {
    if (deploymentTarget !== 'production' || !siteUrl.startsWith('https://') || hostname.endsWith('.github.io') || isReservedHostname) {
      throw new Error('VITE_ALLOW_INDEXING=true requires the final HTTPS production domain.')
    }
  }

  if (publicPhone && publicPhone.replace(/\D/g, '').length < 7) {
    throw new Error('VITE_COMPANY_PHONE must contain a valid public phone number.')
  }
  if (publicEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(publicEmail)) {
    throw new Error('VITE_COMPANY_EMAIL must contain a valid public email address.')
  }
  if (publicIcpNumber && !/^[\u4e00-\u9fff]ICP备\d+号-\d+$/.test(publicIcpNumber)) {
    throw new Error('VITE_COMPANY_ICP_NUMBER must be the full website ICP record number, including its numeric suffix.')
  }
  if (formEndpoint && formEndpoint !== '/api/project-leads') {
    throw new Error('VITE_PROJECT_FORM_ENDPOINT must be /api/project-leads for the same-origin production receiver.')
  }

  const organization = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: '瑞客照明',
    url: siteUrl,
    ...(publicLegalName ? { legalName: publicLegalName } : {}),
    ...(publicEmail ? { email: publicEmail } : {}),
    ...(publicPhone ? {
      contactPoint: {
        '@type': 'ContactPoint',
        telephone: publicPhone,
        contactType: 'customer service',
        availableLanguage: 'zh-CN',
      },
    } : {}),
    ...(publicAddress ? {
      address: {
        '@type': 'PostalAddress',
        streetAddress: publicAddress,
        addressCountry: 'CN',
      },
    } : {}),
  }

  const tokens = new Map([
    ['__RUIKE_SITE_URL__', siteUrl],
    ['__RUIKE_ROBOTS__', allowIndexing ? 'index, follow' : 'noindex, nofollow'],
    ['__RUIKE_ORGANIZATION_JSON_LD__', JSON.stringify(organization).replaceAll('<', '\\u003c')],
    ['__RUIKE_ICP_FOOTER__', publicIcpNumber ? `<p class="legal-updated"><a href="https://beian.miit.gov.cn/" target="_blank" rel="noopener noreferrer">${publicIcpNumber}</a></p>` : ''],
  ])

  const applyTokens = (html: string) => {
    let output = html
    for (const [token, value] of tokens) output = output.replaceAll(token, value)
    return output
  }

  return {
    base: env.VITE_BASE_PATH || '/',
    plugins: [
      react(),
      {
        name: 'ruike-production-metadata',
        transformIndexHtml: applyTokens,
        closeBundle() {
          const robots = allowIndexing
            ? `User-agent: *\nAllow: /\n\nSitemap: ${siteUrl}sitemap.xml\n`
            : `User-agent: *\nDisallow: /\n\nSitemap: ${siteUrl}sitemap.xml\n`
          const sitemapEntries = ['', 'privacy.html', 'terms.html']
            .map((path) => `  <url><loc>${siteUrl}${path}</loc></url>`)
            .join('\n')
          const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemapEntries}\n</urlset>\n`

          writeFileSync(resolve('dist', 'robots.txt'), robots)
          writeFileSync(resolve('dist', 'sitemap.xml'), sitemap)
          writeFileSync(resolve('dist', 'healthz.json'), JSON.stringify({ status: 'ok', release: releaseId }) + '\n')
        },
      },
    ],
    build: {
      rollupOptions: {
        input: {
          main: 'index.html',
          privacy: 'privacy.html',
          terms: 'terms.html',
          notFound: '404.html',
        },
      },
    },
  }
})
