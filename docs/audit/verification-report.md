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
| `npm install` | 通过 | 新增 ExcelJS、Helmet、express-rate-limit |
| Docker MySQL | 通过 | 健康检查正常 |
| `npm run db:generate` | 通过 | Prisma Client 已生成 |
| `npm run db:migrate:deploy` | 通过 | 5 个迁移，无待执行迁移 |
| `npm run db:seed` | 通过 | 2 个管理员、3 个校区、8 个咨询室 |
| `npm run build` | 通过 | student、counselor、admin、wechat-miniapp 全部通过 |
| `npm run test:api` 第一次 | 通过 | 27 项检查 |
| `npm run test:api` 第二次 | 通过 | 重复执行仍通过 |
| 浏览器登录 | 通过 | 学生、咨询师、管理员、小程序 H5 |
| 截图检查 | 通过，有剩余 P1 | 390x844、320x700、1440x900 |
| `npm audit --omit=dev` | 未清零 | 9 high、22 moderate |

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

## 浏览器验证

实际启动地址：

- API：`http://127.0.0.1:3000`
- 学生端：`http://127.0.0.1:5273`，因为本机旧进程占用了 `127.0.0.1:5173`
- 咨询师端：`http://127.0.0.1:5174`
- 管理员端：`http://127.0.0.1:5175`
- 小程序 H5：`http://127.0.0.1:5176`

截图只保存在被忽略的 `.playwright-cli`/`output` 临时目录，验证结束后删除，不提交仓库。

## 安全审计变化

- 修改前：10 high、20 moderate，总计 30。
- 修改后：9 high、22 moderate，总计 31。
- 已消除：服务端直接依赖 `xlsx` 的两个高危 SheetJS 问题。
- 新增中危：ExcelJS 的旧 `uuid` 传递依赖。当前使用路径不调用 UUID v3/v5/v6 的缓冲区接口，仍需跟踪上游修复。
- 剩余高危均来自 uni-app/Vite 构建链，不在 Express 生产运行依赖路径中。

详见 [security-review.md](security-review.md)。

## 失败与处理

1. `127.0.0.1:5173` 命中了旧项目页面。
   - 原因：本机已有旧 Node 进程绑定 `127.0.0.1:5173`，本项目同时绑定 `0.0.0.0:5173`。
   - 处理：不终止来源不明的进程，本轮学生端改用 `5273` 验证。
2. 小程序第一次自动点击协议文本没有勾选复选框。
   - 原因：点击命中了内部文本节点。
   - 处理：改为点击 `.login-checkbox` 后登录，流程通过。

## 结论

项目当前可安装、可迁移、可构建、可重复执行 API 闭环，并能通过四端真实登录。尚不能视为生产就绪，主要差距是密码生命周期、测试数据隔离、静态管理图表、前端会话存储和 uni-app 构建链风险。
