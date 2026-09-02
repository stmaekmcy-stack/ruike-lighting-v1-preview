import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'

type IconName = 'arrow' | 'chevron' | 'menu' | 'close' | 'plus' | 'arrowUp'

type ProcessStep = {
  number: string
  title: string
  summary: string
  detail: string
}

type ProductMode = {
  title: string
  english: string
  description: string
  image: string
  alt: string
}

const navItems = [
  { label: '品牌', href: '#brand' },
  { label: '好灯光', href: '#standard' },
  { label: '交付', href: '#process' },
  { label: '项目', href: '#projects' },
  { label: '产品', href: '#products' },
]

const principles = [
  { title: '视觉需求', body: '真实活动能够自然完成。', motif: 'beam' },
  { title: '视觉舒适', body: '人在真实位置，可以稳定观看。', motif: 'soft' },
  { title: '对象呈现', body: '人物、商品与材料被恰当看见。', motif: 'object' },
  { title: '空间感知', body: '重点、主次、深度与边界清楚。', motif: 'depth' },
  { title: '空间氛围', body: '状态与场所、活动和意图相符。', motif: 'ambient' },
]

const processSteps: ProcessStep[] = [
  {
    number: '01',
    title: '理解空间',
    summary: '先理解真实使用，再谈灯具选择。',
    detail: '从现场信息、空间材质、人的位置与真实活动开始，建立可被验证的灯光任务。',
  },
  {
    number: '02',
    title: '形成方案',
    summary: '把光线、产品与位置放在一起判断。',
    detail: '以空间任务组织方案，明确重点、层次、舒适和氛围，不用单一参数替代整体判断。',
  },
  {
    number: '03',
    title: '选型确认',
    summary: '规格与配套，在交付前复核。',
    detail: '围绕型号、功率、尺寸、开孔、色温、显色、光束角及配套清单完成技术复核。',
  },
  {
    number: '04',
    title: '调试交付',
    summary: '真实位置、真实视线、真实对象。',
    detail: '图纸完成、产品到场、安装完成，都不等于效果完成；最终需要回到真实空间进行调试。',
  },
  {
    number: '05',
    title: '结果验收',
    summary: '让每一束光落到空间结果上。',
    detail: '以视觉需求、舒适、对象呈现、空间感知和空间氛围作为验收时的共同语言。',
  },
]

const productModes: ProductMode[] = [
  {
    title: '内嵌固定',
    english: 'RECESSED / FIXED',
    description: '稳定、克制，适合基础与重点照明。',
    image: '/assets/recessed-light-on.jpeg',
    alt: '瑞客内嵌灯具开灯效果资料图',
  },
  {
    title: '深杯防眩',
    english: 'DEEP ANTI-GLARE',
    description: '见光不见灯，让光柔和地落下，而不是刺向视线。',
    image: '/assets/recessed-light-off.jpeg',
    alt: '瑞客深杯防眩灯具资料图',
  },
  {
    title: '产品家族',
    english: 'PRODUCT FAMILY',
    description: '以产品架构承接不同空间任务，正式选型以最新技术确认单为准。',
    image: '/assets/recessed-light-family.jpeg',
    alt: '瑞客内嵌灯具产品家族资料图',
  },
  {
    title: '选型资料',
    english: 'SELECTION NOTES',
    description: '参数是选择的工具，不是效果的替代；资料位持续维护中。',
    image: '/assets/recessed-light-options.png',
    alt: '瑞客内嵌灯具选型资料图',
  },
]

function Icon({ name }: { name: IconName }) {
  if (name === 'arrow') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 12h15M13 5l7 7-7 7" />
      </svg>
    )
  }
  if (name === 'chevron') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="m9 5 7 7-7 7" />
      </svg>
    )
  }
  if (name === 'plus') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 5v14M5 12h14" />
      </svg>
    )
  }
  if (name === 'arrowUp') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 19V5M6 11l6-6 6 6" />
      </svg>
    )
  }
  return name === 'menu' ? (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m6 6 12 12M18 6 6 18" />
    </svg>
  )
}

