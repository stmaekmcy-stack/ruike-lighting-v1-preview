# V1.0 上线验证记录

更新时间：2026-09-19。范围：冻结视觉母版，仅处理真实使用与发布可靠性。生产构建/集成测试证据来自 2026-09-18；运维安装与 DNS 状态于 2026-09-19 再次复核。

## 当前执行证据

| 检查 | 结果 | 边界 |
| --- | --- | --- |
| lint / typecheck / build | 通过 | 已用真实 `.com` 备案号、企业全称与正式域名完成生产模式构建；不是正式上线 |
| 服务端测试 | 8 项通过 | 包含成功响应、限流、错误输入、投递失败、不泄露个人信息；模拟投递，不等于真实收件 |
| 生产依赖审计 | 0 个漏洞 | `npm audit --omit=dev --audit-level=high` 当次结果 |
| 运维安装 | 用户已执行，SSH 核验通过 | 发布/回滚脚本、systemd 与待启用 Nginx 文件匹配审核版本；未激活公网网站 |
| 生产构建闸门 | 真实备案信息的构建通过，缺少完整网站号时仍主动失败 | `.com` 使用沪ICP备2024099975号-5；`.cn` 的 -4 未混入主站 |
| 生产备案与元数据 | 静态检查通过 | 首页构建代码、3 个基础页面的完整备案号和工信部链接、正式 canonical、企业 JSON-LD、robots、sitemap、healthz 均核验；无开发占位文案 |
| 目标服务器私有 Nginx 集成测试 | 通过 | 普通用户、随机回环端口、临时测试证书；未开放公网端口 |
| 公网预发布 | GitHub Pages 持续提供 | 新版本以 Actions 成功和 `healthz.json` 的 release SHA 为准 |
| 正式域名 / 证书 / 公网服务 | 未上线 | 备案及运维安装已核验；页面控制仍超时，待 DNS/TLS 及最终上线确认 |

## 服务器安装及 DNS 复核（2026-09-19）

- 用户在腾讯云管理员终端完成 `ruike-install-site`，截图显示安装成功并备份旧配置。已经通过 SSH 对安装后的发布、回滚、systemd 与 Nginx 待启用文件进行哈希和 root 所有权核验。
- 本日再次核对已安装的发布/回滚脚本及待启用 Nginx 配置，与审核版本一致；`nginx.service` 与 `ruike-lead.service` 均 `disabled/inactive`，没有 80/443 监听，尚无激活的正式发布目录。
- 查询权威 `storm.dnspod.net`：`ruikelight.com A` 为 NOERROR/0 条答案；`www.ruikelight.com A` 为 NXDOMAIN。没有把本轮解析准备记为已完成。
- 腾讯云终端的 AX 读取 25 秒超时、DOM 读取 20 秒超时、新 DNS 标签初始状态 25 秒超时。已按浏览器官方排障指引尝试新页面，没有改用未经许可的浏览器控制通道或提取 Cookie/凭据。
- 现有 Certbot 为 2.9.0，支持 `reconfigure`；尚未签发正式证书、接受证书协议或进行续期演练。[Certbot 官方说明](https://eff-certbot.readthedocs.io/en/stable/using.html#modifying-the-renewal-configuration-of-existing-certificates)作为后续续期配置依据，未以阅读文档冒充实际完成。
- 本轮没有 UI 或业务代码改动，没有重复执行初始化，没有代替用户接受法律条款。

## 真实备案信息验证（2026-09-18）

- 依据用户提供的腾讯云服务列表截图，`.com` 为沪ICP备2024099975号-5，`.cn` 为沪ICP备2024099975号-4，两个网站及主体状态均为“正常”。不再等待完整备案号，也不要求重新提交备案。
- 已通过 GitHub CLI 写入并读取核对 `production` 的 `COMPANY_ICP_NUMBER` 和 `COMPANY_LEGAL_NAME`；保持索引关闭、联系方式与表单接收变量未配置。
- 本次实际生产构建的源代码版本为 `a35340148b515e6b50048e58f3abe7e9cf91c383`；本轮仅更新公开部署变量与上线记录，无 UI/业务源码改动。
- 实际生产构建已上传至服务器独立目录 `/home/ruike-deploy/ruike-verified-icp-20260918-1W0Hmp`，在该目录执行私有 Nginx 集成测试通过，输出 `publicListenersOpened=false`。
- 上传的安装、发布、回滚脚本 SHA256 与本地一致；没有执行安装或启用服务。测试后 `nginx.service` 与 `ruike-lead.service` 仍均为 `disabled/inactive`。
- 公开 DNS 查询 `.com` / `.cn` 的根 A 记录及 `www` CNAME 仍无答案。未声称域名或 HTTPS 已经上线。

已由现有管理员会话执行的操作（已核验，不要重复安装）：

```bash
sudo bash /home/ruike-deploy/ruike-verified-icp-20260918-1W0Hmp/ops/scripts/ruike-install-site /home/ruike-deploy/ruike-verified-icp-20260918-1W0Hmp
```

该安装脚本 SHA256：`ea7a704e2e8d7e07eb6a4dd930fea0c713aeec0ba7ff843d04092981eff33871`。现有部署用户的 sudo 权限仅覆盖发布/回滚，不扩权、不绕过权限执行管理员命令。

## Nginx 实际检查项

- 根目录首页、隐私页、条款页、favicon、robots、sitemap、首屏图和已有官方微信二维码返回 200。
- 不存在的页面返回 404 与品牌返回首页链接；隐藏文件路径返回 403。
- HTML 不被长期缓存；返回 CSP、HSTS、nosniff 等安全头。
- HTTP 跳转 HTTPS，`www.ruikelight.com` 保留路径跳转主域名。
- 健康检查返回构建版本；健康文件缺失时返回 503，不能用固定 200 掩盖坏发布。
- 咨询服务尚未配置时，接口返回明确 503 JSON，不伪造成功。
- 测试后正式 `nginx` 与 `ruike-lead.service` 保持 inactive。

可复现命令（Ubuntu，有 nginx/openssl/curl）：

```bash
npm ci
npm run check
npm audit --omit=dev --audit-level=high
npm run verify:nginx
```

## 尚不能宣称通过

- 正式域名证书及续期演练、正式 DNS、证书对应的最终 Nginx 配置启用、生产激活与真实回滚演练。运维脚本安装本身已经通过，不再列为待完成。
- 当前版本的浏览器交互、console、iPhone / Android 真机、微信聊天内打开。浏览器连接超时，未用请求结果冒充交互测试。
- 电话拨号、手机端微信复制：功能代码已建立，但正式电话和微信号尚未提供，当前页面不显示虚假字段。
- 表单真实收件：收件人和 SMTP 未配置，生产表单关闭；已有公众号二维码继续显示。

## 存档

前一轮代码收口标签：`checkpoint-before-production-readiness-20260918`、`checkpoint-production-readiness-20260918`。
本轮备案确认与部署记录由 `ops/verified-icp-20260918` 分支存档；最终 SHA 和 Actions 链接以执行回执为准。
只记录已公开核验的企业名称及网站备案号；不保存截图中的人员资料，不将凭据或公安联网备案数据码写入仓库。
