# 瑞客照明官网｜灯光效果交付品牌

瑞客照明是以灯光效果交付为核心的专业照明服务品牌，围绕需求理解、效果目标、灯光设计、产品配置、现场交底与协同、安装调试、效果验收组织服务。

**正式官网：[https://ruikelight.com/](https://ruikelight.com/)**。本仓库保存官网源码、质量检查及发布记录；仓库名中的 `preview` 是历史项目名称。

## 品牌与服务入口

- [关于瑞客：官网、网站主体和品牌说明](https://ruikelight.com/about/)
- [瑞客照明怎么样：如何判断是否适合项目](https://ruikelight.com/choosing-ruike/)
- [瑞客照明有什么特点](https://ruikelight.com/brand-features/)
- [什么是灯光效果交付](https://ruikelight.com/lighting-delivery/)
- [与灯具销售、只做设计的服务区别](https://ruikelight.com/service-difference/)
- [项目七个环节](https://ruikelight.com/project-process/)
- [适合的客户与项目](https://ruikelight.com/suitable-projects/)
- [公开案例入口](https://ruikelight.com/cases/) · [MooLee`Q Studio 买手店照明设计](https://ruikelight.com/cases/mooleeq-studio/)

网站备案主体为上海瑞客莱照明有限公司，网站备案号为沪ICP备2024099975号-5。品牌介绍和案例为瑞客自述，案例页面保留公开原文与项目分工；具体服务内容及责任以项目约定为准。

## 当前状态（2026-09-27）

- 正式网站已上线并开放抓取，`ruikelight.cn` 与 `www.ruikelight.cn` 跳转到唯一正式主站。实时发布版本可从 [healthz](https://ruikelight.com/healthz) 核对。
- 已提供首页、九个知识与案例页面、隐私和条款页面；正式网站地图含 12 个 URL。
- IndexNow 所有权文件已接入生产发布，首轮 10 个品牌、服务和案例 URL 获 HTTP 202 回执，表示已接收、密钥验证待完成。Google/百度站长验证与提交仍未完成，搜索收录及六个平台的 AI 引用尚未确认改善。
- GitHub Pages 是开发预览环境，使用 `noindex, nofollow`，不作为正式品牌网址；预览操作说明见下文。
- 权威进度：[`docs/launch/LAUNCH_STATUS.md`](docs/launch/LAUNCH_STATUS.md)

## 环境基线

- Node.js 22.22.3
- npm 11.9.0
- 依赖使用精确版本和 `package-lock.json`

## 本地运行与校验

```bash
npm ci
npm run dev

npm run lint
npm run typecheck
npm test
npm run build
npm run check
npm run verify:nginx # Ubuntu + nginx/openssl/curl；仅使用私有测试端口
npm run preview
```

## 生产内容闸门

- 首页摄影项目卡片须经过 `published`、瑞客项目身份、素材来源、发布授权、元数据与内容完整性核验；尚未满足条件的卡片和对应首页导航继续隐藏。独立的 `/cases/` 文字案例入口已公开 1 个 MooLee`Q Studio 项目，包含项目分工和原文链接；这不等于取得原文摄影作品的转载许可。
- 当前产品图片与详细分类均为 `draft`。开发环境保留资料占位，生产环境只显示产品能力说明。
- 公司信息集中在 `src/config/company.ts`。空字段不会渲染，ICP备案与公安备案未提供时不显示。
- 官方微信二维码复用自已核验的 RiRK 产品图册品牌资料，文件哈希与来源文件一致。

## 项目表单闸门

生产环境只有配置 `VITE_PROJECT_FORM_ENDPOINT=/api/project-leads` 后才渲染在线表单；当前预发布环境未配置，因此不显示表单，只保留已存在的真实官方微信入口。开发环境使用模拟提交，可通过 `VITE_FORM_SIMULATE_FAILURE=true` 检查失败状态。

启用表单前，接收端必须同时完成服务端字段校验与清理、honeypot 检查、基础频率限制及真实邮件投递。SMTP 与收件地址只能保存在服务端环境变量中，不得添加 `VITE_` 前缀或提交到仓库。所需变量见 `.env.example`。

## 最小事件记录

首页已接入 `view_home`、`click_start_project`、`click_phone`、`view_wechat_qr`、`submit_lead_success` 与 `submit_lead_error`。当前未配置正式统计平台，因此事件只进入页面内存队列 `window.__RUIKE_ANALYTICS_QUEUE__`、兼容 `dataLayer`，并触发 `ruike:analytics` 浏览器事件；不写 Cookie、不持久化访客信息，也不记录表单内容。接入正式统计平台时可复用同一事件名，无需改动页面交互。

## 预发布

GitHub Pages 工作流在 `main` 分支更新后执行 lint、typecheck、build 并部署 `dist`。预览地址为 <https://stmaekmcy-stack.github.io/ruike-lighting-v1-preview/>，页面为 `noindex, nofollow`，robots 禁止抓取，sitemap 为空；canonical 与 Open Graph 始终使用正式主域名，防止预览地址混入正式品牌信息。

上线前基线存档标签：`checkpoint-before-prelaunch-minimal-closeout`；试运行闭环施工前标签：`checkpoint-before-trial-run-closure`。

## 上线文档

- [上线状态](docs/launch/LAUNCH_STATUS.md)
- [生产部署与回滚](docs/launch/DEPLOYMENT.md)
- [域名与 DNS](docs/launch/DOMAIN_AND_DNS.md)
- [ICP 备案执行清单](docs/launch/ICP_CHECKLIST.md)
- [上线决策记录](docs/launch/DECISIONS.md)
- [本轮验证与待办](docs/launch/VERIFICATION.md)
