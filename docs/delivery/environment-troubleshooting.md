# 环境启动与故障排查

生成时间：2026-06-01

## 环境要求

| 项 | 要求 |
|---|---|
| 操作系统 | Windows |
| Node.js | 20+ |
| Docker | Docker Desktop |
| 数据库 | MySQL 8.0 Docker 容器 |
| 项目目录 | `C:\Users\JiaQ\Desktop\学校\anxin-psychology-project\03_dev` |

## 首次初始化

在 `03_dev` 目录执行：

```powershell
cd C:\Users\JiaQ\Desktop\学校\anxin-psychology-project\03_dev
powershell -ExecutionPolicy Bypass -File scripts\init.ps1
```

脚本会执行依赖安装、环境变量准备、MySQL 启动、shadow database 创建、数据库迁移和 seed。

## 分步初始化

如果需要手动分步执行：

```powershell
cd C:\Users\JiaQ\Desktop\学校\anxin-psychology-project\03_dev
npm install
docker compose up -d mysql
docker exec anxin-psychology-mysql mysql -uroot -proot_password -e "CREATE DATABASE IF NOT EXISTS anxin_shadow CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
npm run db:migrate
npm run db:seed
```

## 启动服务

统一启动：

```powershell
cd C:\Users\JiaQ\Desktop\学校\anxin-psychology-project\03_dev
npm run dev
```

单独启动：

```powershell
npm run dev:server     # http://localhost:3000
npm run dev:student    # http://localhost:5173
npm run dev:counselor  # http://localhost:5174
npm run dev:admin      # http://localhost:5175
```

## 访问地址

| 服务 | 地址 |
|---|---|
| 后端健康检查 | `http://localhost:3000/health` |
| 学生端 | `http://localhost:5173` |
| 咨询师端 | `http://localhost:5174` |
| 管理员后台 | `http://localhost:5175` |
| MySQL | `localhost:3307` |

## 自测命令

```powershell
cd C:\Users\JiaQ\Desktop\学校\anxin-psychology-project\03_dev
npm run build
npm run test:api
```

注意：`npm run test:api` 会写入测试预约、风险筛查、活动报名和日志数据。这是验收测试数据，不是数据库结构变更。

## 数据库命令

```powershell
npm run db:migrate
npm run db:seed
npm run db:studio
npm run reset:db
```

`npm run reset:db` 会重置数据库并重新 seed，仅在需要恢复干净演示数据时使用。

## 常见问题

| 问题 | 现象 | 处理 |
|---|---|---|
| Docker Desktop 未启动 | `npm run test:api` 报 `Can't reach database server at localhost:3307`。 | 启动 Docker Desktop，然后执行 `docker compose up -d mysql`。 |
| MySQL 容器未运行 | `localhost:3307` 无监听。 | 在 `03_dev` 执行 `docker compose up -d mysql`。 |
| shadow database 不存在 | Prisma migrate 报 shadow database 相关错误。 | 执行 `docker exec anxin-psychology-mysql mysql -uroot -proot_password -e "CREATE DATABASE IF NOT EXISTS anxin_shadow CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"`。 |
| 本机 3306 已被占用 | 本机已有 MySQL 服务。 | 项目默认使用 `3307:3306`，不需要停止本机 3306。 |
| 前端请求失败 | 页面打开但数据加载失败。 | 检查 `http://localhost:3000/health`，并确认 `.env` 中 `CORS_ORIGIN` 包含 `5173,5174,5175`。 |
| 端口被占用 | Vite 或后端启动失败。 | 使用 `Get-NetTCPConnection -State Listen` 查看 3000、5173、5174、5175 端口占用，再停止冲突进程。 |
| 演示数据被测试污染 | 列表中出现 API 自测创建的预约/风险/报名。 | 如需恢复干净数据，执行 `npm run reset:db`。 |

## 验收前检查清单

- Docker Desktop 已启动。
- `docker compose up -d mysql` 后 MySQL 容器为 healthy。
- `http://localhost:3000/health` 可访问。
- `http://localhost:5173`、`5174`、`5175` 可访问。
- `npm run build` 通过。
- `npm run test:api` 通过。
