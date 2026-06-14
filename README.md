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
docker compose exec -T mysql mysql -uroot -proot_password -e "CREATE DATABASE IF NOT EXISTS anxin_shadow CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
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

## 常用命令

```powershell
npm run dev
npm run dev:server
npm run dev:student
npm run dev:counselor
npm run dev:admin
npm run dev:miniapp:h5
npm run build
npm run test:api
npm run verify
npm run reset:db
```

`npm run build` 会构建学生端、咨询师端、管理员后台和微信小程序。`npm run test:api` 需要 MySQL 已启动，并且已经执行迁移和 seed。默认 MySQL 端口是 `3308`，可在 `.env` 中通过 `MYSQL_PORT`、`DATABASE_URL` 和 `SHADOW_DATABASE_URL` 修改。

## 本地账号

| 端 | 账号 | 密码 |
|---|---|---|
| 管理员后台 | `admin` | `123456` |
| 管理员后台 | `supervisor` | `123456` |

当前 seed 使用“空业务基线”，只创建管理员、校区、咨询室和系统配置，不创建固定学生或咨询师账号。学生和咨询师账号可通过管理员后台批量导入，`npm run test:api` 也会在测试过程中动态导入学生和咨询师账号。

这些账号只用于本地演示和测试。生产环境必须删除默认账号或强制首次登录改密。

## 安全说明

`.env.example` 使用 Docker Compose 本地默认值，便于新开发者启动项目。生产部署前必须替换：

- `DATABASE_URL`
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

## 当前已知风险

- 小程序仍有部分页面保留原型迁移痕迹，需要继续逐页验证真实数据闭环。
- 后端和部分前端入口文件体量较大，需要按模块拆分。
- 管理后台、H5 和小程序的视觉语言仍需统一到成品级设计系统。
- `npm audit` 需要使用 npm 官方 registry；`npmmirror` 不支持官方 audit 接口。
