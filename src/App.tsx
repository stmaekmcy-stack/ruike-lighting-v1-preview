import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { companyConfig } from './config/company'
import { trackEvent, trackEventOnce } from './lib/analytics'

type IconName = 'arrow' | 'chevron' | 'menu' | 'close' | 'plus' | 'arrowUp'

type ProcessStep = {
  number: string
  title: string
  summary: string
  detail: string
}

type PublishStatus = 'draft' | 'published'

type FormStatus = 'idle' | 'submitting' | 'success' | 'error'

type ProductionProductMedia = {
  image: string
  alt: string
  imageSourceVerified: boolean
  approvedForPublication: boolean
  highResolutionVerified: boolean
}

type ProductMode = {
  title: string
  english: string
  description: string
  developmentImage: string
  developmentAlt: string
  productionMedia: ProductionProductMedia | null
  status: PublishStatus
}

type ProjectArchiveItem = {
  id: string
  className: string
  label: string
  status: PublishStatus
  isRuikeProject?: boolean
  imageSourceVerified?: boolean
  approvedForPublication?: boolean
  metadataVerified?: boolean
  contentReady?: boolean
  image?: string
  alt?: string
}

const navItems = [
  { label: '灯光效果', href: '#standard' },
  { label: '真实项目', href: '#projects' },
  { label: '效果交付', href: '#process' },
  { label: '关于瑞客', href: '#brand' },
]

const isDevelopment = import.meta.env.DEV
const formEndpoint = import.meta.env.VITE_PROJECT_FORM_ENDPOINT?.trim() ?? ''
const formEnabled = isDevelopment || formEndpoint.length > 0
const simulateFormFailure = import.meta.env.VITE_FORM_SIMULATE_FAILURE === 'true'