function SectionRail({ number, label, light = false }: { number: string; label: string; light?: boolean }) {
  return (
    <div className={`section-rail ${light ? 'section-rail--light' : ''}`}>
      <span className="section-rail__number">{number}</span>
      <span className="section-rail__line" />
      <span className="section-rail__label">{label}</span>
    </div>
  )
}

function App() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [activeProcess, setActiveProcess] = useState(0)
  const [activeProduct, setActiveProduct] = useState(0)
  const [formStatus, setFormStatus] = useState<'idle' | 'preview'>('idle')

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 32)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const scrollToStart = () => {
    document.querySelector('#start')?.scrollIntoView({ behavior: 'smooth' })
    setMenuOpen(false)
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFormStatus('preview')
  }

  return (
    <div className="site-shell">
      <header className={`site-nav ${isScrolled ? 'site-nav--scrolled' : ''}`}>
        <a className="brand-lockup" href="#top" aria-label="返回瑞客首页">
          <span className="brand-mark" aria-hidden="true">
            <span />
            <span />
          </span>
          <span>
            <strong>瑞客照明</strong>
            <small>RUIKE LIGHTING</small>
          </span>
        </a>
        <nav className={`main-nav ${menuOpen ? 'main-nav--open' : ''}`} aria-label="主导航">
          {navItems.map((item) => (
            <a key={item.href} href={item.href} onClick={() => setMenuOpen(false)}>
              {item.label}
            </a>
          ))}
          <button className="nav-project-link" type="button" onClick={scrollToStart}>
            发起项目 <Icon name="arrow" />
          </button>
        </nav>
        <button
          className="menu-toggle"
          type="button"
          aria-label={menuOpen ? '关闭菜单' : '打开菜单'}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <Icon name={menuOpen ? 'close' : 'menu'} />
        </button>
      </header>

      <main>
        <section className="hero" id="top">
          <div className="hero__image" />
          <div className="hero__edge-fade" />
          <SectionRail number="01" label="LIGHT AS RESULT" light />
          <div className="hero__content page-width">
            <p className="hero__location">RUIKE LIGHTING / 2026</p>
            <h1>
              让好灯光
              <br />
              <span>看得见。</span>
            </h1>
            <p className="hero__intro">
              为客户实现期待的灯光效果，
              <br className="desktop-break" />
              让每一个空间因光而更具价值。
            </p>
            <button className="button button--light" type="button" onClick={scrollToStart}>
              发起项目 <Icon name="arrow" />
            </button>
          </div>
          <a className="hero__scroll" href="#brand">
            <span>SCROLL TO EXPLORE</span>
            <span className="hero__scroll-line" />
          </a>
        </section>

        <section className="brand-section section-light" id="brand">
          <SectionRail number="02" label="WHAT WE DELIVER" />
          <div className="page-width brand-section__grid">
            <div className="brand-section__headline reveal-up">
              <p className="section-kicker">灯光效果交付品牌</p>
              <h2>
                灯光不是
                <br />
                <em>装饰。</em>
                <br />
                是空间的结果。
              </h2>
            </div>
            <div className="brand-section__body reveal-up">
              <p className="display-quote">不止卖灯，效果交付。</p>
              <p className="body-copy">
                瑞客以专业产品、灯光效果与交付协同，让每一束光都落到空间结果上。我们关注的不是灯具被安装在哪里，而是人在真实空间里看见了什么、感受了什么。
              </p>
              <a className="text-link" href="#standard">
                了解瑞客的判断标准 <Icon name="arrow" />
              </a>
            </div>
          </div>
          <div className="page-width brand-section__principles">
            <div className="open-principle">
              <span>01</span>
              <strong>理解空间</strong>
              <small>先有真实任务，再谈产品选择。</small>
            </div>
            <div className="open-principle">
              <span>02</span>
              <strong>控制光线</strong>
              <small>让重点、层次与舒适被同时照顾。</small>
            </div>
            <div className="open-principle">
              <span>03</span>
              <strong>交付结果</strong>
              <small>回到真实位置，完成调试与验收。</small>
            </div>
          </div>
        </section>

        <section className="standard-section section-dark" id="standard">
          <SectionRail number="03" label="THE GOOD LIGHT STANDARD" light />
          <div className="page-width">
            <div className="standard-section__intro reveal-up">
              <p className="section-kicker section-kicker--light">RUIKE GOOD LIGHT</p>
              <h2>什么样的灯光，才叫好？</h2>
              <p>用五个真实观察面，替代只看参数的单一判断。</p>
            </div>
            <div className="principle-list">
              {principles.map((principle, index) => (
                <article className="principle" key={principle.title}>
                  <div className={`principle__visual principle__visual--${principle.motif}`}>
                    <span className="principle__beam" />
                    <span className="principle__object" />
                  </div>
                  <div className="principle__meta">
                    <span>0{index + 1}</span>
                    <span className="principle__rule" />
                  </div>
                  <h3>{principle.title}</h3>
                  <p>{principle.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="process-section section-light" id="process">
          <SectionRail number="04" label="EFFECT DELIVERY" />
          <div className="page-width">
            <div className="process-section__header reveal-up">
              <div>
                <p className="section-kicker">从理解空间，到交付效果</p>
                <h2>光的秩序，<br />要经过现场。</h2>
              </div>
              <p className="process-section__note">图纸完成、产品到场、安装完成，都不等于效果完成。</p>
            </div>
            <div className="process-line" aria-label="效果交付流程">
              {processSteps.map((step, index) => (
                <button
                  className={`process-node ${activeProcess === index ? 'process-node--active' : ''}`}
                  key={step.number}
                  type="button"
                  onClick={() => setActiveProcess(index)}
                >
                  <span className="process-node__dot" />
                  <span className="process-node__number">{step.number}</span>
                  <strong>{step.title}</strong>
                </button>
              ))}
            </div>
            <div className="process-detail">
              <div className="process-detail__number">{processSteps[activeProcess].number}</div>
              <div>
                <h3>{processSteps[activeProcess].summary}</h3>
                <p>{processSteps[activeProcess].detail}</p>
              </div>
              <Icon name="chevron" />
            </div>
          </div>
        </section>

        <section className="projects-section section-paper" id="projects">
          <SectionRail number="05" label="PROJECT ARCHIVE" />
          <div className="page-width">
            <div className="projects-section__header reveal-up">
              <div>
                <p className="section-kicker">真实项目，正在归档</p>
                <h2>先把真实<br />留出来。</h2>
              </div>
              <p className="projects-section__note">
                官网当前尚未接入可公开核验的项目影像与项目数据。正式内容接入前，这里保留真实项目位，不以虚构案例填充。
              </p>
            </div>
            <div className="project-archive-grid">
              <div className="project-placeholder project-placeholder--tall">
                <span className="project-placeholder__cross"><Icon name="plus" /></span>
                <span>PROJECT IMAGE / 待补充真实项目影像</span>
              </div>
              <div className="project-placeholder project-placeholder--tall project-placeholder--warm">
                <span className="project-placeholder__cross"><Icon name="plus" /></span>
                <span>PROJECT IMAGE / 待补充真实项目影像</span>
              </div>
              <div className="project-placeholder project-placeholder--wide">
                <span className="project-placeholder__cross"><Icon name="plus" /></span>
                <span>PROJECT IMAGE / 待补充真实项目影像</span>
              </div>
              <div className="project-placeholder">
                <span className="project-placeholder__cross"><Icon name="plus" /></span>
                <span>PROJECT IMAGE / 待补充</span>
              </div>
              <div className="project-placeholder">
                <span className="project-placeholder__cross"><Icon name="plus" /></span>
                <span>PROJECT IMAGE / 待补充</span>
              </div>
            </div>
            <div className="archive-status">
              <span>ARCHIVE STATUS</span>
              <span className="archive-status__line" />
              <strong>真实内容接入中</strong>
              <span className="archive-status__code">V1.0 / CONTENT PENDING</span>
            </div>
          </div>
        </section>

        <section className="products-section section-light" id="products">
          <SectionRail number="06" label="PRODUCT AS CARRIER" />
          <div className="page-width products-section__grid">
            <div className="product-media reveal-up">
              <div className="product-media__main">
                <img src={productModes[activeProduct].image} alt={productModes[activeProduct].alt} />
                <span className="media-index">0{activeProduct + 1} / 04</span>
              </div>
              <div className="product-media__caption">
                <span>PRODUCT MATERIAL / 资料图</span>
                <span>正式选型以最新技术确认单为准</span>
              </div>
            </div>
            <div className="products-section__content reveal-up">
              <p className="section-kicker">产品只是载体</p>
              <h2>一套产品，<br />回应不同空间任务。</h2>
              <p className="body-copy">从基础照明到重点照明，再到线性与磁吸系统，以空间任务而不是单一参数组织选型。</p>
              <div className="product-index">
                {productModes.map((product, index) => (
                  <button
                    className={`product-index__item ${activeProduct === index ? 'product-index__item--active' : ''}`}
                    type="button"
                    key={product.title}
                    onClick={() => setActiveProduct(index)}
                  >
                    <span>0{index + 1}</span>
                    <span>
                      <strong>{product.title}</strong>
                      <small>{product.english}</small>
                    </span>
                    <Icon name="arrow" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="start-section section-dark" id="start">
          <div className="start-section__ambient" />
          <SectionRail number="07" label="START WITH SPACE" light />
          <div className="page-width start-section__grid">
            <div className="start-section__intro reveal-up">
              <p className="section-kicker section-kicker--light">START WITH SPACE</p>
              <h2>发起一个<br /><span>项目。</span></h2>
              <p>告诉我们空间正在发生什么。<br />从真实问题开始，一起把光落到结果上。</p>
            </div>
            <form className="project-form reveal-up" onSubmit={handleSubmit}>
              <label>
                <span>称呼</span>
                <input name="name" placeholder="怎么称呼您" required />
              </label>
              <label>
                <span>联系方式</span>
                <input name="contact" placeholder="电话 / 微信 / 邮箱" required />
              </label>
              <label>
                <span>空间类型</span>
                <select name="space" defaultValue="">
                  <option value="" disabled>请选择空间类型</option>
                  <option value="residential">居住空间</option>
                  <option value="commercial">商业空间</option>
                  <option value="hospitality">酒店 / 餐饮</option>
                  <option value="other">其他空间</option>
                </select>
              </label>
              <label>
                <span>项目描述</span>
                <textarea name="brief" placeholder="空间位置、阶段或正在遇到的问题" rows={3} />
              </label>
              <button className="button button--outline-light" type="submit">
                {formStatus === 'preview' ? 'V1.0 预览｜接口待接入' : '提交项目需求'} <Icon name="arrow" />
              </button>
              <p className="form-note">当前为官网 V1.0 预览，表单接口待接入。</p>
            </form>
          </div>
          <footer className="page-width site-footer">
            <a className="brand-lockup brand-lockup--footer" href="#top">
              <span className="brand-mark" aria-hidden="true"><span /><span /></span>
              <span><strong>瑞客照明</strong><small>RUIKE LIGHTING</small></span>
            </a>
            <span>专业创造效果，担当兑现承诺。</span>
            <a className="back-top" href="#top" aria-label="返回顶部"><Icon name="arrowUp" /></a>
          </footer>
        </section>
      </main>
    </div>
  )
}

export default App
