# 域名与 DNS

> 状态时间：2026-09-03（中国标准时间）。<br>
> 购买状态来自用户确认；DNS 状态由公开权威解析核验。域名实名认证与备案主体一致性仍以腾讯云控制台为准。

## 已确认域名

- 主域名：`ruikelight.com`，用户于 2026-09-03 确认购买成功。
- 品牌保护：`ruikelight.cn`，用户于 2026-09-03 确认购买成功；正式上线后 301 跳转至主域名。
- 选择理由：比 `ruikelighting` 更短，仍能清晰表达“瑞客 + 灯光”，无连字符，适合口述、输入与长期品牌使用。
- 注册主体：必须与最终 ICP 备案主体一致。历史候选全称为“上海瑞客莱照明有限公司”，未核验前不写入公开页面或结构化数据。

## 注册与解析状态

| 域名 | 购买状态 | DNS 状态 | 下一动作 |
| --- | --- | --- | --- |
| `ruikelight.com` | 已购买（用户确认） | DNSPod 权威 NS 已生效；尚无主站 A 记录 | 核验实名认证；服务器 IP 确认后配置主站解析 |
| `ruikelight.cn` | 已购买（用户确认） | DNSPod 权威 NS 已生效；尚无主站 A 记录 | 核验实名认证；正式上线时配置保护跳转 |

## DNS 规划（服务器 IP 确认后执行）

| 主机记录 | 类型 | 记录值 | TTL | 用途 |
| --- | --- | --- | --- | --- |
| `@` | A | 待填真实腾讯云公网 IPv4 | 600 | 主站 |
| `www` | CNAME | `ruikelight.com.` | 600 | `www` 归一化 |
| `@`（`.cn`） | A | 待填真实腾讯云公网 IPv4 | 600 | 保护域名跳转 |
| `www`（`.cn`） | CNAME | `ruikelight.cn.` | 600 | 保护域名跳转 |
| `@` | TXT | 仅在腾讯云/证书/备案验证页给出真实值后填写 | 600 | 所有权验证 |

- 不预填 IP、TXT 或 MX，不使用示例数据作为真实解析。
- 没有真实 IPv6 服务能力时不添加 AAAA。
- ICP 通过前，不将中国大陆服务器上的正式站对外开放。
- 正式上线后，对 `www` 做 HTTPS 301 跳转，canonical 统一指向主域名。

## 验收命令

```bash
dig +short ruikelight.com A
dig +short www.ruikelight.com CNAME
dig +short ruikelight.cn A
dig +short www.ruikelight.cn CNAME
curl -I https://ruikelight.com/
curl -I https://www.ruikelight.com/
curl -I https://ruikelight.cn/
```

验收标准：主域名返回 200，`.com` 的 `www` 与 `.cn` 两个主机名都 301 到主域名；证书覆盖四个主机名，页面 canonical 仅指向主域名。
