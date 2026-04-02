# Refactor Plan

## Status

This plan is approved for implementation with the following decisions already confirmed:

1. Keep `/` as the original splash / visual landing page.
2. Publish the media kit page publicly.
3. Publish the collaboration page publicly.
4. Reuse the contact information and routing guidance from `召喚寶博` as the source of truth for collaboration/contact flows.

## Background

The current site already has strong content depth, rich issue pages, and a distinctive visual identity. The main problem is not lack of material. The problem is that first-time visitors need to assemble the story themselves.

A new visitor should be able to answer these questions quickly:

1. Who is 葛如鈞
2. What has he actually done
3. Which issues should I read first
4. Why should I keep following this person
5. How do I contact or collaborate with him

Right now, those answers exist, but they are spread across the language homepage, manual pages, act pages, feeds, and contact page.

## Goals

1. Preserve the existing visual identity and splash experience on `/`
2. Make `/{lang}` the real "understand this person" homepage
3. Reduce first-visit comprehension time to under 10 seconds
4. Make top user tasks reachable within 1 click
5. Reuse existing content assets before creating new structure
6. Standardize summary patterns across major content pages
7. Publish public-facing media and collaboration entry pages

## Non-Goals

1. Do not replace or redesign the core splash concept on `/`
2. Do not rewrite the full design system
3. Do not rebuild the news or legislator activity data pipeline
4. Do not remove AI Agent features
5. Do not rewrite all MDX content in one pass
6. Do not change existing routes unless there is strong value

## Current Problems

### 1. The main understanding experience starts too late

The splash page is visually strong and should remain. The issue is that the actual language homepage at `/{lang}` still behaves more like a content hub than a guided introduction.

### 2. The language homepage prioritizes content buckets over user questions

Current `src/pages/[lang]/index.astro` roughly presents:

1. title + description
2. AI Basic Act callout
3. dynamic feeds
4. fragment cards
5. act cards
6. manual cards

This is content-rich, but it does not first answer:

1. who he is
2. his top accomplishments
3. what he stands for
4. where a first-time visitor should go next

### 3. The strongest biography content is buried

`src/content/manual/zh-TW/introduction.mdx` already contains much of the necessary material, but visitors must choose to enter it instead of being guided there.

### 4. Major issue pages are detailed but not front-loaded

Pages such as `src/content/act/zh-TW/ai-basic-act.mdx` are substantial and credible, but they need a shared summary layer before the long-form content.

### 5. Interactive CTA is more obvious than comprehension CTA

The Agent layer is highly visible across the site, but the homepage does not yet provide equally strong "understand first" entry points.

### 6. Media and collaboration use cases are not explicitly served

A journalist, organizer, or partner can eventually find the needed information, but the site does not yet provide single public pages optimized for those tasks.

## Key User Personas

### 1. General voter

Needs:

1. Who is he
2. What has he done
3. Why does it matter to me

### 2. Journalist

Needs:

1. one-paragraph bio
2. key positions
3. representative accomplishments
4. quotable source links
5. contact path

### 3. Tech community / developer

Needs:

1. evidence of actual work in AI, Web3, data governance, tech policy
2. credibility signals
3. reasons to follow or engage

### 4. Collaborator / event organizer

Needs:

1. suitable topics
2. likely collaboration formats
3. how to contact
4. what information to include in an invitation

## Refactor Principles

1. Preserve the splash page
2. Reorder before rewriting
3. Make the homepage answer questions before showing everything
4. Reuse existing content wherever possible
5. Use additive metadata, not destructive schema changes
6. Push AI interaction one level lower than first-time comprehension
7. Make media and collaboration flows public and easy to reach

## Proposed Information Architecture

### `/`

Role:
Brand and visual entry experience

Decision:
Keep it.

Allowed refinements:

1. Improve CTA clarity
2. Improve copy clarity
3. Keep the current visual hierarchy and emotional effect

