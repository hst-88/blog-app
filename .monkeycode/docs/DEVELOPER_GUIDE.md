# 开发指南

## 项目目的

检后无忧让体检中心、医生、用户共用一份数据走完「预约 → 导入报告 → 解读/咨询 → 随访/复查」。

**核心职责**

- C 端：报告、预约、AI、咨询、打卡、复查
- 医生端：患者、预警、咨询、随访、宣教、复查下发
- 管理端：导入、套餐、号源、用户、医生、统计、阈值

## 环境搭建

### 前置条件

- Node.js 22+
- 无需数据库

### 运行

```bash
# 后端（无 watch，改代码必须杀进程再启）
cd /workspace/server && npx tsx src/main.ts

# 三端门户
cd /workspace/web-admin && npm run dev
```

后端 3001，前端 5173，`/api` 反代。预览域名需在 Vite `server.allowedHosts` 中包含 `.monkeycode-ai.online`。

### 演示账号

- 用户 `13800138000` / `user123`，身份证 `110101199001011234`
- 医生 `doctor` / `doctor123`
- 管理 `admin` / `admin123`

登录端点：用户 `POST /api/auth/login`；员工 `POST /api/auth/staff`。没有 `/admin/login` 接口。

### 验证

```bash
cd /workspace/server && npm test
cd /workspace/server && npx esbuild src/main.ts --bundle --platform=node --packages=external --outfile=/tmp/jh-main.js
cd /workspace/web-admin && npm run build
```

## 开发工作流

- 改 `server/src` 后必须重启 tsx 进程，Vite HMR 只覆盖前端
- 块体箭头函数里 `return { ... },` 尾逗号会误报 `Unexpected "}"`
- 数据在 `server/data/store.json`，该目录已 gitignore
- 页面职责与跳转：当前工作区 `/.monkeycode/docs/专有概念/页面职责与三端关联.md`

## 常见任务

从门户 `/` 进对应端。走通预约：管理端上架套餐并配号源 → 用户选套餐确认 → 管理端预约列表出现。走通报告：管理端导入（可用示例身份证）→ 用户报告列表 → 医生预警。
