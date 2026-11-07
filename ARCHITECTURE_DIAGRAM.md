# Seashell Multi-Platform Architecture Diagram

## Overview
Seashell is a language learning application available on multiple platforms:
- **Seashell Play** - Android app with Google Sign-In (Capacitor 6)
- **Seashell TG Clean** - Telegram Mini App without VKUI (React Router)
- **Seashell VK** - VK Mini App with VKUI library (older version)

All three platforms share the same backend API and core functionality.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    SEASHELL MULTI-PLATFORM ARCHITECTURE                      │
└─────────────────────────────────────────────────────────────────────────────┘
```

## High-Level Architecture

```
┌──────────────────┐         ┌──────────────────┐         ┌──────────────────┐
│   Android App    │         │  Telegram Mini   │         │   VK Mini App    │
│  (Seashell Play) │         │  (TG Clean)      │         │  (Seashell VK)   │
│  Capacitor 6     │         │  React Router    │         │  VKUI + VK Bridge│
│  Google Sign-In  │         │  Telegram Auth   │         │  VK Launch Params │
└────────┬─────────┘         └────────┬─────────┘         └────────┬─────────┘
         │                            │                            │
         │ HTTPS                      │ HTTPS                      │ HTTPS
         └────────────┬───────────────┴────────────┬───────────────┘
                      ▼                            ▼
         ┌──────────────────────────────────────────────────────┐
         │              Shared Backend API (Node.js)            │
         │              Express + Multi-Platform Auth            │
         ├──────────────────────────────────────────────────────┤
         │  - Google ID Token Auth (Play)                       │
         │  - Telegram Init Data Auth (TG)                      │
         │  - VK Launch Params Auth (VK)                        │
         │  - Dev Header Auth (local development)               │
         │  - LLM Integration (OpenRouter, GigaChat, etc.)       │
         │  - Practice Service, Dictionary, TTS/STT            │
         └──────────────────────────┬───────────────────────────┘
                                      │
                                      ▼
                         ┌──────────────────────────┐
                         │   PostgreSQL Database    │
                         │                          │
                         │  - users                 │
                         │  - words                 │
                         │  - examples              │
                         │  - practice_sessions     │
                         │  - word_sets             │
                         │  - billing_transactions  │
                         └──────────────────────────┘
