# 生产部署与回滚

## 目标架构

```text
GitHub main / 版本标签
        ↓ 手动生产发布（需确认字串 + production environment）
GitHub Actions 测试、构建、打包、校验和
        ↓ 已验证 SSH
腾讯云中国大陆 Ubuntu 服务器
        ├─ Nginx：HTTPS、静态文件、404、安全响应头
        └─ Node.js：可选项目咨询接口，仅监听 127.0.0.1:8787
```

代码库是唯一真源。服务器不直接编辑页面；每次发布创建 `/srv/ruike-lighting/releases/<commit>`，成功后原子切换 `current` 软链接，上一版保留为 `previous`。

## 生产变量

在 GitHub 仓库 `production` environment 中配置。公开网页值使用 Variables，凭证使用 Secrets。

### Variables

| 名称 | 填写条件 |
| --- | --- |
| `PRODUCTION_SITE_URL` | 正式 HTTPS 主域名，以 `/` 结尾 |
| `PRODUCTION_ALLOW_INDEXING` | ICP 通过且终验前必须为 `false`；正式开放时才改为 `true` |
| `PROJECT_FORM_ENDPOINT` | 只有真实收件测试通过后才填 `/api/project-leads`，否则留空 |
| `COMPANY_PHONE` | 真实对外电话；缺失时留空 |
| `COMPANY_WECHAT_ID` | 真实对外微信号；缺失时留空 |
| `COMPANY_EMAIL` | 真实对外邮箱；缺失时留空 |
| `COMPANY_LEGAL_NAME` | 已核验的企业全称；当前为腾讯云备案主体“上海瑞客莱照明有限公司” |
| `COMPANY_ADDRESS` | 经企业确认可公开的真实地址；未确认时留空 |
| `COMPANY_ICP_NUMBER` | 管局核准的完整网站备案号，必须包含网站序号后缀；未核验时生产构建会主动失败 |

2026-09-18 已写入并读取核对的生产变量：`PRODUCTION_SITE_URL=https://ruikelight.com/`、`PRODUCTION_ALLOW_INDEXING=false`、`COMPANY_LEGAL_NAME=上海瑞客莱照明有限公司`、`COMPANY_ICP_NUMBER=沪ICP备2024099975号-5`。`.cn` 已核验备案号为“沪ICP备2024099975号-4”，只登记于域名记录，不用于 `.com` 构建。联系方式与表单变量仍为空。

### Secrets

| 名称 | 要求 |
| --- | --- |
| `PRODUCTION_SSH_HOST` | 真实公网 IP 或已验证主机名 |
| `PRODUCTION_SSH_PORT` | SSH 端口，未改时为 `22` |
| `PRODUCTION_SSH_USER` | 仅能调用发布/回滚脚本的独立发布用户 |
| `PRODUCTION_SSH_PRIVATE_KEY` | 独立部署密钥，不与个人日常密钥共用 |
| `PRODUCTION_SSH_KNOWN_HOSTS` | 经可信通道核对的服务器主机公钥 |

SMTP 密码和真实收件人不进入 GitHub 构建变量，只保存在服务器 `/etc/ruike-lighting/lead-service.env`，权限必须为 `0600`。

## 服务器首次引导

以 Ubuntu LTS 为基线，推荐最小 2 vCPU / 2 GB RAM、40 GB SSD、3 Mbps 公网带宽。执行前用真实域名和 IP 替换变量值。

1. 将仓库作为只读安装源，使用仓库内的幂等引导脚本完成软件、目录、systemd、sudoers 和 Nginx 待启用配置：

   ```bash
   sudo ops/scripts/ruike-bootstrap-server "$(pwd)"
   ```

   脚本会安装 Nginx、Certbot 和 Node.js 22，并在 DNS、ICP 和 TLS 就绪前保持 Nginx 与项目咨询服务关闭。执行后确认版本：

   ```bash
   node --version
   nginx -v
   certbot --version
   ```

2. 如需人工核验目录和独立发布用户：

   ```bash
   sudo install -d -m 0755 /srv/ruike-lighting/releases
   sudo install -d -m 0755 /var/www/letsencrypt
   sudo install -d -m 0750 /etc/ruike-lighting
   sudo adduser --disabled-password --gecos "" ruike-deploy
   ```

