# Verification Report

Date: 2026-06-14

## Repository

Target repository: `https://github.com/XiaoQ-X/psychological-appointment.git`

The remote repository is still empty. This local repository has been rebuilt from `anxin-psychology-project/03_dev` as a clean source tree.

## Source Extraction

Included:

- `apps/student`
- `apps/counselor`
- `apps/admin`
- `apps/wechat-miniapp`
- `server`
- `packages`
- `database`
- `scripts`
- `docker-compose.yml`
- `.env.example`
- selected Markdown documentation under `docs`

Excluded from the source tree:

- `node_modules`
- `dist`
- `output`
- `.playwright-cli`
- runtime uploads except `uploads/.gitkeep`
- screenshots
- delivery zip archives
- historical deploy packages

## Changes Made In This Repository

- Rewrote `README.md` for a new developer startup flow.
- Expanded `.gitignore` to cover dependencies, build output, automation output, uploads, logs, editor files, and archives.
- Updated root `package.json` so `npm run build` covers student H5, counselor H5, admin, and WeChat miniapp.
- Added `npm run test` and `npm run verify`.
- Changed Docker MySQL from fixed container name to compose-managed service name.
- Changed default MySQL host port from `3307` to `3308` to avoid conflicts with the original local project.
- Updated scripts to use `docker compose exec -T mysql`.
- Added `docs/` with API, database, delivery, and audit documents.
- Updated API test schedule creation so repeated test runs use unique future dates and do not collide with earlier runs.

## Commands Run

```powershell
npm install
npm run build
npm audit --omit=dev --registry=https://registry.npmjs.org --json
docker compose up -d mysql
docker compose exec -T mysql mysql -uroot -proot_password -e "CREATE DATABASE IF NOT EXISTS anxin_shadow CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
npm run db:migrate
npm run db:seed
npm run test:api
```

## Results

| Check | Result | Notes |
|---|---|---|
| `npm install` | Pass | 746 packages installed. `phin` deprecation warning remains. |
| `npm run build` | Pass | Student H5, counselor H5, admin, and WeChat miniapp all built. |
| Docker MySQL | Pass after fix | Fixed container-name conflict and port conflict by removing `container_name` and using port `3308`. |
| Prisma migrate | Pass | All migrations applied to MySQL on `localhost:3308`. |
| Seed | Pass | Creates minimal empty business baseline plus admin/campus/room data. |
| API test | Pass | 25 API checks passed, including import, login, schedule, appointment, completion, feedback, risk, and logs. |
| npm audit | Fail | 30 vulnerabilities: 10 high, 20 moderate. Main sources: uni-app dependency chain, Vite/esbuild, `xlsx`. |

After the first successful API test, a repeated run exposed a non-idempotent test bug: the script reused a fixed schedule time and failed with a schedule conflict. `server/src/test-api.js` was updated to add a per-run future-date offset. A repeated `npm run test:api` now passes.

## Security Audit Findings

High-level audit summary:

- 10 high vulnerabilities.
- 20 moderate vulnerabilities.
- `xlsx` has high vulnerabilities and no automatic npm audit fix.
- uni-app alpha dependency chain pulls vulnerable transitive packages.
- Vite/esbuild advisory is present in dependency graph; upgrade needs compatibility testing.

Recommended next action:

1. Replace `xlsx` or isolate import parsing behind strict server-side validation and sandboxing.
2. Evaluate upgrading DCloud/uni-app packages from the alpha train.
3. Upgrade Vite/esbuild only after checking uni-app compatibility.
4. Add a CI audit job that runs against `https://registry.npmjs.org`.

## UI Screenshots Captured

Screenshots were captured to ignored local output:

- `output/playwright/ui-audit/student-login-390.png`
- `output/playwright/ui-audit/student-login-320.png`
- `output/playwright/ui-audit/counselor-login-390.png`
- `output/playwright/ui-audit/counselor-login-320.png`
- `output/playwright/ui-audit/admin-login-1440.png`
- `output/playwright/ui-audit/admin-login-1024.png`
- `output/playwright/ui-audit/miniapp-login-390.png`
- `output/playwright/ui-audit/miniapp-login-320.png`

These files are intentionally ignored and should not be committed.
