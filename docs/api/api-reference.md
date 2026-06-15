# API 接口文档

## 2026-06-15 会话接口补充

- 三个登录接口仍返回短期 `token`，但 refresh token 不再出现在 JSON 响应中；服务端通过 HttpOnly Cookie `anxin_refresh` 写入 refresh token。
- `POST /api/auth/refresh`：公开接口，仅读取 HttpOnly refresh cookie。成功时轮换 refresh cookie，并返回新的短期 access token、`role`、`mustChangePassword` 和 `user`。
- `POST /api/auth/logout`：无需 Authorization 也可调用，用于清除 `anxin_refresh` cookie；前端同时清空内存 access token。
- access token payload 包含 `type=access`，refresh token payload 包含 `type=refresh`。接口会拒绝错误 token 类型。
- access token 默认有效期为 `JWT_EXPIRES_IN` 或 `15m`；refresh token 默认有效期为 `JWT_REFRESH_EXPIRES_IN` 或 `7d`。
- 自助改密或管理员重置学生/咨询师密码会递增 `sessionVersion`，旧 access token 和旧 refresh cookie 再访问时返回 `SESSION_REVOKED`。
- access token 过期时业务接口返回 `TOKEN_EXPIRED`；H5 API client 会尝试调用 `/api/auth/refresh` 后重放一次请求。

后端地址默认 `http://localhost:3000`。除登录和 `/health` 外，接口都需要请求头：

```http
Authorization: Bearer <token>
Content-Type: application/json
```

统一成功返回：

```json
{ "success": true, "message": "操作成功", "data": {} }
```

统一失败返回：

```json
{ "success": false, "message": "错误原因", "error": {} }
```

## 认证

| 方法 | 路径 | 权限 | 说明 |
|---|---|---|---|
| `POST` | `/api/auth/student/login` | 公开 | 学生登录，参数：`studentNo`、`password` |
| `POST` | `/api/auth/counselor/login` | 公开 | 咨询师登录，参数：`jobNo`、`password` |
| `POST` | `/api/auth/admin/login` | 公开 | 管理员登录，参数：`username`、`password` |
| `GET` | `/api/auth/me` | 登录 | 返回当前用户资料 |
| `POST` | `/api/auth/change-password` | 学生/咨询师 | 参数：`oldPassword`、`newPassword`；首次登录可访问 |
| `POST` | `/api/auth/logout` | 登录 | 退出登录 |

登录返回示例：

```json
{
  "success": true,
  "message": "学生登录成功",
  "data": {
    "token": "jwt-token",
    "role": "student",
    "mustChangePassword": true,
    "user": { "id": "xxx", "studentNo": "202600000001", "name": "测试学生01" }
  }
}
```

学生和咨询师由管理员新增、导入或重置密码后会获得随机临时密码。`mustChangePassword=true` 时，除 `/api/auth/me`、`/api/auth/change-password` 和 `/api/auth/logout` 外，业务接口统一返回 `403`。新密码至少 8 位，不能为纯数字、常见弱密码或与旧密码相同，并要求包含字母和特殊字符。

登录 token 包含服务端会话版本。学生/咨询师自助改密或管理员重置密码后，旧 token 会立即失效，业务接口返回：

```json
{
  "success": false,
  "message": "登录状态已失效",
  "error": { "code": "SESSION_REVOKED" }
}
```

## 学生端

