# 高校学生心理健康预约服务平台

这是一个面向高校心理中心的多端预约与管理系统，包含学生端、咨询师端、管理员后台、微信小程序、统一后端 API 和 Prisma/MySQL 数据库。

## 项目结构

```text
.
├─ apps/
│  ├─ student/          # 学生端 H5
│  ├─ counselor/        # 咨询师端 H5
│  ├─ admin/            # 管理员后台
│  └─ wechat-miniapp/   # uni-app 微信小程序
├─ server/              # Express REST API
├─ packages/
│  ├─ api-client/       # H5 端统一请求封装
│  └─ shared/           # 状态枚举与格式化工具
├─ database/            # Prisma schema、migrations、seed
├─ scripts/             # 初始化、重置数据库、一键启动脚本
├─ docs/                # API、数据库、交付、审查文档
├─ docker-compose.yml
├─ package.json
└─ .env.example
```

## 技术栈

- 前端：Vue 3、Vite、lucide-vue-next
- 小程序：uni-app Vue 3
- 后端：Node.js 20+、Express、Prisma ORM
- 数据库：MySQL 8
- 认证：JWT、bcryptjs
- 工程：npm workspaces

## 环境要求

- Node.js 20+
- npm 10+
- Docker Desktop
- 微信开发者工具（仅微信小程序真机/预览需要）

## 快速启动

```powershell
cd C:\Users\JiaQ\Desktop\学校\psychological-appointment
npm install
copy .env.example .env
docker compose up -d mysql
npm run db:migrate
npm run db:seed
npm run dev
```

也可以使用脚本：

```powershell
powershell -ExecutionPolicy Bypass -File scripts\init.ps1
npm run dev
```

## 本地地址

- API：`http://localhost:3000`
- MySQL：`localhost:3308`
- 学生端 H5：`http://localhost:5173`
- 咨询师端 H5：`http://localhost:5174`
- 管理员后台：`http://localhost:5175`
- 小程序 H5 预览：`http://localhost:5176`

当前 uni-app alpha 工具链固定使用 `5176` 作为 H5 开发端口。并行运行多个项目副本前，请先释放该端口。

如果页面内容与本项目不符，先检查是否有旧进程占用端口：

```powershell
Get-NetTCPConnection -LocalPort 5173,5174,5175,5176 -State Listen |
  Select-Object LocalAddress,LocalPort,OwningProcess
```

不要直接终止来源不明的进程。可临时换端口验证，例如在 `apps/student` 下执行：

```powershell
npm exec vite -- --host 127.0.0.1 --port 5273
```

## 常用命令

```powershell
npm run dev
npm run dev:server
npm run dev:student
npm run dev:counselor
npm run dev:admin
npm run dev:miniapp:h5
npm run build
npm run db:generate
npm run test:api
npm run audit:prod
npm run verify
npm run reset:db
```

`npm run build` 会构建学生端、咨询师端、管理员后台和微信小程序。`npm run test:api` 只连接独立的 `anxin_test`，执行前自动重建、迁移并 seed，结束后自动清空测试数据；若连接目标不是 `anxin_test`，测试会直接拒绝运行。默认 MySQL 端口是 `3308`，可在 `.env` 中通过 `MYSQL_PORT`、`DATABASE_URL`、`TEST_DATABASE_URL` 和 `SHADOW_DATABASE_URL` 修改。

## 本地账号

| 端 | 账号 | 密码 |
|---|---|---|
| 管理员后台 | `admin` | `123456` |
| 管理员后台 | `supervisor` | `123456` |

当前 seed 使用“空业务基线”，只创建管理员、校区、咨询室和系统配置，不创建固定学生或咨询师账号。学生和咨询师账号可通过管理员后台新增或批量导入。系统会生成一次性随机临时密码，管理员必须通过安全渠道分别交付；学生和咨询师首次登录后必须修改密码，完成前所有业务接口均不可访问。自助改密或管理员重置密码后，旧 token 会被服务端会话版本立即撤销。

管理员默认账号只用于本地演示和测试。生产环境必须删除默认账号或更换强密码。

## 安全说明

`.env.example` 使用 Docker Compose 本地默认值，便于新开发者启动项目。生产部署前必须替换：

- `DATABASE_URL`
- `TEST_DATABASE_URL`
- `SHADOW_DATABASE_URL`
- `JWT_SECRET`
- `CORS_ORIGIN`
- 上传目录和文件访问策略

心理健康数据属于敏感数据，正式上线前必须补齐隐私合规、权限审计、日志留存、数据删除和备份恢复策略。

## 文档

- API 文档：[docs/api/api-reference.md](docs/api/api-reference.md)
- 数据库设计：[docs/database/database-design.md](docs/database/database-design.md)
- 环境与故障排查：[docs/delivery/environment-troubleshooting.md](docs/delivery/environment-troubleshooting.md)
- 验收演示路径：[docs/delivery/acceptance-demo-paths.md](docs/delivery/acceptance-demo-paths.md)
- 项目审查与下一步：[docs/audit/project-audit-and-next-steps.md](docs/audit/project-audit-and-next-steps.md)
- UI 与产品问题：[docs/audit/ui-and-product-issue-register.md](docs/audit/ui-and-product-issue-register.md)
- 验证报告：[docs/audit/verification-report.md](docs/audit/verification-report.md)
- 安全审查：[docs/audit/security-review.md](docs/audit/security-review.md)

## 当前已知风险

- 浏览器端 JWT 仍存储在 `localStorage`，虽然已有服务端会话撤销，仍需评估 HttpOnly Cookie、短期 token 或 refresh token 轮换。
- 后端和部分前端入口文件体量较大，需要按模块拆分。
- uni-app/Vite 构建链仍有高危依赖项，必须通过兼容性升级处理。
- 微信小程序仍需微信开发者工具和真机验证安全区、键盘顶起与授权行为。
