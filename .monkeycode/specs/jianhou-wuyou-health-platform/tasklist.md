# 需求实施计划

- [x] 1. 搭建多工程目录与共享包
  - [x] 1.1 创建 `miniprogram/`、`web-doctor/`、`web-admin/`、`server/`、`packages/shared/`、`packages/web-ui/` 目录与基础配置
    - 对齐 design.md Architecture 仓库结构
    - 根目录补充 workspace 说明，保留现有 Vite 模板直到管理端可替换入口
  - [x] 1.2 实现 `packages/shared` 类型、枚举与校验
    - 覆盖用户/报告/指标/咨询/预警/随访 DTO 与风险枚举
    - 实现年龄 1-120、手机号、身份证 18 位、验证码 6 位校验（Requirement 2, 3, 4）
    - 实现指标相对参考范围判定 high/low/normal 与箭头映射（Requirement 6）
  - [x] 1.3 实现 `packages/web-ui` 脱敏函数
    - `maskName`、`maskPhone`、`maskIdNo`（Requirement 16, 17, 29）
  - [ ]* 1.4 为 shared 校验、指标状态、脱敏编写单元测试
    - 边界：空输入、年龄 0/1/120/121、身份证格式、血压 180（Requirement 3, 4, 6, 14）

- [x] 2. 搭建 NestJS 后端骨架与安全基线
  - [x] 2.1 初始化 `server/`（NestJS + TypeORM + JWT + 全局前缀 `/api`）
    - 写入 `server/.env.example`：`USER_LLM_*`、`USER_DATA_AES_KEY`、MySQL/Redis/OSS 占位（design.md AI 模块）
    - 配置 CORS、ValidationPipe、全局异常过滤器与业务码（design.md Error Handling）
    - 运行时以 Express 挂载同一套控制器（tsx 下 Nest DI 不可用）；持久化一期为内存存储
  - [x] 2.2 实现 AES-256-GCM 加解密与哈希工具
    - 隐私字段 phone/id_no/real_name 加密存储，`phone_hash`/`id_no_hash` 唯一（Requirement 33，Correctness 1, 14）
  - [x] 2.3 实现 JWT Guard、`@Roles`、资源归属 Guard
    - 用户仅本人报告、医生仅签约患者、管理员全量、越权 403（Requirement 30，Correctness 2, 3, 4, 16）
  - [x] 2.4 建立核心实体与迁移
    - users、doctors、admins、roles、role_permissions、user_roles、doctor_patient、reports、indicators、audit_logs（design.md Data Models）
    - 一期为内存实体；MySQL 迁移待后续切换
  - [ ]* 2.5 为加密往返、RBAC 继承、越权拒绝编写单元测试

- [x] 3. 检查点 - 确保骨架可启动且核心测试通过
  - 确保所有测试通过,如有疑问请询问用户

- [x] 4. 实现用户认证与档案 API
  - [x] 4.1 实现 `POST /auth/wechat`
    - code 换 OpenID、昵称、头像，签发 JWT；拒绝授权文案由客户端展示（Requirement 1）
  - [x] 4.2 实现短信验证码发送与绑定
    - `POST /auth/sms/send`、`POST /auth/sms/bind`：6 位码 TTL 300s、错误 3 次锁定 10 分钟、一号一账号（Requirement 2，Correctness 5）
  - [x] 4.3 实现资料完善与实名匹配
    - `PUT /users/me/profile`、`POST /users/me/realname`（Requirement 3, 4）
  - [ ]* 4.4 为短信锁定、手机占用、年龄非法、身份证格式编写接口测试

- [x] 5. 实现报告、导入与预警规则
  - [x] 5.1 实现报告列表/详情/PDF 接口
    - 分页 10、倒序、风险色标字段、按科室分组指标、权限分流（Requirement 5, 6, 7）
  - [x] 5.2 实现 Excel/CSV 导入与模板下载
    - 必填校验、失败行号、成功后入队 AI（Requirement 25，Correctness 10）
  - [x] 5.3 实现预警规则引擎与预警列表/处理
    - 默认血糖/血压/ALT/胆固醇阈值，handled 后移出并记日志（Requirement 19, 20，Correctness 9）
  - [x] 5.4 实现 FHIR 接入与续传游标
    - `POST /admin/fhir/ingest`、幂等键、resume_token（Requirement 26，Correctness 11）
  - [ ]* 5.5 为导入行失败、预警阈值、FHIR 去重编写测试

