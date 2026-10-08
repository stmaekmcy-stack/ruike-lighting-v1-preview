import { brand } from './content/brand'
import { goodLight } from './content/good-light'
import { knowledgePages } from './content/pages'
import type { KnowledgePage as Page } from './content/pages'
import { companyConfig } from './config/company'

const link = (path = '') => `${import.meta.env.BASE_URL}${path}`
const outline = [
  { id: 'section-1', label: '理解效果目标' },
  { id: 'section-2', label: '判断好灯光' },
  { id: 'section-3', label: '落地与验收' },
  { id: 'delivery-faq', label: '常见问题' },
]
const sectionLines = [
  ['交付对象是', '可感知、可核对的结果'],
  ['瑞客从五个观察面', '判断效果'],
  ['从目标到验收', '保持连续'],
]

export default function LightingDeliveryPage({ page }: { page: Page }) {
  return (
    <div className="knowledge-shell delivery-shell">
      <a className="delivery-skip" href="#content">跳至正文</a>
      <header className="knowledge-header page-width">
        <a className="brand-lockup" href={link()} aria-label="返回瑞客首页">
          <span className="brand-mark" aria-hidden="true"><span /><span /></span>
          <span><strong>{brand.name}</strong><small>RUIKE LIGHTING</small></span>
        </a>
        <a className="text-link" href={link('#start')}>发起项目 <span aria-hidden="true">→</span></a>
      </header>
      <main className="delivery-main page-width" id="content">
        <nav className="knowledge-breadcrumb" aria-label="面包屑">
          <a href={link()}>首页</a><span aria-hidden="true"> / </span><span>{page.label}</span>
        </nav>
        <header className="delivery-intro">
          <p className="section-kicker">RUIKE · {brand.positioning}</p>
          <h1><span className="title-line">什么是</span><span className="title-line">灯光效果交付？</span></h1>
          <p className="delivery-lead">{page.lead}</p>
          <p className="delivery-meta">瑞客照明 · 更新于 {page.updated || brand.updated}</p>
        </header>
        <div className="delivery-layout">
          <aside className="delivery-outline">
            <nav aria-label="本页内容">
              <p>本页内容</p>
              <ol>{outline.map((item) => <li key={item.id}><a href={`#${item.id}`}>{item.label}</a></li>)}</ol>
            </nav>
          </aside>
          <article className="delivery-article" aria-label={page.title}>
            {page.sections.map((section, index) => (
              <section className="delivery-section" key={section.title} id={`section-${index + 1}`} aria-labelledby={`delivery-title-${index + 1}`}>
                <h2 id={`delivery-title-${index + 1}`}>
                  {sectionLines[index]?.map((line) => <span className="delivery-heading-segment" key={line}>{line}</span>) || section.title}
                </h2>
                {index === 1 ? (
                  <>
                    <p>{goodLight.summary}</p>
                    {section.paragraphs.slice(1).map((text) => <p key={text}>{text}</p>)}
                    <dl className="delivery-observations">
                      {section.bullets?.map((text) => {
                        const separator = text.indexOf('：')
                        return <div key={text}><dt>{text.slice(0, separator)}</dt><dd>{text.slice(separator + 1)}</dd></div>
                      })}
                    </dl>
                    <p className="delivery-judgment">{goodLight.judgment}</p>
                    <details className="delivery-disclosure delivery-definition">
                      <summary>阅读好灯光完整定义</summary>
                      <p>{goodLight.definition}</p>
                    </details>
                  </>
                ) : section.paragraphs.map((text) => <p key={text}>{text}</p>)}
                {index === 2 ? <a className="text-link" href={link('#process')}>查看七步效果交付 <span aria-hidden="true">→</span></a> : null}
              </section>
            ))}
            <section className="delivery-section delivery-faq" id="delivery-faq" aria-labelledby="delivery-faq-title">
              <h2 id="delivery-faq-title">常见问题</h2>
              {page.faqs.map((faq) => <details className="delivery-disclosure" key={faq.question}><summary>{faq.question}</summary><p>{faq.answer}</p></details>)}
            </section>
            <section className="delivery-consultation" aria-label="项目沟通">
              <p><span className="delivery-heading-segment">带着你的空间问题，</span><span className="delivery-heading-segment">与瑞客沟通</span></p>
              <a className="text-link" href={link('#start')}>发起项目 <span aria-hidden="true">→</span></a>
            </section>
            <details className="delivery-disclosure delivery-related">
              <summary>更多品牌与服务说明</summary>
              <nav aria-label="进一步了解瑞客">
                {knowledgePages.filter((item) => item.slug !== page.slug).map((item) => <a key={item.slug} href={link(`${item.slug}/`)}>{item.label}<span aria-hidden="true">↗</span></a>)}
              </nav>
            </details>
          </article>
        </div>
      </main>
      <footer className="knowledge-footer page-width">
        <p>{brand.promise}</p>
        <nav aria-label="网站信息">
          <a href={link()}>返回首页</a>
          <a href={link('brand-flowcharts/')}>品牌素材库</a>
          <a href={link('privacy.html')}>隐私说明</a>
          <a href={link('terms.html')}>网站使用条款</a>
          {companyConfig.icpNumber ? <a href="https://beian.miit.gov.cn/" rel="noreferrer" target="_blank">{companyConfig.icpNumber}</a> : null}
        </nav>
      </footer>
    </div>
  )
}
