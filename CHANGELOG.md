# Changelog

## [Unreleased]

### Changed

- 正式主域名锁定为 `ruikelight.com`，`ruikelight.cn` 作为品牌保护域名。
- 生产部署、DNS、ICP、Nginx 跳转与咨询接口测试统一使用正式域名。
- 未核验的企业全称与地址改为生产变量控制，缺失时不公开也不写入结构化数据。

## [1.0.0-rc.1] - 2026-09-03

### Added

- 中国大陆生产发布、Nginx、systemd、HTTPS 与原子回滚配置。
- 真实邮件投递型项目咨询服务与自动化测试。
- 生产/预发布 SEO 元信息、robots 和 sitemap 生成。
- GitHub 质量门与手动生产发布工作流。
- 上线状态、域名/DNS、ICP、部署与决策文档。

### Changed

- 所有依赖改为精确版本，固定 Node.js/npm 运行基线。
- 字体转为本地托管，首屏图提供 WebP 与 PNG 回退。
- 联系方式改为仅在真实生产配置存在时渲染。
- 生产表单改为仅在真实接收端配置完成时渲染。

### Preserved

- 已通过的首页结构、导航、Logo、文案、桌面端与移动端视觉母版。
