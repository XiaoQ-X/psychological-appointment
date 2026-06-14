# 安全审查报告

审查日期：2026-06-14

## 执行摘要

本轮修复了服务端直接可利用面较高的表格解析依赖、缺失安全响应头和登录无限重试问题。项目仍不满足生产上线安全要求，最高优先级是首次登录强制改密、测试/演示数据隔离、前端会话方案和 uni-app 工具链升级。

## 已修复

### SEC-001：高危 SheetJS 解析依赖

- 严重度：High
- 位置：`server/src/app.js:8`、`server/src/app.js:562`
- 证据：原服务端使用 `xlsx@0.18.5` 直接解析管理员上传文件，npm 报告原型污染和 ReDoS。
- 修复：改为 ExcelJS；限制 5MB、仅 `.xlsx`、最多 1000 条/50 列，上传内容只映射允许字段。
- 剩余风险：ExcelJS 当前有一个中危 `uuid` 传递依赖，使用路径不涉及公告中的 UUID 缓冲区接口。

### SEC-002：缺少基础安全响应头

- 严重度：Medium
- 位置：`server/src/app.js:40`
- 修复：加入 Helmet、关闭 `X-Powered-By`，API 测试验证 `nosniff` 和指纹隐藏。
- 说明：API 不渲染 HTML，因此本轮未在 Express API 上启用 CSP；前端部署层仍需配置 CSP 和 `frame-ancestors`。

### SEC-003：登录接口无限重试

- 严重度：Medium
- 位置：`server/src/app.js:69`、`server/src/app.js:845`
- 修复：三个登录接口增加 15 分钟 10 次失败尝试限制，成功请求不计数。
- 剩余风险：单实例内存限流不适合多实例生产环境，应迁移到 Redis 或网关。

## 未解决

### SEC-004：身份证后六位作为初始/重置密码

- 严重度：High
- 位置：`server/src/app.js:2038`、`server/src/app.js:2193`、`server/src/app.js:2274`
- 影响：掌握或猜测身份信息的人可能接管账号。
- 修复建议：增加首次登录强制改密、密码复杂度、重置审计和临时随机密码。

### SEC-005：JWT 存储在 localStorage

- 严重度：Medium
- 位置：`packages/api-client/index.js:5`
- 影响：发生 XSS 时令牌可被读取。
- 修复建议：优先评估 HttpOnly、Secure、SameSite 会话 Cookie；若继续 Bearer Token，缩短有效期并增加刷新/撤销机制及严格 CSP。

### SEC-006：开发 JWT 密钥回退

- 严重度：Medium
- 位置：`server/src/middleware/auth.js:9`
- 影响：错误部署为非 production 时可能使用公开开发密钥。
- 现有控制：`NODE_ENV=production` 时拒绝弱密钥。
- 修复建议：除显式测试环境外都要求提供 JWT_SECRET，并在部署启动检查中失败退出。

### SEC-007：上传文件通过 `/uploads` 直接静态提供

- 严重度：Medium
- 位置：`server/src/app.js:67`
- 现有控制：头像使用服务端随机文件名，并校验 PNG/JPEG/WEBP 文件头。
- 剩余风险：没有恶意内容扫描、访问授权、生命周期清理和对象存储隔离。
- 修复建议：生产环境迁移至私有对象存储，通过鉴权或签名 URL 访问。

### SEC-008：uni-app/Vite 构建链漏洞

- 严重度：High
- 证据：`npm audit --omit=dev` 仍为 9 high、22 moderate。
- 范围：高危来自 `@dcloudio/uni-cli-shared`、Vue I18n 旧链、esbuild、jpeg-js 和 Vite。
- 判断：主要位于开发/构建链，但供应链和不可信构建环境仍有风险。
- 修复建议：整套升级 DCloud alpha 与 Vite，在隔离分支进行 H5/mp-weixin 全量回归；禁止 `npm audit fix --force`。

## 上线前最低清单

1. 首次登录强制改密。
2. 独立测试数据库和测试数据清理。
3. 生产 JWT 密钥与会话撤销机制。
4. 前端 CSP、点击劫持防护和 HTTPS 部署。
5. 上传文件私有存储和访问控制。
6. uni-app/Vite 升级及锁文件审查。
7. 敏感操作日志留存、数据导出/删除和隐私合规流程。
