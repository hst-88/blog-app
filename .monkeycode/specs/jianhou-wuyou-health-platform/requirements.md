# Requirements Document

## Introduction

“检后无忧”全流程健康管理平台连接体检中心、基层医生与用户，将一次性体检转化为全周期健康管理闭环。平台覆盖三个端：C 端微信小程序（体检者）、B 端医生 Web 后台（基层医生/健康管理师）、B 端管理 Web 后台（体检中心/平台运营）。

核心业务闭环：体检中心导入数据 → AI 初步解读 → 异常指标预警 → 用户查看报告 → 用户发起咨询 → 医生干预回复 → 系统推送复查提醒 → 用户健康打卡 → 健康档案更新。

本文档将产品需求文档（PRD）中的功能转化为符合 EARS 模式与 INCOSE 语义质量规则的可测试需求。

## Glossary

- **平台（System）**：检后无忧全流程健康管理平台，含 C 端小程序、医生端 Web、管理端 Web 及后端服务。
- **用户（User）**：C 端体检者/普通用户，通过微信小程序使用服务。
- **医生（Doctor）**：基层医生或健康管理师，通过医生端 Web 后台管理签约患者。
- **管理员（Admin）**：体检中心或平台运营人员，通过管理端 Web 后台进行数据与系统管理。
- **体检中心（Health Center）**：提供体检数据导入与套餐管理的机构。
- **体检报告（Report）**：一次体检产生的指标集合，含日期、机构、风险等级、指标明细。
- **指标（Indicator）**：报告中的单项检测结果，含名称、检测值、单位、参考范围、状态、科室。
- **异常指标（Abnormal Indicator）**：状态为偏高或偏低的指标。
- **风险等级（Risk Level）**：低、中、高三档，分别以绿色、黄色、红色展示。
- **预警等级（Alert Level）**：高危、中危，由可配置阈值判定。
- **签约患者（Contracted Patient）**：与某医生建立服务关系的用户。
- **健康档案（Health Record）**：患者历次报告、AI 解读、打卡数据、咨询记录、随访结果的时间轴集合。
- **AI 解读（AI Interpretation）**：大模型根据报告或单项指标生成的通俗说明，仅供参考。
- **咨询（Consultation）**：用户与签约医生之间的图文/语音/图片会话。
- **随访（Follow-up）**：医生按计划对重点患者进行的主动健康干预。
- **复查提醒（Recheck Reminder）**：按医生建议在指定时间向用户推送的微信订阅消息。
- **RBAC**：基于角色的访问控制模型。
- **OpenID**：微信授权返回的用户唯一标识。
- **脱敏（Masking）**：对姓名、手机号、身份证号等敏感字段做部分隐藏展示。

## Requirements

### Requirement 1: 用户微信授权登录

**User Story:** AS 用户, I want 通过微信一键授权登录, so that 我能快速进入平台并使用完整功能。

#### Acceptance Criteria

1. WHEN 用户首次打开小程序并同意微信授权, the 平台 SHALL 获取 OpenID、昵称、头像并完成登录。
2. WHEN 用户再次打开小程序且授权仍然有效, the 平台 SHALL 自动完成登录并进入首页。
3. IF 用户拒绝或取消微信授权, the 平台 SHALL 展示提示文案“请允许授权以使用完整功能”。
4. WHILE 用户处于已登录状态, the 平台 SHALL 保持会话有效并允许访问需要登录的功能。

### Requirement 2: 用户手机号绑定

**User Story:** AS 用户, I want 绑定手机号, so that 平台能匹配我的体检报告并向我发送通知。

#### Acceptance Criteria

1. WHEN 用户提交 11 位且以 1 开头的手机号并请求验证码, the 平台 SHALL 向该手机号发送 6 位短信验证码。
2. WHILE 验证码已发送, the 平台 SHALL 将该验证码的有效期保持为 5 分钟。
3. WHEN 用户在有效期内提交正确验证码, the 平台 SHALL 将该手机号绑定到当前账号。
4. IF 同一手机号已被其他账号绑定, the 平台 SHALL 拒绝本次绑定并提示该手机号已被占用。
5. IF 用户连续 3 次提交错误验证码, the 平台 SHALL 锁定该绑定操作 10 分钟。

### Requirement 3: 完善个人信息

**User Story:** AS 用户, I want 填写年龄、性别、既往病史和过敏史, so that 后续解读与风险评估能使用我的基础健康信息。