3. 如需人工复核，发布、回滚和 systemd 文件应安装在以下固定位置：

   ```bash
   sudo install -m 0755 ops/scripts/ruike-activate-release /usr/local/sbin/ruike-activate-release
   sudo install -m 0755 ops/scripts/ruike-rollback-release /usr/local/sbin/ruike-rollback-release
   sudo install -m 0644 ops/systemd/ruike-lead.service /etc/systemd/system/ruike-lead.service
   sudo systemctl daemon-reload
   sudo systemctl disable --now ruike-lead.service
   ```

4. 仅授权发布用户调用经路径校验的发布/回滚脚本：

   ```bash
   sudo install -m 0440 ops/sudoers/ruike-deploy /etc/sudoers.d/ruike-deploy
   sudo visudo -cf /etc/sudoers.d/ruike-deploy
   ```

5. `.com` DNS A/CNAME 生效后，在现有管理员会话中只为 `ruikelight.com` 与 `www.ruikelight.com` 申请证书。`.cn` 暂不纳入；由用户输入真实通知邮箱并自行确认证书签发服务协议，不自动同意条款。申请证书不启用正式网站，最终公开仍需单独“确认上线”。

   ```bash
   RUIKE_PRIMARY_DOMAIN=ruikelight.com
   RUIKE_WWW_DOMAIN=www.ruikelight.com
   sudo systemctl stop nginx
   sudo certbot certonly --standalone --cert-name ruikelight.com \
     -d "$RUIKE_PRIMARY_DOMAIN" -d "$RUIKE_WWW_DOMAIN"
   ```

6. 先安装新运维文件并保留旧文件备份（不会启动公网服务）：

   ```bash
   sudo bash ops/scripts/ruike-install-site "$(pwd)"
   ```

   **当前服务器已完成该安装，不要重复执行。** 用户于 2026-09-20 在管理员终端发起证书申请并自行确认协议，服务器已生成该域名的续期文件。初次上线准备统一使用经审核的脚本：

   ```bash
   sudo bash ops/scripts/ruike-prepare-https
   ```

   该脚本仅适用于本仓库对应的初次上线状态，固定校验待启用 Nginx 配置哈希、服务器 IP、域名、证书链、有效期及密钥匹配。不扩展发布账号的 sudo 权限，不启动正式首页，不自动接受证书协议。它临时启动只提供 ACME 验证路径的 80 端口监听，其他路径返回 404；Certbot `reconfigure` 通过真实 staging 续期演练后，保存 webroot 和续期重载钩子，然后关闭临时监听。最后备份并准备正式 Nginx 配置、运行 `nginx -t`，仍不启动正式服务。

   成功结果保存在 `/var/lib/ruike-lighting/https-readiness.txt`，只含公开证书元数据与检查状态，不包含私钥、账号邮箱或表单信息。失败时恢复本次改动的配置并保留 `/etc/ruike-lighting/ops-backups/https-*` 备份；未知虚拟主机、已运行服务或已有 current 会使脚本停止，不触碰已有网站。只有读取实际成功报告后才能标记证书及续期已验证；模拟测试通过不能代替管理员实测。该脚本成功后跳过下面的手动配置步骤，最终激活仍须用户确认。

   证书存在且用户确认上线后，将待启用配置安装到正式位置。初次安装时检查 `sites-enabled/default`，若仍指向发行版默认站点，先将该软链接移至本次运维备份目录，避免重复 `default_server`。不得删除无关虚拟主机。

   ```bash
   RUIKE_PRIMARY_DOMAIN=ruikelight.com
   RUIKE_WWW_DOMAIN=www.ruikelight.com
   sed -e "s/__PRIMARY_DOMAIN__/$RUIKE_PRIMARY_DOMAIN/g" \
       -e "s/__WWW_DOMAIN__/$RUIKE_WWW_DOMAIN/g" \
       ops/nginx/ruike-lighting.conf.template > /tmp/ruike-lighting.conf
   grep -q '__' /tmp/ruike-lighting.conf && exit 1 || true
   sudo install -m 0644 /tmp/ruike-lighting.conf /etc/nginx/sites-available/ruike-lighting.conf
   sudo ln -sfn /etc/nginx/sites-available/ruike-lighting.conf /etc/nginx/sites-enabled/ruike-lighting.conf
   sudo nginx -t
   # 这里仅校验配置；发布脚本在 current 指向真实发布包后启动 Nginx。
   ```

