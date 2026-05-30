# VOID · Resume Intelligence Terminal — Full Project Context

> Complete handoff document. Captures the entire build history: what's done, what
> issues arose, what was fixed, and what's still pending. Last updated mid-session
> after the "WebGL / scoring / doodles" fix round.

---

## 1. What this project is

An **AI-powered résumé analyzer** with a "Void Bioluminescence" deep-ocean-terminal
theme. A user drops a résumé, gets an ATS score, compares it to a job description,
and chats with an AI coach about it.

- **Location:** `D:\Internship Task 3`
- **Frontend:** React 18, Vite 5, TypeScript (strict), Tailwind 3, Framer Motion 11, Recharts, Zustand
- **Backend:** Express 4, Zod, Multer, pdf-parse, mammoth (Node, run via `tsx`)
- **AI:** OpenAI GPT-4o via OpenAI SDK / LangChain — **optional**
- **Ports:** client `5173`, API `8787` (Vite proxies `/api/*` → 8787)

### Dual-mode design (important)
Every AI endpoint has **two modes**:
- **With a valid `OPENAI_API_KEY`** → real GPT-4o (structured output for score/match, token streaming for chat).
- **Without a key** → deterministic local engines (heuristic scoring, keyword matching, intent-based coach).

So the app is fully functional with no key; a key just upgrades the intelligence.

---

## 2. Status at a glance

| Module | Feature | Build | Verified |
|--------|---------|-------|----------|
| 1 | 3D Drop Zone & Parser (`/api/parse`) | ✅ | ✅ API + browser screenshot |
| 2 | Score Matrix dashboard (`/api/score`) | ✅ | ✅ API + browser (live 76/100) |
| 3 | Semantic Matcher (`/api/match`) | ✅ | ✅ API + browser (21 pills) |
| 4 | AI Coach chatbot (`/api/chat`, SSE) | ✅ | ✅ curl stream + browser |
| — | Canvas doodle background | ✅ | ✅ browser screenshot |
| — | Loading screen (3–4s logo) | ❌ | **PENDING — deferred by user** |

**Overall: all 4 modules built and verified. One small fix (API-key guard) applied
but not yet re-verified. One requested feature (loading screen) not started.**

---

## 3. What's DONE (by module)

### Module 1 — 3D Quantum Drop Zone & Parser ✅
- `src/components/DropZone/*`: glass drop deck with 3D mouse-tilt parallax (3 depth
  layers), drop choreography (card flip → scan beam → 24-particle canvas burst →
  staggered terminal log), success state now showing **parsed stats (words / pages /
  tokens)** and filename, keyboard support, reduced-motion guards.
- `server/routes/parse.ts`: Multer memory upload (≤5MB), PDF (pdf-parse) / DOCX
  (mammoth) / TXT extraction, word & page count, token estimate (`words × 1.35`).
- **Verified:** valid TXT → correct counts; unsupported type → 400; no file → 400;
  empty / sub-threshold → 422; live browser screenshot of the deck.

### Module 2 — Scroll-Linked Score Matrix ✅
- `src/components/ScoreMatrix/*`: count-up SVG ring (spring 80/12), 4 sub-score
  Recharts radial gauges, scroll-linked fly-in/out (scale + blur), card cascade,
  idle breathe, **empty-state handling for strengths/issues**.
- `server/routes/score.ts` + `server/lib/scoreEngine.ts`: deterministic scorer
  (impact, keywords, formatting, completeness from action verbs / quantified results
  / sections / contact / length / JD overlap) + GPT-4o structured-output path.
- **Verified:** strong résumé 72–76, weak 47, empty → 400, malformed JSON → clean
  400; browser DOM showed live 76/100 + summary.

### Module 3 — Split-Screen Semantic Matcher ✅
- `src/components/SemanticMatcher/*`: two-panel layout, **magnetic keyword pills**
  (cursor repulsion), matched/partial/missing classification with ✓/≈/✗ icons,
  scroll-sync (one IntersectionObserver lights the matching pill), AnimatePresence
  pill enter/exit, résumé-highlight cards, semantic %.
- `server/routes/match.ts` + `server/lib/matchEngine.ts` + `server/lib/textUtils.ts`
  (shared tokeniser/stemmer): keyword overlap + stem/substring "partial" + top-8
  highlight extraction + GPT-4o path.
- **Verified:** API returned correct matched/partial/missing + 8 highlights + score;
  browser DOM confirmed exactly 21 pills (5+3+13), 8 highlight cards, live score.
- **NOTE:** The JD is a **manual paste field** — empty until the user pastes a job
  description. That is expected behaviour, not a bug.

### Module 4 — AI Coach Chatbot ✅
- `src/components/Chatbot/*`: floating pill that morphs into a 420×560 panel,
  6 macro prompts, **token streaming** with thinking-dots, auto-scroll, abortable.
- `server/routes/chat.ts` (SSE) + `server/lib/coachFallback.ts`: builds a
  résumé-aware system prompt; streams real GPT-4o, or a deterministic coach that
  answers from the actual computed scores/issues/missing-keywords.
- **Verified:** curl SSE stream produced context-aware answers (used real 72/100,
  completeness 42) + `[DONE]`; browser DOM confirmed streamed bubbles.
- **NOTE:** Without a real key it uses the heuristic coach (intent-matched, not
  general chat). With a key it behaves like GPT-4o.

### Cross-cutting (DONE)
- Zustand stores (`resumeStore`, `toastStore`), unified toast system, custom
  bio-green crosshair cursor, error boundaries around lazy sections, Tailwind
  "Void Bioluminescence" theme, code-splitting (Recharts + Score Matrix lazy).
