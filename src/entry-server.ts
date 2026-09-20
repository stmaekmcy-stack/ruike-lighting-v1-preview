import { renderToString } from 'react-dom/server'
import { createElement } from 'react'
import App from './App'
import KnowledgePage from './KnowledgePage'
import { knowledgePages } from './content/pages'
import { brand } from './content/brand'
import { companyConfig } from './config/company'

export { knowledgePages, brand, companyConfig }
export { schemaFor } from './content/schema'
export { SITE_URL, resolveSiteConfig } from './config/site'
export const renderHome = () => renderToString(createElement(App))
export const renderPage = (slug: string) => {
  const page = knowledgePages.find((item) => item.slug === slug)
  if (!page) throw new Error(`Unknown page: ${slug}`)
  return renderToString(createElement(KnowledgePage, { page }))
}
