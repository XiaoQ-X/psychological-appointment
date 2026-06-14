# Psychological Appointment 项目审查与整理计划

审查日期：2026-06-14

## 当前结论

`https://github.com/XiaoQ-X/psychological-appointment.git` 当前是空仓库。当前工作区中实际可审查的项目包是：

`C:\Users\JiaQ\Desktop\学校\anxin-psychology-project`

该项目是一个高校学生心理健康预约服务平台，包含：

- 学生端 H5：`03_dev/apps/student`
- 咨询师端 H5：`03_dev/apps/counselor`
- 管理员后台：`03_dev/apps/admin`
- 微信小程序/uni-app：`03_dev/apps/wechat-miniapp`
- 后端 API：`03_dev/server`
- Prisma/MySQL 数据库：`03_dev/database`
- 共享包与 API Client：`03_dev/packages`
- 原型、分析文档、测试报告、交付包、部署包等历史资料

## 已验证情况

- `npm run build` 可通过，但只构建微信小程序和管理员后台。
- `npm run build -w @anxin/student` 可通过。
- `npm run build -w @anxin/counselor` 可通过。
- `npm run test:api` 未通过，原因是 Docker/MySQL 未启动，无法连接 `localhost:3307`。
- Docker Desktop 当前未运行，`docker compose up -d mysql` 失败。
- `npm audit --omit=dev` 未通过，原因是 npm registry 当前为 `https://registry.npmmirror.com`，该源不支持 npm 官方 audit 接口。
- 学生端、咨询师端、管理端、小程序 H5 登录页均可启动并截图。

## 主要问题清单

### P0 阻塞问题

1. GitHub 目标仓库为空，当前项目没有上传到目标仓库。
2. 当前真实源码在另一个本地目录，且该目录已有大量未提交和未跟踪文件，不能直接全量推送。
3. API 闭环测试依赖 MySQL，但本机 Docker 未启动时无法验证。
4. 根目录 `npm run build` 没有覆盖学生 H5 和咨询师 H5，成品构建口径不完整。
5. 当前 `localhost:5173` 存在旧 Vite 进程抢占，容易误测到错误页面。

### P1 工程结构问题

1. 后端 `server/src/app.js` 约 2525 行，路由、业务逻辑、校验、查询混在一个文件中。
2. 学生端 `apps/student/src/App.vue` 约 2664 行，页面和业务状态集中在单文件。
3. 管理端 `apps/admin/src/App.vue` 约 3526 行，后台模块没有按功能拆分。
4. 小程序 `src/styles/prototype.css` 体量很大，包含大量 `!important` 和原型迁移样式，维护风险高。
5. 项目中同时存在源码、原型、分析、测试截图、交付 zip、部署包、历史输出，仓库边界不清晰。
6. `03_dev` 下已有 `node_modules/dist/output/uploads` 等产物，需要确保不会进入 GitHub 源码仓库。
7. 当前 Git 历史只有少量提交，且本地工作区包含大量未跟踪文件，版本基线不稳定。

### P1 产品完整性问题

1. 微信小程序部分页面仍保留“UI 原型还原阶段静态展示数据/后续替换真实数据”的注释，说明真实数据闭环需要复核。
2. 小程序登录页协议勾选区域触控面积偏小，文案字号偏小。
3. 小程序登录页顶部视觉图占比偏高，窄屏下表单首屏空间偏紧。
4. 学生 H5 采用固定手机壳模拟视图，适合原型演示，不适合直接当响应式 H5 成品。
5. 咨询师 H5 和小程序学生端在品牌、图形、登录结构上不完全统一。
6. 管理后台登录页偏插画/营销风格，学校管理系统成品感应更偏稳重、信息效率和权限感。
7. 管理后台最小宽度为 1024px，窄屏或平板场景需要明确是否支持。

### P1 安全与上线问题

1. 默认测试账号密码均为 `123456`，上线前必须强制改密或仅保留在 seed/dev 环境。
2. 学生和咨询师重置密码使用身份证后 6 位，安全性不足，需要增加首次登录改密、密码策略和审计提醒。
3. JWT 开发环境会回退到 `development-only-secret`，生产环境必须强校验环境变量。
4. token 存储在 `localStorage` 或小程序 storage 中，需要评估 XSS、失效、刷新和登出策略。
5. 上传接口需要继续确认文件类型、大小、路径穿越、防病毒/内容检查策略。
6. 心理健康数据属于敏感数据，需要补充隐私合规、操作审计、数据导出与删除策略。

### P2 文档与交付问题

