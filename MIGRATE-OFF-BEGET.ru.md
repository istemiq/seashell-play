# Уход с Beget → новый VPS (OpenRouter fix)

## Проблема

OpenRouter (Cloudflare) **блокирует исходящие запросы с IP Beget** (`155.212.141.148`):

```json
{ "success": false, "error": "Access denied by security policy." }
```

Пока API на Beget — **словарь и практика не работают** (LLM 403). Решение: перенести API + PostgreSQL на VPS с «чистым» EU IP.

## Что переносим

| Компонент | Сейчас (Beget) | После |
|-----------|----------------|-------|
| API | `api.sishel.ru` → `155.212.141.148:3001` | новый IP |
| TG-фронт | `front.sishel.ru` → `/var/www/seashell-tg` | новый IP |
| PostgreSQL | `seashell` @ `127.0.0.1:5432` | dump → restore |
| `.env` | `/root/seashell-server-new/.env` | копия |
| Backend-код | `./server` в этом репозитории | тот же |

**VK не используется.** Активный фронт: `seashell_tg_clean`.

## Шаг 0 — Аренда VPS

Рекомендация (оплата СБП/Мир, EU IP для OpenRouter):

- **Timeweb Cloud** — Amsterdam или Frankfurt, 2 GB RAM (~300–500 ₽/мес)
- **Aeza** — Netherlands/Germany

**Не** Beget, **не** российский IP — OpenRouter может снова заблокировать.

После создания VPS запиши `NEW_IP` и настрой SSH-ключ.

## Шаг 1 — Bootstrap на новом сервере

```powershell
cd C:\Users\Пайчармик\seashell_tg_clean
scp scripts/bootstrap-new-vps.sh root@NEW_IP:/root/
ssh root@NEW_IP bash /root/bootstrap-new-vps.sh
```

## Шаг 2 — Автоматическая миграция (БД + .env + API)

```powershell
$env:SEASHELL_VPS_OLD = "root@155.212.141.148"
$env:SEASHELL_VPS_NEW = "root@NEW_IP"
node scripts/migrate-off-beget.mjs
```

Скрипт:
1. Делает `pg_dump` + копирует `.env` с Beget
2. Восстанавливает на новом VPS
3. **Проверяет OpenRouter** с нового IP (если 403 — остановится, нужен другой VPS)
4. Деплоит backend из `./server`

## Шаг 3 — DNS (Reg.ru)

В панели домена **sishel.ru** смени A-записи:

| Имя | Было | Стало |
|-----|------|-------|
| `api` | `155.212.141.148` | `NEW_IP` |
| `front` | `155.212.141.148` | `NEW_IP` |

TTL 300, подождать 5–30 мин.

## Шаг 4 — SSL на новом VPS

```bash
ssh root@NEW_IP
certbot --nginx -d api.sishel.ru -d front.sishel.ru --non-interactive --agree-tos -m istemiwork@gmail.com
```

## Шаг 5 — Деплой фронта

```powershell
$env:SEASHELL_VPS = "root@NEW_IP"
npm run deploy:prod
```

## Шаг 6 — Проверка

```powershell
curl https://api.sishel.ru/api/health
curl -I https://front.sishel.ru/
```

В Telegram: открыть бота → словарь → добавить слово (LLM должен ответить, не 403).

## Шаг 7 — Отключить Beget

Через 1–2 дня стабильной работы — удалить VPS на Beget (~1700 ₽/мес экономии).

## Полезные команды

| Действие | Команда |
|----------|---------|
| Деплой API | `npm run deploy:api-vps` |
| Деплой фронта | `npm run deploy:prod` |
| OpenRouter в .env | `node scripts/set-openrouter-vps.mjs` (нужен `$env:OPENROUTER_API_KEY`) |
| Миграция | `node scripts/migrate-off-beget.mjs` |

## Переменные окружения prod (.env)

```env
LLM_PROVIDER=openrouter
OPENROUTER_API_KEY=sk-or-v1-...
OPENROUTER_MODEL=deepseek/deepseek-chat
OPENROUTER_APP_NAME=Seashell
OPENROUTER_HTTP_REFERER=https://api.sishel.ru
DATABASE_URL=postgresql://seashell:***@127.0.0.1:5432/seashell
TELEGRAM_BOT_TOKEN=...
CORS_ORIGINS=...,https://front.sishel.ru
```