#### Acceptance Criteria

1. WHEN 用户提交个人信息, the 平台 SHALL 校验年龄为 1 至 120 的整数、性别为男或女，并要求昵称长度为 1 至 20 个字符。
2. WHEN 年龄、性别均通过校验, the 平台 SHALL 保存个人信息；既往病史与过敏史允许为空，填写时各自最多 200 字。
3. IF 用户提交的年龄超出 1 至 120 范围, the 平台 SHALL 提示“请输入有效年龄”并拒绝保存。
4. WHEN 昵称来自微信授权, the 平台 SHALL 在注册页自动填充该昵称并允许用户修改。

### Requirement 4: 实名认证与报告匹配

**User Story:** AS 用户, I want 用真实姓名和身份证号完成实名认证, so that 平台能匹配体检中心中我的体检记录。

#### Acceptance Criteria

1. WHEN 用户提交真实姓名与 18 位身份证号, the 平台 SHALL 校验身份证号格式。
2. WHEN 身份证号格式校验通过, the 平台 SHALL 按姓名与身份证号匹配体检中心数据。
3. IF 身份证号格式校验失败, the 平台 SHALL 拒绝提交并提示身份证号格式错误。
4. IF 格式正确但未匹配到体检记录, the 平台 SHALL 提示“未找到您的体检记录，请联系客服”。

### Requirement 5: 体检报告列表

**User Story:** AS 用户, I want 按时间倒序查看历次体检报告, so that 我能快速了解每次体检的日期、机构和风险情况。

#### Acceptance Criteria

1. WHEN 用户进入报告列表页, the 平台 SHALL 按体检日期倒序展示报告，每页 10 条，并显示体检日期（YYYY-MM-DD）、体检机构、风险等级、异常指标数、报告缩略图。
2. WHEN 平台展示风险等级, the 平台 SHALL 以绿色表示低、黄色表示中、红色表示高。
3. WHEN 用户下拉刷新, the 平台 SHALL 重新加载第一页报告列表。
4. WHEN 用户上拉且仍有未加载报告, the 平台 SHALL 加载下一页 10 条记录。

### Requirement 6: 体检报告详情

**User Story:** AS 用户, I want 查看每项指标的检测值、参考范围和异常状态, so that 我能看懂本次体检结果。

#### Acceptance Criteria

1. WHEN 用户打开某份报告详情, the 平台 SHALL 按科室分组展示指标名称、检测值、单位、参考范围与状态（正常/偏高/偏低）。
2. WHEN 指标状态为偏高, the 平台 SHALL 以红色或橙色高亮该指标并标注“↑”。
3. WHEN 指标状态为偏低, the 平台 SHALL 以红色或橙色高亮该指标并标注“↓”。
4. WHILE 用户查看本人报告详情, the 平台 SHALL 仅展示该用户本人的报告数据。

### Requirement 7: 报告下载与分享

**User Story:** AS 用户, I want 下载 PDF 原始报告并分享给微信好友或医生, so that 我能保存或转交报告。

#### Acceptance Criteria

1. WHEN 用户选择下载 PDF 报告, the 平台 SHALL 提示“建议在WiFi环境下下载”并提供 PDF 下载。
2. WHEN 用户选择分享, the 平台 SHALL 生成含小程序码的分享卡片。
3. IF 报告 PDF 生成失败, the 平台 SHALL 提示下载失败并允许用户重试。

### Requirement 8: 整体报告 AI 解读

**User Story:** AS 用户, I want 获得通俗易懂的整体报告解读, so that 我能理解体检结果的含义。

#### Acceptance Criteria

1. WHEN 用户对一份报告请求整体解读, the 平台 SHALL 在 5 秒内返回通俗解读，并标明“AI建议仅供参考，不能替代医生诊断”。
2. IF 解读生成超过 5 秒仍未完成, the 平台 SHALL 提示“AI正在思考，请稍后”。
3. WHILE 展示 AI 解读, the 平台 SHALL 同时展示免责声明。

### Requirement 9: 单项指标 AI 追问

**User Story:** AS 用户, I want 点击异常指标向 AI 追问解释和建议, so that 我能了解单项指标的可能原因与生活建议。

#### Acceptance Criteria