| 方法 | 路径 | 说明 |
|---|---|---|
| `GET` | `/api/student/home` | 首页公告、文章、活动、推荐咨询师 |
| `GET` | `/api/student/counselors` | 咨询师列表，支持 `campusId`、`keyword` |
| `GET` | `/api/student/counselors/:id` | 咨询师详情与可约排班 |
| `GET` | `/api/student/schedules` | 可约排班，支持 `counselorId` |
| `POST` | `/api/student/appointments` | 提交预约，参数：`scheduleId`、`type`、`concern`、`consentAccepted` |
| `GET` | `/api/student/appointments` | 我的预约，支持 `status` |
| `GET` | `/api/student/appointments/:id` | 预约详情 |
| `POST` | `/api/student/appointments/:id/cancel` | 取消预约，参数：`reason` |
| `POST` | `/api/student/appointments/:id/reschedule` | 改期，参数：`newScheduleId`、`reason` |
| `POST` | `/api/student/appointments/:id/feedback` | 评价，参数：`rating`、`tags`、`content` |
| `POST` | `/api/student/risk-assessments` | 风险筛查，参数：`score`、`answers` |
| `GET` | `/api/student/assessments` | 测评列表 |
| `POST` | `/api/student/assessment-results` | 提交测评结果 |
| `GET` | `/api/student/messages` | 消息中心 |
| `GET` | `/api/student/articles` | 心理科普 |
| `GET` | `/api/student/activities` | 活动列表 |
| `POST` | `/api/student/activities/:id/signup` | 活动报名，参数：`name`、`phone`、`remark` |

预约提交示例：

```json
{
  "scheduleId": "schedule-id",
  "type": "首次咨询",
  "concern": "近期学习压力较大",
  "consentAccepted": true
}
```

## 咨询师端

| 方法 | 路径 | 说明 |
|---|---|---|
| `GET` | `/api/counselor/dashboard` | 工作台统计 |
| `GET` | `/api/counselor/appointments` | 当前咨询师预约 |
| `GET` | `/api/counselor/appointments/:id` | 预约详情 |
| `POST` | `/api/counselor/appointments/:id/confirm` | 确认预约 |
| `POST` | `/api/counselor/appointments/:id/reject` | 拒绝预约，参数：`reason` |
| `POST` | `/api/counselor/appointments/:id/checkin` | 签到，状态变为 `in_progress` |
| `POST` | `/api/counselor/appointments/:id/complete` | 完成咨询并保存记录 |
| `POST` | `/api/counselor/appointments/:id/no-show` | 标记未到 |
| `POST` | `/api/counselor/records` | 保存咨询记录 |
| `GET` | `/api/counselor/students` | 当前咨询师负责学生 |
| `GET` | `/api/counselor/students/:id` | 学生档案 |
| `GET` | `/api/counselor/schedules` | 我的排班 |
| `POST` | `/api/counselor/schedules` | 新增排班，自动检测咨询师/咨询室冲突 |
| `POST` | `/api/counselor/shift-applications` | 提交调班申请 |
| `GET` | `/api/counselor/risk-records` | 风险学生记录 |
| `POST` | `/api/counselor/risk-feedback` | 提交风险处理反馈 |
| `GET` | `/api/counselor/referrals` | 转介列表 |
| `POST` | `/api/counselor/referrals` | 发起转介 |
| `POST` | `/api/counselor/referrals/:id/accept` | 接收转介 |
| `POST` | `/api/counselor/referrals/:id/reject` | 拒绝转介 |
| `GET` | `/api/counselor/messages` | 咨询师消息 |
| `GET` | `/api/counselor/articles` | 我的文章 |
| `POST` | `/api/counselor/articles` | 发布文章，学生端可见 |

完成咨询示例：

```json
{
  "summary": "完成本次咨询",
  "intervention": "支持性倾听",
  "riskNote": "未发现急性风险",
  "plan": "建议复访"
}
```

## 管理员端

