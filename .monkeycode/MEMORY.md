# User Instruction Memory

This file records user instructions, preferences, and teachings for reference in future interactions.

## Format

### User Instruction Entry
User instruction entries should follow this format:

[User Instruction Summary]
- Date: [YYYY-MM-DD]
- Context: [Mentioned scenario or time]
- Instructions:
  - [Content of user teaching or instruction, described line by line]

### Project Knowledge Entry
Entries discovered by the Agent during task execution should follow this format:

[Project Knowledge Summary]
- Date: [YYYY-MM-DD]
- Context: Discovered by Agent while performing [specific task description]
- Category: [Operations & Deployment|Build Methods|Testing Methods|Troubleshooting & Debugging|Workflow & Collaboration|Environment Configuration]
- Instructions:
  - [Specific knowledge points, described line by line]

## Deduplication Strategy
- Before adding a new entry, check for similar or identical instructions.
- If a duplicate is found, skip the new entry or merge it with the existing one.
- When merging, update the context or date information.
- This helps avoid redundant entries and keeps the memory file tidy.

## Entries

[Project Knowledge Summary]
- Date: 2026-10-14
- Context: Discovered by Agent while implementing the health-platform package/appointment feature
- Category: Operations & Deployment
- Instructions:
  - Backend runs via `cd /workspace/server && npx tsx src/main.ts` (no watch mode); any backend source change requires killing and restarting the server process to take effect.
  - Backend listens on port 3001; frontend requests go through the `/api` reverse proxy.
  - `web-admin` (all three portals: user/doctor/admin) runs on port 5173 with Vite HMR; no build needed during development. `web-doctor` is a separate project on port 5174.
  - Login endpoints: end user `POST /api/auth/login` (phone + password); staff/admin `POST /api/auth/staff` (username + password). Tokens are stored in localStorage keys `jh_user_token`, `jh_doctor_token`, `jh_admin_token`.
  - Demo accounts: user `13800138000`/`user123`, doctor `doctor`/`doctor123`, admin `admin`/`admin123`.

[Project Knowledge Summary]
- Date: 2026-10-14
- Context: Discovered by Agent during backend edits
- Category: Troubleshooting & Debugging
- Instructions:
  - The shared package exposes business error factories via `Errors` in `/workspace/server/src/common/http-error.ts`.
  - Store data persists to `/workspace/server/data/store.json`; `ensureCatalogAndPackages()` repairs legacy package records on load.
  - When a TS/JS block-bodied arrow returns an object literal, do not leave a trailing comma after the `return {...}` statement inside the block; it produces a misleading `Unexpected "}"` / `Expression expected` parse error.

[Project Knowledge Summary]
- Date: 2026-10-15
- Context: Discovered by Agent while implementing the appointment seat-source (号源) feature
- Category: Workflow & Collaboration
- Instructions:
  - Appointment seat capacity comes from `store.appointmentSettings` (per-slot capacity + slot list + closed dates), admin-editable via `GET/PUT /api/admin/settings/appointments`; admin UI is `/admin/settings/appointments`.
  - All packages share one global slot pool, so a date's total bookable count equals `slotCapacity x slotsPerDay`; cancellation frees the seat.
  - C-side reads `GET /api/appointments/availability?date=YYYY-MM-DD`, which returns `capacity`, `slotsPerDay`, `totalRemaining`, `closed`, and per-slot `used/remaining/full`.

[Project Knowledge Summary]
- Date: 2026-10-18
- Context: Discovered by Agent while fixing the server test command
- Category: Testing Methods
- Instructions:
  - Run server tests with `cd /workspace/server && npm test`, which uses `tsx --test src/**/*.spec.ts`; plain `node --experimental-strip-types` cannot resolve the `.js` import paths of `.ts` sources.
  - Verify server syntax without starting it via `npx esbuild src/main.ts --bundle --platform=node --packages=external --outfile=/tmp/jh-main.js`.
  - Build the unified frontend with `cd /workspace/web-admin && npm run build`.
