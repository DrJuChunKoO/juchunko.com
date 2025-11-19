# AI Coding Agent Instructions for juchunko.com

Concise, project-specific guidance for working productively in this Astro + React + Cloudflare Workers repository.

Overview

- Astro 5 site with React islands. A Cloudflare Worker (`src/worker/index.ts`, `wrangler.jsonc`) powers the AI chat endpoint `/api/chat` and streams responses.
- Content: MDX under `src/content/{collection}/{lang}/{slug}.mdx` (collections: `act`, `manual`, `fragment`). See `src/content.config.ts` (zod schema: title, date, emoji, description, image).
- Internationalization: Locale prefix required. Use `getLangFromUrl(Astro.url)` and `useTranslations(lang)` from `src/i18n/utils.ts`. Translate keys in `src/i18n/ui.ts`.

Development & build

- pnpm install
- pnpm dev (Astro dev server at :4321)
- pnpm build (produces `./dist` for Worker assets)
- pnpm preview (preview build)
- Lint / format: `pnpm lint` / `pnpm format` (prettier only)

Worker & AI chat (most important)

- Worker implements `POST /api/chat` and uses `ai.streamText()` + `@ai-sdk/openai`. See `src/worker/index.ts` for system prompt and tools.
- Sample request body (frontend uses `DefaultChatTransport` in `src/components/AIAssistantWindow.tsx`):
  {"messages": [{"role": "user", "content": "..."}], "filename": "/zh-TW/act/nuclear-reactor-facility-control-act" }
- The `viewPage` tool maps `/en|zh-TW` routes to `src/content/{collection}/{lang}/{slug}.mdx` and fetches raw MDX from GitHub main. This can lead to differences between local dev files and the Worker’s remote view.
- DO NOT call OpenAI directly from client islands; set `OPENAI_API_KEY` as a Cloudflare secret: `wrangler secret put OPENAI_API_KEY`.

Frontend integration & patterns

- Use `DefaultChatTransport` + `useChat` from `@ai-sdk/react` for the chat UI. Include `filename: window.location.pathname` so `viewPage` can load content.
- `useReducedMotion()` may return `null` during SSR — treat as boolean: `Boolean(useReducedMotion())`.
- Keep DOM order for accessibility when animating island buttons; prefer transform & opacity only (see `Agent.tsx`, `AIAssistantWindow.tsx`).
- Use `cn()` helper (`src/lib/utils.ts`) to merge Tailwind classes.
- For content pages, filter using `post.id.startsWith(lang + '/')` to restrict results per locale.

External integrations

- `src/lib/indexCards.ts` pulls external RSS and APIs (blog, transpal, ly.govapi.tw) and normalizes data.
- `viewPage` fetches MDX from raw GitHub `main`—update that if you need the worker to read local dev files (use `wrangler dev` or develop a local mock).

Deploy & environment

- Worker entry and assets binding in `wrangler.jsonc`. `OPENAI_API_KEY` -> wrangler secret.
- Typical deploy: `pnpm build` + `wrangler publish`.
- Optional: `wrangler dev` to run the Worker locally while developing UI features.

Quick actions & samples

- Add MDX content: create `src/content/manual/zh-TW/foo.mdx` with valid frontmatter; run `pnpm build`.
- Add a translation key: update both locales in `src/i18n/ui.ts`.
- Chat curl example (if Worker is deployed):
  curl -X POST https://YOUR_DOMAIN/api/chat -H 'Content-Type: application/json' --data '{"messages":[{"role":"user","content":"Summarize this post"}], "filename":"/zh-TW/manual/reading" }'

Common pitfalls

- Worker `viewPage` uses GitHub `main` (not local), so content drift can occur.
- `z.coerce.date()` will fail on invalid date frontmatter in MDX — fix or omit the `date` field.
- Avoid direct client access to AI keys/ external LLM APIs.

If you'd like this expanded with CI rules, codeowners, or sample local worker mock scripts, tell me which area to extend.

# AI Coding Agent Instructions for juchunko.com

Quick, project-specific guidance to get productive in this Astro + React + Cloudflare Workers repository.

- Big picture: Astro 5 for routing & static content + React islands for interactive UI. A Cloudflare Worker (entry: `src/worker/index.ts`, described in `wrangler.jsonc`) provides the AI chat endpoint `/api/chat` and streams responses.
- Content model: MDX files under `src/content/{collection}/{lang}/{slug}.mdx`. There are 3 collections--`act`, `manual`, `fragment` defined in `src/content.config.ts`. Frontmatter schema: `title`, `date` (coerced), optional `emoji/description/image`.
- i18n: Locale prefixing in routes is mandatory: `/en/...` or `/zh-TW/...`. Use the helpers `getLangFromUrl(Astro.url)` and `useTranslations(lang)` from `src/i18n/utils.ts`. Keep keys in `src/i18n/ui.ts`.

Dev & build shortcuts:

- pnpm install
- pnpm dev (Astro dev server)
- pnpm build (generate `dist/` for worker assets)
- pnpm preview
- lint/format: `pnpm lint` / `pnpm format` (prettier)

