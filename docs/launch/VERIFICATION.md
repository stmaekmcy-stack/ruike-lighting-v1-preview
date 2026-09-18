# V1.0 上线验证记录

日期：2026-09-18。范围：冻结视觉母版，仅修复真实使用与发布可靠性。

## 当前执行证据

| 检查 | 结果 | 边界 |
| --- | --- | --- |
| lint / typecheck / build | 通过 | 预发布构建；正式生产因完整 ICP 网站号未配置而保持阻断 |
| 服务端测试 | 8 项通过 | 包含成功响应、限流、错误输入、投递失败、不泄露个人信息；模拟投递，不等于真实收件 |
| 生产依赖审计 | 0 个漏洞 | `npm audit --omit=dev --audit-level=high` 当次结果 |
| 运维脚本 | Bash 语法校验通过 | 未执行正式系统配置替换或上线切换 |
| 生产构建闸门 | 缺少完整 ICP 网站号时主动失败 | 未使用编造的后缀绕过；预发布正常构建通过 |
| 目标服务器私有 Nginx 集成测试 | 通过 | 普通用户、随机回环端口、临时测试证书；未开放公网端口 |
| 公网预发布 | GitHub Pages 持续提供 | 新版本以 Actions 成功和 `healthz.json` 的 release SHA 为准 |
| 正式域名 / 证书 / 公网服务 | 未上线 | 待核验备案号、恢复云控制台登录并完成最终上线确认 |

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

- 腾讯云签发的正式证书及续期演练，正式 DNS、服务器系统配置安装、生产激活与真实回滚演练。
- 当前版本的浏览器交互、console、iPhone / Android 真机、微信聊天内打开。浏览器连接超时，未用请求结果冒充交互测试。
- 电话拨号、手机端微信复制：功能代码已建立，但正式电话和微信号尚未提供，当前页面不显示虚假字段。
- 表单真实收件：收件人和 SMTP 未配置，生产表单关闭；已有公众号二维码继续显示。

## 存档

修改前 Git 标签：`checkpoint-before-production-readiness-20260918`。
本轮变更由 `ops/production-readiness-20260918` 分支提交并经 Quality 检查后合并；最终 SHA 和 Actions 链接以执行回执为准。
无真实联系方式、凭据、公安备案数据码或未核验的网站备案号进入代码。
