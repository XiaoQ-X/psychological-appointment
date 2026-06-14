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

## 当前主要问题

### P0

- 当前无已知 P0。

### P1

1. 尚未实现密码过期、管理员强制失效会话和服务端令牌撤销。
2. 管理后台部分图表是静态概览，不是实时统计。
3. 浏览器端 JWT 存储在 `localStorage`。
4. uni-app/Vite 构建链仍有高危依赖审计项。
5. 学生 H5 和咨询师 H5 是固定手机容器，不是完整响应式 Web 产品。
6. `server/src/app.js`、学生端和管理员端入口文件过大。

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

- 将趋势图和咨询类型分布改为真实聚合 API。
- 补充日期筛选、空状态、失败重试和导出。
- 明确桌面端最低支持宽度。

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
