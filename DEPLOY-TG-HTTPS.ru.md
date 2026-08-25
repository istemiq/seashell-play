# Telegram Mini App — HTTPS на Beget (VPS)

API уже есть: **https://api.sishel.ru** (тот же VPS `155.212.141.148`).

Фронт для Telegram: **https://app.sishel.ru** (поддомен + Let's Encrypt).

---

## Шаг 1 — DNS в Beget (5 мин)

1. [cp.beget.com](https://cp.beget.com) → домен **sishel.ru** → **DNS / Поддомены**
2. Добавь **A-запись**:
   - Имя: `app`
   - Значение: `155.212.141.148` (как у `api`)
   - TTL: 300–3600
3. Подожди 5–30 мин, проверь на ПК:
   ```powershell
   nslookup app.sishel.ru
   ```
   Должен вернуть `155.212.141.148`.

---

## Шаг 2 — nginx + SSL на VPS (один раз)

```powershell
scp C:\Users\Пайчармик\seashell_tg\scripts\setup-tg-web-vps.sh root@155.212.141.148:/root/
ssh root@155.212.141.148 "bash /root/setup-tg-web-vps.sh"
```

Если certbot ругнётся — DNS ещё не доехал, подожди и повтори.

---

## Шаг 3 — Сборка и заливка фронта

```powershell
cd C:\Users\Пайчармик\seashell_tg
npm run build:tg-web
npm run deploy:tg-web
```

Проверка: https://app.sishel.ru/ — тёмный интерфейс Seashell.

---

## Шаг 4 — CORS на API

На VPS в `/root/seashell-server-new/.env` в `CORS_ORIGINS` добавь:

```env
https://app.sishel.ru
```

```bash
pm2 restart seashell-api --update-env
```

---

## Шаг 5 — BotFather

1. @BotFather → твой бот → **Bot Settings** → **Menu Button** / **Configure Mini App**
2. URL: `https://front.sishel.ru/` (не `app.sishel.ru` — для него нет DNS)
3. Открой бота в Telegram → кнопка меню → Mini App.

---

## Чеклист

- [ ] A-запись `app.sishel.ru` → VPS
- [ ] certbot / HTTPS
- [ ] `npm run build:tg-web` + `deploy:tg-web`
- [ ] `TELEGRAM_BOT_TOKEN` на VPS (в `.env`, не в чат)
- [ ] CORS `https://app.sishel.ru`
- [ ] URL в BotFather

---

## Команды на будущее

| Действие | Команда |
|----------|---------|
| Обновить API | `npm run deploy:api-vps` |
| Обновить фронт | `npm run build:tg-web && npm run deploy:tg-web` |
