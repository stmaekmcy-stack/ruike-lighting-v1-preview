# 域名与 DNS

> 状态时间：2026-09-19（中国标准时间）。<br>
> 购买状态来自用户确认；两域名网站备案号与备案主体已由用户提供的腾讯云控制台截图核验；DNS 状态由公开解析核验。

## 已确认域名

- 主域名：`ruikelight.com`，用户于 2026-09-03 确认购买成功。
- 品牌保护：`ruikelight.cn`，用户于 2026-09-03 确认购买成功，2026-09-18 已核验自身备案通过；后续配置 DNS/HTTPS 后 301 跳转至主域名。
- 选择理由：比 `ruikelighting` 更短，仍能清晰表达“瑞客 + 灯光”，无连字符，适合口述、输入与长期品牌使用。
- 备案主体：上海瑞客莱照明有限公司。已配置到生产环境企业名称变量，不由此推测公开地址或联系方式。

## 注册与解析状态

| 域名 | 购买状态 | DNS 状态 | 下一动作 |
| --- | --- | --- | --- |
| `ruikelight.com` | 已购买、实名、备案通过；沪ICP备2024099975号-5 | DNSPod 权威 NS 已生效；2026-09-19 查询权威 `storm.dnspod.net`：根 A 无答案，`www` 为 NXDOMAIN | 按本轮 DNS/HTTPS 准备授权建立解析；保持正式服务关闭，最终公开仍待确认 |
| `ruikelight.cn` | 已购买、备案通过；沪ICP备2024099975号-4 | DNSPod 权威 NS 已生效；2026-09-19 根 A 查询无答案，尚未配置保护跳转 | 单独完成保护跳转与 TLS 配置；无需重新提交备案 |

## DNS 准备（本轮已授权；尚未保存）

| 主机记录 | 类型 | 记录值 | TTL | 用途 |
| --- | --- | --- | --- | --- |
| `@` | A | `124.220.205.94` | 600 | 主站解析准备；不启动正式站点 |
| `www` | CNAME | `ruikelight.com.` | 600 | `www` 归一化 |
| `@`（`.cn`） | A | 暂不配置 | 600 | 备案已通过；保护跳转与 TLS 就绪后再配置 |
| `www`（`.cn`） | CNAME | 暂不配置 | 600 | 备案已通过；保护跳转与 TLS 就绪后再配置 |
| `@` | TXT | 仅在腾讯云/证书/备案验证页给出真实值后填写 | 600 | 所有权验证 |

- 不预填 IP、TXT 或 MX，不使用示例数据作为真实解析。
- `.com` 两条记录均用默认线路。保存前核对已有记录：同值不重复添加，有冲突时先核实，不覆盖未知用途的记录。不要改动 NS、MX 或无关域名。
- 没有真实 IPv6 服务能力时不添加 AAAA。
- 用户最终确认上线前，不将中国大陆服务器上的正式站对外开放。
- `.cn` 虽已备案，但不能将其解析到尚未为该主机名配置 TLS 和跳转的服务上。
- 正式上线后，对 `www` 做 HTTPS 301 跳转，canonical 统一指向主域名。

操作入口：[腾讯云 DNSPod 控制台](https://console.cloud.tencent.com/cns)。本轮浏览器控制超时，打开页面请求处于排队状态，不能声称已进入记录页或已保存记录。[腾讯云添加解析说明](https://intl.cloud.tencent.com/zh/document/product/1295/76956)用于核对主机记录、默认线路和 TTL 的含义。

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

当前阶段验收标准：主域名返回 200，`.com` 的 `www` 以 HTTPS 301 到主域名，证书覆盖两个 `.com` 主机名，页面 canonical 仅指向主域名。`.cn` 备案已通过，其证书和保护跳转单独验收，不混入 `.com` 首发范围。
