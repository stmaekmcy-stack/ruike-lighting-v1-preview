# 瑞客官网 V1.0

瑞客照明官网首页项目。当前范围为已通过视觉母版的上线前最小收口，不扩展大量二级页面。

## 本地运行与校验

```bash
npm ci
npm run dev

npm run lint
npm run typecheck
npm run build
npm run preview
```

## 生产内容闸门

- 项目内容只有在 `published`、瑞客项目身份、素材来源、发布授权、元数据与内容完整性全部核验后才显示。当前没有符合条件的项目，生产环境会同时隐藏项目区与对应导航。
- 当前产品图片与详细分类均为 `draft`。开发环境保留资料占位，生产环境只显示产品能力说明。
- 公司信息集中在 `src/config/company.ts`。空字段不会渲染，ICP备案与公安备案未提供时不显示。
- 官方微信二维码复用自已核验的 RiRK 产品图册品牌资料，文件哈希与来源文件一致。

## 项目表单闸门

生产环境只有配置 `VITE_PROJECT_FORM_ENDPOINT` 后才启用在线表单；当前预发布环境未配置，因此按钮明确关闭并显示真实官方微信入口。开发环境使用模拟提交，可通过 `VITE_FORM_SIMULATE_FAILURE=true` 检查失败状态。

启用表单前，接收端必须同时完成服务端字段校验与清理、honeypot 检查、基础频率限制及真实邮件投递。SMTP 与收件地址只能保存在服务端环境变量中，不得添加 `VITE_` 前缀或提交到仓库。所需变量见 `.env.example`。

## 最小事件记录

首页已接入 `view_home`、`click_start_project`、`click_phone`、`view_wechat_qr`、`submit_lead_success` 与 `submit_lead_error`。当前未配置正式统计平台，因此事件只进入页面内存队列 `window.__RUIKE_ANALYTICS_QUEUE__`、兼容 `dataLayer`，并触发 `ruike:analytics` 浏览器事件；不写 Cookie、不持久化访客信息，也不记录表单内容。接入正式统计平台时可复用同一事件名，无需改动页面交互。

## 预发布

GitHub Pages 工作流在 `main` 分支更新后执行 lint、typecheck、build 并部署 `dist`。预发布页面和 `robots.txt` 均设置为禁止搜索引擎收录；切换正式域名前必须更新 canonical、Open Graph、sitemap 与索引策略。

上线前基线存档标签：`checkpoint-before-prelaunch-minimal-closeout`；试运行闭环施工前标签：`checkpoint-before-trial-run-closure`。