1. WHEN 用户对异常指标发起追问并提交问题, the 平台 SHALL 将 report_id、指标名称与用户问题发送至解读服务。
2. WHEN 解读服务收到追问, the 平台 SHALL 组装包含指标名称、检测值、单位、参考范围与用户问题的提示词，要求回答覆盖可能原因、严重程度、生活建议。
3. WHEN 解读服务返回结果, the 平台 SHALL 展示回答并标注免责声明。
4. IF 同一用户当日追问次数已达到 10 次, the 平台 SHALL 拒绝新的追问并提示当日次数已用完。

### Requirement 10: 健康风险评估

**User Story:** AS 用户, I want 基于体检数据评估慢病风险并看到雷达图, so that 我能了解代谢、心血管、肝肾等方面的风险分布。

#### Acceptance Criteria

1. WHEN 用户请求风险评估, the 平台 SHALL 基于体检数据、年龄、性别输出高血压、糖尿病、脂肪肝等慢病的低/中/高风险等级。
2. WHEN 风险评估完成, the 平台 SHALL 生成含代谢风险、心血管风险、肝肾风险、呼吸风险、骨骼风险五个维度的雷达图。
3. WHEN 用户选择截图分享雷达图, the 平台 SHALL 提供可分享的雷达图截图。
4. WHILE 评估模型配置发生变更, the 平台 SHALL 按最新可配置模型执行后续评估。

### Requirement 11: 发起在线咨询

**User Story:** AS 用户, I want 向签约基层医生发起图文咨询, so that 我能获得专业干预。

#### Acceptance Criteria

1. WHEN 已绑定签约医生的用户发起咨询, the 平台 SHALL 允许发送文本、图片、语音与报告截图。
2. WHEN 用户上传图片, the 平台 SHALL 限制单次咨询最多 9 张图，每张图片大小不超过 5MB。
3. WHEN 用户发送语音, the 平台 SHALL 限制语音时长不超过 60 秒。
4. IF 用户尚未签约医生, the 平台 SHALL 提示需要先签约医生后再发起咨询。
5. WHEN 用户成功发送消息, the 平台 SHALL 将消息状态标记为已发送，并记录消息 ID、发送方、消息类型、内容或文件 URL、发送时间。

### Requirement 12: 咨询历史

**User Story:** AS 用户, I want 查看历史咨询记录和医生回复, so that 我能回顾过往沟通。

#### Acceptance Criteria

1. WHEN 用户打开咨询历史, the 平台 SHALL 按发送时间倒序展示消息。
2. WHEN 存在未读医生回复, the 平台 SHALL 将未读消息标红。
3. WHEN 用户按医生筛选, the 平台 SHALL 仅展示与所选医生相关的咨询记录。
4. WHEN 用户阅读一条未读消息, the 平台 SHALL 将该消息状态更新为已读。

### Requirement 13: 复查提醒

**User Story:** AS 用户, I want 按医生建议收到复查提醒, so that 我能按时复查。

#### Acceptance Criteria

1. WHEN 医生建议了复查日期, the 平台 SHALL 在复查日前 3 天通过微信订阅消息向用户推送一次提醒。
2. WHEN 到达复查当天, the 平台 SHALL 再次通过微信订阅消息向用户推送一次提醒。
3. WHEN 用户点击复查提醒, the 平台 SHALL 跳转至预约页面。

### Requirement 14: 健康数据记录

**User Story:** AS 用户, I want 记录血压、血糖、体重、步数并查看趋势, so that 我能持续管理日常健康数据。

#### Acceptance Criteria

1. WHEN 用户手动输入血压、血糖、体重或步数, the 平台 SHALL 保存该条记录并更新对应趋势图。
2. IF 用户记录的血压收缩压大于 180, the 平台 SHALL 将该条记录标红并提示就医。
3. WHILE 展示健康打卡数据, the 平台 SHALL 按时间顺序生成趋势图。

### Requirement 15: 用药与运动提醒

**User Story:** AS 用户, I want 设置用药提醒和运动目标, so that 我能按计划服药和运动。

#### Acceptance Criteria

1. WHEN 用户设置用药或运动提醒并选择每天或每周重复, the 平台 SHALL 按所选周期创建提醒。
2. WHEN 到达提醒时间, the 平台 SHALL 通过微信订阅消息与小程序内弹窗各提醒一次。

### Requirement 16: 医生患者列表

**User Story:** AS 医生, I want 查看并筛选签约患者列表, so that 我能按风险优先处理患者。