```

## Component Breakdown

### 1. Mobile App Layer (Android/Capacitor)

```
┌─────────────────────────────────────────────────────────────┐
│                    Android Native Layer                      │
├─────────────────────────────────────────────────────────────┤
│  MainActivity.java                                          │
│  - Capacitor bridge initialization                          │
│  - Native plugin handling                                   │
│  - Google Sign-In integration                               │
├─────────────────────────────────────────────────────────────┤
│  Capacitor Plugins:                                         │
│  - @capacitor-community/text-to-speech (TTS)                │
│  - @codetrix-studio/capacitor-google-auth (Google Sign-In)  │
│  - @capacitor/app (App lifecycle)                           │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   React WebView Layer                        │
├─────────────────────────────────────────────────────────────┤
│  Built React app served from localhost/https                │
│  - HashRouter for navigation                                │
│  - Context providers (I18n, Theme, Auth)                   │
│  - Platform-specific adaptations                           │
└─────────────────────────────────────────────────────────────┘
```

### 2. Platform-Specific Frontends

#### Seashell Play (Android/Capacitor)
```
┌─────────────────────────────────────────────────────────────┐
│                    Android Native Layer                      │
├─────────────────────────────────────────────────────────────┤
│  MainActivity.java                                          │
│  - Capacitor bridge initialization                          │
│  - Native plugin handling                                   │
│  - Google Sign-In integration                               │
├─────────────────────────────────────────────────────────────┤
│  Capacitor Plugins:                                         │
│  - @capacitor-community/text-to-speech (TTS)                │
│  - @codetrix-studio/capacitor-google-auth (Google Sign-In)  │
│  - @capacitor/app (App lifecycle)                           │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   React WebView Layer                        │
├─────────────────────────────────────────────────────────────┤
│  Built React app served from localhost/https                │
│  - HashRouter for navigation                                │
│  - Context providers (I18n, Theme, Auth)                   │
│  - Platform-specific adaptations                           │
└─────────────────────────────────────────────────────────────┘
```

#### Seashell TG Clean (Telegram Mini App)
```
┌─────────────────────────────────────────────────────────────┐
│              Telegram Mini App Layer                        │
├─────────────────────────────────────────────────────────────┤
│  - window.Telegram.WebApp SDK                              │
│  - Telegram initData authentication                         │
│  - Telegram theme integration                              │
│  - Telegram back button handling                           │
│  - Stars billing integration                               │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   React Application                          │
├─────────────────────────────────────────────────────────────┤
│  - React Router (HashRouter)                                │
│  - Custom UI components (no VKUI)                          │
│  - Telegram-specific platform layer                       │
│  - Platform session management                             │
└─────────────────────────────────────────────────────────────┘
```

#### Seashell VK (VK Mini App)
```
┌─────────────────────────────────────────────────────────────┐
│                 VK Mini App Layer                            │
├─────────────────────────────────────────────────────────────┤
│  - VK Bridge library                                        │
│  - VK launch params authentication                          │
│  - VKUI component library                                   │
│  - VK Mini Apps Router                                      │
│  - VK hosting integration                                  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   React Application                          │
├─────────────────────────────────────────────────────────────┤
│  - VKUI-based panels (Home, Dictionary, Practice)           │
│  - VK Mini Apps Router navigation                          │
│  - VK Bridge integration                                    │
│  - Platform-specific utilities                             │
└─────────────────────────────────────────────────────────────┘
```

### 3. Shared Frontend Architecture (React)

```
┌─────────────────────────────────────────────────────────────┐
│                        App.jsx                               │
│  - Authentication state management                         │
│  - Route configuration                                      │
│  - Global providers (I18n, Theme, Modal slots)             │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│  Auth Layer   │   │  Pages Layer  │   │  API Layer    │
├───────────────┤   ├───────────────┤   ├───────────────┤
│ GoogleSignIn  │   │ HomePage      │   │ dictionaryApi │
│ googleSession │   │ DictionaryPage│   │ practiceApi   │
│ platformUser  │   │ PracticePages │   │ userApi       │
│ googleAuthStore│  │ SettingsPage  │   │ billingApi    │
└───────────────┘   │ PremiumPage   │   │ ttsApi        │
                    │ AdminPage     │   │ sttApi        │
                    └───────────────┘   └───────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│  Components   │   │    Hooks      │   │  Context     │
