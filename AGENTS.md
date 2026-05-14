# AGENTS.md

Guide for coding agents working in `juchunko.com`.
This file consolidates the useful project rules from `.github/copilot-instructions.md` and current repository conventions.

## Rule Sources

- Copilot instructions exist in `.github/copilot-instructions.md`; use this file as the cleaner agent-facing version.
- No Cursor rules were found in `.cursorrules` or `.cursor/rules/`.
- Use `pnpm` for package-manager commands in this repository.

## Project Skills

- Project-local agent skills live under `.agents/skills/<name>/SKILL.md`.
- Use `.agents/skills/juchunko-article-editor/SKILL.md` when creating, editing, translating, localizing, or structurally improving MDX content under `src/content/{act,manual,fragment}`.
- The article editor skill contains the project terminology dictionary, bilingual article rules, existing content map, reusable MDX component guidance, and topic gaps to consider before writing new pages.
- When a task is primarily article/content work, read the skill before editing content and follow its bilingual `zh-TW`/`en` slug parity, frontmatter, component, and validation rules.

## Repository Snapshot

- Stack: Astro 5, React 19 islands, TypeScript, Tailwind CSS 4, Hono, Cloudflare Workers.
- Worker entrypoint: `src/worker/index.ts`.
- Static build output: `dist/`.
- Content lives in `src/content/{collection}/{lang}/{slug}.mdx`.
- Collections are `act`, `manual`, and `fragment`, defined in `src/content.config.ts`.
- Locales are `zh-TW` and `en`, and routes stay locale-prefixed.

## Core Commands

```sh
pnpm install
pnpm dev
pnpm build
pnpm preview
pnpm lint
pnpm format
```

- `pnpm dev`: start the Astro dev server.
- `pnpm build`: build the static site into `dist/` for Worker assets.
- `pnpm preview`: preview the production build locally.
- `pnpm lint`: Prettier check only. There is no ESLint script.
- `pnpm format`: run Prettier write across the repo.

## Test Commands

```sh
pnpm test
pnpm exec tsx --test src/lib/homepage.test.ts
pnpm exec tsx --test src/components/news-page-motion.test.ts
pnpm exec tsx --test src/lib/homepage.test.ts --test-name-pattern "selectFeaturedEntries"
pnpm exec tsx --test src/components/news-page-motion.test.ts --test-name-pattern "opens panel"
```

- The package test script is `tsx --test "src/**/*.test.ts"`.
- To run one test file, use `pnpm exec tsx --test path/to/file.test.ts`.
- To run one named test, add `--test-name-pattern "..."`.
- Do not rely on `pnpm test -- path/to/file.test.ts`; the hard-coded glob still runs the broader suite.

## Validation Commands

```sh
pnpm exec prettier --check <changed-files>
pnpm exec tsx --test <relevant-test-file>
pnpm build
```

- For docs-only changes, a Prettier check is usually enough.
- For UI, Worker, routing, or content-schema changes, run a focused test and then `pnpm build`.

## Architecture Notes

- Astro handles routes, layouts, content rendering, and static generation.
- React is used for interactive islands under `src/components/**`.
- Worker API routes live under `src/worker/routes/api/**`.
- Chat streaming is implemented in `src/worker/routes/api/chat.ts`.
- `wrangler.jsonc` binds static assets from `dist/` and points Worker execution at `src/worker/index.ts`.
- Reuse existing route and content patterns before inventing new abstractions.

## Code Style

- Keep imports ordered as: external packages, project aliases, then relative imports.
- Prefer `@/` imports for `src/*` when they improve clarity, but do not churn existing `src/...` absolute imports just for consistency.
- Use `import type` for type-only imports when practical.
- Prettier is the formatting authority.
- `.prettierrc` requires tabs, double quotes, trailing commas, and `printWidth: 140`.
- `prettier-plugin-tailwindcss` sorts Tailwind classes, and `prettier-plugin-astro` formats Astro files.
- `tsconfig.json` extends `astro/tsconfigs/base` and enables `strictNullChecks`.
- Honor nullability instead of suppressing it.
- Prefer narrow unions such as `"en" | "zh-TW"` over loose strings.
- Avoid new `any` unless it is a narrow boundary type and clearly justified.
- Model tool inputs and content schemas with `zod`.
- Components, interfaces, and exported types use `PascalCase`.
- Functions, variables, and helpers use `camelCase`.
- Utility and test file names tend to use `kebab-case`, and tests end in `.test.ts`.
- Translation keys are dotted strings like `home.description`.