- [x] 6. 实现 AI 解读与风险评估
  - [x] 6.1 实现 `AiModule` OpenAI 兼容调用
    - 整体解读 5s 超时、免责声明、`AI_TIMEOUT`/`LLM_NOT_CONFIGURED`（Requirement 8）
    - 未配置 `USER_LLM_*` 时返回带免责声明的规则解读
  - [x] 6.2 实现单项追问与日限额
    - Redis `ask:{userId}:{yyyyMMdd}` 上限 10，Prompt 含名称/值/单位/范围/问题（Requirement 9，Correctness 6）
    - 一期日限额记在内存
  - [x] 6.3 实现可配置风险模型与雷达五维
    - `GET /risk/me`、`PUT /admin/settings/risk-model`（Requirement 10）
  - [ ]* 6.4 为 Prompt 组装、日限额跨日重置、超时码编写测试

- [x] 7. 实现咨询、打卡、提醒与随访
  - [x] 7.1 实现咨询会话与消息
    - 图片 ≤9 张且 ≤5MB、语音 ≤60s、未签约拒绝、归档只读、WebSocket 推送（Requirement 11, 12, 21，Correctness 7, 8）
    - 一期为 HTTP 轮询，WebSocket 待补
  - [x] 7.2 实现处方模板变量替换
    - `{患者姓名}` 替换后发送（Requirement 22）
  - [x] 7.3 实现健康打卡与用药/运动提醒
    - 血压收缩压 >180 标红；提醒 daily/weekly（Requirement 14, 15）
  - [x] 7.4 实现复查提醒任务
    - D-3 与 D-0 各推一次订阅消息，点击跳转预约页（Requirement 13）
    - 预约落地页已有；定时推送待接微信订阅消息
  - [x] 7.5 实现随访计划、逾期标红、结果归档
    - 每月/每季度、批量制定（Requirement 23）
  - [x] 7.6 实现患者分组与宣教发布/统计
    - 按组推送、阅读/点赞/评论计数（Requirement 18, 24）
  - [ ]* 7.7 为附件边界、归档不可改、血压 180 编写测试

- [x] 8. 实现医生端与管理端其余 API
  - [x] 8.1 实现医生患者列表与档案
    - 分页 20、风险排序、脱敏、PDF 导出、非签约 403（Requirement 16, 17）
  - [x] 8.2 实现套餐 CRUD 与上下架
    - 下架后小程序不可见、已预约保留（Requirement 27，Correctness 12）
  - [x] 8.3 实现统计、白皮书、定时导出
    - 检出率/异常率/均值，脱敏数据（Requirement 28）
  - [x] 8.4 实现管理用户列表、批量推送、RBAC、审计日志
    - 日志保留 180 天可查（Requirement 29, 30, 31，Correctness 13）
  - [ ]* 8.5 为鉴权矩阵、套餐下架、脱敏列表编写接口测试

- [x] 9. 检查点 - 确保后端 API 与测试通过
  - 确保所有测试通过,如有疑问请询问用户

- [x] 10. 实现微信小程序 C 端
  - [x] 10.1 搭建 `miniprogram/` 页面与请求封装
    - 登录/绑手机/资料/实名、Bearer JWT、`wx.uploadFile`（Requirement 1-4）
  - [x] 10.2 实现报告列表、详情、解读、追问、分享
    - 风险绿/黄/红、异常箭头、免责声明、WiFi 下载提示（Requirement 5-9）
  - [x] 10.3 实现风险雷达、咨询、打卡、提醒、预约落地页
    - 对齐 Requirement 10-15 页面路径

- [x] 11. 实现医生端 Web `web-doctor/`
  - [x] 11.1 初始化 Vue3+Vite+Pinia+Element Plus，端口 5174，`jh_doctor_token`，`allowedHosts` 与 `/api` 反代
  - [x] 11.2 实现登录、患者、档案、预警、咨询、随访、宣教页面
    - 角色非 doctor 拒绝（Requirement 16-24, 30）

- [x] 12. 实现管理端 Web `web-admin/`
  - [x] 12.1 初始化 Vue3+Vite，端口 5173，`jh_admin_token`，`allowedHosts` 与 `/api` 反代
  - [x] 12.2 实现导入、FHIR、套餐、统计、用户推送、RBAC、日志、阈值与风险模型配置页
    - 角色非 admin 拒绝（Requirement 25-31）

- [x] 13. 检查点 - 确保三端联调入口可用
  - 确保所有测试通过,如有疑问请询问用户
