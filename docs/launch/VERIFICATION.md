# V1.0 上线验证记录

更新时间：2026-09-20。范围：冻结视觉母版，完成 HTTPS、正式部署与真实公网验收。以下最新记录取代后文历史阶段中的“未执行”“未上线”“等待扫码”等状态。

## 正式主域名上线实测（2026-09-20 18:51—18:52 中国标准时间）

- 网址：`https://ruikelight.com/`；版本 `0cbe1fc9396604ffe46195e4d54350889244c688`；生产 Actions [35506036575](https://github.com/stmaekmcy-stack/ruike-lighting-v1-preview/actions/runs/35506036575) 成功。`/healthz` 与服务器 current 相同；Nginx enabled/active。
- 真实 HTTPS 准备于 18:20 通过。证书覆盖 `.com`/`www`，有效期至 2026-12-18 22:44:50 UTC；链与密钥匹配核验通过。Certbot webroot staging 续期通过，timer enabled/active，配置保存 Nginx reload hook；没有导出私钥。
- 首次生产 run `35504944104` 的公网检查超时并成功自动回滚；腾讯云缺少 TCP443 规则是已核实原因。已仅新增这一条 HTTPS 公网规则，原 TCP22/80/ICMP 不变。主机 UFW 原为 inactive，只读检查，未降低主机防护设置。
- 当前发布真实执行 lint/typecheck/build，24 项接口/运维测试和 5 项 GEO 测试全部通过；PR Quality 含依赖审计与 Nginx 私有集成测试也通过。保留 GEO 六个知识页，没有更改当前首页视觉。
- 正式 HTTPS 的首页、六个知识页、隐私、条款、robots、sitemap、llms、healthz、favicon 共 14 路由返回 200。HTTP 主域名、HTTP www、HTTPS www 都 301 到唯一 HTTPS 主域名；不存在页面、静态资源和内部文档路径返回 404。
- CSP/HSTS 响应头存在，完整 ICP 号与 canonical 正确；公开 HTML 无待补充、开发环境、PROJECT IMAGE、CONTENT PENDING 等占位内容。
- 实际 Chrome 浏览器以 1440/390/430 宽度打开公网域名。每种尺寸均实际点击首屏/导航或手机菜单/产品区 CTA、返回顶部、七步第七项再恢复第一项。目标咨询区真实可见，手机菜单正确关闭，展开状态唯一。
- 三种尺寸均无 console error、pageerror、失败资源；实际 scrollWidth 等于 viewport 宽度，全部图片加载成功。五项标准/七步数量及首屏两行“让好灯光 / 看得见。”核验通过；全页截图已生成并人工查看桌面与 390 版本，未调整 UI。
- 生产表单、电话、微信号复制按钮按未配置状态不渲染；官方公众号二维码实际加载。接口实际返回 503/ok:false，未声称收到测试咨询。事件结构通过，但无正式统计平台接收验证。
- 受控首发仍 noindex，sitemap 为空；公网检查通过后下一发布开放正式索引，预览持续 noindex。
- 明确边界：浏览器尺寸模拟不是 iPhone/Android 真机，也不是微信聊天内打开；电话/客服微信和真实表单接收资料缺失。`.cn` 保护跳转仍未配置。Mac 默认代理有一次独立 curl TLS 错误，直接连接及三组真实浏览器全部通过；未修改全局代理。

## 历史准备阶段证据（以下未完成状态已被上方实测取代）

| 检查 | 结果 | 边界 |
| --- | --- | --- |
| lint / typecheck / build | 通过 | 已用真实 `.com` 备案号、企业全称与正式域名完成生产模式构建；不是正式上线 |
| 服务端测试 | 8 项通过 | 包含成功响应、限流、错误输入、投递失败、不泄露个人信息；模拟投递，不等于真实收件 |
| HTTPS 准备脚本测试 | 16 项通过 | 本机及目标 Ubuntu 普通用户各通过一次；模拟系统命令，不代表真实证书及续期已经验证 |
| 生产依赖审计 | 0 个漏洞 | 2026-09-19 `npm audit --omit=dev --audit-level=high` 的历史结果，本日未重新审计 |
| 运维安装 | 用户已执行，SSH 核验通过 | 发布/回滚脚本、systemd 与待启用 Nginx 文件匹配审核版本；未激活公网网站 |
| 生产构建闸门 | 真实备案信息的构建通过，缺少完整网站号时仍主动失败 | `.com` 使用沪ICP备2024099975号-5；`.cn` 的 -4 未混入主站 |
| 生产备案与元数据 | 静态检查通过 | 首页构建代码、3 个基础页面的完整备案号和工信部链接、正式 canonical、企业 JSON-LD、robots、sitemap、healthz 均核验；无开发占位文案 |
| 目标服务器私有 Nginx 集成测试 | 通过 | 普通用户、随机回环端口、临时测试证书；未开放公网端口 |
| 公网预发布 | GitHub Pages 持续提供 | 新版本以 Actions 成功和 `healthz.json` 的 release SHA 为准 |
| 正式域名 DNS | 已生效 | 2026-09-19 19:01 两台权威 DNS、公共解析器和目标服务器独立核验通过；记录由用户保存 |
| 证书 / 公网服务 | 证书配置已生成，未上线 | 用户已发起申请并确认协议，证书完整检查和续期实测待管理员执行；Nginx/咨询服务 inactive |

## 证书申请后核验与合并准备脚本（2026-09-20）

- 用户截图显示已在管理员会话填写真实通知邮箱、确认协议并发起 `.com` / `www` 证书申请。本轮未重复申请、代签协议、变更订阅或将账号邮箱写入网站联系方式。
- SSH 核验申请进程已结束，`/etc/letsencrypt/live`、`archive` 目录与 `renewal/ruikelight.com.conf` 已生成。普通发布账号不能读取 root 私有证书目录，所以目前只确认申请产物及续期配置存在，不将其写作证书链、域名或有效期已核验。
- 07:58（中国标准时间）再次确认 Nginx/咨询服务 inactive，无 80/443 监听、无正式 current；`certbot.timer` 为 enabled/active，续期配置仍为 standalone。DNS 和已安装待启用 Nginx 的 SHA256 再次核对正确。
- 新增 `ops/scripts/ruike-prepare-https`：固定目标与哈希、证书链/域名/有效期/密钥匹配检查、只服务 ACME 的临时 HTTP 监听、Certbot staging 续期后保存 webroot、配置备份与失败恢复、Nginx 语法检查、明确禁止启用正式首页。续期重载钩子仅保存，本阶段不运行 reload，以免试图启动未发布网站；发布后再验证重载行为。
- 使用真实 `.com` 备案号、企业名、正式域名以及空联系方式/接收端执行 `npm run check`：lint、typecheck、24 项测试（8 项接口 + 16 项 HTTPS 运维模拟）、build 全通过。部署包未发布；没有修改 `src`、`public`、首页、字体、Nginx 模板或依赖锁文件。
- 16 项运维模拟测试同时在目标 Ubuntu 上以普通发布账号通过，覆盖配置漂移、权限/已有站点保护、错误 DNS、过期/不可信/域名不符证书、密钥不匹配、意外首页响应、续期失败和 Nginx 失败回滚。它们没有读取真实私钥、开放端口、运行真实 Certbot 或修改系统配置。
- 准备脚本已上传至 `/home/ruike-deploy/ruike-https-20260920-QXfy9X/ops/scripts/ruike-prepare-https`；本机与服务器 SHA256 同为 `0e57c41dd0dd22f2a1a80bf3a6b9a794fb3ea971bee89c775a63082ef8af6a02`，服务器 `bash -n` 通过。只上传与测试，没有执行管理员准备脚本或扩展 sudoers。
- 下一步只需在已有管理员终端运行该路径的脚本。实际成功后生成 `/var/lib/ruike-lighting/https-readiness.txt`，由 SSH 独立读取，不要求用户提供私钥、密码或账号邮箱。真实续期与最终配置尚不能记为通过，最终公开仍等待“确认上线”。
- 下方旧记录中的“尚无证书目录”“协议待确认”保留为历史证据，已被本节状态取代。

## DNS 生效及 HTTPS 前置核验（2026-09-19 19:01 中国标准时间）

- 用户截图显示两条默认线路记录已保存：`@ A 124.220.205.94`、`www CNAME ruikelight.com`，TTL 均为 600。
- `storm.dnspod.net` 与 `lepus.dnspod.net` 均返回上述正确记录；公共解析器 `223.5.5.5`、`1.1.1.1` 也返回正确 A/CNAME 链。
- SSH 服务器 `getent ahostsv4` 对 `.com` 和 `www` 均返回 `124.220.205.94`，服务器端解析通过。
- Certbot 为 2.9.0，已查阅目标服务器 `certbot --help certonly`、`certbot --help standalone`，确认交互式 standalone 申请命令。没有运行签发命令或接受任何协议。
- 当前 Nginx/咨询服务仍 inactive，无 80/443 监听、无 `/etc/letsencrypt/live` 和正式 current。现有 SSH 的 sudo 权限仅为发布/回滚，未扩权。管理员需执行证书申请；证书服务协议由用户本人确认。
- 本轮仅更新上线文档与交接记录，没有改动页面源码，没有重复运行先前已通过的 lint/typecheck/test/build。证书签发、HTTP-01 公网可达性与自动续期尚未验证。
- 下方较早记录保留历史证据；其中“无 DNS 记录”已被本节新核验结果取代，不再作为当前阻塞。

## 服务器安装及 DNS 复核（2026-09-19）

### 本轮控制连接恢复与重新检查

- 当前工作分支 `ops/dns-https-20260919`，重新检查时 HEAD 为 `bd2dc1fcf5a7c7e9481ed23beae92bbaf5c897cd`。没有修改 UI、业务代码或正式配置。
- 使用真实 `.com` 备案号、企业名与正式域名，明确关闭索引并留空未确认联系方式/表单接收端，再次执行 `npm run check`：lint、typecheck、8 项模拟接口测试、production build 全部通过。这不是实际收件或公网验收。
- 浏览器工具初始化返回 `failed to write kernel assets: No such file or directory (os error 2)`。官方 `js_reset` 后同样报错；系统临时目录仍存在，具体缺失路径及原因未确定，不能断言是腾讯云权限问题或清理软件所致。
- 已按可执行文件、父子关系及当前工作目录核对，仅对本任务失效的浏览器控制子进程发送 TERM；未停止桌面应用、浏览器页面或其他任务。子进程停止后调用返回 `Transport closed`，没有自动重建连接，恢复结果为未完成。需重新加载应用控制组件后再检验。
- 既有 SSH 登录仍成功；Nginx/咨询服务均 inactive，无 80/443 监听，正式 current 与证书目录尚不存在。发布账号 sudo 范围仍仅为发布和回滚，未扩权。
- 本轮权威查询：`ruikelight.com A` 为 NOERROR/0 条答案；`www.ruikelight.com CNAME` 为 NXDOMAIN。没有保存任何 DNS。
- 公网预览 `healthz.json` 重新返回 HTTP 成功，release 为 `d35f7122af22215c6f4b994076911909148d407d`。正式域名、HTTPS 和最终上线仍未完成；不将预览或构建成功冒充正式上线。

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

- 正式域名证书及续期演练、证书对应的最终 Nginx 配置启用、生产激活与真实回滚演练。`.com` DNS 和运维脚本安装已通过，不再列为待完成；`.cn` DNS 单独待配置。
- 当前版本的浏览器交互、console、iPhone / Android 真机、微信聊天内打开。浏览器连接超时，未用请求结果冒充交互测试。
- 电话拨号、手机端微信复制：功能代码已建立，但正式电话和微信号尚未提供，当前页面不显示虚假字段。
- 表单真实收件：收件人和 SMTP 未配置，生产表单关闭；已有公众号二维码继续显示。

## 存档

前一轮代码收口标签：`checkpoint-before-production-readiness-20260918`、`checkpoint-production-readiness-20260918`。
本轮备案确认与部署记录由 `ops/verified-icp-20260918` 分支存档；最终 SHA 和 Actions 链接以执行回执为准。
只记录已公开核验的企业名称及网站备案号；不保存截图中的人员资料，不将凭据或公安联网备案数据码写入仓库。