#### Acceptance Criteria

1. WHEN 医生打开患者列表, the 平台 SHALL 仅展示该医生的签约患者，每页 20 条。
2. WHEN 医生按姓名、手机号或风险等级筛选, the 平台 SHALL 返回符合条件的签约患者。
3. WHEN 医生按风险等级排序, the 平台 SHALL 按高、中、低顺序排列患者。
4. WHEN 平台展示患者列表, the 平台 SHALL 对姓名做脱敏（如张*）、对手机号做脱敏（如 138****1234），并展示风险等级、最近体检日期、最近一次报告异常指标数，以及“查看档案”“发起随访”操作。

### Requirement 17: 医生查看健康档案

**User Story:** AS 医生, I want 查看签约患者的历次报告、AI 解读、打卡数据和咨询记录, so that 我能全面了解患者健康状况。

#### Acceptance Criteria

1. WHEN 医生打开某签约患者档案, the 平台 SHALL 按时间轴展示该患者的体检报告、AI 解读、打卡数据与咨询记录。
2. WHEN 档案中出现身份证号等敏感信息, the 平台 SHALL 以脱敏形式展示。
3. WHEN 医生选择导出 PDF, the 平台 SHALL 生成该患者健康档案的 PDF。
4. IF 医生尝试查看非签约患者档案, the 平台 SHALL 拒绝访问。

### Requirement 18: 患者分组

**User Story:** AS 医生, I want 按慢病类型对患者分组, so that 我能按组管理患者并推送宣教。

#### Acceptance Criteria

1. WHEN 医生创建自定义分组（如高血压组、糖尿病组）, the 平台 SHALL 保存该分组。
2. WHEN 医生批量将患者移动到某分组, the 平台 SHALL 更新这些患者的分组归属。
3. WHEN 医生向某分组推送健康宣教, the 平台 SHALL 仅向该分组内患者发送。

### Requirement 19: 异常指标预警列表

**User Story:** AS 医生, I want 看到高危患者预警列表, so that 我能优先干预异常患者。

#### Acceptance Criteria

1. WHEN 患者最近报告命中可配置预警阈值, the 平台 SHALL 将该患者纳入预警列表并以红色高亮展示。
2. WHEN 平台展示预警列表, the 平台 SHALL 按预警严重程度排序。
3. WHEN 管理员配置血糖大于 11.1 mmol/L 或血压大于 160/100 mmHg, the 平台 SHALL 将命中记录判定为高危。
4. WHEN 管理员配置谷丙转氨酶大于 100 U/L 或总胆固醇大于 7.0 mmol/L, the 平台 SHALL 将命中记录判定为中危。

### Requirement 20: 预警标记处理

**User Story:** AS 医生, I want 对预警患者标记处理或发起主动随访, so that 预警得到闭环。

#### Acceptance Criteria

1. WHEN 医生对预警患者标记已处理, the 平台 SHALL 将该患者从预警列表移除，并记录处理人、处理时间、处理方式。
2. WHEN 医生从预警条目发起主动随访, the 平台 SHALL 创建对应随访任务并记录处理日志。

### Requirement 21: 医生回复咨询

**User Story:** AS 医生, I want 接收并回复用户图文咨询, so that 用户能及时获得专业建议。

#### Acceptance Criteria

1. WHEN 签约用户发送咨询消息, the 平台 SHALL 在医生端展示该消息，并支持医生以文字、语音、图片回复。
2. WHEN 医生使用快捷回复模板发送, the 平台 SHALL 将模板内容作为回复发送给用户。
3. WHEN 医生完成回复, the 平台 SHALL 向用户端实时推送通知。
4. WHEN 咨询产生新消息, the 平台 SHALL 将咨询记录归档到该患者健康档案，关联对应报告 ID，归档后禁止修改。

### Requirement 22: 健康处方模板

**User Story:** AS 医生, I want 发送可自定义的健康处方模板, so that 我能高效给出饮食或运动建议。

#### Acceptance Criteria

1. WHEN 医生创建或编辑健康处方模板, the 平台 SHALL 保存模板内容并支持变量 `{患者姓名}`。
2. WHEN 医生向患者发送处方模板, the 平台 SHALL 将 `{患者姓名}` 替换为该患者姓名后发送。

### Requirement 23: 随访计划与任务