1. README 在 PowerShell 默认编码下会显示乱码，需要交付说明写明 UTF-8 读取方式，或统一加 BOM/改写关键文档。
2. 运行说明依赖 Docker Desktop，但没有自动检测 Docker 是否运行。
3. npm audit 依赖官方 registry，文档中未说明如何切换。
4. 现有测试报告很多，但缺少一份“当前真实状态”的总控清单。
5. 原型复原报告与当前代码状态可能不同步，需要重新建立验收矩阵。

## 建议的仓库整理目标

目标 GitHub 仓库应只承载“可运行、可维护、可部署”的源码和必要文档，不应直接塞入所有历史资料。

推荐结构：

```text
psychological-appointment/
├─ apps/
│  ├─ admin/
│  ├─ counselor/
│  ├─ student/
│  └─ wechat-miniapp/
├─ server/
├─ packages/
│  ├─ api-client/
│  └─ shared/
├─ database/
├─ scripts/
├─ docs/
│  ├─ product/
│  ├─ api/
│  ├─ database/
│  ├─ qa/
│  └─ deployment/
├─ .env.example
├─ docker-compose.yml
├─ package.json
├─ package-lock.json
├─ README.md
└─ CHANGELOG.md
```

历史原型、截图、zip、部署包建议放在 `docs/archive` 或独立网盘/Release，不建议作为主源码长期维护。

## 下一步执行路线

### 第 1 步：建立干净源码基线

- 从 `anxin-psychology-project/03_dev` 抽取正式源码到空 GitHub 仓库。
- 排除 `node_modules`、`dist`、`output`、`.playwright-cli`、`uploads`、历史截图、交付 zip。
- 重写顶层 README，说明项目定位、端口、启动、测试账号、构建、部署。
- 修正 root `build` 脚本，覆盖 admin、student、counselor、wechat-miniapp。

### 第 2 步：恢复可验证环境

- 启动 Docker Desktop。
- 执行 `npm install`、`docker compose up -d mysql`、`npm run db:migrate`、`npm run db:seed`。
- 执行 `npm run build`、`npm run test:api`。
- 切换 npm registry 或补充安全扫描命令。

### 第 3 步：拆分工程结构

- 后端按模块拆分为 auth、student、counselor、admin、appointments、risk、content、settings。
- 前端按页面/组件/API/store 拆分。
- 小程序抽离公共样式 token、页面壳、卡片、表单、状态标签。

### 第 4 步：成品级 UI 复核

- 逐页截图对比：375x812、390x844、430x932、320x700、1024x768、1440x900。
- 检查文字溢出、按钮触控、底部导航遮挡、状态栏安全区、弹窗层级、空状态、加载态、错误态。
- 管理后台按学校业务后台风格收敛：更少插画感，更强数据表、筛选、权限和审计感。

### 第 5 步：业务闭环与上线安全

- 验证学生预约、取消、改期、评价。
- 验证咨询师确认、拒绝、签到、完成、记录、转介、排班。
- 验证管理员账号导入、排班、风险、转介、内容、活动、反馈、日志。
- 加强密码、JWT、上传、日志、敏感数据和隐私策略。

## 可直接给 Codex 的后续提示词

```text
请你接着审查并整理这个项目：C:\Users\JiaQ\Desktop\学校\anxin-psychology-project，同时目标 GitHub 仓库是 https://github.com/XiaoQ-X/psychological-appointment.git。

要求：
1. 先确认目标 GitHub 仓库是否仍为空；如果为空，把本地项目中真正可运行的源码从 03_dev 抽取为干净仓库结构，不要把 node_modules、dist、output、uploads、截图、zip、历史交付包直接放进源码仓库。
2. 重新整理 README、.gitignore、package scripts、docs 目录，让项目能被新的开发者按文档启动。
3. 修正 root build/test 口径：build 必须覆盖 admin、student、counselor、wechat-miniapp；test 至少包含 API 闭环测试，并说明 Docker/MySQL 前置条件。
4. 启动 Docker/MySQL 后执行 npm install、db migrate/seed、build、API test，记录所有失败原因并修复能修复的问题。
5. 按成品项目标准审查 UI，不只看功能。页面不整洁、错位、溢出、触控面积不足、状态栏/底部栏遮挡、视觉风格不统一、空状态/错误态缺失都算问题。
6. 对学生端、咨询师端、管理员后台、微信小程序分别列出 P0/P1/P2 问题，并优先修 P0 和影响演示闭环的 P1。
7. 不要破坏用户已有未提交内容；改动前先看 git status，并说明哪些文件是你新改的。
8. 每次修改后运行可用的构建、测试和截图级验证，最后给出变更摘要、验证结果、剩余问题和下一步计划。
```
