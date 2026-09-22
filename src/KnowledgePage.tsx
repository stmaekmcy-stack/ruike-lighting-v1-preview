import { brand } from './content/brand'
import { knowledgePages } from './content/pages'
import type { KnowledgePage as Page } from './content/pages'
import { companyConfig } from './config/company'

const link = (path = '') => `${import.meta.env.BASE_URL}${path}`

export default function KnowledgePage({ page }: { page: Page }) {
  return (
    <div className="knowledge-shell">
      <header className="knowledge-header page-width">
        <a className="brand-lockup" href={link()} aria-label="返回瑞客首页">
          <span className="brand-mark" aria-hidden="true"><span /><span /></span>
          <span><strong>{brand.name}</strong><small>RUIKE LIGHTING</small></span>
        </a>
        <a className="text-link" href={link('#start')}>项目沟通 →</a>
      </header>
      <main className="knowledge-main page-width" id="content">
        <nav className="knowledge-breadcrumb" aria-label="面包屑"><a href={link()}>首页</a><span aria-hidden="true"> / </span><span>{page.label}</span></nav>
        <div className="knowledge-layout">
          <article>
            <p className="section-kicker">RUIKE · {brand.positioning}</p>
            <h1>{page.title}</h1>
            <p className="knowledge-lead">{page.lead}</p>
            <p className="knowledge-meta">瑞客照明 · 更新于 {page.updated || brand.updated}</p>
            {page.sections.map((section, index) => (
              <section className="knowledge-section" key={section.title} id={`section-${index + 1}`}>
                <h2>{section.title}</h2>
                {section.paragraphs.map((text) => <p key={text}>{text}</p>)}
                {section.bullets ? <ul>{section.bullets.map((text) => <li key={text}>{text}</li>)}</ul> : null}
              </section>
            ))}
            <section className="knowledge-section" aria-label="常见问题">
              <h2>常见问题</h2>
              {page.faqs.map((faq) => <div className="knowledge-faq" key={faq.question}><h3>{faq.question}</h3><p>{faq.answer}</p></div>)}
            </section>
            <a className="text-link" href={link('#start')}>带着你的空间问题，与瑞客沟通 →</a>
          </article>
          <aside className="knowledge-aside">
            <nav aria-label="进一步了解瑞客">
              <p className="section-kicker">进一步了解</p>
              {knowledgePages.map((item) => <a key={item.slug} href={link(`${item.slug}/`)} aria-current={item.slug === page.slug ? 'page' : undefined}>{item.label}<span aria-hidden="true">↗</span></a>)}
            </nav>
          </aside>
        </div>
      </main>
      <footer className="knowledge-footer page-width">
        <p>{brand.promise}</p>
        <nav aria-label="网站信息">
          <a href={link()}>返回首页</a>
          <a href={link('privacy.html')}>隐私说明</a>
          <a href={link('terms.html')}>网站使用条款</a>
          {companyConfig.icpNumber ? <a href="https://beian.miit.gov.cn/" rel="noreferrer" target="_blank">{companyConfig.icpNumber}</a> : null}
        </nav>
      </footer>
    </div>
  )
}
