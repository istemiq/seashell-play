---
name: trainer-lessons
description: Create a new Beginner trainer lesson (word cards with character art, choice steps, writing) in Seashell — covers data files, UI registration, i18n, server lesson registry, LLM example generation, and card artwork.
---

# Creating a trainer lesson

Lessons live in BOTH repos and must stay identical:

- `C:\Users\Пайчармик\seashell_play` — Android/Play app + shared backend (edit here first)
- `C:\Users\Пайчармик\seashell_tg_clean` — Telegram Mini App (port by copying files; page export is `TextReaderPage`-style renamed only where it already differs)

Reference lesson to copy from: `pronouns-en` (`src/data/pronounTrainerEn.js`, `src/pages/PronounTrainerPage.jsx`).

## Curriculum rule (enforced)

Every new lesson may use ONLY words from previous lessons plus its own new words.
This is enforced by `allowedTrainerWords()` / the validator in `server/trainerGenerator.js`
against `server/trainerLessons.js` — lesson order in `TRAINER_LESSONS` defines the cumulative
vocabulary. Put new lessons at the END of the array.

## Steps

### 1. Content design

- Choose `lessonId` like `<topic>-en` (e.g. `colors-en`, `food-en`).
- Word list: ~10-15 words. Must respect the cumulative-vocab rule — new lesson introduces
  new words, sentences may reuse anything already taught.
- Contrast axes: pairs of forms the learner picks between in a `before ___ after` frame
  (like `i-me`, `he-him`). Each axis needs a wrong/right option pair with semantic tag keys.

### 2. Client files (in seashell_play)

- `src/data/<topic>TrainerEn.js` — copy `pronounTrainerEn.js` structure:
  `*_WORDS_EN` (`{id, word, trKey}`), `*_STEPS_EN` (hardcoded choice steps),
  `*_AXES_EN` (templates for server-generated frames), `<topic>GeneratedSteps(frames)`.
- `src/pages/<Topic>TrainerPage.jsx` — copy `PronounTrainerPage.jsx`, swap the imports,
  `LESSON_ID`, data arrays, `wordImageSrc` path and progress keys
  (`seashell.trainer.<topic>.en.*`).
- `src/App.jsx` — lazy import + `<Route path="trainers/<topic>">`.
- `src/pages/TrainersHubPage.jsx` — add tile/`Cell` under the Beginner section.
- i18n: add keys ONLY to `src/i18n/messages/en.js` (required) and `ru.js` (optional):
  `trainers.<topic>`, `trainer.word.*` translations, `trainer.<topic>.axis*`,
  `trainer.<topic>.sit*`. Other 9 locales fall back to English — do NOT touch them.
  Run `node scripts/check-locales.mjs` after.

### 3. Server (in seashell_play/server)

- Add the lesson object to `TRAINER_LESSONS` in `server/trainerLessons.js`:
  `id`, `targetLang`, `level: 'beginner'`, `newWords`, `extraForms`,
  `carrierWords`, `functionWords`, `wordForms`, `axes` (`{id, target, wrong}`),
  `framesPerAxis`.
- Deploy API: `node scripts/deploy-api-vps.mjs`.
- Generate examples once on the VPS (they are shared by all users, no re-generation):
  `cd /root/seashell-server-new && node scripts/generate-trainer-lesson.mjs <lessonId>`
  (`--dry-run` to inspect the prompt first, `--force` to regenerate).

### 4. Card artwork — `public/trainer/<topic>/<word-id>.png` (both repos)

Main character — the recurring sketched girl (keep identical across all cards):
see `character-reference.jpg` in this skill folder — pencil sketch on cream torn-edge
paper, loose bun hairdo, t-shirt and jeans, expressive eyes, playful confident look.

Prompt template (Gemini image generation, one card per request, reference attached):

```
Same girl, same pencil-on-sketchbook-paper style, same torn paper patch.
Now she is <action or scene that reads as the target word instantly>.
Keep her face, hairstyle, outfit and line weight identical to the reference.
Simple readable pose, one clear gesture a language learner would decode instantly.
Square 1:1.
```

Reference-generation prompt for a NEW character sheet (only if a different
character/style is ever needed):

```
A pencil-sketch character sheet on warm cream sketchbook paper with slightly torn
edges — the paper itself is part of the artwork. Loose expressive graphite strokes,
visible hatching, soft smudged shading. Character centered, generous paper margin.
Square 1:1.
```

- Save as `<word-id>.png` (~1024×1024) into `public/trainer/<topic>/` in BOTH repos.
- The paper patch is opaque — dark theme needs no variant.
- Generation path: Gemini web/app with `character-reference.jpg` attached as the
  reference image, or Gemini image API if a `GEMINI_API_KEY` is available — reuse
  the same template, attaching the reference as inline image input.
- A `<id>` that has no natural girl-action (objects, colors, weather) may depict
  the object directly, still in the same paper-patch style — optionally with the
  girl pointing at it.

### 5. Port to seashell_tg_clean

Copy: the data file, the page (keep export name if TG naming differs), images, i18n
edits. Route + hub registration must mirror the play repo. TG and play versions of
the page are kept textually identical — `diff` before/after to confirm only intended
lines differ.

### 6. Verify & ship

- `npx eslint` on every changed file (warnings that pre-date the change are fine).
- `node scripts/check-locales.mjs` (play repo).
- `npm run build` in both repos; for play also `npx cap sync android` + Gradle
  `assembleDebug` + `adb install`.
- TG deploy: `npm run deploy:tg-web`; if the script stalls, tar `build/`, scp to
  `root@193.41.4.206:/tmp/tg-web.tar.gz`, unpack into `/var/www/seashell-tg`.
- Tell the user to fully close and reopen the Mini App (bundle caching).
