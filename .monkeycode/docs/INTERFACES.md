# 接口文档

Base URL：前端经 Vite 走 `/api`，后端监听 `http://127.0.0.1:3001/api`。

鉴权：`Authorization: Bearer <token>`。用户 `POST /auth/login`；医生/管理员 `POST /auth/staff`。错误体为 `{ code, message }`。

完整路由表在 `server/src/main.ts`。下面按三端会碰到的业务分组。

## 健康与身份

| 方法 | 路径 | 谁用 | 作用 |
| :--- | :--- | :--- | :--- |
| GET | `/health` | 探活 | `{ ok, name }` |
| POST | `/auth/login` | C 端登录页 | phone+password |
| POST | `/auth/register` | C 端注册 | 含身份证匹配报告 |
| POST | `/auth/staff` | 医生/管理登录 | username+password，可选 expectRole；停用医生 FORBIDDEN |
| POST | `/auth/staff/register` | 医生/管理注册 | |
| GET | `/auth/me` | 三端 | 当前用户公开资料 |
| PUT | `/users/me/profile` | C 端编辑资料 | 昵称/性别/年龄/病史 |
| GET/PUT | `/doctor/profile` | 医生设置 | 执业信息与通知开关 |

## 报告与 AI

| 方法 | 路径 | 谁用 | 作用 |
| :--- | :--- | :--- | :--- |
| GET | `/reports` | C/医生/管理 | 分页列表 |
| GET | `/reports/:id` | C/医生 | 详情+指标 |
| POST | `/reports/:id/interpret` | C 报告详情/AI 页 | 整体解读 |
| POST | `/reports/:id/ask` | 同上 | 按指标追问，日限 10 |
| GET | `/reports/:id/chats` | AI 页 | 历史问答 |
| GET | `/risk/me` | C 风险页 | 分层+雷达+模型版本 |

## 套餐与预约

| 方法 | 路径 | 谁用 | 作用 |
| :--- | :--- | :--- | :--- |
| GET | `/packages` | C 列表 | 仅上架 |
| GET | `/packages/:id` | C 详情/确认 | |
| GET | `/appointments/availability` | C 列表/详情 | 某日号源 |
| GET/POST | `/appointments` | C | 我的预约 / 下单 |
| POST | `/appointments/:id/cancel` | C 我的预约 | 释放号源 |
| GET/POST | `/admin/packages` | 管理套餐 | 列表/保存 |
| POST | `/admin/packages/delete` | 管理套餐 | |
| GET | `/admin/appointments` | 管理预约 | 全量 |
| GET/PUT | `/admin/settings/appointments` | 号源设置 | 容量/时段/停约日 |

## 咨询、打卡、提醒、随访、宣教

| 方法 | 路径 | 谁用 | 作用 |
| :--- | :--- | :--- | :--- |
| POST/GET | `/consultations` | C/医生 | 建会话/列表 |
| POST | `/consultations/:id/messages` | C/医生聊天 | |
| GET/POST | `/health-logs` | C 打卡；医生档案时间线 | SBP，>180 异常 |
| GET/POST | `/reminders` | C 列表；医生代建需 patientId | |
| POST | `/reminders/:id/done` | C 复查页 | |
| GET/POST | `/followups` | 医生随访 | |
| POST | `/followups/:id/result` | 医生随访 | 归档 |
| GET/POST | `/edu` | C 我的 / 医生宣教 | |
| POST | `/edu/:id/read` | C 我的 | 阅读计数 |

## 医生工作台

| 方法 | 路径 | 谁用 | 作用 |
| :--- | :--- | :--- | :--- |
| GET | `/doctor/overview` | 工作台 KPI | |
| GET | `/doctor/patients` | 患者列表 | keyword/riskLevel |
| GET | `/doctor/patients/:id/record` | 患者档案 | |
| GET | `/alerts` | 预警中心 | |
| POST | `/alerts/:id/handle` | 预警中心 | marked 或 followup |

## 管理端其余

| 方法 | 路径 | 谁用 | 作用 |
| :--- | :--- | :--- | :--- |
| GET | `/admin/overview` | 总览 | |
| GET | `/admin/imports/template` | 导入页 | xlsx |
| POST | `/admin/imports` | 导入页 | multipart |
| POST | `/admin/fhir/ingest` | FHIR 页 | |
| GET | `/admin/stats` | 统计 | |
| POST | `/admin/stats/whitepaper` | 统计 | |
| POST | `/admin/stats/export` | 统计 | JSON |
| GET | `/admin/users` | 用户页 | q.name/date/package |
| GET | `/admin/users/export` | 用户页 | CSV |
| POST | `/admin/push` | 用户页 | 排队推送 |
| GET/POST/PUT | `/admin/doctors` | 医生管理 | |
| POST | `/admin/doctors/reset-password` | 医生管理 | |
| GET/POST | `/admin/roles` | 角色权限 | |
| GET | `/admin/audit-logs` | 操作日志 | |
| GET/PUT | `/admin/settings/alert-rules` | 预警阈值 | |
| GET/PUT | `/admin/settings/risk-model` | 评估模型 | |

页面与这些接口的对应关系见 当前工作区 `/.monkeycode/docs/专有概念/页面职责与三端关联.md`。
