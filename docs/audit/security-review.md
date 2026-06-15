# 安全审查报告

审查日期：2026-06-14

## 执行摘要

已修复表格解析依赖、安全响应头、登录限流、身份信息派生初始密码和测试/演示数据隔离问题。项目仍不满足生产上线安全要求，当前最高优先级是服务端会话撤销、前端令牌存储方案、上传隔离和 uni-app 工具链升级。

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

### SEC-004：身份信息派生值作为初始/重置密码

- 严重度：High
- 修复：学生和咨询师新增、导入、重置时生成 12 位随机临时密码，并设置 `mustChangePassword=true`。
- 强制控制：首次登录后，后端只允许查询当前会话、修改密码和退出；所有业务接口返回 `403`。
- 密码策略：至少 8 位，拒绝纯数字、常见弱密码和旧密码，并要求包含字母与特殊字符。
- 隐私控制：身份核验码和密码哈希不进入用户响应；临时密码仅在管理员操作成功响应中一次性返回，不写入日志。

### SEC-009：测试数据污染演示数据库

- 严重度：Medium
- 修复：新增 `TEST_DATABASE_URL` 和独立 `anxin_test`。
- 强制控制：API 测试若发现当前数据库不是 `anxin_test` 会拒绝运行。
- 生命周期：测试前重建并迁移/seed，测试结束无论成功失败都再次重置。

### SEC-010：旧 token 在改密/重置后仍可使用

- 严重度：Medium
- 修复：学生、咨询师和管理员增加 `sessionVersion`；JWT 写入登录时的会话版本。
- 强制控制：自助改密、管理员重置学生/咨询师密码时递增 `sessionVersion`，旧 token 访问业务接口或 `/api/auth/me` 返回 `401` 和 `SESSION_REVOKED`。
- 验证：`npm run test:api` 连续两次覆盖自助改密撤销旧 token、管理员重置撤销旧 token。
- 剩余风险：浏览器端仍使用 Bearer token，下一步应评估 HttpOnly Cookie 或短期 access token + refresh token。

### SEC-011：4xx 业务错误打印服务端堆栈

- 严重度：Low
- 修复：全局错误处理器只对 5xx/未知错误输出 `console.error`，避免登录失败、弱密码等预期 4xx 污染日志。
- 验证：API 测试中预期失败请求不再打印账号密码错误堆栈。

## 未解决

### SEC-005：JWT 存储在 localStorage

- 严重度：Medium
- 位置：`packages/api-client/index.js:5`
- 影响：发生 XSS 时令牌可被读取。
- 现有控制：`sessionVersion` 已支持服务端撤销旧 token；管理员重置密码和用户改密后旧 token 失效。
- 修复建议：优先评估 HttpOnly、Secure、SameSite 会话 Cookie；若继续 Bearer Token，缩短有效期、增加刷新令牌轮换及严格 CSP。

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

1. 生产 JWT 密钥、短期令牌和会话撤销机制。
2. 前端 CSP、点击劫持防护和 HTTPS 部署。
3. 上传文件私有存储和访问控制。
4. uni-app/Vite 升级及锁文件审查。
5. 敏感操作日志留存、数据导出/删除和隐私合规流程。

## 2026-06-15 会话安全更新

- 已落地 H5 端更低风险方案：短期 access token 仅保存在内存中，refresh token 通过 HttpOnly Cookie `anxin_refresh` 保存并由 `/api/auth/refresh` 轮换。
- 保留并扩展 `sessionVersion`：自助改密、管理员重置学生/咨询师密码后，旧 access token 和旧 refresh cookie 都会返回 `SESSION_REVOKED`。
- 服务端区分 `type=access` 与 `type=refresh`，防止 refresh token 被当作业务 access token 使用。
- `POST /api/auth/logout` 会清除 refresh cookie；H5 API client 同时清空内存 token。
- 默认 access token 有效期为 15 分钟，refresh token 有效期为 7 天，可通过 `JWT_EXPIRES_IN` 和 `JWT_REFRESH_EXPIRES_IN` 配置。
- 剩余风险：原生微信小程序仍需要独立验证平台 token 存储模型；HttpOnly refresh cookie 方案还应补充生产域名下的 `Secure`、`SameSite=None/Lax`、CSP、CSRF 策略和 HTTPS 部署验证。

## 2026-06-15 依赖安全判断

- 复查 `npm run audit:prod`：仍为 31 个漏洞，包含 9 high、22 moderate，无 critical。
- 非强制 `npm audit fix --omit=dev --registry=https://registry.npmjs.org` 没有可安全落地更新；不使用 `--force`。
- `uni-app / vue-i18n / jimp / ws`：漏洞主要来自 `@dcloudio/*` alpha 工具链传递依赖，`--force` 会安装破坏性/降级版本，需在独立升级分支验证 H5 与 mp-weixin。
- `Vite / esbuild`：根 Vite 已在当前 lockfile 使用 6.4.3，但 uni-app 内部仍带旧链；需跟随 DCloud 5.13+ 工具链验证。
- `ExcelJS / uuid`：`uuid <11.1.1` 由 `exceljs@4.4.0` 传递引入，强制修复会降级到 `exceljs@3.4.0`，本轮保留并要求后续替换/跟踪上游。

## 依赖升级判断（2026-06-14）

- 已安全更新：非强制 `npm audit fix --omit=dev` 仅将根 lockfile 中 Vite 从 `6.4.2` 提升到 `6.4.3`，已通过 `npm ci`、四端 build 和 API 测试。
- uni-app / vue-i18n / jimp / ws：漏洞来自 `@dcloudio/*` alpha 工具链传递依赖，`npm audit fix --force` 会安装 `@dcloudio/uni-mp-weixin@0.0.973`，属于破坏性降级/跨版本替换，未执行。
- Vite / esbuild：根 Vite 已小版本更新，但 uni-app 内部仍带旧链；需要 DCloud 整套升级分支验证 H5 与 mp-weixin。
- ExcelJS / uuid：`uuid <11.1.1` 由 `exceljs@4.4.0` 传递引入，强制修复会安装 `exceljs@3.4.0`，属于破坏性降级；当前 Excel 导入路径不调用公告中的 UUID buffer 参数，保留并跟踪上游。