**User Story:** AS 医生, I want 为重点患者制定随访计划并处理任务提醒, so that 我能按周期完成随访。

#### Acceptance Criteria

1. WHEN 医生制定随访计划, the 平台 SHALL 保存随访周期（每月或每季度）、随访方式与随访内容。
2. WHEN 医生选择批量制定随访计划, the 平台 SHALL 为所选患者分别创建随访计划。
3. WHEN 随访任务到期, the 平台 SHALL 在医生任务列表中按日期排序展示，逾期任务标红。
4. WHEN 医生一键拨打患者电话, the 平台 SHALL 调起拨号并使用该患者联系电话。
5. WHEN 医生记录随访结果（含血压控制、用药依从性及自定义字段）, the 平台 SHALL 将结果归档到该患者健康档案。

### Requirement 24: 健康宣教

**User Story:** AS 医生, I want 向指定患者群体发布科普内容并查看反馈, so that 我能做健康教育并衡量效果。

#### Acceptance Criteria

1. WHEN 医生发布含图片或视频的富文本科普内容并选择目标患者群体, the 平台 SHALL 推送该内容并通知对应用户。
2. WHEN 用户阅读、点赞或评论该内容, the 平台 SHALL 累计阅读数、点赞数、评论数。
3. WHEN 医生导出宣教反馈数据, the 平台 SHALL 提供可导出的统计数据。

### Requirement 25: 体检数据批量导入

**User Story:** AS 管理员, I want 按模板批量导入 Excel/CSV 体检数据, so that 报告能进入平台并自动触发 AI 解读。

#### Acceptance Criteria

1. WHEN 管理员下载导入模板, the 平台 SHALL 提供含姓名、身份证号、体检日期、体检机构、指标名称、检测值、单位、参考范围的模板，上述字段均为必填。
2. WHEN 管理员上传 Excel 或 CSV, the 平台 SHALL 校验必填字段、数值范围与格式合法性。
3. WHEN 一行数据校验通过, the 平台 SHALL 导入该行并在整批成功导入后触发 AI 解读。
4. IF 某行校验失败, the 平台 SHALL 标记该行、提示具体行号，并支持导出失败数据。

### Requirement 26: 体检中心接口对接

**User Story:** AS 管理员, I want 通过 HL7/FHIR 与体检中心系统同步数据, so that 报告能实时进入平台。

#### Acceptance Criteria

1. WHEN 体检中心按平台 API 文档推送 HL7/FHIR 数据, the 平台 SHALL 接收并存储对应体检报告。
2. IF 同步中断, the 平台 SHALL 支持从中断位置续传。
3. WHEN 接口完成一次成功同步, the 平台 SHALL 对新增报告触发 AI 解读。

### Requirement 27: 套餐管理

**User Story:** AS 管理员, I want 维护体检套餐并控制上架状态, so that 小程序能展示可预约套餐。

#### Acceptance Criteria

1. WHEN 管理员新增、编辑或删除套餐, the 平台 SHALL 保存套餐名称、项目、价格、适用人群；套餐项目从指标库中选择。
2. WHEN 管理员上架套餐, the 平台 SHALL 使该套餐在小程序端可见。
3. WHEN 管理员下架套餐, the 平台 SHALL 使该套餐对用户不可见，已预约订单保持有效。

### Requirement 28: 异常指标统计与白皮书

**User Story:** AS 管理员, I want 按批次或区域统计体检异常并生成白皮书, so that 我能做运营分析与对外汇报。

#### Acceptance Criteria

1. WHEN 管理员按时间、机构、套餐筛选, the 平台 SHALL 统计检出率、异常率、平均值。
2. WHEN 管理员生成健康白皮书, the 平台 SHALL 以柱状图或饼图展示高血脂检出率等统计结果。
3. WHEN 管理员导出统计报表, the 平台 SHALL 提供 PDF 或 Excel 文件。
4. WHEN 管理员配置定时导出, the 平台 SHALL 按计划生成报表并通过邮件发送。
5. WHILE 生成统计, the 平台 SHALL 使用脱敏后的体检数据。

### Requirement 29: 平台用户管理与批量推送

**User Story:** AS 管理员, I want 查看注册用户并向分组用户推送通知, so that 我能运营体检与复查触达。

#### Acceptance Criteria

1. WHEN 管理员打开用户列表并按体检时间或套餐筛选, the 平台 SHALL 展示脱敏后的用户列表并支持导出。
2. WHEN 管理员按分组批量推送体检通知或复查提醒, the 平台 SHALL 通过微信订阅消息向该分组用户发送。