## Content And i18n

- Derive locale from the route with `getLangFromUrl(Astro.url)`.
- New `src/pages/[lang]/**` routes usually need `getStaticPaths()` covering both locales.
- Locale filtering commonly uses `post.id.startsWith(lang + "/")`.
- Keep MDX frontmatter aligned with `src/content.config.ts`.
- `date` uses `z.coerce.date()`, so invalid date strings fail builds.
- Mirror slugs across `zh-TW` and `en` when content is intended to be bilingual.
- Add translation keys to both locales in `src/i18n/ui.ts`.
- Use `const t = useTranslations(lang)` and then `t("key")`.
- Do not duplicate locale fallback logic; `useTranslations()` already provides fallback behavior.
- Do not ship new user-facing copy in only one language unless the task explicitly requires it.

## React And UI

- Prefer small functional components with local props typing.
- Use `cn()` from `src/lib/utils.ts` to merge Tailwind classes.
- Preserve DOM order for accessibility when animating UI.
- Prefer transform and opacity animations over layout-shifting motion.
- `useReducedMotion()` may be `null` during SSR or hydration; coerce with `Boolean(...)` or `?? false` before boolean logic.
- Existing client chat uses `useChat` with `DefaultChatTransport`; follow that pattern instead of custom fetch state.

## Visual Style Guidance

- Match existing site UI before introducing a new visual treatment.
- For article callouts, resource cards, and download blocks, align with `src/components/CardLink.astro`.
- Prefer neutral black/white/gray tones as the default visual language.
- Use subtle borders, `rounded-lg`, and soft background contrast instead of strong color fills.
- Avoid decorative shadows for new article card patterns unless the surrounding component already depends on them.
- Favor hover outlines and background shifts over shadow-heavy hover effects.
- Keep card content compact: small title, muted metadata, short descriptive copy.
- Use accent colors sparingly and only when the surrounding page already uses them intentionally.

## AI Chat And Worker Rules

- Keep LLM calls on the Worker side; do not call providers directly from client components.
- `POST /api/chat` streams responses from the Worker.
- Include `filename: window.location.pathname` in chat requests so Worker tools can inspect the current page.
- Keep Worker streaming behavior intact when editing `src/worker/routes/api/chat.ts`.
- Define tool inputs explicitly with `zod`.
- The `viewPage` tool fetches MDX from the GitHub `main` branch, so Worker-visible content can differ from local files.
- Keep CORS and event-stream behavior intact when touching chat routes.
- `OPENAI_API_KEY` belongs in Cloudflare secrets, not in client code.

## Error Handling And Tests

- Follow the existing fetch pattern: throw on non-OK responses, then catch at the recovery boundary.
- Use `throw new Error(...)` with useful request context.
- Use `console.error(...)` when the code intentionally degrades gracefully.
- Only swallow errors for intentionally optional browser APIs such as `localStorage` or `matchMedia`.
- Do not silently ignore Worker or network failures.
- Tests use `node:test` and `node:assert/strict` via `tsx --test`.
- Keep tests close to the module they cover.
- Prefer focused deterministic tests over broad end-to-end style coverage.
- When fixing a bug, add or update the nearest focused test if the area already has test coverage.

## Deploy And Safety Notes

- Typical deploy flow is `pnpm build` followed by `wrangler publish`.
- Use `wrangler dev` only when you specifically need local Worker behavior.
- Prefer the smallest correct change.
- Reuse existing helpers, components, and route patterns before adding new abstractions.
- Do not remove locale prefixes or move AI integration into the browser.
- Do not break Worker tool-call or streaming flow without a concrete reason.
- Do not churn formatting, imports, or naming in unrelated files.

## Known Gotchas

- The current repository does not have a clean `pnpm test` baseline.
- `src/lib/homepage.test.ts` is currently failing because `getFeaturedAchievementMeta()` no longer returns the label expected by the test.
- `pnpm lint` is Prettier-only, so type and logic regressions can still pass lint.
- Worker answers can drift from local content because `viewPage` reads GitHub `main`, not your uncommitted local files.
