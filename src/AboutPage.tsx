import { brand } from './content/brand'
import { culture } from './content/culture'
import { goodLight } from './content/good-light'
import type { KnowledgePage } from './content/pages'
import { companyConfig } from './config/company'
import { SITE_URL } from './config/site'

const link = (path = '') => `${import.meta.env.BASE_URL}${path}`
const navigation = [
  { label: '灯光效果', href: '#standard' },
  { label: '效果交付', href: '#process' },
  { label: '关于瑞客', href: 'about/' },
  { label: '品牌素材库', href: 'brand-flowcharts/' },
]

function PageLinks() {
  return navigation.map((item) => (
    <a key={item.href} href={link(item.href)} aria-current={item.href === 'about/' ? 'page' : undefined}>
      {item.label}
    </a>
  ))
}

function StartProject({ className = '' }: { className?: string }) {
  return <a className={`about-cta ${className}`} href={link('#start')}>发起项目 <span aria-hidden="true">→</span></a>
}

export default function AboutPage({ page }: { page: KnowledgePage }) {
  const [identity, effect, delivery, project, sources] = page.sections
  return (
    <div className="about-shell">
      <a className="about-skip" href="#content">跳至正文</a>
      <header className="about-header">
        <div className="about-header__inner page-width">
          <a className="brand-lockup" href={link()} aria-label="返回瑞客首页">
            <span className="brand-mark" aria-hidden="true"><span /><span /></span>
            <span><strong>{brand.name}</strong><small>RUIKE LIGHTING</small></span>
          </a>
          <nav className="about-desktop-nav" aria-label="主导航"><PageLinks /></nav>
          <StartProject />
          <details className="about-menu">
            <summary aria-label="打开或关闭导航菜单"><span aria-hidden="true">菜单</span></summary>
            <nav aria-label="手机主导航"><PageLinks /><StartProject /></nav>
          </details>
        </div>
      </header>

      <main id="content">
        <section className="about-intro" aria-labelledby="about-title">
          <div className="page-width">
            <nav className="about-breadcrumb" aria-label="面包屑">
              <a href={link()}>首页</a><span aria-hidden="true">/</span><span aria-current="page">关于瑞客</span>
            </nav>
            <div className="about-intro__grid">
              <div className="about-intro__copy">
                <p className="about-eyebrow">{brand.positioning}</p>
                <h1 id="about-title">{culture.origin.map((line) => <span className="title-line" key={line}>{line}</span>)}</h1>
                <p className="about-intro__lead">{culture.explanationLines.map((line) => <span key={line}>{line}</span>)}</p>
                <a className="about-link" href="#company">了解瑞客 <span aria-hidden="true">↓</span></a>
              </div>
              <figure className="about-intro__visual">
                <img src={link('assets/hero-architecture.webp')} alt="品牌光影意象：暖光沿建筑墙面延伸，非瑞客项目实拍" width="1672" height="941" fetchPriority="high" />
                <figcaption>品牌光影意象，非项目实拍</figcaption>
              </figure>
            </div>
          </div>
        </section>

        <section className="about-company page-width about-section" id="company" aria-labelledby="company-title">
          <div className="about-company__intro" id="section-2">
            <h2 className="about-heading" id="company-title">{page.title}</h2>
            <p className="about-body about-body--lead">{brand.definition}</p>
            <p className="about-body">{page.lead.slice(brand.definition.length)}</p>
            <p className="about-body">{effect.paragraphs[0]}</p>
            <p className="about-body">{effect.paragraphs[1]}</p>
            <a className="about-link" href={link('lighting-delivery/')}>了解灯光效果交付 <span aria-hidden="true">→</span></a>
          </div>
          <div className="about-company__facts" id="section-1">
            <h3>{identity.title}</h3>
            <dl>
              <div><dt>品牌</dt><dd>{brand.name}</dd></div>
              {companyConfig.legalCompanyName ? <div><dt>网站主体</dt><dd>{companyConfig.legalCompanyName}</dd></div> : null}
              <div><dt>正式官网</dt><dd><a href={SITE_URL}>ruikelight.com <span aria-hidden="true">↗</span></a></dd></div>
              <div><dt>微信公众号</dt><dd>上海瑞客莱照明有限公司</dd></div>
              {companyConfig.icpNumber ? <div><dt>网站备案</dt><dd><a href="https://beian.miit.gov.cn/" target="_blank" rel="noreferrer">{companyConfig.icpNumber} ↗</a></dd></div> : null}
            </dl>
            <p>ruikelight.cn 与 www.ruikelight.cn 为跳转到正式官网的品牌保护域名。</p>
          </div>
        </section>

        <section className="about-purpose" aria-label="使命与愿景">
          <div className="page-width about-purpose__grid">
            <div>
              <h2 className="about-small-heading">我们的使命</h2>
              <p className="about-purpose__statement about-purpose__statement--mission">
                {culture.missionLines.map((line) => <span className="title-line" key={line}>{line}</span>)}
              </p>
              <p className="about-body">{culture.missionNote}</p>
            </div>
            <div>
              <h2 className="about-small-heading">我们的愿景</h2>
              <p className="about-purpose__statement">
                {culture.visionLines.map((line) => <span className="title-line" key={line}>{line}</span>)}
              </p>
              <p className="about-body">{culture.visionNote}</p>
            </div>
          </div>
        </section>

        <section className="about-good-light page-width about-section" id="good-light" aria-labelledby="good-light-title">
          <div className="about-good-light__intro">
            <h2 className="about-heading" id="good-light-title"><span className="title-line">瑞客如何定义</span><span className="title-line">好灯光？</span></h2>
            <p className="about-body about-body--lead">{goodLight.summary}</p>
          </div>
          <dl className="about-good-light__observations">
            {goodLight.observations.map((observation, index) => (
              <div key={observation.title}>
                <dt><span aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>{observation.title}</dt>
                <dd>{observation.body}</dd>
              </div>
            ))}
          </dl>
          <div className="about-good-light__conclusion">
            <p>{goodLight.judgment}<span>{goodLight.note}</span></p>
            <a className="about-link" href={link('lighting-delivery/#section-2')}>了解完整定义与效果判断 <span aria-hidden="true">→</span></a>
          </div>
        </section>

        <section className="about-values page-width about-section" aria-labelledby="values-title">
          <div className="about-values__heading">
            <h2 className="about-heading" id="values-title">核心价值观</h2>
            <p className="about-body">我们判断对错、取舍<br />与优先级的标准。</p>
          </div>
          <div className="about-values__list">
            {culture.values.map((value) => (
              <article className="about-value" key={value.name}>
                <h3>{value.name}</h3>
                <div><p className="about-value__principle">{value.principle}</p><p className="about-body">{value.practice}</p></div>
              </article>
            ))}
          </div>
        </section>

        <section className="about-belief page-width" aria-labelledby="belief-title">
          <div className="about-belief__philosophy">
            <h2 className="about-small-heading" id="belief-title">经营理念</h2>
            <p>{culture.philosophy.map((line) => <span className="title-line" key={line}>{line}</span>)}</p>
          </div>
          <div className="about-belief__spirit">
            <h3 className="about-small-heading">企业精神</h3>
            <ul>{culture.spirit.map((word) => <li key={word}>{word}</li>)}</ul>
            <p className="about-body">客户成功、员工成长、伙伴受益、企业发展，共同创造长期价值。</p>
          </div>
        </section>

        <section className="about-delivery page-width about-section" id="section-3" aria-labelledby="delivery-title">
          <h2 className="about-heading" id="delivery-title">{delivery.title}</h2>
          <p className="about-body">{delivery.paragraphs[1]}</p>
          <ol className="about-chain">{brand.deliveryStepNames.map((step) => <li key={step}>{step}</li>)}</ol>
          <a className="about-link" href={link('#process')}>查看七步效果交付 <span aria-hidden="true">→</span></a>
        </section>

        <section className="about-project page-width" id="section-4" aria-labelledby="project-title">
          <div className="about-project__heading">
            <h2 className="about-heading" id="project-title"><span className="title-line">从真实项目，</span><span className="title-line">了解瑞客。</span></h2>
            <a className="about-link" href={link('cases/')}>查看公开项目 <span aria-hidden="true">→</span></a>
          </div>
          <div className="about-project__detail">
            <p className="about-small-heading">MooLee`Q Studio 商业街买手店</p>
            <p className="about-body">{project.paragraphs[1]}</p>
            <p className="about-project__credit">照明设计：瑞客照明<br />室内空间设计：bnb design 本白设计</p>
            <a className="about-link" href={link('cases/mooleeq-studio/')}>阅读项目说明与原文 <span aria-hidden="true">↗</span></a>
          </div>
        </section>

        <section className="about-sources page-width about-section" id="section-5" aria-labelledby="sources-title">
          <div>
            <h2 className="about-small-heading" id="sources-title">{sources.title}</h2>
            <p className="about-body">{sources.paragraphs[0]}</p>
          </div>
          <div className="about-sources__links">
            {sources.sources?.map((source) => <a key={source.url} href={source.url} target="_blank" rel="noreferrer">{source.label} <span aria-hidden="true">↗</span></a>)}
            <p>{sources.paragraphs[1]}</p>
          </div>
        </section>

        <section className="about-faq page-width" aria-labelledby="faq-title">
          <h2 className="about-heading" id="faq-title">常见问题</h2>
          <div>{page.faqs.map((faq) => (
            <details key={faq.question}>
              <summary>{faq.question}<span className="about-faq__indicator" aria-hidden="true">+</span></summary>
              <p className="about-body">{faq.answer}</p>
            </details>
          ))}</div>
        </section>

        <section className="about-contact page-width about-section" aria-labelledby="contact-title">
          <h2 className="about-heading" id="contact-title"><span className="title-line">从你的空间，</span><span className="title-line">开始沟通。</span></h2>
          <div>
            <p className="about-body">{project.paragraphs[0]}</p>
            <StartProject />
            <p className="about-contact__scope">{brand.scopeNote}</p>
          </div>
        </section>
      </main>

      <footer className="about-footer">
        <div className="page-width">
          <div className="about-footer__top"><p>{brand.promise}</p><a className="about-link" href={link()}>返回首页 <span aria-hidden="true">↗</span></a></div>
          <nav aria-label="网站信息">
            <a href={link('brand-flowcharts/')}>品牌素材库</a>
            <a href={link('privacy.html')}>隐私说明</a>
            <a href={link('terms.html')}>网站使用条款</a>
            {companyConfig.icpNumber ? <a href="https://beian.miit.gov.cn/" target="_blank" rel="noreferrer">{companyConfig.icpNumber}</a> : null}
          </nav>
        </div>
      </footer>
    </div>
  )
}
