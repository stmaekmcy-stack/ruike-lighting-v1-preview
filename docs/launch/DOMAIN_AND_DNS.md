# 域名与 DNS

> 查询时间：2026-09-03（中国标准时间）。<br>
> 注意：WHOIS/RDAP 无注册记录只能说明查询时点未发现已注册信息；最终可注册状态和实际价格以腾讯云下单页为准。

## 推荐

- 主域名：`ruikelighting.com`，建议首次购买 3 年。
- 品牌保护：`ruikelighting.cn`，建议同步购买 3 年，后续 301 跳转至主域名。
- 原因：与“瑞客照明 / RUIKE LIGHTING”完整对应，无连字符，口述、输入与印刷都更稳定。
- 注册主体：应使用最终 ICP 备案主体的企业名称，当前网站配置中的待核对全称为“上海瑞客莱照明有限公司”；不建议使用员工个人名义持有。

## 实时可用性检查结果

| 候选域名 | WHOIS/RDAP 查询 | DNS 解析 | 建议顺序 |
| --- | --- | --- | --- |
| `ruikelighting.com` | 未发现已注册记录 | 无 | 1，主域名 |
| `ruikelighting.cn` | 未发现已注册记录 | 无 | 2，品牌保护 |
| `ruike-lighting.com` | 未发现已注册记录 | 无 | 3，备选 |
| `ruikelight.com` | 未发现已注册记录 | 无 | 4，备选 |
| `ruike-lighting.cn` | 未发现已注册记录 | 无 | 5，备选 |
| `ruikelight.cn` | 未发现已注册记录 | 无 | 6，备选 |

## 当前估算费用

腾讯云官方价格页在查询日显示的常规价格为：`.com` 新注册约 83 元/年、续费 90 元/年；`.cn` 新注册约 33 元/年、续费 38 元/年。据此估算：

- `ruikelighting.com` 3 年：约 263 元。
- `ruikelighting.cn` 3 年：约 109 元。
- 两个域名各 3 年：约 372 元。

促销、溢价域名、优惠券和实名模板状态都可能改变结算价。参考：[腾讯云域名价格](https://buy.cloud.tencent.com/domain/price)、[腾讯云域名购买页](https://buy.cloud.tencent.com/domain)。

## DNS 规划（服务器 IP 确认后执行）

| 主机记录 | 类型 | 记录值 | TTL | 用途 |
| --- | --- | --- | --- | --- |
| `@` | A | 待填真实腾讯云公网 IPv4 | 600 | 主站 |
| `www` | CNAME | `ruikelighting.com.` | 600 | `www` 归一化 |
| `@` | TXT | 仅在腾讯云/证书/备案验证页给出真实值后填写 | 600 | 所有权验证 |

- 不预填 IP、TXT 或 MX，不使用示例数据作为真实解析。
- 没有真实 IPv6 服务能力时不添加 AAAA。
- ICP 通过前，不将中国大陆服务器上的正式站对外开放。
- 正式上线后，对 `www` 做 HTTPS 301 跳转，canonical 统一指向主域名。

## 验收命令

```bash
dig +short ruikelighting.com A
dig +short www.ruikelighting.com CNAME
curl -I https://ruikelighting.com/
curl -I https://www.ruikelighting.com/
```

验收标准：主域名返回 200，`www` 返回到主域名的 301，证书覆盖两个主机名，页面 canonical 仅指向主域名。