Worker & AI chat notes:

- The Worker implements POST /api/chat and streams text using `ai.streamText()` and `@ai-sdk/openai` in `src/worker/index.ts`.
- Sample payload (frontend uses `DefaultChatTransport` in `src/components/AIAssistantWindow.tsx`):
  {"messages":[{"role":"user","content":"..."}],"filename":"/en/act/slug"}
- System prompt & tools live in the worker. The worker includes a `viewPage` tool that maps `/{lang}/{contentType}/{slug}` to `src/content/{contentType}/{lang}/{slug}.mdx` and fetches raw MDX from the GitHub `main` branch. This is how AI reads page content — not via local file system in production.
- DON'T call external OpenAI APIs from client-side islands; the Worker is the single integration point. Keep OpenAI API key in Cloudflare secrets (e.g., `wrangler secret put OPENAI_API_KEY`).
- Dev testing: use `pnpm dev` for the site; to run Worker endpoints locally use Cloudflare `wrangler dev` (install globally or via npm) and set secrets as required.

UI & component guidance:

- React islands (AIAssistantWindow / Agent / VoiceReaderWindow) use `motion/react` (Framer Motion) and `useReducedMotion()`; treat `null` as false during hydration.
- Use `cn(...class)` from `src/lib/utils.ts` to merge Tailwind classes.
- Use `DefaultChatTransport` and `useChat` from `@ai-sdk/react` in interactive components. Include `filename: window.location.pathname` (the worker uses that to run `viewPage`).
- Do not mutate `messages` directly; use `sendMessage()` provided by the `useChat` hook.
- Add quick prompts to `src/components/AIAssistantWindow.tsx`'s `quickPrompts` array; each item is {text,prompt}.

Patterns & quirks:

- Always maintain language prefix in new routes / pages; update getStaticPaths functions under `src/pages/[lang]/**` to ensure static generation per locale.
- Content filters use `post.id` with locale prefix; for example: `posts.filter(p => p.id.startsWith(lang + '/'))`.
- Frontmatter `date` uses `z.coerce.date()` and will throw on invalid date frontmatter at build time.
- Avoid layout thrash and reflow in animations: prefer transform & opacity only (see `Agent.tsx`/`AIAssistantWindow.tsx`).

External integrations & data sources:

- Index page combines several data sources: internal MDX (`src/content`), external RSS (`blog.juchunko.com`, `transpal.juchunko.com`), and public APIs (`ly.govapi.tw`) in `src/lib/indexCards.ts`.
- `viewPage` uses raw GitHub raw fetch; be aware of drift between local files and GitHub `main` when testing with the Worker.

Deploy hints:

- Cloudflare `wrangler.jsonc` defines worker entrypoint and `assets.binding: ASSETS`. `OPENAI_API_KEY` must be set via `wrangler secret put OPENAI_API_KEY` in the appropriate environment.
- After update: `pnpm build` -> `wrangler publish`.

Short examples:

- Add a content item: `src/content/manual/zh-TW/new-topic.mdx` with proper frontmatter (title/date), then `pnpm build`.
- Add translation: add keys in `src/i18n/ui.ts` for both locales; use `const t = useTranslations(lang)`.
- Chat sample request for testing with curl (if Worker is live):
  curl -X POST https://YOUR_DEPLOYED_DOMAIN/api/chat -H 'Content-Type: application/json' --data '{"messages":[{"role":"user","content":"Summarize this post"}], "filename":"/zh-TW/manual/reading" }'

Pitfalls & warnings:

- `viewPage` fetches from GitHub `main`—a mismatch between local dev files and remote files may lead to confusing AI answers in production.
- Do not remove the locale prefix or rewrite route structure — the codebase assumes it widely.
- `useReducedMotion()` might return null server-side — handle via Boolean casting.

If something is unclear or you'd like the instructions expanded to cover CI, tests, or local Worker mocks, tell me which area to expand.

# AI Coding Agent Instructions for `juchunko.com`

Concise, project-specific guidance for working productively in this Astro + React + Cloudflare Workers codebase. Focus on existing patterns—do not invent new abstractions unless clearly needed.

## Overview & Architecture

