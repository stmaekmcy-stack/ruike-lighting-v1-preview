import { useEffect, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'

type IconName = 'arrow' | 'chevron' | 'menu' | 'close' | 'plus' | 'arrowUp'

type ProcessStep = {
  number: string
  title: string
  description: string
}

type ContentStatus = 'DEV_PLACEHOLDER' | 'DRAFT' | 'PUBLISHED'

type ProjectRecord = {
  status: ContentStatus
  className: string
  label: string
}

type FormStatus = 'idle' | 'submitting' | 'success' | 'error'

type InquiryForm = {
  name: string
  phone: string
  city: string
  projectType: string
  stage: string
  brief: string
  wechat: string
  area: string
}

const initialForm: InquiryForm = {
  name: '',
  phone: '',
  city: '',
  projectType: '',
  stage: '',
  brief: '',
  wechat: '',
  area: '',
}

const projectTypes = ['别墅', '大平层', '酒店', '会所', '餐饮', '零售', '展厅', '办公', '其他']

const projectStages = [
  '概念 / 方案阶段',
  '深化设计',
  '水电施工',
  '木工 / 吊顶',
  '灯具选择',
  '安装阶段',
  '已安装待调试',
  '其他',
]

const projectRecords: ProjectRecord[] = [
  { status: 'DEV_PLACEHOLDER', className: 'project-placeholder--tall', label: 'REAL PROJECT IMAGE / 待补充' },
  { status: 'DEV_PLACEHOLDER', className: 'project-placeholder--tall project-placeholder--warm', label: 'REAL PROJECT IMAGE / 待补充' },
  { status: 'DEV_PLACEHOLDER', className: 'project-placeholder--wide', label: 'REAL PROJECT IMAGE / 待补充' },
  { status: 'DEV_PLACEHOLDER', className: '', label: 'REAL PROJECT IMAGE / 待补充' },
  { status: 'DEV_PLACEHOLDER', className: '', label: 'REAL PROJECT IMAGE / 待补充' },
]

const publishedProjects = projectRecords.filter((project) => project.status === 'PUBLISHED')
const visibleProjects = import.meta.env.DEV ? projectRecords : publishedProjects
const showProjects = visibleProjects.length > 0
const projectsHref = showProjects ? '#projects' : '#spaces'

const navItems = [
  { label: '好灯光', href: '#standard' },
  { label: '项目', href: projectsHref },
  { label: '效果交付', href: '#process' },
  { label: '关于瑞客', href: '#brand' },
]

const principles = [
  { title: '视觉需求', body: '真实活动需要的视觉条件是否合适。', motif: 'beam' },
  { title: '视觉舒适', body: '人在真实位置能否自然、稳定地观看。', motif: 'soft' },
  { title: '对象呈现', body: '需要被看见的人、物品与材料是否被恰当呈现。', motif: 'object' },
  { title: '空间感知', body: '光是否帮助人自然理解重点、主次、前后、深度、边界与方向。', motif: 'depth' },
  { title: '空间氛围', body: '整体视觉状态是否与场所、活动、时间和设计意图相符。', motif: 'ambient' },
]

const processSteps: ProcessStep[] = [
  { number: '01', title: '理解期待', description: '理解客户、空间、活动、对象与真实使用需求。' },
  { number: '02', title: '定义效果', description: '把客户期待转化为这个项目需要实现的明确视觉结果。' },
  { number: '03', title: '灯光设计', description: '围绕效果目标组织灯位、配光、亮暗关系、控制与场景。' },
  { number: '04', title: '产品实现', description: '根据效果需要匹配合适的产品、光学与控制能力。' },
  { number: '05', title: '现场落地', description: '保护灯位、节点、材料、安装方向和现场条件，使设计意图不在施工中丢失。' },
  { number: '06', title: '调试验收', description: '回到真实空间、真实位置和真实场景完成调试，并确认约定效果是否真正实现。' },
]

function Icon({ name }: { name: IconName }) {
  if (name === 'arrow') {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h15M13 5l7 7-7 7" /></svg>
  }
  if (name === 'chevron') {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 7 7-7 7" /></svg>
  }
  if (name === 'plus') {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
  }
  if (name === 'arrowUp') {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 19V5M6 11l6-6 6 6" /></svg>
  }
  return name === 'menu' ? (
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
  ) : (
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg>
  )
}

function BrandLockup({ footer = false }: { footer?: boolean }) {
  return (
    <span className={`brand-lockup ${footer ? 'brand-lockup--footer' : ''}`}>
      <span className="brand-mark" aria-hidden="true"><span /><span /></span>
      <span><strong>瑞客照明</strong><small>RUIKE LIGHTING</small></span>
    </span>
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

function LegalDialog({ type, onClose }: { type: 'privacy' | 'terms'; onClose: () => void }) {
  const isPrivacy = type === 'privacy'
  return (
    <div className="legal-dialog" role="dialog" aria-modal="true" aria-labelledby="legal-dialog-title">
      <button className="legal-dialog__backdrop" type="button" aria-label="关闭说明" onClick={onClose} />
      <div className="legal-dialog__panel">
        <button className="legal-dialog__close" type="button" aria-label="关闭说明" onClick={onClose}><Icon name="close" /></button>
        <p className="section-kicker">RUIKE LIGHTING / {isPrivacy ? 'PRIVACY' : 'TERMS'}</p>
        <h2 id="legal-dialog-title">{isPrivacy ? '隐私说明' : '网站使用条款'}</h2>
        {isPrivacy ? (
          <p>瑞客仅使用你主动提交的项目资料，用于进一步了解项目与联系沟通。未经你的授权，瑞客不会将项目资料用于无关用途。</p>
        ) : (
          <p>本网站内容用于介绍瑞客照明的品牌、灯光效果判断与效果交付方式。真实项目内容以获得授权并完成核验的正式发布版本为准。</p>
        )}
        <button className="text-link" type="button" onClick={onClose}>返回页面 <Icon name="arrow" /></button>
      </div>
    </div>
  )
}

function App() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [activeProcess, setActiveProcess] = useState(0)
  const [formData, setFormData] = useState<InquiryForm>(initialForm)
  const [formStatus, setFormStatus] = useState<FormStatus>('idle')
  const [formMessage, setFormMessage] = useState('')
  const [fileNames, setFileNames] = useState<string[]>([])
  const [legalDialog, setLegalDialog] = useState<'privacy' | 'terms' | null>(null)

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

  const handleFieldChange = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target
    setFormData((current) => ({ ...current, [name]: value }))
    if (formStatus === 'error') {
      setFormStatus('idle')
      setFormMessage('')
    }
  }

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? [])
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png']
    const maxFileSize = 8 * 1024 * 1024
    const invalidFile = files.find((file) => !allowedTypes.includes(file.type) || file.size > maxFileSize)
    if (files.length > 3 || invalidFile) {
      setFormStatus('error')
      setFormMessage('文件请上传 PDF、JPG、JPEG 或 PNG，单个文件不超过 8MB，最多 3 个。')
      event.target.value = ''
      setFileNames([])
      return
    }
    setFileNames(files.map((file) => file.name))
    setFormStatus('idle')
    setFormMessage('')
  }

  const encodeFile = (file: File) => new Promise<{ name: string; type: string; size: number; data: string }>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve({ name: file.name, type: file.type, size: file.size, data: String(reader.result) })
    reader.onerror = () => reject(new Error('文件读取失败'))
    reader.readAsDataURL(file)
  })

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = event.currentTarget
    const filesElement = form.elements.namedItem('files')
    const websiteElement = form.elements.namedItem('website')
    const files = filesElement instanceof HTMLInputElement ? Array.from(filesElement.files ?? []) : []
    const hiddenWebsite = websiteElement instanceof HTMLInputElement ? websiteElement.value : ''
    setFormStatus('submitting')
    setFormMessage('')

    try {
      const encodedFiles = await Promise.all(files.map(encodeFile))
      const response = await fetch('/api/project-inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, website: hiddenWebsite, files: encodedFiles }),
      })
      const result = (await response.json()) as { message?: string }
      if (!response.ok) throw new Error(result.message ?? '提交未完成，请稍后再试。')
      setFormStatus('success')
      setFormMessage('项目资料已收到。瑞客会根据你提供的信息进一步了解项目。')
      setFormData(initialForm)
      setFileNames([])
      form.reset()
    } catch (error) {
      setFormStatus('error')
      setFormMessage(error instanceof Error ? error.message : '提交未完成，请稍后再试。')
    }
  }

  return (
    <div className="site-shell">
      <header className={`site-nav ${isScrolled ? 'site-nav--scrolled' : ''}`}>
        <a className="brand-link" href="#top" aria-label="返回瑞客首页"><BrandLockup /></a>
        <nav className={`main-nav ${menuOpen ? 'main-nav--open' : ''}`} aria-label="主导航">
          {navItems.map((item) => <a key={item.label} href={item.href} onClick={() => setMenuOpen(false)}>{item.label}</a>)}
          <button className="nav-project-link" type="button" onClick={scrollToStart}>发起项目 <Icon name="arrow" /></button>
        </nav>
        <button className="menu-toggle" type="button" aria-label={menuOpen ? '关闭菜单' : '打开菜单'} aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)}>
          <Icon name={menuOpen ? 'close' : 'menu'} />
        </button>
      </header>

      <main>
        <section className="hero" id="top">
          <div className="hero__image" />
          <div className="hero__edge-fade" />
          <SectionRail number="01" label="LIGHT AS RESULT" light />
          <div className="hero__content page-width">
            <p className="hero__location">灯光效果交付品牌</p>
            <h1>让好灯光<br /><span>看得见。</span></h1>
            <p className="hero__claim">效果保障，让好灯光看得见。</p>
            <p className="hero__intro">为客户实现期待的灯光效果。</p>
            <p className="hero__helper">从设计、产品到现场与调试，让期待的灯光真正落到空间。</p>
            <div className="hero-actions">
              <button className="button button--light" type="button" onClick={scrollToStart}>发起项目 <Icon name="arrow" /></button>
              <a className="button button--ghost-light" href={projectsHref}>查看项目 <Icon name="arrow" /></a>
            </div>
          </div>
          <a className="hero__scroll" href="#brand"><span>SCROLL TO EXPLORE</span><span className="hero__scroll-line" /></a>
        </section>

        <section className="brand-section section-light" id="brand">
          <SectionRail number="02" label="WHAT WE DELIVER" />
          <div className="page-width brand-section__grid">
            <div className="brand-section__headline reveal-up">
              <p className="section-kicker">灯光效果交付品牌</p>
              <h2>买到好灯，<br /><em>不等于</em><br />得到好灯光。</h2>
            </div>
            <div className="brand-section__body reveal-up">
              <p className="display-quote">不止卖灯，效果交付。</p>
              <p className="body-copy">客户最终真正感受到的，不是哪一盏灯，而是光在真实空间中形成的整体结果。</p>
              <p className="body-copy">灯具、参数、图纸和效果图，都是实现结果的条件，却都不等于最终灯光效果本身。</p>
              <a className="text-link" href="#standard">了解瑞客如何判断好灯光 <Icon name="arrow" /></a>
              <div className="brand-trust">
                <span className="brand-trust__year">2020 — 至今</span>
                <p>瑞客自2020年开始，以设计、产品与现场交付协同的方式服务真实灯光项目，并持续把项目经验沉淀为更稳定的效果交付能力。</p>
                <a className="text-link" href="#brand">了解瑞客 <Icon name="arrow" /></a>
              </div>
            </div>
          </div>
          <div className="page-width brand-section__principles">
            <div className="open-principle"><span>01</span><strong>理解期待</strong><small>先理解真实的人、空间、活动与客户期待。</small></div>
            <div className="open-principle"><span>02</span><strong>定义效果</strong><small>先明确这个项目最终需要形成什么视觉结果。</small></div>
            <div className="open-principle"><span>03</span><strong>兑现结果</strong><small>让设计、产品、现场与调试共同服务最终效果。</small></div>
          </div>
        </section>

        <section className="standard-section section-dark" id="standard">
          <SectionRail number="03" label="THE GOOD LIGHT STANDARD" light />
          <div className="page-width">
            <div className="standard-section__intro reveal-up">
              <div><p className="section-kicker section-kicker--light">RUIKE GOOD LIGHT</p><h2>什么样的灯光，才叫好？</h2></div>
              <p>瑞客从五个相互关联的质量观察面判断灯光效果，不是只看某一个参数。</p>
            </div>
            <div className="principle-list">
              {principles.map((principle, index) => (
                <article className="principle" key={principle.title}>
                  <div className={`principle__visual principle__visual--${principle.motif}`}><span className="principle__beam" /><span className="principle__object" /></div>
                  <div className="principle__meta"><span>0{index + 1}</span><span className="principle__rule" /></div>
                  <h3>{principle.title}</h3><p>{principle.body}</p>
                </article>
              ))}
            </div>
            <a className="text-link text-link--light standard-section__link" href="#process">了解瑞客如何判断好灯光 <Icon name="arrow" /></a>
          </div>
        </section>

        <section className="process-section section-light" id="process">
          <SectionRail number="04" label="EFFECT DELIVERY" />
          <div className="page-width">
            <div className="process-section__header reveal-up">
              <div><p className="section-kicker">效果交付</p><h2>好效果，<br />从一开始就需要被设计和管理。</h2></div>
              <p className="process-section__note">图纸完成、产品到场、安装完成，都不等于效果完成。</p>
            </div>
            <div className="process-line" aria-label="效果交付流程">
              {processSteps.map((step, index) => (
                <button className={`process-node ${activeProcess === index ? 'process-node--active' : ''}`} key={step.number} type="button" onClick={() => setActiveProcess(index)}>
                  <span className="process-node__dot" /><span className="process-node__number">{step.number}</span><strong>{step.title}</strong>
                </button>
              ))}
            </div>
            <div className="process-detail"><div className="process-detail__number">{processSteps[activeProcess].number}</div><div><h3>{processSteps[activeProcess].title}</h3><p>{processSteps[activeProcess].description}</p></div><Icon name="chevron" /></div>
          </div>
        </section>

        {showProjects && (
          <section className="projects-section section-paper" id="projects">
            <SectionRail number="05" label="PROJECT ARCHIVE" />
            <div className="page-width">
              <div className="projects-section__header reveal-up">
                <div><p className="section-kicker">真实项目，正在归档</p><h2>让真实<br />先留下来。</h2></div>
                <p className="projects-section__note">开发环境保留真实项目位。正式环境只显示已核验、已获授权并完成资料整理的项目内容。</p>
              </div>
              <div className="project-archive-grid">
                {visibleProjects.map((project, index) => (
                  <div className={`project-placeholder ${project.className}`} data-content-status={project.status} key={`${project.status}-${index}`}>
                    <span className="project-placeholder__cross"><Icon name="plus" /></span><span>{project.label}</span>
                  </div>
                ))}
              </div>
              <div className="archive-status"><span>PROJECT ARCHIVE</span><span className="archive-status__line" /><strong>只等待真实内容</strong><span className="archive-status__code">DEV ONLY / NO INVENTED CASES</span></div>
            </div>
          </section>
        )}

        <section className="scenario-section section-light" id="spaces">
          <SectionRail number="06" label="FIND YOUR PROJECT" />
          <div className="page-width">
            <div className="scenario-section__header reveal-up"><p className="section-kicker">从项目类型开始匹配</p><h2>你正在做什么空间？</h2><p>先从真实的空间任务开始，再进入适合你的项目沟通。</p></div>
            <div className="scenario-list">
              <button className="scenario-entry" type="button" onClick={scrollToStart}><span className="scenario-entry__number">01</span><span className="scenario-entry__content"><strong>住宅</strong><small>别墅 / 大平层 / 高品质住宅</small></span><Icon name="arrow" /></button>
              <button className="scenario-entry" type="button" onClick={scrollToStart}><span className="scenario-entry__number">02</span><span className="scenario-entry__content"><strong>商业</strong><small>酒店 / 会所 / 餐饮 / 零售 / 展厅等</small></span><Icon name="arrow" /></button>
              <button className="scenario-entry" type="button" onClick={scrollToStart}><span className="scenario-entry__number">03</span><span className="scenario-entry__content"><strong>设计师合作</strong><small>灯光专业协同 / 产品实现 / 技术深化 / 现场与调试协同</small></span><Icon name="arrow" /></button>
            </div>
          </div>
        </section>

        <section className="start-section section-dark" id="start">
          <div className="start-section__ambient" /><SectionRail number="07" label="START WITH SPACE" light />
          <div className="page-width start-section__grid">
            <div className="start-section__intro reveal-up"><p className="section-kicker section-kicker--light">START WITH SPACE</p><h2>你期待怎样的<br /><span>灯光效果？</span></h2><p>如果你正在设计、装修或实施一个空间，可以把项目情况告诉瑞客。</p></div>
            <form className="project-form reveal-up" onSubmit={handleSubmit}>
              <label htmlFor="inquiry-name"><span>称呼 <i>必填</i></span><input id="inquiry-name" name="name" value={formData.name} onChange={handleFieldChange} placeholder="怎么称呼您" required maxLength={80} /></label>
              <label htmlFor="inquiry-phone"><span>联系电话 <i>必填</i></span><input id="inquiry-phone" name="phone" value={formData.phone} onChange={handleFieldChange} placeholder="请输入联系电话" required maxLength={40} inputMode="tel" /></label>
              <label htmlFor="inquiry-city"><span>项目城市 <i>必填</i></span><input id="inquiry-city" name="city" value={formData.city} onChange={handleFieldChange} placeholder="项目所在城市" required maxLength={80} /></label>
              <label htmlFor="inquiry-type"><span>项目类型 <i>必填</i></span><select id="inquiry-type" name="projectType" value={formData.projectType} onChange={handleFieldChange} required><option value="" disabled>请选择项目类型</option>{projectTypes.map((type) => <option key={type} value={type}>{type}</option>)}</select></label>
              <label htmlFor="inquiry-stage"><span>项目阶段 <i>必填</i></span><select id="inquiry-stage" name="stage" value={formData.stage} onChange={handleFieldChange} required><option value="" disabled>请选择项目阶段</option>{projectStages.map((stage) => <option key={stage} value={stage}>{stage}</option>)}</select></label>
              <label htmlFor="inquiry-wechat"><span>微信 <i>选填</i></span><input id="inquiry-wechat" name="wechat" value={formData.wechat} onChange={handleFieldChange} placeholder="微信号（选填）" maxLength={80} /></label>
              <label htmlFor="inquiry-area"><span>面积 <i>选填</i></span><input id="inquiry-area" name="area" value={formData.area} onChange={handleFieldChange} placeholder="平方米（选填）" maxLength={20} inputMode="decimal" /></label>
              <label className="project-form__full" htmlFor="inquiry-brief"><span>项目说明 <i>必填</i></span><textarea id="inquiry-brief" name="brief" value={formData.brief} onChange={handleFieldChange} placeholder="空间位置、阶段、期待的灯光效果或正在遇到的问题" rows={4} required maxLength={4000} /></label>
              <label className="file-field project-form__full" htmlFor="inquiry-files"><span>项目资料 <i>选填</i></span><input id="inquiry-files" name="files" type="file" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" multiple onChange={handleFileChange} /><span className="file-field__button">添加平面图、效果图或现场照片 <Icon name="plus" /></span>{fileNames.length > 0 && <small className="file-field__names">{fileNames.join(' / ')}</small>}</label>
              <input className="form-honeypot" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" />
              <button className="button button--outline-light" type="submit" disabled={formStatus === 'submitting'}>{formStatus === 'submitting' ? '正在提交…' : '提交项目需求'} <Icon name="arrow" /></button>
              {formMessage && <p className={`form-feedback form-feedback--${formStatus}`} role={formStatus === 'error' ? 'alert' : 'status'}>{formMessage}</p>}
              <p className="form-note">提交即表示你同意瑞客仅为项目沟通使用所提交资料。文件支持 PDF / JPG / JPEG / PNG，单个不超过 8MB，最多 3 个。</p>
            </form>
          </div>
          <footer className="page-width site-footer">
            <a className="brand-link" href="#top" aria-label="返回瑞客首页"><BrandLockup footer /></a>
            <div className="site-footer__facts"><span>瑞客照明</span><span>灯光效果交付品牌</span><span>效果保障，让好灯光看得见</span></div>
            <div className="site-footer__legal"><button type="button" onClick={() => setLegalDialog('privacy')}>隐私说明</button><button type="button" onClick={() => setLegalDialog('terms')}>网站条款</button></div>
            <a className="back-top" href="#top" aria-label="返回顶部"><Icon name="arrowUp" /></a>
          </footer>
        </section>
      </main>
      {legalDialog && <LegalDialog type={legalDialog} onClose={() => setLegalDialog(null)} />}
    </div>
  )
}

export default App