- **Canvas-2D `LivingBackground`** (drifting plankton, glowing orbs, constellation
  lines, slow "creature" doodles) — replaced the Three.js background.

---

## 4. Issues encountered — and how they were RESOLVED ✅

| # | Issue | Root cause | Fix |
|---|-------|-----------|-----|
| 1 | Résumé text could be silently emptied | A sanitiser regex matched spaces, not null bytes | Rewrote with `String.fromCharCode(0)` split/join |
| 2 | Multer type error | `fileFilter` cb arity | Used `cb(null, true)` / `cb(err)` form |
| 3 | API server bound to **5173**, broke `/api` proxy | Server read `process.env.PORT`, which the dev harness set to the frontend port | Dedicated **`API_PORT`** (default 8787) |
| 4 | Malformed requests leaked raw 500 errors | Generic error handler | Hardened handler → clean 400 "Malformed JSON body." |
| 5 | One failed lazy chunk blanked the whole app | No error boundary | Added `ErrorBoundary` around lazy sections |
| 6 | Vite reload cascade broke lazy imports in dev | Heavy deps discovered mid-session | `optimizeDeps.include` |
| 7 | Keyword tokens kept trailing punctuation / dupes | Token regex | Trim edge punctuation in `tokenize` |
| 8 | **Chat stream stopped after 1 token** | `req.on("close")` fires when the POST body is read | Switched to `res.on("close")` + `writableFinished` |
| 9 | `coachFallback` build error | `as const` tuple lacked `.sort` | Typed as `[string, number][]` |
| 10 | **"WebGL failed to render"** (your screenshot) | `@react-three/drei` dynamic-import failing under Vite dev dep-optimization | **Removed Three.js/fiber/drei entirely**; replaced with Canvas-2D `LivingBackground` |
| 11 | **Different score on same résumé** | (a) GPT-4o temperature; (b) stale state lingering between uploads | Set score/match `temperature: 0`; clear stale analysis on new résumé |
| 12 | **Empty "TOP ISSUES" card** (your screenshot) | A strong résumé has zero issues → bare card | Added empty states for issues & strengths |
| 13 | Lots of empty space / wanted moving doodles | — | Canvas doodle background + parsed-stats in success card |
| 14 | Scoring stuck on "Analysing…" | `.env` placeholder key `sk-REPLACE_ME` made the server attempt OpenAI → 401 retries | **Just fixed:** blank `.env` key + `hasOpenAIKey()` guard validating key format |

### Environment / tooling friction (not app bugs, but consumed effort)
- The preview harness injects `PORT=5173`, repeatedly collided with the API server
  (drove fix #3) and spawned orphaned `node` processes that squatted on 8787.
- The headless preview browser's **GPU compositor wedged** after repeated WebGL/drei
  failures → screenshots timed out for a while. Removing WebGL (#10) fixed this; clean
  screenshots now work.

---

## 5. What's PENDING / still open ⚠️

1. **Re-verify fix #14 (API-key guard).** The `hasOpenAIKey()` guard + blank `.env`
   were applied but the last `typecheck` / runtime check was interrupted. Need to
   confirm scoring is instant again (heuristic) and that a real key still routes to
   GPT-4o. *(Low risk — straightforward edits.)*

2. **Loading screen — NOT STARTED (deferred by you).** You asked for a first-load
   page with an interesting logo that shows for ~3–4s. This was intentionally left
   for after the current fixes.

3. **Chatbot "like OpenAI".** Working as designed in heuristic mode; to get true
   conversational GPT-4o the user must add a valid `OPENAI_API_KEY`. (Not a bug.)

4. **Job description discoverability (optional polish).** The empty JD field confused
   you — could add a clearer hint/affordance so it's obvious you paste a JD there.

5. **Unused dependency `d3`** still in `package.json` (never used). Optional cleanup.

### Not yet verified after recent changes
- Full `npm run typecheck` and `npm run build` **after** the `hasOpenAIKey` edits.
- End-to-end browser pass of Module 3 (paste JD → pills) and Module 4 (chat) on the
  current build (earlier verifications predate the latest fixes).

---

## 6. How to run / configure

```bash
npm install
npm run dev          # client :5173 + API :8787
# open http://localhost:5173
```

### Add an OpenAI key (enables real GPT-4o)
Edit `.env` in the project root and paste your key after the `=`:
```
OPENAI_API_KEY=sk-proj-your-real-key-here
```
Then restart `npm run dev`. Leave it blank to use the built-in deterministic engines.
Get a key at https://platform.openai.com/api-keys.

---

## 7. Key files map

```
src/
  App.tsx                         shell, lazy ScoreMatrix, scroll ref
  components/
    Background/LivingBackground.tsx   Canvas-2D doodle background (replaces WebGL)
    DropZone/*                    Module 1 UI + useFileParser
    ScoreMatrix/*                 Module 2 UI + useScoreEngine
    SemanticMatcher/*             Module 3 UI + useMatchEngine
    Chatbot/*                     Module 4 UI + useChat (SSE consumer)
    Cursor/CustomCursor.tsx, Toast/ToastViewport.tsx, common/ErrorBoundary.tsx
  store/resumeStore.ts, store/toastStore.ts
  api/parseClient, scoreClient, matchClient, chatClient.ts
server/
  index.ts                        Express app, CORS, rate-limit, error handler
  routes/parse, score, match, chat.ts
  lib/extractText, scoreEngine, matchEngine, textUtils, coachFallback, ai.ts
  schemas.ts                      all Zod request/response schemas
```
