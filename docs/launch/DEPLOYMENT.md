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
| `COMPANY_LEGAL_NAME` | 与营业执照逐字核验后的企业全称；未核验时留空 |
| `COMPANY_ADDRESS` | 经企业确认可公开的真实地址；未确认时留空 |
| `COMPANY_ICP_NUMBER` | 管局核准的完整网站备案号，必须包含网站序号后缀；未核验时生产构建会主动失败 |

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

5. DNS A/CNAME 生效后，为主域名、`www` 与 `.cn` 保护域名申请同一张证书：

   ```bash
   RUIKE_PRIMARY_DOMAIN=ruikelight.com
   RUIKE_WWW_DOMAIN=www.ruikelight.com
   RUIKE_CN_DOMAIN=ruikelight.cn
   RUIKE_CN_WWW_DOMAIN=www.ruikelight.cn
   sudo systemctl stop nginx
   sudo certbot certonly --standalone \
     -d "$RUIKE_PRIMARY_DOMAIN" -d "$RUIKE_WWW_DOMAIN" \
     -d "$RUIKE_CN_DOMAIN" -d "$RUIKE_CN_WWW_DOMAIN"
   sudo systemctl start nginx
   ```

6. 生成 Nginx 正式配置，确认无任何占位符后启用：

   ```bash
   RUIKE_PRIMARY_DOMAIN=ruikelight.com
   RUIKE_WWW_DOMAIN=www.ruikelight.com
   RUIKE_CN_DOMAIN=ruikelight.cn
   RUIKE_CN_WWW_DOMAIN=www.ruikelight.cn
   sed -e "s/__PRIMARY_DOMAIN__/$RUIKE_PRIMARY_DOMAIN/g" \
       -e "s/__WWW_DOMAIN__/$RUIKE_WWW_DOMAIN/g" \
       -e "s/__CN_DOMAIN__/$RUIKE_CN_DOMAIN/g" \
       -e "s/__CN_WWW_DOMAIN__/$RUIKE_CN_WWW_DOMAIN/g" \
       ops/nginx/ruike-lighting.conf.template > /tmp/ruike-lighting.conf
   grep -q '__' /tmp/ruike-lighting.conf && exit 1 || true
   sudo install -m 0644 /tmp/ruike-lighting.conf /etc/nginx/sites-available/ruike-lighting.conf
   sudo ln -sfn /etc/nginx/sites-available/ruike-lighting.conf /etc/nginx/sites-enabled/ruike-lighting.conf
   sudo nginx -t
   sudo systemctl reload nginx
   ```

7. 如果暂不启用表单，不创建包含虚假值的服务端环境文件，GitHub 中 `PROJECT_FORM_ENDPOINT` 留空。如果启用，根据 `ops/env/lead-service.env.example` 填入真实值：

   ```bash
   sudo install -m 0600 ops/env/lead-service.env.example /etc/ruike-lighting/lead-service.env
   sudoedit /etc/ruike-lighting/lead-service.env
   sudo systemctl enable ruike-lead.service
   sudo systemctl restart ruike-lead.service
   curl --fail http://127.0.0.1:8787/healthz
   ```

8. 在 GitHub Actions 手动运行 `Deploy production`，`release_ref` 必须是已审核的 commit 或版本标签，确认字符串只能在最终生产批准后填写。

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
curl --head --silent https://ruikelight.cn/ | grep -i '^location: https://ruikelight.com/'
readlink -f /srv/ruike-lighting/current
```

## 上线后监控与备份

- 每 5 分钟检查首页 HTTPS 和 `/healthz`，连续 2 次失败才告警。
- 启用表单后，检查 `ruike-lead.service` 运行状态与非 2xx 计数；日志仅保留请求 ID、状态码和耗时，不记录表单个人信息。
- 每日备份 `/etc/nginx/sites-available/ruike-lighting.conf` 和已加密的 `/etc/ruike-lighting/lead-service.env`；源代码、文档和版本标签已由 GitHub 保存。
- 每月执行证书续期演练：`sudo certbot renew --dry-run`。
- 发布完成后保留至少最近 2 个发布目录，删除更旧版本前必须确认当前和 `previous` 目标。
