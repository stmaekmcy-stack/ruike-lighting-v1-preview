# 域名与 DNS

> 状态时间：2026-09-20 19:45（中国标准时间）。<br>
> 购买状态来自用户确认；两域名网站备案号与备案主体已由用户提供的腾讯云控制台截图核验；DNS 状态由公开解析核验。

## 已确认域名

- 主域名：`ruikelight.com`，用户于 2026-09-03 确认购买成功。
- 品牌保护：`ruikelight.cn`，已购买及核验备案；2026-09-20 已配置根域名和 www 的 DNS、独立 HTTPS 证书及 301 主域名跳转。
- 选择理由：比 `ruikelighting` 更短，仍能清晰表达“瑞客 + 灯光”，无连字符，适合口述、输入与长期品牌使用。
- 备案主体：上海瑞客莱照明有限公司。已配置到生产环境企业名称变量，不由此推测公开地址或联系方式。

## 注册与解析状态

| 域名 | 购买状态 | DNS 状态 | 下一动作 |
| --- | --- | --- | --- |
| `ruikelight.com` | 已购买、实名、备案通过；沪ICP备2024099975号-5 | 根 A 为 `124.220.205.94`，`www` CNAME 为 `ruikelight.com.`；2026-09-20 正式 HTTPS 已上线，证书和真实 webroot staging 续期通过 | 不重复添加 DNS 或申请证书；HTTP/www 均 301 到 `https://ruikelight.com/` |
| `ruikelight.cn` | 已购买、备案通过；沪ICP备2024099975号-4 | 根 A 为 `124.220.205.94`，www CNAME 为 `ruikelight.cn.`；两台公共解析器与上海服务器核验通过 | HTTP/HTTPS、根域名/www 均 301 到 `.com`，保留路径与参数；无需重复配置 |

## DNS 记录（两域名均已保存并核验）

| 主机记录 | 类型 | 记录值 | TTL | 用途 |
| --- | --- | --- | --- | --- |
| `@` | A | `124.220.205.94` | 600 | 已上线的唯一主站 |
| `www` | CNAME | `ruikelight.com.` | 600 | `www` 归一化 |
| `@`（`.cn`） | A | `124.220.205.94` | 600 | 品牌保护跳转 |
| `www`（`.cn`） | CNAME | `ruikelight.cn.` | 600 | www 品牌保护跳转 |
| `@` | TXT | 仅在腾讯云/证书/备案验证页给出真实值后填写 | 600 | 所有权验证 |

- 不预填 IP、TXT 或 MX，不使用示例数据作为真实解析。
- `.com` 两条记录均用默认线路。保存前核对已有记录：同值不重复添加，有冲突时先核实，不覆盖未知用途的记录。不要改动 NS、MX 或无关域名。
- 没有真实 IPv6 服务能力时不添加 AAAA。
- 用户最终确认上线前，不将中国大陆服务器上的正式站对外开放。
- `.cn` 使用独立证书及独立 Nginx 文件，不复用未经该主机名验证的证书。HTTP-01 初始化先准备 ACME 路径，再添加 DNS，签发并验证证书后启用 HTTPS；当前该流程已完成。
- 正式上线后，对 `www` 做 HTTPS 301 跳转，canonical 统一指向主域名。

操作入口：[腾讯云 DNSPod 控制台](https://console.cloud.tencent.com/cns)。`.com` 两条记录由用户此前保存；`.cn` 两条由 Codex 本轮在用户已登录控制台保存并回验。未改 NS、MX、AAAA、付费套餐或 `.com` 原记录。[腾讯云添加解析说明](https://intl.cloud.tencent.com/zh/document/product/1295/76956)用于核对字段含义。

`.cn` 证书覆盖 `ruikelight.cn` 和 `www.ruikelight.cn`，有效期至 2026-12-19 10:44:01 UTC。Certbot webroot 自动续期和 Nginx reload hook 已保存，timer enabled/active，真实 staging 续期演练通过。没有导出私钥或修改 `.com` 证书。所有入口最终 canonical 仍是 `https://ruikelight.com/`。

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

上述验收已通过；可重复运行只读检查 `node ops/scripts/verify-cn-live.mjs`。覆盖两台公共 DNS、两个 TLS 主机名、8 条根路径/深路径跳转、ACME 404 和最终主站 200。正式页面版本保持 `be80b05819053ea0ec99af35f78e5312c5b98cf3`。
