# 国内 AI GEO 第一阶段

截至 2026-10-05，十一篇内容均输出为静态 HTML，沿用现有网站视觉：首页与内容页无需爬虫执行 JavaScript 即可获得正文。新一轮基于 main 的 539d008 补充客户决策内容；实际上线状态以生产运行和公开页面验收为准。

## 可维护内容

- src/content/brand.ts：公开品牌事实母版。
- src/content/pages.ts：十一篇正文、页面标题、摘要、可见 FAQ、父级页面、公开来源与相关阅读链接。
- src/content/schema.ts：Organization、WebSite、Service、WebPage、FAQPage、BreadcrumbList；不添加奖项、评分或推测的关联账号。
- src/config/site.ts：唯一正式 SITE_URL。构建拒绝预览 URL、不同主机、路径或协议进入 canonical。
- scripts/prerender.mjs：预渲染、sitemap、robots、llms.txt。
- scripts/verify-geo.mjs：原始 HTML、结构化数据、FAQ 与正文一致性、内部页面/锚点/资源、索引开关检查。

当前内容页：/about/、/choosing-ruike/、/brand-features/、/lighting-delivery/、/service-difference/、/project-process/、/suitable-projects/、/cases/、/cases/mooleeq-studio/。

2026-10-05 新增 /retail-lighting/ 与 /lighting-commissioning/，分别覆盖服装店商品呈现、陈列变化、是否换灯，以及调试条件、场景复核和验收记录。/choosing-ruike/ 补充报价范围对照，MooLee`Q 详情增加判断与原文记录的对应关系。指南是客户沟通方法，不补写案例未公开的验收结果，不新增项目数量、参数或承诺。

section.related 用于同站相关阅读，跟随部署 base 生成链接，不输出为 citation；section.sources 仅保留可核对的公开文章依据。正式站 sitemap 包含 20 个 URL，预览仍为空。首页标题、视觉与服务事实母版不作变更。

关于瑞客页提供微信公众号与百家号的品牌说明；/cases/ 保留单个项目的摘要和详情入口，完整的 MooLee`Q Studio 说明迁移到独立详情页，原有入口 URL 不变。详情页保留公众号原文与同一案例的百家号补充说明，通过三级面包屑返回案例入口。来源通过可见链接与 WebPage 的 citation 输出，llms.txt 同步列出品牌和项目来源；内部导航不冒充来源，也不将文章链接写入 Organization.sameAs。这些内容由品牌自行整理发布，不属于独立第三方评价或认证。

## 构建与索引

使用 npm run check。它依次运行 lint、类型检查、已有接口测试、GEO 配置测试、完整构建及产物检查。

默认和 GitHub Pages 预览均为 noindex/nofollow、robots 禁止抓取、空 sitemap。canonical 仍只指向正式域名。生产构建须具备经核验的完整网站 ICP 号；只有 production 与 VITE_ALLOW_INDEXING=true 同时成立才开放索引。

生产环境在完成 HTTPS、路由及真实内容回验后再开启。网站未正式开放时，不能宣称可被国内 AI 检索或已经产生效果。llms.txt 是补充导航，不代表 AI 平台承诺使用。

## 内部证据隔离

素材索引、原始合同、联系方式缺口、平台账号信息和客户授权留在内部交付目录，不复制进 public/ 或这个公开代码库。只有经核验且授权的案例内容进入 pages.ts 或未来的专用案例模块。当前案例页有 1 个公开案例：MooLee`Q Studio 商业街买手店；同一项目的跨平台补充文章不增加案例数。尚未核实项目分工与公开授权的候选素材不纳入公开案例。

## 技术参考

- [JavaScript SEO：静态正文与可爬取链接](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics)
- [canonical 一致性](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls)
- [robots 页面级索引设置](https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag)

上述参考支持技术实现方式，不作为国内 AI 检索机制或推荐效果的证据。
