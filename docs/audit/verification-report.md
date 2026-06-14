# 验证报告

日期：2026-06-14

仓库：`https://github.com/XiaoQ-X/psychological-appointment`

## 环境

- Node.js 20+
- Docker Desktop 29.5.2
- MySQL 8，宿主机端口 `3308`
- Prisma Client 6.19.3

## 执行结果

| 检查 | 结果 | 说明 |
|---|---|---|
| `npm ci` | 通过 | 822 个依赖按 lockfile 干净安装 |
| `npm install` | 通过 | lockfile 与依赖可正常解析 |
| Docker MySQL | 通过 | 健康检查正常 |
| `npm run db:generate` | 通过 | Prisma Client 已生成 |
| `npm run db:migrate:deploy` | 通过 | 7 个迁移，新增 `must_change_password` 与 `session_version` |
| `npm run db:seed` | 通过 | 2 个管理员、3 个校区、8 个咨询室 |
| `npm run build` | 通过 | student、counselor、admin、wechat-miniapp 全部通过 |
| `npm run test:api` 第一次 | 通过 | 38 项检查，使用并清理 `anxin_test` |
| `npm run test:api` 第二次 | 通过 | 38 项检查，重复执行仍通过 |
| 浏览器首次改密 | 通过 | 学生 H5、咨询师 H5、小程序 H5 |
| 截图级检查 | 通过 | 390x844、1365x900；管理员移动端横向溢出已修复 |
| `npm audit --omit=dev` | 未清零 | 9 high、22 moderate，均无 critical |

CI 会执行生产依赖审计，并在出现 critical 漏洞时失败；当前 high/moderate 项仍必须按安全报告持续处置。

## API 覆盖

本轮 API 测试覆盖：

- 安全响应头和 Express 指纹隐藏
- 管理员登录、看板、校区和咨询室
- 学生/咨询师模板下载和批量导入
- 重复导入失败且不写入部分数据
- 密码重置
- 学生和咨询师登录
- 创建排班
- 学生查看排班和创建预约
- 咨询师查看、确认、签到和完成预约
- 学生查看状态和提交评价
- 学生主动取消预约并释放未来排班
- 风险评估
- 管理员查看预约和操作日志
- 随机临时密码和 `mustChangePassword` 登录返回
- 首次改密前业务接口 `403`
- 旧密码错误、纯数字、常见弱密码、与旧密码相同的拒绝
- 学生/咨询师改密成功、临时密码失效和新密码重新登录
- 自助改密后旧 token 返回 `SESSION_REVOKED`
- 管理员再次重置密码后学生/咨询师旧 token 返回 `SESSION_REVOKED`
- 管理员 dashboard 聚合真实预约状态、类型、趋势和最近预约
- 测试连接必须为 `anxin_test`，测试前后自动重置

## 浏览器验证

实际启动地址：

- API：`http://127.0.0.1:3000`
- 学生端：`http://127.0.0.1:5273`，因为本机旧进程占用了 `127.0.0.1:5173`
- 咨询师端：`http://127.0.0.1:5174`
- 管理员端：`http://127.0.0.1:5175`
- 小程序 H5：`http://127.0.0.1:5176`

截图只保存在被忽略的 `.playwright-cli`/`output` 临时目录，验证结束后删除，不提交仓库。

本轮在 `390x844` 视口确认：

- 学生 H5 登录后进入改密页，弱密码反馈正确，成功后进入首页。
- 咨询师 H5 登录后进入改密页，成功后进入工作台。
- 小程序 H5 登录后进入改密页；重置密码后刷新业务页仍会被全局守卫拉回改密流程。
- 管理员后台登录后展示真实统计；空预约时趋势、类型和最近预约均显示空状态。
- 管理员后台在 `390x844` 下 `scrollWidth=390`，已消除原 `body min-width:1024px` 造成的横向溢出。
- 学生、咨询师、小程序 H5 改密页和业务首页无横向溢出、底部遮挡和小于 44px/88rpx 的主要按钮。

桌面视口 `1365x900` 确认：

- 管理员 dashboard 正常显示真实学生/咨询师计数与空状态。
- 学生端、咨询师端和小程序 H5 业务首页 `scrollWidth` 与视口宽一致。

## 安全审计变化

- 修改前：9 high、22 moderate，总计 31。
- 修改后：9 high、22 moderate，总计 31。
- 已消除：服务端直接依赖 `xlsx` 的两个高危 SheetJS 问题。
- 本轮非强制 `npm audit fix --omit=dev` 将根 lockfile 中 Vite 从 `6.4.2` 提升到 `6.4.3`，仍不能消除 uni-app 内部工具链漏洞。
- ExcelJS 的旧 `uuid` 传递依赖仍存在；当前使用路径不调用 UUID v3/v5/v6 的缓冲区接口，仍需跟踪上游修复。
- 剩余高危主要来自 uni-app/Vite/vue-i18n/jimp 构建链，不在 Express API 运行路径中。

详见 [security-review.md](security-review.md)。

## 失败与处理

1. `127.0.0.1:5173` 命中了旧项目页面。
   - 原因：本机已有旧 Node 进程绑定 `127.0.0.1:5173`，本项目同时绑定 `0.0.0.0:5173`。
   - 处理：不终止来源不明的进程，本轮学生端改用 `5273` 验证。
2. 小程序第一次自动点击协议文本没有勾选复选框。
   - 原因：点击命中了内部文本节点。
   - 处理：改为点击 `.login-checkbox` 后登录，流程通过。

## 结论

项目当前可安装、可迁移、可构建、可重复执行隔离 API 闭环，并完成学生/咨询师/小程序首次登录强制改密、管理员真实 dashboard 聚合和旧 token 服务端撤销。尚不能视为生产就绪，主要差距是 HttpOnly/短期令牌方案、上传隔离、微信真机验证、构建链漏洞和更完整的浏览器 E2E。
