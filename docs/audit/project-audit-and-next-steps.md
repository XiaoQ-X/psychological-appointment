# 项目审查与下一步

更新日期：2026-06-14

## 当前定位

本项目是面向高校心理中心的多端预约与管理平台：

- 学生 H5
- 咨询师 H5
- 管理员后台
- uni-app 微信小程序
- Express API
- Prisma/MySQL 数据库

干净源码已经整理并推送到：

`https://github.com/XiaoQ-X/psychological-appointment`

## 2026-06-15 更新

本轮已完成：

- H5 会话方案从 `localStorage` access token 改为内存短期 access token + HttpOnly refresh cookie。
- 新增 `/api/auth/refresh` refresh cookie 轮换；`/api/auth/logout` 清除 refresh cookie。
- 保留 `sessionVersion` 并扩展到 refresh cookie：自助改密、管理员重置密码后旧 access token 与旧 refresh cookie 均失效。
- 管理员复杂表格在移动端增加卡片式行布局，降低 390px 视口下的横向阅读成本。
- API 测试补充登录 refresh cookie、刷新、登出、改密撤销、管理员重置撤销、过期 token 等断言。
- 浏览器验证补充学生/咨询师首次改密、管理员移动 dashboard、小程序 H5 首屏、320/390/1365 关键视口。

当前 P1 调整：

- 已降级/修复：H5 `localStorage` token 存储风险在学生端、咨询师端、管理员端已通过内存 token + HttpOnly refresh cookie 缓解。
- 已降级/部分修复：管理员移动端复杂表格已转为卡片式列表，但批量操作、详情密度和二次确认仍需继续产品化。
- 未完成：浏览器层完整预约 E2E 仍未覆盖创建、取消、咨询师确认/签到/完成；API 闭环已覆盖，下一轮应补 Playwright 项目级测试。
- 未完成：`server/src/app.js` 路由拆分，本轮因会话安全和验证优先，未做大规模拆分。
- 未完成：原生微信小程序真机安全区、键盘顶起、授权和存储策略验证。

下一阶段优先级：

1. 建立仓库内 Playwright E2E 套件，优先覆盖学生预约、取消、咨询师处理、管理员查看四条演示路径。
2. 拆分 `server/src/app.js`，先抽出 `routes/auth.js`、`routes/admin-dashboard.js`、`routes/appointments.js`，保持 API 行为不变。
3. 为原生微信小程序制定真机验证清单，验证 token 刷新、强制改密、安全区和键盘遮挡。
4. 建立 `codex/upgrade-uni-vite-toolchain` 分支，集中验证 DCloud alpha、Vite/esbuild、vue-i18n、jimp、ws 和 ExcelJS/uuid 升级风险。

原始目录 `anxin-psychology-project` 仅作为只读历史来源，不再作为开发仓库。

## 当前完成度

已完成：

- 干净仓库结构和 GitHub 基线
- README、脚本、CI 和审计文档
- 四端统一构建命令
- Docker/MySQL/Prisma 启动链路
- 可重复 API 闭环测试
- 学生取消预约并释放排班测试
- Express 安全响应头、登录限流和指纹隐藏
- 移除服务端高危 `xlsx` 依赖
- 四端真实登录和截图检查
- 清除学生端不可用原型入口及登录页虚假操作
- 学生/咨询师随机临时密码、首次登录强制改密和后端业务门禁
- 独立 `anxin_test` 数据库，测试前自动初始化、测试后自动清理
- 服务端 `sessionVersion` 会话撤销：自助改密和管理员重置密码后旧 token 失效
- 管理员 dashboard 真实聚合学生、咨询师、预约、风险、排班、操作日志等数据
- 管理员后台 390px 移动视口横向溢出修复

## 当前主要问题

### P0

- 当前无已知 P0。

### P1

1. 浏览器端 JWT 仍存储在 `localStorage`，需要 HttpOnly Cookie、短期 token 或 refresh token 轮换方案。
2. uni-app/Vite/vue-i18n/jimp 构建链仍有高危依赖审计项。
3. 学生 H5 和咨询师 H5 是固定手机容器，不是完整响应式 Web 产品。
4. 管理员复杂表格在手机上仍需卡片式移动布局。
5. `server/src/app.js`、学生端和管理员端入口文件过大。

### P2

1. 多端品牌、颜色和组件语言尚未完全统一。
2. 缺少浏览器 E2E 自动化和可访问性自动扫描。
3. 微信开发者工具和真机安全区验证尚未完成。

## 推荐执行路线

### 阶段 1：账号安全和测试隔离（已完成）

- 已增加 `mustChangePassword` 字段和修改密码接口。
- 已改用随机临时密码，导入/创建/重置后强制首次登录改密。
- 已增加独立 `anxin_test` 数据库，API 测试前后自动重置。
- API 测试会拒绝连接非 `anxin_test` 数据库。

### 阶段 2：管理员真实数据化

- 已完成趋势图、咨询类型、预约状态、最近预约和操作日志真实聚合。
- 已补充 dashboard 空状态、加载态、失败重试。
- 已修复管理员 390px 视口横向溢出。
- 待补充：日期筛选、导出、复杂表格移动卡片布局和敏感操作二次确认。

### 阶段 2.5：会话安全（部分完成）

- 已完成：`sessionVersion` 写入 JWT，并在自助改密、管理员重置密码后撤销旧 token。
- 已完成：API 测试覆盖旧 token `SESSION_REVOKED`。
- 待完成：缩短 access token 有效期、引入 refresh token 轮换或 HttpOnly Cookie，并配置前端 CSP。

### 阶段 3：模块拆分

- 后端按 auth、appointments、schedules、admin、risk、content 拆分路由和服务。
- 前端按页面、组件、API 和状态拆分。
- 先覆盖测试再拆，不做一次性重写。

### 阶段 4：小程序工具链升级

- 建立独立升级分支。
- 统一升级 DCloud alpha 包和 Vite。
- 验证 H5、mp-weixin 构建、登录、上传、路由和安全区。
- 不使用 `npm audit fix --force`。

## 仓库清洁标准

源码仓库只保留可维护源码和必要文档。以下内容必须保持忽略并可随时删除重建：

- `node_modules`
- 所有 `dist`/`build`
- `output`
- `.playwright-cli`
- `uploads` 运行文件
- 日志、截图、压缩包和历史交付包

每次任务结束前执行：

```powershell
git status --short
git diff --check
git ls-files | Select-String -Pattern "node_modules|dist|output|uploads/.+|\.zip$"
```