### `/{lang}`

Role:
Primary understanding homepage

Target structure:

1. Hero
2. identity statement
3. representative achievements
4. quick entry points
5. key issues
6. evidence and recent updates
7. extended reading
8. AI interaction

### Public support pages

Add two explicit public pages:

1. Media Kit
2. Collaboration

These should become stable destinations for journalists and organizers.

## File-Level Refactor Scope

## A. Keep splash, refactor the language homepage

### `src/pages/index.astro`

Goal:
Preserve the splash page as an important visual statement.

Implementation direction:

1. Keep the current Spline-based landing composition
2. Keep the current direct entry behavior
3. Only make minimal copy or CTA refinements if needed
4. Do not transform `/` into the main biography homepage

### `src/pages/[lang]/index.astro`

Goal:
Turn the language homepage into the true "understand 葛如鈞" page.

Target homepage order:

1. Hero with name, role, and short identity statement
2. Three representative achievements
3. Two main CTA buttons
4. Quick links for first-time visitors
5. Featured issue cards
6. Evidence layer with feeds
7. Secondary content from manual / fragment collections
8. Full content archives

Proposed homepage sections:

1. Hero
2. Why follow 葛如鈞
3. Representative achievements
4. Key issues
5. Quick links
6. Latest evidence and updates
7. Extended reading

## B. Reposition feeds as evidence, not as the first story

### `src/components/HomeFeeds.tsx`

Current role:
A visually prominent dynamic content block.

New role:
A supporting evidence layer.

Refactor direction:

1. Move it below primary narrative sections
2. Reduce its responsibility for first impressions
3. Frame it as "latest evidence and updates"
4. Keep the API integration as-is
5. Keep news, activity, blog, and transcript data sourcing intact

## C. Standardize summary structure for content pages

### `src/components/SharedContentTemplate.astro`

Current role:
General renderer + recommended posts

New role:
Shared structured page shell for act / manual / fragment pages

Add a summary block above content body when data is available.

Suggested summary fields:

1. `summary`
2. `role`
3. `status`
4. `impact`
5. `evidence`
6. `primaryCtaLabel`
7. `primaryCtaHref`

Fallback behavior:
If these fields are absent, continue rendering the page with current behavior using `description`.

## D. Add metadata support without breaking existing content

### `src/content.config.ts`

Add optional frontmatter fields for content collections.

Suggested fields:

1. `summary`
2. `role`
3. `impact`
4. `featured`
5. `featuredOrder`
6. `hero`
7. `primaryCtaLabel`
8. `primaryCtaHref`

Purpose:

1. `featured` and `featuredOrder` drive homepage curation
2. `summary`, `role`, and `impact` power structured page intros
3. CTA fields allow guided journeys without hardcoding too much logic

All new fields should remain optional.

## E. Elevate biography and contact content into source-of-truth pages

### `src/content/manual/zh-TW/introduction.mdx`

Goal:
Use this as the primary biography source for homepage and media references.

Refactor direction:

1. Open with a direct identity statement
2. Make role and expertise scannable
3. Reframe milestone section into 3 to 5 top representative achievements
4. Keep the longer biography content below

Same structure should later be mirrored in:

1. `src/content/manual/en/introduction.mdx`

### `src/content/fragment/zh-TW/contact.mdx`

Goal:
Keep this as the canonical source of public contact guidance.

Refactor direction:

1. Preserve the current contact methods
2. Preserve current priority order
3. Make the page easier to reference from homepage and collaboration page
4. Highlight:
   - fastest contact path
   - when to use email
   - when to call
   - what to include in outreach
5. Reuse this content in the future collaboration page to avoid divergence

Same structure should later be mirrored in:

1. `src/content/fragment/en/contact.mdx`

## F. Make major act pages easier to scan

Priority pages:

1. `src/content/act/zh-TW/ai-basic-act.mdx`
2. `src/content/act/zh-TW/cybersecurity.mdx`
3. `src/content/act/zh-TW/multi-satellite-regulatory-adaptation.mdx`
4. `src/content/act/zh-TW/bitcoin-reserve.mdx`
5. `src/content/act/zh-TW/autonomous-driving-deployment-initiative.mdx`

Refactor direction:
Add a short summary layer at the top of each page that answers:

1. What is this issue
2. What role did 葛如鈞 play
3. What is the current status
4. Why does it matter
5. Where is the supporting evidence

Apply the same structure later to matching English pages.

## G. Add public Media Kit page

Add:

1. `src/content/fragment/zh-TW/media-kit.mdx`
2. `src/content/fragment/en/media-kit.mdx`

Purpose:
A public page for journalists and researchers.

Contents:

1. short bio
2. current roles
3. 3 to 5 representative accomplishments
4. core issue areas
5. source links / quotable references
6. contact path

This page should be linked from:

1. homepage quick links
2. nav
3. footer

## H. Add public Collaboration page

Add:

1. `src/content/fragment/zh-TW/collaboration.mdx`
2. `src/content/fragment/en/collaboration.mdx`

Purpose:
A public page for organizers and partners.

Contents:

1. topics he is suitable for
2. common collaboration formats
3. what to include in an invitation
4. best contact path
5. response guidance
6. direct reuse of the contact rules from `召喚寶博`

Important rule:
Do not invent a different contact workflow. The collaboration page should explicitly inherit the logic from the contact page.

## I. Reduce homepage noise from AI Agent

### `src/layouts/PageLayout.astro`

### `src/components/agent/Agent.tsx`

### `src/components/agent/AgentButton.tsx`

Goal:
Keep AI interaction as a differentiator without letting it dominate first-time comprehension.

Refactor direction:

1. On homepage, reduce immediate visual dominance
2. Prefer one compact entry point on the homepage
3. Keep full interaction on content pages
4. Continue hiding voice reader on list pages where it is less useful
5. Ensure the primary homepage CTA remains comprehension-first

## J. Rebalance site navigation

### `src/components/Nav.astro`

Current nav is dominated by:

1. Blog
2. Transcript
3. GitHub
4. theme toggle

Refactor direction:
Add clearer first-time visitor navigation.

Suggested primary nav items:

1. 認識葛如鈞 / About
2. 代表成果 / Key Achievements
3. 重點議題 / Key Issues
4. 媒體資料 / Media Kit
5. 聯繫 / 合作 / Contact / Collaboration

Blog and Transcript should remain available, but no longer be the only obvious textual navigation paths.

### `src/components/Footer.astro`

Refactor direction:
Add stronger decision-oriented links:

1. Media Kit
2. Collaboration
3. Contact
4. Key Issues

Keep social links.

### `src/components/LanguagePrompt.tsx`

Refactor direction:

1. Reduce interruption
2. Keep the prompt useful but less competitive with first-view comprehension
3. Prefer simpler copy and conservative display behavior

## Homepage Content Model

### Hero

Must answer:

1. who he is
2. current role
3. what he is known for

Suggested contents:

1. site title / person name
2. one-line identity statement
3. 2 to 3 sentence plain-language summary
4. CTA to biography
5. CTA to achievements

### Representative achievements

Show 3 cards only:

1. AI 基本法
2. 電子簽章法修法
3. 多元衛星法規調適 or 核管法修法

Each card should include:

1. title
2. current outcome
3. one-line why it matters
4. link to detail page

### Quick links

Recommended 5 cards:

1. 認識葛如鈞
2. 代表成果
3. 重點議題
4. 媒體資料
5. 聯繫 / 合作

### Evidence layer

Use feeds to show:

1. recent news
2. recent legislator activity
3. latest blog / transcript references

### Extended reading

Keep current secondary human-interest content available:

1. 興趣
2. 閱讀
3. 論文
4. 品味
5. 怎麼想

