# VOID · Resume Intelligence Terminal

**🔗 Live site:** [void-resume-analyzer.vercel.app](https://void-resume-analyzer.vercel.app) — scoring and matching use the built-in engines; no AI key required

An AI-powered résumé analyzer with a *Void Bioluminescence* interface — a deep-ocean intelligence terminal. React + Vite + Three.js front end, Express + Zod back end.

> **Status:** All four modules are built and verified — 3D Quantum Drop Zone & Parser, Scroll-Linked Score Matrix, Split-Screen Semantic Matcher, and the Floating AI Coach.

## Stack

| Layer    | Tech |
|----------|------|
| Frontend | React 18, Vite 5, Tailwind 3, Framer Motion 11, @react-three/fiber + drei, Recharts |
| Backend  | Express 4, Multer, pdf-parse, mammoth, Zod |
| AI       | OpenAI GPT-4o (optional) via the OpenAI SDK / LangChain structured output |

## AI is optional — it works without a key

Every analysis endpoint runs in one of two modes:

- **With `OPENAI_API_KEY`** → real GPT-4o (structured output for scores/match, token streaming for chat).
- **Without a key** → a deterministic, résumé-specific engine (heuristic scoring, keyword matching, and a coach that streams advice built from your actual computed analysis).

So the whole app is fully functional out of the box; adding a key simply upgrades the intelligence.

## Getting started

```bash
npm install
cp .env.example .env        # optional: add OPENAI_API_KEY to enable GPT-4o
npm run dev                 # client :5173 + API :8787 (concurrently)
```

Open http://localhost:5173 → drop a résumé, scroll through the score and matcher, and open the coach (bottom-right).

## Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Run client + API together |
| `npm run dev:client` / `dev:server` | Run either side alone |
| `npm run typecheck` | Strict typecheck (client + server) |
| `npm run build` | Typecheck + production client build |

## Modules

| # | Module | What it does |
|---|--------|--------------|
| 1 | **Drop Zone & Parser** | 3D-tilt glass drop deck, scan-beam + particle drop choreography, terminal log. Parses PDF/DOCX/TXT → text, word/page count, token estimate. |
| 2 | **Score Matrix** | Scroll-linked ATS dashboard: count-up SVG ring + 4 sub-score radial charts, fly-in/out, idle breathe. |
| 3 | **Semantic Matcher** | Split-screen résumé↔JD: matched/partial/missing keyword pills (magnetic cursor), scroll-synced résumé highlights, semantic score. |
| 4 | **AI Coach** | Floating chat that morphs open, streams résumé-aware coaching token-by-token, with macros + thinking indicator. |

## API

```
POST /api/parse   (multipart: file)  → { text, wordCount, pageCount, fileType, tokenEstimate }
POST /api/score   { resumeText, jobDescription? } → { overall, impact, keywords, formatting, completeness, summary, topIssues, topStrengths }
POST /api/match   { resumeText, jobDescription }  → { matched, missing, partial, resumeHighlights, semanticScore }
POST /api/chat    { messages, context }           → text/event-stream (SSE tokens, `data: [DONE]`)
GET  /api/health  → { ok, ts }
```
All errors share one shape: `{ errors: [{ code, message }] }`.

## Environment

See `.env.example`: `OPENAI_API_KEY` (optional), `API_PORT`, `MAX_FILE_SIZE_MB`, `RATE_LIMIT_RPM`, `ALLOWED_ORIGINS`.

## Notes

- **Performance:** initial JS chunk ~94 KB gzipped (heavy/below-the-fold work — Three.js, Recharts, each module — is code-split into async chunks). WebGL caps `devicePixelRatio` at 1.5.
- **Accessibility:** `prefers-reduced-motion` honoured throughout, keyboard-operable drop zone, ARIA labels on score rings and the chat stream, colour never the sole signal (pills also carry ✓/✗/≈).
- **Resilience:** error boundaries isolate each lazy section; all AI calls degrade gracefully to deterministic engines.
