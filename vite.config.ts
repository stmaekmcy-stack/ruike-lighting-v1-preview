import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { resolveSiteConfig } from './src/config/site.ts'

const escapeHtml = (value: string) => value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')

export default defineConfig(({ mode }) => {
  const env = { ...loadEnv(mode, '.', ''), ...process.env }
  const { siteUrl, deploymentTarget, allowIndexing, base } = resolveSiteConfig(env)
  const publicPhone = env.VITE_COMPANY_PHONE?.trim()
  const publicEmail = env.VITE_COMPANY_EMAIL?.trim()
  const publicIcpNumber = env.VITE_COMPANY_ICP_NUMBER?.trim()
  const formEndpoint = env.VITE_PROJECT_FORM_ENDPOINT?.trim()
  const releaseId = env.RUIKE_RELEASE_ID?.trim() || 'local'

  if (deploymentTarget === 'production' && !publicIcpNumber) {
    throw new Error('Production builds require the verified full website ICP record number.')
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

  const tokens = new Map([
    ['__RUIKE_SITE_URL__', siteUrl],
    ['__RUIKE_ROBOTS__', allowIndexing ? 'index, follow' : 'noindex, nofollow'],
    ['__RUIKE_ICP_FOOTER__', publicIcpNumber ? `<p class="legal-updated"><a href="https://beian.miit.gov.cn/" target="_blank" rel="noopener noreferrer">${escapeHtml(publicIcpNumber)}</a></p>` : ''],
  ])
  return {
    base,
    plugins: [react(), {
      name: 'ruike-production-metadata',
      transformIndexHtml(html: string) {
        for (const [token, value] of tokens) html = html.replaceAll(token, value)
        return html
      },
      closeBundle() {
        writeFileSync(resolve('dist', 'healthz.json'), JSON.stringify({ status: 'ok', release: releaseId }) + '\n')
      },
    }],
    build: {
      rollupOptions: { input: { main: 'index.html', privacy: 'privacy.html', terms: 'terms.html', notFound: '404.html' } },
    },
  }
})