const withBasePath = (path: string) => {
  if (/^(?:https?:)?\/\//.test(path)) return path
  return `${import.meta.env.BASE_URL}${path.replace(/^\/+/, '')}`
}

const principles = [
  { title: '视觉需求', body: '真实使用所需的视觉条件是否得到适宜回应。', motif: 'beam' },
  { title: '视觉舒适', body: '人在主要使用与观看位置能否自然、稳定地观看。', motif: 'soft' },
  { title: '对象呈现', body: '重要人物、物品与材料是否被恰当呈现。', motif: 'object' },
  { title: '空间感知', body: '光是否帮助人自然理解空间的重点、主次、前后、深度、边界与方向。', motif: 'depth' },
  { title: '空间氛围', body: '整体视觉状态是否与建筑、功能、活动、时间及设计意图相符。', motif: 'ambient' },
]

const processSteps: ProcessStep[] = [
  {
    number: '01',
    title: '理解期待',
    summary: '理解客户期待',
    detail: '理解客户对空间、使用与灯光效果的真实期待。',
  },
  {
    number: '02',
    title: '定义效果',
    summary: '明确效果目标',
    detail: '将客户期待转化为明确的灯光效果目标。',
  },
  {
    number: '03',
    title: '灯光设计',
    summary: '围绕目标完成设计',
    detail: '围绕已经明确的效果目标形成灯光设计。',
  },
  {
    number: '04',
    title: '产品匹配',
    summary: '匹配产品与技术条件',
    detail: '根据效果目标匹配产品、配光、控制及相应技术条件。',
  },
  {
    number: '05',
    title: '现场落地',
    summary: '在真实现场落地',
    detail: '将灯光设计与产品能力落实到真实空间。',
  },
  {
    number: '06',
    title: '专业调试',
    summary: '完成专业调试',
    detail: '在真实空间与实际使用、观看条件下完成专业调试。',
  },
  {
    number: '07',
    title: '效果验收',
    summary: '确认约定效果',
    detail: '对约定的灯光效果进行专业验收。',
  },
]

const developmentProductModes: ProductMode[] = [
  {
    title: '内嵌固定',
    english: 'RECESSED / FIXED',
    description: '稳定、克制，适合基础与重点照明。',
    developmentImage: 'src/dev-assets/recessed-light-on.jpeg',
    developmentAlt: '瑞客内嵌灯具开灯效果开发占位图',
    productionMedia: null,
    status: 'draft',
  },
  {
    title: '深杯防眩',
    english: 'DEEP ANTI-GLARE',
    description: '见光不见灯，让光柔和地落下，而不是刺向视线。',
    developmentImage: 'src/dev-assets/recessed-light-off.jpeg',
    developmentAlt: '瑞客深杯防眩灯具开发占位图',
    productionMedia: null,
    status: 'draft',
  },
  {
    title: '产品家族',
    english: 'PRODUCT FAMILY',
    description: '以产品架构承接不同空间任务，正式选型以最新技术确认单为准。',
    developmentImage: 'src/dev-assets/recessed-light-family.jpeg',
    developmentAlt: '瑞客内嵌灯具产品家族开发占位图',
    productionMedia: null,
    status: 'draft',
  },
  {
    title: '选型资料',
    english: 'SELECTION NOTES',
    description: '参数是选择的工具，不是效果的替代；资料位持续维护中。',
    developmentImage: 'src/dev-assets/recessed-light-options.png',
    developmentAlt: '瑞客内嵌灯具选型资料开发占位图',
    productionMedia: null,
    status: 'draft',
  },
]

const publishedProductModes: ProductMode[] = []

const developmentProjectArchive: ProjectArchiveItem[] = [
  { id: 'slot-01', className: 'project-placeholder--tall', label: 'PROJECT IMAGE / 待补充真实项目影像', status: 'draft' },
  { id: 'slot-02', className: 'project-placeholder--tall project-placeholder--warm', label: 'PROJECT IMAGE / 待补充真实项目影像', status: 'draft' },
  { id: 'slot-03', className: 'project-placeholder--wide', label: 'PROJECT IMAGE / 待补充真实项目影像', status: 'draft' },
  { id: 'slot-04', className: '', label: 'PROJECT IMAGE / 待补充', status: 'draft' },
  { id: 'slot-05', className: '', label: 'PROJECT IMAGE / 待补充', status: 'draft' },
]

const publishedProjectArchive: ProjectArchiveItem[] = []

const isPublishableProject = (project: ProjectArchiveItem) => (
  project.status === 'published'
  && project.isRuikeProject === true
  && project.imageSourceVerified === true
  && project.approvedForPublication === true
  && project.metadataVerified === true
  && project.contentReady === true
  && Boolean(project.image)
  && Boolean(project.alt)
)

const visibleProjects = isDevelopment
  ? developmentProjectArchive
  : publishedProjectArchive.filter(isPublishableProject)

const visibleNavItems = navItems.filter((item) => item.href !== '#projects' || visibleProjects.length > 0)

const visibleProductModes = isDevelopment
  ? developmentProductModes
  : publishedProductModes.filter((product) => (
      product.status === 'published'
      && product.productionMedia?.imageSourceVerified === true
      && product.productionMedia.approvedForPublication === true
      && product.productionMedia.highResolutionVerified === true
      && Boolean(product.productionMedia.image)
      && Boolean(product.productionMedia.alt)
    ))

const cleanSingleLine = (value: FormDataEntryValue | null, maxLength: number) => (
  String(value ?? '')
    .replace(/[<>]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength)
)

const cleanMultiline = (value: FormDataEntryValue | null, maxLength: number) => (
  String(value ?? '')
    .replace(/[<>]/g, '')
    .replace(/\r\n/g, '\n')
    .trim()
    .slice(0, maxLength)
)

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
  const [formStatus, setFormStatus] = useState<FormStatus>('idle')
  const wechatQrRef = useRef<HTMLImageElement>(null)
  const activeProductMode = visibleProductModes[activeProduct]
  const activeProductImagePath = activeProductMode
    ? (isDevelopment ? activeProductMode.developmentImage : activeProductMode.productionMedia?.image)
    : undefined
  const activeProductImage = activeProductImagePath ? withBasePath(activeProductImagePath) : undefined
  const activeProductAlt = activeProductMode
    ? (isDevelopment ? activeProductMode.developmentAlt : activeProductMode.productionMedia?.alt)
    : undefined
  const wechatQr = companyConfig.wechatQr ? withBasePath(companyConfig.wechatQr) : null
  const phoneHref = companyConfig.phone
    ? `tel:${companyConfig.phone.replace(/[^\d+]/g, '')}`
    : null

  useEffect(() => {
    trackEventOnce('view_home')
  }, [])

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 32)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const qrElement = wechatQrRef.current
    if (!wechatQr || !qrElement) return

    if (!('IntersectionObserver' in window)) {
      trackEventOnce('view_wechat_qr', { source: 'contact' })
      return
    }

    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        trackEventOnce('view_wechat_qr', { source: 'contact' })
        observer.disconnect()
      }
    }, { threshold: 0.5 })

    observer.observe(qrElement)
    return () => observer.disconnect()
  }, [wechatQr])

  const scrollToStart = (source: 'navigation' | 'hero') => {
    trackEvent('click_start_project', { source })
    document.querySelector('#start')?.scrollIntoView({ behavior: 'smooth' })
    setMenuOpen(false)
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = event.currentTarget

    if (!formEnabled) {
      setFormStatus('error')
      trackEvent('submit_lead_error', { source: 'project_form', reason: 'unconfigured' })
      return
    }

    if (!form.checkValidity()) {
      form.reportValidity()
      setFormStatus('error')
      trackEvent('submit_lead_error', { source: 'project_form', reason: 'validation' })
      return
    }

    const formData = new FormData(form)
    const honeypot = cleanSingleLine(formData.get('website'), 120)

    if (honeypot) {
      setFormStatus('success')
      form.reset()
      return
    }

    const payload = {
      name: cleanSingleLine(formData.get('name'), 60),
      contact: cleanSingleLine(formData.get('contact'), 120),
      space: cleanSingleLine(formData.get('space'), 60),
      brief: cleanMultiline(formData.get('brief'), 1200),
    }

    if (payload.name.length < 2 || payload.contact.length < 4) {
      setFormStatus('error')
      trackEvent('submit_lead_error', { source: 'project_form', reason: 'validation' })
      return
    }

    setFormStatus('submitting')

    try {
      if (isDevelopment) {
        await new Promise((resolve) => window.setTimeout(resolve, 450))
        if (simulateFormFailure) throw new Error('Simulated form failure')
      } else {
        const controller = new AbortController()
        const timeoutId = window.setTimeout(() => controller.abort(), 12_000)
        try {
          const response = await fetch(formEndpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            signal: controller.signal,
          })
          if (!response.ok) throw new Error('Project request failed')
        } finally {
          window.clearTimeout(timeoutId)
        }
      }

      form.reset()
      setFormStatus('success')
      trackEvent('submit_lead_success', { source: 'project_form' })
    } catch {
      setFormStatus('error')
      trackEvent('submit_lead_error', {
        source: 'project_form',
        reason: isDevelopment && simulateFormFailure ? 'simulated' : 'network',
      })
    }
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
            <strong>{companyConfig.companyName}</strong>
            <small>RUIKE LIGHTING</small>
          </span>
        </a>
        <nav className={`main-nav ${menuOpen ? 'main-nav--open' : ''}`} aria-label="主导航">
          {visibleNavItems.map((item) => (
            <a key={item.href} href={item.href} onClick={() => setMenuOpen(false)}>
              {item.label}
            </a>
          ))}
          <button className="nav-project-link" type="button" onClick={() => scrollToStart('navigation')}>
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
          <div
            className="hero__image"
            role="img"
            aria-label="建筑空间中暖光沿墙面与地面展开"
            style={{ backgroundImage: `url(${withBasePath('assets/hero-architecture.png')})` }}
          />
          <div className="hero__edge-fade" />
          <SectionRail number="01" label="LIGHT AS RESULT" light />
          <div className="hero__content page-width">
            <p className="hero__location">灯光效果交付品牌</p>
            <h1>
              <span className="hero__promise">效果保障，</span>
              <span className="title-line">让好灯光</span>
              <span className="title-line hero__result">看得见。</span>
            </h1>
            <p className="hero__intro">
              为客户实现期待的灯光效果，
              <br className="desktop-break" />
              让每一个空间因光而更具价值。
            </p>
            <button className="button button--light" type="button" onClick={() => scrollToStart('hero')}>
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
              <h2 className="section-title brand-section__title">
                <span className="title-line">光，</span>
                <span className="title-line">是空间的</span>
                <em className="title-line">第二次塑造。</em>
              </h2>
            </div>
            <div className="brand-section__body reveal-up">
              <p className="display-quote">不止卖灯，效果交付。</p>
              <p className="body-copy">
                灯光效果，是灯光在真实空间以及实际使用、观看条件下，最终形成并被人感知到的视觉结果。
              </p>
              <a className="text-link" href="#standard">
                了解瑞客的判断标准 <Icon name="arrow" />
              </a>
            </div>
          </div>
          <div className="page-width brand-section__principles">
            <div className="open-principle">
              <span>01</span>
              <strong>专业定义效果</strong>
              <small>理解客户期待，并转译为明确的灯光效果目标。</small>
            </div>
            <div className="open-principle">
              <span>02</span>
              <strong>产品承载效果</strong>
              <small>通过合适的产品、光学与技术能力，支撑灯光效果目标的实现。</small>
            </div>
            <div className="open-principle">
              <span>03</span>
              <strong>交付兑现效果</strong>
              <small>从方案、现场到专业调试与效果验收，对最终结果负责。</small>
            </div>
          </div>
        </section>

        <section className="standard-section section-dark" id="standard">
          <SectionRail number="03" label="THE GOOD LIGHT STANDARD" light />
          <div className="page-width">
            <div className="standard-section__intro reveal-up">
              <p className="section-kicker section-kicker--light">RUIKE GOOD LIGHT</p>
              <h2 className="section-title standard-section__title">
                <span className="title-line">什么样的灯光，</span>
                <span className="title-line">才叫好？</span>
              </h2>
              <p className="standard-section__intro-copy">
                <span>瑞客用五个相互关联的质量观察面判断灯光效果：</span>
                <span>单项看是否恰当，整体看是否相符，</span>
                <span>不以单一参数代替整体判断。</span>
              </p>
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
                <p className="section-kicker">效果目标先于产品选择</p>
                <h2 className="section-title process-section__judgements">
                  <span className="title-line">图纸完成 ≠ 效果完成</span>
                  <span className="title-line">产品到场 ≠ 效果完成</span>
                  <span className="title-line">灯具安装完成 ≠ 效果完成</span>
                </h2>
              </div>
              <p className="process-section__note">只有约定的灯光效果在真实空间中被合理实现，并通过专业调试与效果验收，才构成完整效果交付。</p>
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

        {visibleProjects.length > 0 ? (
          <section className="projects-section section-paper" id="projects">
            <SectionRail number="05" label="PROJECT ARCHIVE" />
            <div className="page-width">
              {isDevelopment ? (
                <div className="projects-section__header reveal-up">
                  <div>
                    <p className="section-kicker">真实项目，正在归档</p>
                    <h2 className="section-title projects-section__title">
                      <span className="title-line">先把真实</span>
                      <span className="title-line">留出来。</span>
                    </h2>
                  </div>
                  <p className="projects-section__note">
                    官网当前尚未接入可公开核验的项目影像与项目数据。正式内容接入前，这里保留真实项目位，不以虚构案例填充。
                  </p>
                </div>
              ) : null}
              <div className="project-archive-grid">
                {visibleProjects.map((project) => (
                  <div className={`${project.image ? 'project-image' : 'project-placeholder'} ${project.className}`.trim()} key={project.id}>
                    {project.image && project.alt ? (
                      <img src={withBasePath(project.image)} alt={project.alt} />
                    ) : (
                      <>
                        <span className="project-placeholder__cross"><Icon name="plus" /></span>
                        <span>{project.label}</span>
                      </>
                    )}
                  </div>
                ))}
              </div>
              {isDevelopment ? (
                <div className="archive-status">
                  <span>ARCHIVE STATUS</span>
                  <span className="archive-status__line" />
                  <strong>真实内容接入中</strong>
                  <span className="archive-status__code">V1.0 / CONTENT PENDING</span>
                </div>
              ) : null}
            </div>
          </section>
        ) : null}

        <section className="products-section section-light" id="products">
          <SectionRail number="06" label="PRODUCT AS CARRIER" />
          <div className="page-width products-section__grid">
            {activeProductMode && activeProductImage && activeProductAlt ? (
              <div className="product-media reveal-up">
                <div className="product-media__main" data-media-status={isDevelopment ? 'development-placeholder' : 'production-ready'}>
                  <img src={activeProductImage} alt={activeProductAlt} />
                  <span className="media-index">0{activeProduct + 1} / 0{visibleProductModes.length}</span>
                </div>
                <div className="product-media__caption">
                  <span>{isDevelopment ? 'DEVELOPMENT PLACEHOLDER / 低清资料截图' : 'PRODUCT MATERIAL / 正式高清产品图'}</span>
                  <span>{isDevelopment ? '正式高清产品图替换位' : '正式选型以最新技术确认单为准'}</span>
                </div>
              </div>
            ) : null}
            <div className={`products-section__content reveal-up ${visibleProductModes.length === 0 ? 'products-section__content--summary' : ''}`}>
              <p className="section-kicker">产品，是实现效果的载体。</p>
              <h2 className="section-title products-section__headline">
                <span className="title-line">为不同效果任务，</span>
                <span className="title-line">匹配合适的产品能力。</span>
              </h2>
              <p className="body-copy">先明确需要实现什么灯光效果，再确定配光、产品、控制及相应技术条件。</p>
              {visibleProductModes.length > 0 ? (
                <div className="product-index">
                  {visibleProductModes.map((product, index) => (
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
              ) : (
                <a
                  className="text-link"
                  href="#start"
                  onClick={() => trackEvent('click_start_project', { source: 'product' })}
                >
                  发起项目 <Icon name="arrow" />
                </a>
              )}
            </div>
          </div>
        </section>

        <section className="start-section section-dark" id="start">
          <div className="start-section__ambient" />
          <SectionRail number="07" label="START WITH SPACE" light />
          <div className="page-width start-section__grid">
            <div className="start-section__intro reveal-up">
              <p className="section-kicker section-kicker--light">START WITH SPACE</p>
              <h2 className="section-title start-section__title">
                <span className="title-line">发起一个</span>
                <span className="title-line start-section__title-accent">项目。</span>
              </h2>
              <p>把你的空间、真实使用场景和期待告诉瑞客。<br />我们先理解需要解决的问题，<br />再明确这个项目需要实现什么灯光效果。</p>
            </div>
            <form className="project-form reveal-up" onSubmit={handleSubmit} noValidate aria-disabled={!formEnabled}>
              <label>
                <span>称呼</span>
                <input name="name" placeholder="怎么称呼您" autoComplete="name" minLength={2} maxLength={60} required disabled={!formEnabled} />
              </label>
              <label>
                <span>联系方式</span>
                <input name="contact" placeholder="电话 / 微信 / 邮箱" autoComplete="off" minLength={4} maxLength={120} required disabled={!formEnabled} />
              </label>
              <label>
                <span>空间类型</span>
                <select name="space" defaultValue="" disabled={!formEnabled}>
                  <option value="" disabled>请选择空间类型</option>
                  <option value="residential">居住空间</option>
                  <option value="commercial">商业空间</option>
                  <option value="hospitality">酒店 / 餐饮</option>
                  <option value="other">其他空间</option>
                </select>
              </label>
              <label>
                <span>项目描述</span>
                <textarea name="brief" placeholder="空间位置、阶段或正在遇到的问题" rows={3} maxLength={1200} disabled={!formEnabled} />
              </label>
              <label className="form-honeypot" aria-hidden="true">
                <span>网站</span>
                <input name="website" tabIndex={-1} autoComplete="off" disabled={!formEnabled} />
              </label>
              {!formEnabled && wechatQr ? (
                <div className="form-contact-fallback">
                  <img ref={wechatQrRef} src={wechatQr} alt={`${companyConfig.wechat ?? companyConfig.companyName}二维码`} />
                  <div>
                    <strong>{companyConfig.wechat ?? '瑞客官方微信'}</strong>
                    <p>线上项目表单尚未接通，请扫描二维码进入微信端。</p>
                    {companyConfig.phone && phoneHref ? (
                      <a
                        href={phoneHref}
                        onClick={() => trackEvent('click_phone', { source: 'contact' })}
                      >
                        {companyConfig.phone}
                      </a>
                    ) : null}
                    {companyConfig.email ? <a href={`mailto:${companyConfig.email}`}>{companyConfig.email}</a> : null}
                    {companyConfig.address ? <address>{companyConfig.address}</address> : null}
                  </div>
                </div>
              ) : null}
              <button className="button button--outline-light" type="submit" disabled={!formEnabled || formStatus === 'submitting'}>
                {!formEnabled ? '在线表单暂未开放' : formStatus === 'submitting' ? '正在提交' : '提交项目需求'} <Icon name="arrow" />
              </button>
              {formStatus !== 'idle' ? (
                <p className={`form-status form-status--${formStatus}`} role="status" aria-live="polite">
                  {formStatus === 'success'
                    ? '项目信息已收到。瑞客会根据你提供的情况进一步了解项目。'
                    : formStatus === 'error'
                      ? '暂未提交成功。请检查必填信息，或稍后重试。'
                      : '正在安全提交项目信息…'}
                </p>
              ) : null}
              <p className="form-note form-consent">
                提交即表示你同意瑞客仅为项目沟通目的处理你主动提供的信息。
                <a href={withBasePath('privacy.html')}>隐私说明</a>
                <a href={withBasePath('terms.html')}>网站使用条款</a>
              </p>
              {isDevelopment ? <p className="form-note form-development-note">开发环境使用模拟提交；生产环境仅在配置真实接收端后启用。</p> : null}
            </form>
          </div>
          <footer className="page-width site-footer">
            <a className="brand-lockup brand-lockup--footer" href="#top">
              <span className="brand-mark" aria-hidden="true"><span /><span /></span>
              <span><strong>{companyConfig.companyName}</strong><small>RUIKE LIGHTING</small></span>
            </a>
            <div className="site-footer__meta">
              <span>专业创造效果，担当兑现承诺。</span>
              {companyConfig.legalCompanyName && companyConfig.address ? (
                <address>{companyConfig.legalCompanyName} · {companyConfig.address}</address>
              ) : null}
              <span className="site-footer__links">
                <a href={withBasePath('privacy.html')}>隐私说明</a>
                <a href={withBasePath('terms.html')}>网站使用条款</a>
              </span>
            </div>
            <a className="back-top" href="#top" aria-label="返回顶部"><Icon name="arrowUp" /></a>
          </footer>
        </section>
      </main>
    </div>
  )
}

export default App