- Framework: Astro 5 with hybrid Astro `.astro` pages/layouts and React 19 islands (`@astrojs/react`). Tailwind CSS 4 via Vite plugin; icons via `unplugin-icons`.
- Content system: `src/content.config.ts` defines three MDX collections (`act`, `manual`, `fragment`) with identical schema (title/date/emoji/optional description/image). Localized content stored under `src/content/{collection}/{lang}/...`.
- Internationalization: Astro i18n configured in `astro.config.mjs` with locales `zh-TW` (default) and `en`. URL structure always prefixed with locale (`/zh-TW/...` or `/en/...`). Utility functions in `src/i18n/utils.ts`; translation keys in `src/i18n/ui.ts`.
- Pages: Dynamic language scoped routes in `src/pages/[lang]/**`. The home page (`src/pages/[lang]/index.astro`) loads collections filtered by `post.id.startsWith(lang + '/')`.
- Layout & Styling: Global layout `src/layouts/Layout.astro` plus `PageLayout.astro` (not shown here). Global styles in `src/styles/global.css`. Use Tailwind utility classes; merge class names with `cn()` helper in `src/lib/utils.ts`.
- Interactive features: React components providing UI islands (e.g. `Agent.tsx`, `AIAssistantWindow.tsx`, `LanguageSelector.tsx`). Motion animations via `motion/react` (Framer Motion v12). Keep DOM order for accessibility; use `AnimatePresence` + `Variants` for enter/exit symmetry.
- AI Chat API: Cloudflare Worker in `src/worker/index.ts` exposes `POST /api/chat`. Streams responses using `@ai-sdk/openai` + `ai` package tools. System prompt localized & page-aware. Frontend integrates through `useChat` with `DefaultChatTransport` (`AIAssistantWindow.tsx`).
- Deployment: Built site assets served by Cloudflare Workers (see `wrangler.jsonc` `assets.directory: ./dist`). Worker entry: `main: ./src/worker/index.ts`.

## Key Conventions

- Content lookup: Pages derive language from URL via `getLangFromUrl(Astro.url)`; do not rely on browser locale.
- Filtering collections: Filter by `post.id.startsWith(lang + '/')` after `getCollection("act")` etc. Maintain descending date sort using `b.data.date.valueOf()`.
- Translation access: Obtain closure `t = useTranslations(lang)` then call `t("home.title")`. Fallback to default language is built-in; don't reimplement.
- Time formatting: Use `timeAgo(dateString, lang)` from `src/lib/utils.ts` for relative timestamps; do not duplicate logic.
- React island positioning: Windows (`AIAssistantWindow`, `VoiceReaderWindow`, `PhoneCallInterface`) anchored with `motion.div` and a `useMotionValue` for `bottom` distance reacting to footer visibility.
- Animation: Respect `useReducedMotion()` for accessibility; variants generated by functions to avoid SSR/hydration issues.
- Language switching (client): `LanguageSelector.tsx` rewrites the leading locale segment and reloads. Preserve rest of path, only replace initial `/(en|zh-TW)`.
- System prompt additions: If adjusting tools/prompts, keep core constraints (concise answers, language match, page guarding against hallucination).

## Working with the AI Chat

- API contract: Request body `{ messages: ModelMessage[], filename: string }`; server derives system prompt & streams SSE. Frontend sends `{ text: string }` per message via `sendMessage`.
- Tool: `viewPage` fetches raw MDX from GitHub `main` branch. Route parsing: `/{lang}/{contentType}/{slug}` -> `src/content/{contentType}/{lang}/{slug}.mdx`.
- When modifying Worker, ensure CORS headers remain and `Content-Type: text/event-stream` for streaming.

## Adding Content

1. Create MDX in `src/content/<collection>/<lang>/<slug>.mdx`.
2. Ensure frontmatter matches schema: `title`, `date`, optional `emoji`, `description`, `image`.
3. No additional registration needed—`getCollection()` auto-picks it.
4. For cross-language parity, mirror slug names across `en` and `zh-TW` where applicable.

## Adding Translations

- Add new keys consistently to both locales in `src/i18n/ui.ts`. If a key is missing in a locale, fallback returns default language value—verify UI expectations.

## Typical Commands

```sh
pnpm install        # install deps
pnpm dev            # start Astro dev server (default port 4321)
pnpm build          # output to dist/ for worker assets
pnpm preview        # local preview of production build
```

## Extension / Refactor Guidelines

- Prefer extending existing patterns (e.g., replicate collection schema if adding new content type) rather than inventing new global state.
- Keep Node APIs / OpenAI calls confined to the Worker; do not call external LLM APIs directly from React islands.
- Maintain locale prefix in any new routes; update `getStaticPaths()` for language-specific pages.
- For new streaming tools, follow the structure of existing `tool({ description, inputSchema, execute })` usage.

## Pitfalls & Edge Cases

- Missing or malformed route for `viewPage` tool returns an error string—handle gracefully client-side if consumed.
- `useReducedMotion()` may return `null` during hydration—cast to boolean as in `Agent.tsx`.
- Ensure `date` in frontmatter parses correctly (`z.coerce.date()`); invalid date strings will throw at build time.
- Avoid direct mutation of `messages` from `useChat`; use provided `sendMessage`.

## Safe Changes Examples

- Adding a new translation key: edit both locale objects in `ui.ts` and use via `t("new.key")`.
- Adding a new AI quick prompt: extend `quickPrompts` array in `AIAssistantWindow.tsx`; ensure uniqueness to avoid filter suppression.
- Adding new content: create MDX file; verify with `pnpm build`—no code change required.

## Do Not

- Remove locale prefixing or fallback logic.
- Introduce blocking synchronous operations inside Worker streaming loop.
- Hardcode asset paths without using existing directory conventions.

Feedback welcome—request clarifications if any section seems incomplete or if new patterns emerge.
