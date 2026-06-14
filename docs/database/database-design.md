# 数据库设计说明

数据库使用 MySQL 8.x + Prisma ORM，schema 位于 `03_dev/database/schema.prisma`。正式数据通过 `npm run db:migrate` 建表，通过 `npm run db:seed` 初始化。

## 核心表结构

| 表 | 说明 | 关键字段 |
|---|---|---|
| `students` | 学生档案与登录账号 | `student_no`、`name`、`id_card_last6`、`password_hash`、`college`、`campus_id`、`privacy_accepted` |
| `counselors` | 咨询师档案与登录账号 | `job_no`、`name`、`title`、`specialties`、`introduction`、`campus_id`、`status` |
| `admins` | 管理员账号 | `username`、`name`、`password_hash`、`role`、`status` |
| `campuses` | 校区基础数据 | `name`、`address`、`phone`、`status` |
| `counseling_rooms` | 咨询室 | `campus_id`、`name`、`location`、`capacity`、`status` |
| `schedules` | 咨询师排班 | `counselor_id`、`campus_id`、`room_id`、`start_at`、`end_at`、`status` |
| `appointments` | 预约主记录 | `appointment_no`、`student_id`、`counselor_id`、`schedule_id`、`status`、`concern`、`reject_reason` |
| `appointment_records` | 咨询记录 | `appointment_id`、`counselor_id`、`summary`、`intervention`、`risk_note`、`plan` |
| `risk_assessments` | 风险筛查记录 | `student_id`、`score`、`level`、`answers`、`process_status`、`feedback`、`followup_notes` |
| `assessments` | 测评量表 | `code`、`title`、`description`、`questions`、`status` |
| `assessment_results` | 测评结果 | `assessment_id`、`student_id`、`score`、`level`、`answers`、`suggestion` |
| `messages` | 站内消息 | `recipient_role`、`recipient_id`、`type`、`title`、`content`、`related_type`、`related_id`、`is_read` |
| `articles` | 心理科普文章 | `title`、`category`、`summary`、`content`、`author_role`、`status` |
| `activities` | 心理活动 | `title`、`category`、`location`、`start_at`、`signup_end_at`、`capacity`、`status` |
| `activity_signups` | 活动报名 | `activity_id`、`student_id`、`name`、`phone`、`status` |
| `referrals` | 转介记录 | `student_id`、`source_counselor_id`、`target_counselor_id`、`reason`、`status` |
| `shift_applications` | 调班申请 | `counselor_id`、`schedule_id`、`to_start_at`、`to_end_at`、`reason`、`status` |
| `feedbacks` | 咨询评价 | `appointment_id`、`student_id`、`rating`、`tags`、`content` |
| `operation_logs` | 操作日志 | `actor_role`、`actor_id`、`action`、`entity`、`entity_id`、`detail`、`ip` |
| `system_settings` | 系统设置 | `key`、`value`、`description` |

## 关系说明

- `students`、`counselors` 都可关联 `campuses`。
- `counseling_rooms` 属于 `campuses`，`schedules` 同时关联咨询师、校区和咨询室。
- `appointments` 连接学生、咨询师、排班、校区和咨询室；一个排班最多关联一个预约。
- `appointment_records` 与 `appointments` 一对一，保存咨询师完成咨询后的记录。
- `risk_assessments`、`assessment_results` 均归属学生；高风险记录会同步给咨询师端和管理员端。
- `referrals` 关联学生、发起咨询师和目标咨询师。
- `activity_signups` 对 `activity_id + student_id` 做唯一约束，避免重复报名。
- 所有新增、修改、删除类业务操作写入 `operation_logs`。

## 状态枚举

### 预约状态 `AppointmentStatus`

| 值 | 含义 |
|---|---|
| `pending` | 待确认 |
| `confirmed` | 已确认 |
| `in_progress` | 咨询中 |
| `completed` | 已完成 |
| `cancelled` | 已取消 |
| `rejected` | 已拒绝 |
| `no_show` | 未到 |

### 风险等级 `RiskLevel`

| 值 | 含义 |
|---|---|
| `low` | 低风险 |
| `medium` | 中风险 |
| `high` | 高风险 |
| `crisis` | 危机风险 |

### 其他状态

- `ScheduleStatus`：`available`、`booked`、`disabled`
- `ShiftStatus`：`pending`、`approved`、`rejected`
- `ReferralStatus`：`pending`、`accepted`、`rejected`、`approved`、`closed`
- `ArticleStatus`：`draft`、`published`、`archived`
- `ActivityStatus`：`draft`、`published`、`cancelled`
- `RiskProcessStatus`：`open`、`following`、`handled`、`closed`

## Seed 数据

`03_dev/database/seed.js` 初始化：

- 20 个学生
- 6 个咨询师
- 2 个管理员
- 3 个校区
- 8 个咨询室
- 36 条排班
- 30 条预约
- 12 条风险记录
- 12 篇文章
- 6 个活动
- 24 条消息
- 12 条操作日志