These remain valuable, but should move after the essential "understand the person" flow.

## Execution Phases

## Phase 1: Homepage structure

Files:

1. `src/pages/[lang]/index.astro`
2. `src/components/HomeFeeds.tsx`

Deliverables:

1. identity-first homepage
2. representative achievements section
3. quick links section
4. feeds repositioned as evidence layer

Success criteria:

1. a first-time visitor understands who he is within 10 seconds
2. homepage first screen shows identity + next steps
3. dynamic feeds no longer dominate the first story

## Phase 2: Shared page summary system

Files:

1. `src/content.config.ts`
2. `src/components/SharedContentTemplate.astro`

Deliverables:

1. additive content metadata
2. summary block support on shared content pages
3. graceful fallback for older content

Success criteria:

1. content pages can show structured intros
2. existing pages do not break without new metadata

## Phase 3: Core content uplift

Files:

1. `src/content/manual/zh-TW/introduction.mdx`
2. `src/content/manual/en/introduction.mdx`
3. `src/content/fragment/zh-TW/contact.mdx`
4. `src/content/fragment/en/contact.mdx`
5. priority act pages in zh-TW
6. matching act pages in en where feasible

Deliverables:

1. biography optimized for homepage and media reuse
2. contact content structured for reuse
3. key act pages with summary-first pattern

Success criteria:

1. biography is easier to scan
2. contact guidance is easier to act on
3. key issue pages are easier to understand at a glance

## Phase 4: Public support pages

Files to add:

1. `src/content/fragment/zh-TW/media-kit.mdx`
2. `src/content/fragment/en/media-kit.mdx`
3. `src/content/fragment/zh-TW/collaboration.mdx`
4. `src/content/fragment/en/collaboration.mdx`

Deliverables:

1. public media page
2. public collaboration page
3. navigation access from homepage, nav, and footer

Success criteria:

1. journalists can find background + sources + contact in 1 click
2. organizers can find collaboration details + contact path in 1 click
3. collaboration page stays aligned with contact page

## Phase 5: Agent and polish

Files:

1. `src/layouts/PageLayout.astro`
2. `src/components/agent/*`
3. `src/components/Nav.astro`
4. `src/components/Footer.astro`
5. `src/components/LanguagePrompt.tsx`

Deliverables:

1. reduced homepage noise
2. improved first-visit navigation
3. supporting links for media and collaboration

Success criteria:

1. comprehension CTA outranks interaction CTA
2. homepage feels more focused
3. AI functionality remains intact

## Acceptance Criteria

1. `/` remains the original splash-style visual entry
2. `/{lang}` becomes the real first-time understanding homepage
3. Within one screen, a visitor can identify who 葛如鈞 is
4. Within one click, a user can reach:
   - biography
   - representative achievements
   - media kit
   - contact / collaboration
5. Major act pages show a summary-first structure
6. Media Kit is public
7. Collaboration page is public
8. Collaboration page reuses the contact logic from `召喚寶博`
9. Existing news, blog, transcript, and activity systems continue to work
10. AI Agent remains available but no longer dominates homepage first impression

## Risks

1. If too many new homepage sections are added at once, the page may become crowded
2. If metadata rollout is inconsistent, summary blocks may feel uneven across pages
3. If contact data is duplicated instead of reused, Media / Collaboration / Contact can drift apart
4. If English content lags too far behind Chinese, bilingual UX may feel incomplete

## Recommended Implementation Order

1. Refactor `/{lang}` homepage first
2. Add shared summary metadata and content template support
3. Upgrade biography and contact source pages
4. Add public media and collaboration pages
5. Rebalance navigation, footer, agent, and language prompt

## Confirmed Decisions

1. Keep `/` splash page and original visual presentation
2. Publish media kit publicly
3. Publish collaboration page publicly
4. Use `召喚寶博` contact information and routing rules as the source of truth
