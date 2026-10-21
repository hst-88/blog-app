# 模块：server

**路径**: `server/`

Express 在 `src/main.ts` 把 `AppController` 方法挂到 `/api`。业务在 `app.service.ts`，实体在 `store.ts`。tsx 启动，无 Nest DI。

改后端必须重启进程。测试：`cd /workspace/server && npm test`。
