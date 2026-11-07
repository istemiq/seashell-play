# Seashell Play (Google auth / Android + shared backend)

## Deploy policy
- If the backend builds/passes checks, deploy automatically without asking: `node scripts/deploy-api-vps.mjs` → `root@193.41.4.206:/root/seashell-server-new`, PM2 process `seashell-api`, health: `https://api.sishel.ru/api/health`.
- The web frontend of this project is NOT the Telegram Mini App — do not deploy it to front.sishel.ru (that is served from `seashell_tg_clean`).
- Android builds go through `npm run build:android` + Android Studio.

## Verification
- `npm test` for server tests (needs Docker/Postgres for some suites; DB-dependent tests may skip).
- Lint changed files with `npx eslint <files>` — pre-existing lint debt lives in untouched `src/` files.
