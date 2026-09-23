import { SITE_URL } from '../config/site'
import { companyConfig } from '../config/company'
import { brand } from './brand'
import type { KnowledgePage } from './pages'

export function schemaFor(page?: KnowledgePage) {
  const url = page ? `${SITE_URL}${page.slug}/` : SITE_URL
  const graph: Record<string, unknown>[] = [
    {
      '@type': 'Organization', '@id': `${SITE_URL}#organization`,
      name: brand.name, url: SITE_URL, description: brand.description,
      ...(companyConfig.legalCompanyName ? { legalName: companyConfig.legalCompanyName } : {}),
      ...(companyConfig.phone ? { telephone: companyConfig.phone } : {}),
      ...(companyConfig.email ? { email: companyConfig.email } : {}),
      ...(companyConfig.address ? { address: { '@type': 'PostalAddress', streetAddress: companyConfig.address, addressCountry: 'CN' } } : {}),
    },
    {
      '@type': 'WebSite', '@id': `${SITE_URL}#website`, name: brand.name,
      url: SITE_URL, inLanguage: 'zh-CN', publisher: { '@id': `${SITE_URL}#organization` },
    },
    {
      '@type': 'Service', '@id': `${SITE_URL}#service`,
      name: '灯光效果交付', serviceType: '灯光设计与效果交付',
      url: `${SITE_URL}lighting-delivery/`, description: brand.description,
      provider: { '@id': `${SITE_URL}#organization` },
    },
    {
      '@type': page?.slug === 'about' ? 'AboutPage' : page?.slug === 'cases' ? 'CollectionPage' : 'WebPage',
      '@id': `${url}#webpage`, url,
      name: page?.title || `${brand.name}｜${brand.positioning}`,
      description: page?.description || brand.description,
      inLanguage: 'zh-CN', isPartOf: { '@id': `${SITE_URL}#website` },
      about: { '@id': `${SITE_URL}#organization` },
      ...(page ? { dateModified: page.updated || brand.updated, hasPart: { '@id': `${url}#faq` } } : {}),
      ...(page?.sections.some((section) => section.sources?.length) ? { citation: page.sections.flatMap((section) => section.sources?.map((source) => source.url) || []) } : {}),
    },
  ]
  if (page) graph.push(
    {
      '@type': 'FAQPage', '@id': `${url}#faq`,
      mainEntity: page.faqs.map((faq) => ({
        '@type': 'Question', name: faq.question,
        acceptedAnswer: { '@type': 'Answer', text: faq.answer },
      })),
    },
    {
      '@type': 'BreadcrumbList', '@id': `${url}#breadcrumb`,
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: '首页', item: SITE_URL },
        { '@type': 'ListItem', position: 2, name: page.label, item: url },
      ],
    },
  )
  return { '@context': 'https://schema.org', '@graph': graph }
}