├───────────────┤   ├───────────────┤   ├───────────────┤
│ Ui.jsx (UI kit)│  │ useLearnLocale│   │ I18nContext   │
│ CardPickers    │   │ usePremium   │   │ SplitModal    │
│ PracticeBubble │  │ usePlatformUser│               │
│ StreamingText  │   │ useAppTheme  │   │               │
│ TTS/STT Buttons│  │ usePracticeVoice│             │
└───────────────┘   └───────────────┘   └───────────────┘
```

### 3. Backend Architecture (Node.js/Express)

```
┌─────────────────────────────────────────────────────────────┐
│                    server/index.js                           │
│                    Express API Server                        │
├─────────────────────────────────────────────────────────────┤
│  Middleware Layer:                                           │
│  - CORS configuration                                        │
│  - Security headers                                          │
│  - Rate limiting                                             │
│  - Authentication (Multi-platform)                          │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│  Auth Methods │   │  API Routes   │   │  Services     │
├───────────────┤   ├───────────────┤   ├───────────────┤
│ Google ID Token│  │ /api/user/*   │   │ LLM Client    │
│ Play App Secret│  │ /api/words/*  │   │ Dictionary    │
│ Telegram Init  │  │ /api/practice/*│  │ Practice      │
│ VK Launch Params│ │ /api/billing/*│  │ TTS/STT       │
│ Dev Header Auth│  │ /api/admin/*  │   │ Billing       │
└───────────────┘   └───────────────┘   └───────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Database Layer                            │
├─────────────────────────────────────────────────────────────┤
│  db.js - PostgreSQL access via pg library                    │
│  - User management                                           │
│  - Word/Example storage                                      │
│  - Practice sessions                                        │
│  - Billing/Premium                                           │
└─────────────────────────────────────────────────────────────┘
```

## Authentication Flow

### Platform-Specific Authentication

```
┌─────────────────────────────────────────────────────────────┐
│              Multi-Platform Authentication                   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │ Seashell Play   │  │ Seashell TG     │  │ Seashell VK  │ │
│  │ (Android)       │  │ Clean           │  │              │ │
│  ├─────────────────┤  ├─────────────────┤  ├──────────────┤ │
│  │ 1. Google Sign- │  │ 1. Telegram App  │  │ 1. VK App    │ │
│  │    In (Capacitor│  │    opens Mini   │  │    opens Mini │ │
│  │    plugin)      │  │    App          │  │    App       │ │
│  │                 │  │                 │  │              │ │
│  │ 2. Google ID    │  │ 2. Telegram     │  │ 2. VK Launch │ │
│  │    Token        │  │    initData     │  │    Params    │ │
│  │    returned     │  │    provided     │  │    provided  │ │
│  │                 │  │                 │  │              │ │
│  │ 3. Token stored │  │ 3. initData     │  │ 3. Params    │ │
│  │    locally      │  │    sent with    │  │    sent with │ │
│  │                 │  │    requests     │  │    requests  │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
│           │                    │                    │         │
│           └────────────────────┼────────────────────┘         │
│                                ▼                              │
│                 ┌──────────────────────────────┐               │
│                 │  server/index.js Auth Layer  │               │
│                 │  - tryGoogleIdTokenAuth()    │               │
│                 │  - tryTelegramInitDataAuth()  │               │
│                 │  - verifyVkLaunchParams()     │               │
│                 │  - tryPlayDevAuth() (dev)     │               │
│                 └──────────────────────────────┘               │
│                                │                              │
│                                ▼                              │
│                 ┌──────────────────────────────┐               │
│                 │  Unified User ID (vkUserId)  │               │
│                 │  - All platforms map to       │               │
│                 │    same user ID space        │               │
│                 │  - Play: 5000000000+         │               │
│                 │  - TG: Telegram user ID      │               │
│                 │  - VK: VK user ID            │               │
│                 └──────────────────────────────┘               │
└─────────────────────────────────────────────────────────────┘
```

### Platform Comparison

| Feature | Seashell Play | Seashell TG Clean | Seashell VK |
|---------|---------------|-------------------|-------------|
| **Platform** | Android (Capacitor) | Telegram Mini App | VK Mini App |
| **Authentication** | Google Sign-In | Telegram initData | VK launch params |
| **UI Library** | Custom components | Custom components | VKUI |
| **Navigation** | React Router | React Router | VK Mini Apps Router |
| **Billing** | TBD (Play Billing) | Telegram Stars | N/A |
| **User IDs** | 5000000000+ sequence | Telegram user ID | VK user ID |
| **TTS** | Capacitor plugin + server | Server only | Server only |
| **Deploy Target** | APK/AAB (Google Play) | VPS hosting | VK hosting |
| **Status** | Active development | Active development | Legacy/maintenance |

## Data Flow: Dictionary Feature

```
┌─────────────┐
│   User      │
└──────┬──────┘
       │  Enters word
       ▼
┌─────────────────────────────────────────────────────────────┐
│  DictionaryPage.jsx                                          │
│  - User inputs word in search field                          │
│  - Triggers API call to generate examples                    │
└─────────────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────┐
│  dictionaryApi.js                                            │
│  - POST /api/words with word, content locale, target lang   │
│  - Includes auth headers (Google ID token)                   │
└─────────────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────┐
│  server/index.js - POST /api/words                           │
│  - Authenticates request                                      │
│  - Checks quota/limits                                        │
│  - Calls generateWordExamples()                              │
└─────────────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────┐
│  llmClient.js - LLM Integration                               │
│  - Builds prompt based on content locale                      │
│  - Calls LLM provider (OpenRouter, GigaChat, etc.)           │
│  - Parses response into structured examples                  │
└─────────────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────┐
│  db.js - Database Storage                                    │
│  - Inserts word with examples into PostgreSQL               │
│  - Stores translations, usage notes, etc.                    │
└─────────────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────┐
│  Response to Frontend                                        │
│  - Returns word ID and generated examples                    │
│  - Frontend displays in SwipeableExamplePane                │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow: Practice Feature

```
┌─────────────┐
│   User      │
└──────┬──────┘
       │  Starts practice
       ▼
┌─────────────────────────────────────────────────────────────┐
│  PracticeHubPage.jsx                                         │
│  - User selects practice mode (chat, expert, pattern, word)  │
│  - Navigates to specific practice page                       │
└─────────────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────┐
│  Practice Pages (PracticePage, ExpertPracticePage, etc.)     │
│  - Initializes practice session via API                       │
│  - Handles user input (text or voice)                        │
│  - Streams LLM responses                                     │
└─────────────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────┐
│  practiceApi.js                                              │
│  - POST /api/practice/session (create session)               │
│  - POST /api/practice/turn (send user message)              │
│  - Includes practice level, target lang, content locale      │
└─────────────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────┐
│  server/practiceService.js                                   │
│  - Manages practice session state                            │
│  - Calls appropriate LLM service                             │
│  - Handles conversation context                             │
└─────────────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────┐
│  llmClient.js - LLM Conversation                             │
│  - Maintains conversation history                            │
│  - Streams responses chunk by chunk                          │
│  - Applies practice-specific prompts                        │
└─────────────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────┐
│  Frontend Streaming                                           │
│  - StreamingText component displays chunks                   │
│  - PracticeVoiceCell for voice input                        │
│  - TTS/STT integration for audio practice                     │
└─────────────────────────────────────────────────────────────┘
```

## Multi-Platform Support

The backend supports multiple platforms through different authentication methods:

```
┌─────────────────────────────────────────────────────────────┐
│              Multi-Platform Authentication                   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │ Seashell Play   │  │ Telegram Mini   │  │ VK Mini App  │ │
│  │ (Android)       │  │ App             │  │              │ │
│  ├─────────────────┤  ├─────────────────┤  ├──────────────┤ │
│  │ Google ID Token │  │ Telegram Init    │  │ VK Launch    │ │
│  │ X-Google-Id-    │  │ Data             │  │ Params       │ │
│  │ Token header    │  │ X-Telegram-Init- │  │ X-VK-Launch- │ │
│  │                 │  │ Data header      │  │ Params header│ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
│           │                    │                    │         │
│           └────────────────────┼────────────────────┘         │
│                                ▼                              │
│                 ┌──────────────────────────────┐               │
│                 │  server/index.js Auth Layer  │               │
│                 │  - tryGoogleIdTokenAuth()    │               │
│                 │  - tryTelegramInitDataAuth()  │               │
│                 │  - verifyVkLaunchParams()     │               │
│                 │  - tryPlayDevAuth() (dev)     │               │
│                 └──────────────────────────────┘               │
│                                │                              │
│                                ▼                              │
│                 ┌──────────────────────────────┐               │
│                 │  Unified User ID (vkUserId)  │               │
│                 │  - All platforms map to       │               │
│                 │    same user ID space        │               │
│                 └──────────────────────────────┘               │
└─────────────────────────────────────────────────────────────┘
```

## Key Features Implementation

### 1. Internationalization (i18n)
```
┌─────────────────────────────────────────────────────────────┐
│  i18n System                                                  │
├─────────────────────────────────────────────────────────────┤
│  - I18nContext provides translations                         │
│  - Message files per locale (en, ru, es, etc.)              │
│  - Content locale vs UI locale separation                     │
│  - 30+ language modules for content generation              │
└─────────────────────────────────────────────────────────────┘
```

### 2. Text-to-Speech (TTS)
```
┌─────────────────────────────────────────────────────────────┐
│  TTS System                                                  │
├─────────────────────────────────────────────────────────────┤
│  Frontend: ListenTtsButton, SpeakAloudButton                │
│  Backend: tts.js with multiple providers                     │
│  - Native Android TTS (Capacitor plugin)                     │
│  - Server-side TTS with caching (/tts/v1/...)                │
│  - Stress marking for Russian (ruaccent)                     │
└─────────────────────────────────────────────────────────────┘
```

### 3. Speech-to-Text (STT)
```
┌─────────────────────────────────────────────────────────────┐
│  STT System                                                  │
├─────────────────────────────────────────────────────────────┤
│  Frontend: PracticeVoiceCell, usePracticeVoiceInput hook    │
│  Backend: stt.js with transcription service                  │
│  - Used in practice modes for pronunciation practice        │
│  - Streaming transcription results                          │
└─────────────────────────────────────────────────────────────┘
```

### 4. Billing and Premium
```
┌─────────────────────────────────────────────────────────────┐
│  Billing System                                              │
├─────────────────────────────────────────────────────────────┤
│  Frontend: PremiumPage, usePremium hook                     │
│  Backend: billingDb.js, billingPolicy.js, entitlements.js    │
│  - Telegram Stars integration (Telegram version)             │
│  - Ad-based reward system (free users)                      │
│  - Premium grants (admin)                                    │
│  - Quota management (words, practice turns)                  │
└─────────────────────────────────────────────────────────────┘
```

## Development Workflow

### Seashell Play (Android)
```
┌─────────────────────────────────────────────────────────────┐
│  Android Development Setup                                    │
├─────────────────────────────────────────────────────────────┤
│  1. Start PostgreSQL: docker compose up -d db               │
│  2. Configure .env files (frontend + server)                │
│  3. Run dev server: npm run dev                              │
│     - Starts Vite dev server (localhost:5173)               │
│     - Starts API server (localhost:3001)                     │
│  4. Build for Android: npm run build:android                 │
│  5. Open in Android Studio: npm run android:open             │
└─────────────────────────────────────────────────────────────┘
```

### Seashell TG Clean (Telegram)
```
┌─────────────────────────────────────────────────────────────┐
│  Telegram Development Setup                                  │
├─────────────────────────────────────────────────────────────┤
│  1. Start PostgreSQL: docker compose up -d db               │
│  2. Configure .env files (frontend + server)                │
│  3. Run dev server: npm run dev                              │
│     - Starts Vite dev server (localhost:5174)               │
│     - Starts API server (localhost:3001)                     │
│  4. Build for production: npm run build                     │
│  5. Deploy to VPS: npm run deploy:prod                       │
└─────────────────────────────────────────────────────────────┘
```

### Seashell VK (VK Mini App)
```
┌─────────────────────────────────────────────────────────────┐
│  VK Development Setup                                        │
├─────────────────────────────────────────────────────────────┤
│  1. Start PostgreSQL: docker compose up -d db               │
│  2. Configure .env files (frontend + server)                │
│  3. Run dev server: npm start                                │
│     - Starts Vite dev server (localhost:5173)               │
│     - Starts API server (localhost:3001)                     │
│  4. Deploy to VK hosting: npm run deploy                    │
│  5. Configure in VK Dev Portal                               │
└─────────────────────────────────────────────────────────────┘
```

## Database Schema

```
┌─────────────────────────────────────────────────────────────┐
│  Core Tables                                                 │
├─────────────────────────────────────────────────────────────┤
│  users - Platform user accounts                              │
│  words - User dictionary entries                             │
│  examples - Generated examples for words                     │
│  word_sets - User word collections                           │
│  word_set_items - Many-to-many relationship                  │
│  practice_sessions - Practice conversation history           │
│  practice_turns - Individual practice exchanges              │
│  custom_examples - User-defined examples                     │
│  irregular_verbs - Predefined irregular verb data             │
│  billing_transactions - Payment records                      │
│  premium_grants - Premium access management                  │
└─────────────────────────────────────────────────────────────┘
```

## Security Considerations

```
┌─────────────────────────────────────────────────────────────┐
│  Security Measures                                           │
├─────────────────────────────────────────────────────────────┤
│  - Google ID token verification with Google servers          │
│  - Rate limiting on API endpoints                            │
│  - Content policy validation for user inputs                 │
│  - CORS configuration for allowed origins                   │
│  - Security headers (CSP, X-Frame-Options, etc.)            │
│  - Input validation and sanitization                         │
│  - SQL injection prevention via parameterized queries        │
└─────────────────────────────────────────────────────────────┘
```

## File Structure Summary

### Seashell Play (Android)
```
seashell_play/
├── android/              # Android Studio project (Capacitor)
├── src/                  # React frontend
│   ├── api/             # API clients
│   ├── components/      # Reusable UI components
│   ├── pages/           # Page components
│   ├── hooks/           # Custom React hooks
│   ├── i18n/            # Internationalization
│   ├── modules/         # Language-specific modules
│   ├── platform/        # Platform-specific code (Google auth)
│   └── utils/           # Utility functions
├── server/              # Node.js backend (shared)
├── public/              # Static assets
├── capacitor.config.json # Capacitor configuration
└── package.json         # Frontend dependencies
```

### Seashell TG Clean (Telegram)
```
seashell_tg_clean/
├── src/                  # React frontend
│   ├── api/             # API clients
│   ├── components/      # Reusable UI components (custom)
│   ├── pages/           # Page components
│   ├── hooks/           # Custom React hooks
│   ├── i18n/            # Internationalization
│   ├── modules/         # Language-specific modules
│   ├── platform/        # Platform-specific code (Telegram auth)
│   └── utils/           # Utility functions
├── server/              # Node.js backend (shared)
├── public/              # Static assets
└── package.json         # Frontend dependencies
```

### Seashell VK (VK Mini App)
```
seashell_tg/
├── src/                  # React frontend
│   ├── api/             # API clients
│   ├── components/      # Shared components
│   ├── panels/          # VKUI panel components
│   ├── hooks/           # Custom React hooks
│   ├── platform/        # Platform-specific code (VK auth)
│   ├── utils/           # VK-specific utilities
│   └── styles/          # VKUI custom styles
├── server/              # Node.js backend (shared)
├── public/              # Static assets
├── vk-hosting-config.json # VK hosting configuration
└── package.json         # Frontend dependencies
```

### Shared Backend Structure
```
server/ (shared across all platforms)
├── index.js             # Main Express server
├── db.js                # Database layer
├── llmClient.js         # LLM integration
├── practiceService.js  # Practice logic
├── googleAuth.js       # Google authentication
├── telegramAuth.js      # Telegram authentication
├── vkSignature.js       # VK signature verification
├── playAuth.js          # Play app authentication
├── prompts/             # LLM prompts per locale
└── [other service files]
```

This multi-platform architecture enables Seashell to provide a comprehensive language learning experience across different platforms:

- **Unified Backend**: Single Node.js/Express API serves all three platforms with shared business logic
- **Platform-Specific Frontends**: Each platform has optimized UI and authentication for its ecosystem
- **Shared Features**: Dictionary, practice, irregular verbs, TTS/STT, and billing work consistently across platforms
- **Flexible Authentication**: Supports Google Sign-In, Telegram initData, VK launch params, and dev modes
- **Database Consolidation**: All platforms share the same PostgreSQL database with unified user ID space

The architecture allows for efficient development and maintenance while providing platform-specific optimizations and native platform integration where beneficial.