# AGENTS.md

Guide for coding agents working in `juchunko.com`, based on the current repository config and source code.

## Rule Sources

- Copilot rules exist in `.github/copilot-instructions.md`; their project-specific guidance is folded into this file.
- No Cursor rules were found in `.cursorrules` or `.cursor/rules/`.
- Use `pnpm` for package-manager commands in this repository.

## Repository Overview

- Stack: Astro 5, React 19 islands, TypeScript, Tailwind CSS 4, Hono, Cloudflare Workers.
- Site output is static and built into `dist/`.
- Worker entrypoint is `src/worker/index.ts` and serves `/api/*` plus static assets.
- Content lives in `src/content/{collection}/{lang}/{slug}.mdx`.
- Collections are `act`, `manual`, and `fragment`, defined in `src/content.config.ts`.
- i18n locales are `zh-TW` and `en`.

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
- `pnpm build`: build the site into `dist/` for Worker assets.
- `pnpm preview`: preview the production build.
- `pnpm lint`: Prettier check only; there is no ESLint script.
- `pnpm format`: run Prettier write across the repo.

## Test Commands

```sh
pnpm test
pnpm exec tsx --test src/lib/homepage.test.ts
pnpm exec tsx --test src/lib/homepage.test.ts --test-name-pattern "selectFeaturedEntries"
pnpm exec tsx --test src/components/nav-layout.test.ts
```

- The package test script is `tsx --test "src/**/*.test.ts"`.
- For a single test file, use `pnpm exec tsx --test path/to/file.test.ts`.
- For a single named test, add `--test-name-pattern "..."`.
- Do not rely on `pnpm test -- path/to/file.test.ts`; the hard-coded glob still pulls in the full suite.

## Architecture Notes

- Astro handles routes, layouts, content rendering, and static generation.
- React is used for interactive islands under `src/components/**`.
- Worker API routes live under `src/worker/routes/api/**`.
- Chat streaming is implemented in `src/worker/routes/api/chat.ts`.
- Use existing route and content patterns before inventing new abstractions.

## Imports

- Match the existing import order: external packages first, project aliases next, relative imports last.
- Prefer `@/` imports for `src/*` when they improve clarity.
- `src/...` absolute imports already exist; do not churn files just to normalize import style.
- Use `import type` for type-only imports when practical.

## Formatting

- Prettier is the formatting authority.
- `.prettierrc` requires tabs, double quotes, trailing commas, and `printWidth: 140`.
- `prettier-plugin-tailwindcss` handles class sorting, and `prettier-plugin-astro` handles Astro files.
- Run `pnpm format` after broad edits or `pnpm exec prettier --write <file>` for targeted cleanup.

## Types

- `tsconfig.json` extends `astro/tsconfigs/base` and enables `strictNullChecks`.
- Honor nullability instead of suppressing it.
- Prefer explicit domain unions such as `"en" | "zh-TW"`.
- Avoid new `any` unless it is truly a boundary type and kept narrow.

## Naming

- Components, interfaces, and exported types use `PascalCase`.
- Functions, variables, and helpers use `camelCase`.
- Utility and test file names tend to use `kebab-case`, and tests end in `.test.ts`.
- Translation keys are dotted strings like `home.description`.

## Astro And Content

- Derive the locale from the route with `getLangFromUrl(Astro.url)`.
- Keep locale-prefixed routes such as `/zh-TW/...` and `/en/...`.
- New `src/pages/[lang]/**` routes usually need `getStaticPaths()` covering both locales.
- Locale filtering commonly uses `post.id.startsWith(lang + "/")`.
- Keep MDX frontmatter aligned with `src/content.config.ts`; `date` uses `z.coerce.date()` and invalid dates fail builds.

## React And UI

- Prefer small functional components with local props typing.
- Use `cn()` from `src/lib/utils.ts` to merge Tailwind classes.
- Preserve DOM order for accessibility when animating UI.
- Prefer transform and opacity animations over layout-shifting motion.
- `useReducedMotion()` may be `null` during SSR or hydration; coerce with `Boolean(...)` before boolean logic.

## AI Chat And Worker Rules

- Keep LLM calls on the Worker side; do not call providers directly from client components.
- Existing chat UI uses `useChat` with `DefaultChatTransport`.
- Include `filename: window.location.pathname` in chat requests so Worker tools can inspect the current page.
- Keep Worker streaming behavior intact when editing `src/worker/routes/api/chat.ts`.
- Define tool inputs explicitly with `zod`.
- `viewPage` fetches MDX from the GitHub `astro` branch, so Worker-visible content can differ from local files.

## Error Handling

- Follow the existing fetch pattern: throw on non-OK responses, then catch at the recovery boundary.
- Use `throw new Error(...)` with useful request context.
- Use `console.error(...)` when the code intentionally degrades gracefully.
- Only swallow errors for intentionally optional browser APIs such as `localStorage` or `matchMedia`.

## Tests

- Tests use `node:test` and `node:assert/strict`.
- Keep tests close to the module they cover.
- Prefer focused deterministic tests over broad end-to-end style coverage.

## i18n

- Add keys to both locales in `src/i18n/ui.ts`.
- Use `const t = useTranslations(lang)` and then `t("key")`.
- Do not duplicate locale fallback logic; `useTranslations()` already provides fallback behavior.
- Do not ship new UI copy in only one language unless the task explicitly requires it.

## Validation

```sh
pnpm exec prettier --check <changed-files>
pnpm exec tsx --test <relevant-test-file>
pnpm build
```

- For docs-only changes, a Prettier check is usually enough.
- For UI, Worker, content-schema, or routing changes, run the nearest relevant test file.

## Safe Change Guidance

- Prefer the smallest correct change.
- Reuse existing helpers and patterns before adding new ones.
- Do not remove locale prefixes or move AI integration into the browser.
- Do not break the Worker tool-call and streaming flow without a concrete reason.

## Known Gotchas

- The current repository does not have a clean `pnpm test` baseline.
- `src/components/nav-layout.test.ts` is currently failing against the rendered mobile-nav markup.
- `src/lib/homepage.test.ts` is currently failing because `getFeaturedAchievementMeta()` no longer returns the label expected by the test.
- Because `pnpm lint` is Prettier-only, type and logic regressions can still pass lint.
