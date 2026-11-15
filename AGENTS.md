# Seashell Play (Google auth / Android + shared backend)

## Deploy policy
- If the backend builds/passes checks, deploy automatically without asking: `node scripts/deploy-api-vps.mjs` → `root@193.41.4.206:/root/seashell-server-new`, PM2 process `seashell-api`, health: `https://api.sishel.ru/api/health`.
- The web frontend of this project is NOT the Telegram Mini App — do not deploy it to front.sishel.ru (that is served from `seashell_tg_clean`).
- Android builds go through `npm run build:android` + Android Studio.

## Verification
- `npm test` for server tests (needs Docker/Postgres for some suites; DB-dependent tests may skip).
- Lint changed files with `npx eslint <files>` — pre-existing lint debt lives in untouched `src/` files.
- `node scripts/check-locales.mjs` — locale coverage guard (modules, prompts, TTS/STT, reader dst).

## Locales policy
- English (`en`) is the primary development target. New UI i18n keys go into `src/i18n/messages/en.js` (optionally `ru.js`) only — `translate()` falls back to English for every other locale, so do NOT touch the other 9 locale files for routine English work.
- Non-English learning locales are frozen: don't edit `src/modules/<code>/` or `server/prompts/targets/<code>/` unless fixing a reported bug in that locale.
