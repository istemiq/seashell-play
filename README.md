# Seashell Play (Google Play / Android)

Отдельный проект от Telegram Mini App (`seashell_tg_clean`).

- **Auth:** только Google Sign-In (в dev/emulator — `VITE_PLAY_DEV_AUTH=1`)
- **Stack:** React + Vite + Capacitor 6 + Android
- **API:** тот же backend-код в `server/`, но auth через Google ID token

## Быстрый старт (эмулятор)

### 1. Env

```powershell
cd C:\Users\Пайчармик\seashell_play
copy .env.example .env
```

В `server/.env` должно быть (скопировано из TG-проекта + строка):

```
PLAY_DEV_AUTH=1
DATABASE_URL=...
```

### 2. API + БД

```powershell
npm run db
npm run dev
```

API слушает `http://127.0.0.1:3001`. В `.env` для эмулятора:

```
VITE_API_URL=http://10.0.2.2:3001
VITE_PLAY_DEV_AUTH=1
```

### 3. Сборка и Android Studio

```powershell
npm run build:android
npm run android:open
```

В Android Studio: **Run** на эмуляторе (Pixel / API 34).

На экране входа нажми **Continue with Google** — в dev-режиме войдёт без Google Cloud.

### 4. Пересборка после изменений фронта

```powershell
npm run build:android
```

Потом Run снова в Android Studio.

## Реальный Google Sign-In

1. [Google Cloud Console](https://console.cloud.google.com/) → OAuth client:
   - **Web** client → `VITE_GOOGLE_WEB_CLIENT_ID`
   - **Android** client (package `ru.sishel.seashell`, SHA-1 debug keystore)
2. Server `.env`:
   ```
   GOOGLE_WEB_CLIENT_ID=...
   GOOGLE_ANDROID_CLIENT_ID=...
   PLAY_DEV_AUTH=0
   ```
3. Frontend `.env`: `VITE_PLAY_DEV_AUTH=0`, `VITE_GOOGLE_WEB_CLIENT_ID=...`
4. `capacitor.config.json` → `plugins.GoogleAuth.serverClientId`

Debug SHA-1:

```powershell
keytool -list -v -keystore "$env:USERPROFILE\.android\debug.keystore" -alias androiddebugkey -storepass android -keypass android
```

## GitHub

```powershell
cd C:\Users\Пайчармик\seashell_play
git init -b main
git add -A
git commit -m "Initial Seashell Play: Capacitor Android + Google auth"
```

Создай пустой репозиторий `seashell-play` на GitHub и:

```powershell
git remote add origin https://github.com/YOUR_USER/seashell-play.git
git push -u origin main
```

## iOS (позже)

```powershell
npx cap add ios
```

Тот же React-код + Sign in with Apple/Google через Capacitor.

## Отличия от Telegram-версии

| | Telegram (`seashell_tg_clean`) | Play (`seashell_play`) |
|---|---|---|
| Auth | Telegram initData | Google ID token |
| Billing | Telegram Stars | TBD (Play Billing) |
| Deploy | front.sishel.ru | APK / AAB |
| User ids | Telegram id | 5000000000+ sequence |

## Структура

```
seashell_play/
  android/          ← Android Studio project
  src/              ← React UI
  server/           ← API (Google auth)
  capacitor.config.json
```