### Requirement 30: 权限与角色管理

**User Story:** AS 管理员, I want 基于 RBAC 管理医生账号与权限, so that 不同角色只能访问被授权功能。

#### Acceptance Criteria

1. WHEN 管理员创建或编辑角色, the 平台 SHALL 按 RBAC 保存该角色权限，并支持角色继承。
2. WHEN 管理员向医生账号分配角色, the 平台 SHALL 使该账号仅能访问所分配权限对应的功能。
3. WHILE 用户已登录 C 端, the 平台 SHALL 允许该用户查看个人报告、使用 AI 解读、发起在线咨询、进行健康打卡、接收提醒。
4. WHILE 医生已登录医生端, the 平台 SHALL 允许该医生查看签约患者报告、回复咨询、查看异常预警、进行随访管理、发布健康宣教。
5. WHILE 管理员已登录管理端, the 平台 SHALL 允许该管理员查看全部患者报告、查看异常预警、导入数据、管理套餐、查看统计报表、管理用户、配置系统。
6. IF 某角色请求未授权功能, the 平台 SHALL 拒绝该请求。

### Requirement 31: 操作日志审计

**User Story:** AS 管理员, I want 查询关键操作日志, so that 健康数据操作可追溯。

#### Acceptance Criteria

1. WHEN 发生关键操作, the 平台 SHALL 记录操作人、操作时间、操作内容、IP 地址。
2. WHILE 日志在保留期内, the 平台 SHALL 将日志保留 6 个月并支持按条件查询。

### Requirement 32: 性能

**User Story:** AS 平台运营, I want 系统在约定负载下保持可接受响应, so that 用户与医生操作流畅。

#### Acceptance Criteria

1. WHEN 500 个并发请求访问常规业务接口, the 平台 SHALL 使平均响应时间不超过 2 秒。
2. WHEN 用户请求 AI 整体解读, the 平台 SHALL 在 5 秒内返回解读结果或超时提示。

### Requirement 33: 安全

**User Story:** AS 平台运营, I want 健康数据加密存储并经鉴权传输, so that 用户隐私与接口安全得到保障。

#### Acceptance Criteria

1. WHEN 平台存储手机号、身份证号等用户隐私数据, the 平台 SHALL 使用 AES 加密存储。
2. WHEN 客户端与服务端通信, the 平台 SHALL 使用 HTTPS 传输。
3. WHEN 客户端请求需登录的 API, the 平台 SHALL 使用 JWT 校验身份并校验权限，阻止越权访问。
4. WHEN 接口接收外部输入, the 平台 SHALL 防护 SQL 注入与 XSS。

### Requirement 34: 可用性与兼容性

**User Story:** AS 平台运营, I want 系统稳定运行并兼容主流终端, so that 用户能在常用设备上使用。

#### Acceptance Criteria

1. WHILE 平台处于生产运行, the 平台 SHALL 提供 7x24 服务，可用性达到 99.9%。
2. WHEN 用户在微信最新版小程序中访问 C 端, the 平台 SHALL 适配主流屏幕尺寸并完成功能可用。
3. WHEN 医生或管理员使用 Chrome、Edge 或 Safari 访问 Web 后台, the 平台 SHALL 完成功能可用。

### Requirement 35: 可扩展接口预留

**User Story:** AS 平台运营, I want 预留标准接口, so that 后续可接入可穿戴设备、保险理赔、药品配送而不影响现有业务。

#### Acceptance Criteria

1. WHEN 新业务通过预留标准接口接入, the 平台 SHALL 保持现有报告、咨询、随访、导入功能继续可用。
2. WHEN 后续接入可穿戴设备数据, the 平台 SHALL 将设备数据写入用户健康打卡记录。

## Priority Mapping

| 优先级 | 需求编号 |
| :--- | :--- |
| 高 | 1, 2, 3, 5, 6, 8, 9, 11, 12, 13, 16, 17, 19, 20, 21, 25 |
| 中 | 4, 7, 10, 14, 18, 22, 23, 26, 28, 30, 31 |
| 低 | 15, 24, 27, 29 |

数据导入校验（Requirement 25）与权限控制（Requirement 30）同为高/中优先级中的安全基线，实施时应与对应业务功能同步交付。