7. 如果暂不启用表单，不创建包含虚假值的服务端环境文件，GitHub 中 `PROJECT_FORM_ENDPOINT` 留空。如果启用，根据 `ops/env/lead-service.env.example` 填入真实值：

   ```bash
   sudo install -m 0600 ops/env/lead-service.env.example /etc/ruike-lighting/lead-service.env
   sudoedit /etc/ruike-lighting/lead-service.env
   sudo systemctl enable ruike-lead.service
   sudo systemctl restart ruike-lead.service
   curl --fail http://127.0.0.1:8787/healthz
   ```

8. 在 GitHub Actions 手动运行 `Deploy production`，`release_ref` 必须是已审核的 commit 或版本标签，确认字符串只能在最终生产批准后填写。工作流先比对服务器已安装发布/回滚脚本和 Nginx 配置的 SHA256，旧运维文件未更新时拒绝发布；再核验 `/healthz` 中的 release 与所发布 commit 一致。首发失败没有前一版时，回滚会关闭公网服务并保留发布目录；已有旧版时恢复旧版。

证书续期使用 webroot 模式，HTTP 80 的 ACME 路径由 Nginx 提供。首次签发成功后将该证书续期配置改为 webroot 并执行演练，避免 standalone 续期与占用 80 端口的 Nginx 冲突；不得仅安装 Certbot 后就宣称自动续期完成。

## 私有环境验证

已在目标上海服务器上以 `ruike-deploy` 普通用户执行 `node ops/scripts/verify-nginx.mjs`。脚本使用临时测试证书（客户端显式信任，不关闭 TLS 校验）、本机回环监听和复制的发布文件，验证后停止测试进程并清除自建临时目录。它不会切换正式 DNS、安装系统配置或启动系统 Nginx。

## 表单真实接收验收

只有以下条件同时成立时，才将 `PROJECT_FORM_ENDPOINT` 设为 `/api/project-leads`：

1. SMTP 启动验证通过，服务只监听 `127.0.0.1:8787`。
2. 使用约定测试内容从正式 HTTPS 网页提交。
3. 页面经历“正在提交”到“项目信息已收到”。
4. 指定真实收件端实际收到邮件，内容与测试值一致。
5. 连续第 4 次有效投递返回 429 与明确提示。
6. 暂停 SMTP 后的一次提交返回明确失败提示，然后立即恢复服务。

真实收件人尚未提供，因此当前不得启用生产表单。

## 回滚

发布脚本会在 Node.js 接口健康检查或 Nginx 重载失败时自动恢复上一版。手动回滚：

```bash
sudo /usr/local/sbin/ruike-rollback-release
```

回滚后验收：

```bash
curl --fail --silent https://ruikelight.com/ > /dev/null
curl --fail --silent https://ruikelight.com/healthz
curl --head --silent https://www.ruikelight.com/ | grep -i '^location: https://ruikelight.com/'
readlink -f /srv/ruike-lighting/current
```

## 上线后监控与备份

- 正式发布后再配置每 5 分钟首页 HTTPS 和 `/healthz` 检查，连续 2 次失败才告警；目前未配置定时监控，不应视为已启用。
- 启用表单后，检查 `ruike-lead.service` 运行状态与非 2xx 计数；日志仅保留请求 ID、状态码和耗时，不记录表单个人信息。
- 每日备份 `/etc/nginx/sites-available/ruike-lighting.conf` 和已加密的 `/etc/ruike-lighting/lead-service.env`；源代码、文档和版本标签已由 GitHub 保存。
- 每月执行证书续期演练：`sudo certbot renew --dry-run`。
- 发布完成后保留至少最近 2 个发布目录，删除更旧版本前必须确认当前和 `previous` 目标。