| 方法 | 路径 | 说明 |
|---|---|---|
| `GET` | `/api/admin/dashboard` | 数据看板 |
| `GET` | `/api/admin/students` | 学生列表 |
| `GET` | `/api/admin/students/:id` | 学生详情 |
| `POST` | `/api/admin/students` | 新增学生，返回一次性 `temporaryPassword` |
| `PUT` | `/api/admin/students/:id` | 编辑学生 |
| `DELETE` | `/api/admin/students/:id` | 删除学生（软删除） |
| `POST` | `/api/admin/students/:id/reset-password` | 生成新的随机临时密码 |
| `GET` | `/api/admin/counselors` | 咨询师列表 |
| `GET` | `/api/admin/counselors/:id` | 咨询师详情 |
| `POST` | `/api/admin/counselors` | 新增咨询师，返回一次性 `temporaryPassword` |
| `PUT` | `/api/admin/counselors/:id` | 编辑咨询师 |
| `POST` | `/api/admin/counselors/:id/disable` | 禁用咨询师 |
| `POST` | `/api/admin/counselors/:id/reset-password` | 生成新的随机临时密码 |
| `GET` | `/api/admin/appointments` | 全量预约 |
| `GET` | `/api/admin/schedules` | 全量排班 |
| `POST` | `/api/admin/schedules` | 新增排班 |
| `PUT` | `/api/admin/schedules/:id` | 编辑排班 |
| `DELETE` | `/api/admin/schedules/:id` | 删除排班（置为 disabled） |
| `GET` | `/api/admin/shift-applications` | 调班审批列表 |
| `POST` | `/api/admin/shift-applications/:id/approve` | 通过调班 |
| `POST` | `/api/admin/shift-applications/:id/reject` | 驳回调班 |

Dashboard 返回字段包括：

```json
{
  "students": 12,
  "counselors": 4,
  "appointments": 28,
  "pendingAppointments": 3,
  "activeRisks": 1,
  "activities": 2,
  "schedules": 16,
  "pendingShifts": 0,
  "pendingReferrals": 0,
  "pendingFeedbacks": 1,
  "appointmentStatus": [{ "status": "completed", "count": 10 }],
  "appointmentTypes": [{ "type": "首次咨询", "count": 6 }],
  "appointmentTrend": [{ "date": "2026-06-14", "count": 2 }],
  "recentAppointments": [],
  "recentLogs": []
}
```
| `GET` | `/api/admin/risk-records` | 风险预警 |
| `POST` | `/api/admin/risk-records/:id/followup` | 添加跟进 |
| `POST` | `/api/admin/risk-records/:id/close` | 结案 |
| `GET` | `/api/admin/referrals` | 转介管理 |
| `POST` | `/api/admin/referrals/:id/approve` | 通过转介 |
| `POST` | `/api/admin/referrals/:id/reject` | 驳回转介 |
| `GET` | `/api/admin/articles` | 文章管理 |
| `POST` | `/api/admin/articles` | 新增文章 |
| `PUT` | `/api/admin/articles/:id` | 编辑文章 |
| `DELETE` | `/api/admin/articles/:id` | 删除文章（归档） |
| `GET` | `/api/admin/activities` | 活动管理 |
| `POST` | `/api/admin/activities` | 新增活动 |
| `PUT` | `/api/admin/activities/:id` | 编辑活动 |
| `DELETE` | `/api/admin/activities/:id` | 删除活动（取消） |
| `GET` | `/api/admin/campuses` | 校区列表 |
| `POST` | `/api/admin/campuses` | 新增校区 |
| `DELETE` | `/api/admin/campuses/:id` | 删除校区（禁用） |
| `GET` | `/api/admin/logs` | 操作日志 |
| `GET` | `/api/admin/settings` | 系统设置 |
| `PUT` | `/api/admin/settings` | 保存系统设置 |

## 权限说明

- 学生接口只能访问当前学生自己的预约、测评、风险、消息和活动报名。
- 咨询师接口只能访问当前咨询师相关预约、排班、学生档案和消息；高风险记录面向咨询师提供提醒列表。
- 管理员接口可访问全局管理数据。
- 所有新增、修改、删除和关键状态变更都会写入 `operation_logs`。
- 身份核验码、密码哈希和临时密码不会写入操作日志；身份核验码和密码哈希不会出现在用户资料响应中。
