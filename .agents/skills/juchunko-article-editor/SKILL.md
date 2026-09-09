---
name: juchunko-article-editor
description: Create and edit bilingual MDX articles for juchunko.com. Use when adding, updating, translating, localizing, fact-checking, or structurally improving content under src/content/{act,manual,fragment}; when preserving Dr. Ju-Chun Ko terminology, bilingual zh-TW/en slug parity, article frontmatter, and existing Astro MDX components such as ActProgress, NewsTopicEmbed, Timeline, TimelineItem, Cards, Card, YouTube, and policy resource blocks.
---

# Ju-Chun Ko Article Editor

## Core Workflow

1. Read repository rules first: `AGENTS.md`, `src/content.config.ts`, and nearby content in the same collection.
2. Read all current articles before proposing a new topic or substantial rewrite. At minimum inspect every file under `src/content/act`, `src/content/manual`, and `src/content/fragment` for title, description, slug, headings, imports, links, media, and reusable argument patterns.
3. Create or update both `zh-TW` and `en` versions unless the user explicitly asks for one language only.
4. Mirror slugs across languages: `src/content/<collection>/zh-TW/<slug>.mdx` and `src/content/<collection>/en/<slug>.mdx`.
5. Reuse existing MDX components and article structures before inventing new HTML or custom components.
6. Keep writing factual, sourced, and policy-oriented. Do not fabricate legislative dates, government replies, statistics, bill status, media reports, topic IDs, or document links.
7. Run a focused validation after editing content: `pnpm exec prettier --check <changed-mdx-files>` and `pnpm build` for structural, component, routing, or schema changes.

## Content Collections

Use these frontmatter schemas from `src/content.config.ts`:

```yaml
---
title: "..."
description: "..."
date: 2026-05-14
emoji: "🤓"
image: "/image/example.jpg" # optional
status: "..." # act only, optional
---
```

Use `act` for policy, legislative, and issue pages.
Use `manual` for biography, preferences, philosophy, reading, academic work, and personal background.
Use `fragment` for shorter evergreen utility pages such as glossary, contact, and tools.

## Bilingual Requirements

Write the Chinese version first when source material is Taiwanese legislative or policy context. Write the English version as localization, not literal translation.

For `zh-TW`:

Use Traditional Chinese. Prefer `臺灣` in new formal policy content. Keep existing `台灣` only when preserving quoted text, legacy title style, or nearby page convention.

For `en`:

Use clear public-policy English. Prefer concise paragraphs, active voice, and explain Taiwan-specific institutions on first mention.

Both versions must be content-equivalent. Do not add facts, sections, caveats, examples, links, resources, timeline items, media, or calls to action to only one language unless the user explicitly requests an asymmetric page.

Both versions must align on:

Title meaning, date, status, headings, paragraph intent, claims, examples, facts, numbers, names, timeline sequence, resource links, image paths, YouTube IDs, and calls to action.

Both versions may differ on:

Idioms, grammar, word choice, institution expansions, and short context needed to make the same fact understandable to that language's audience. These differences must not change the substantive content.

## Required Terminology Dictionary

Use these translations consistently. If existing articles disagree, prefer this dictionary for new edits and avoid expanding inconsistency.

| Chinese                    | English                                                                      |
| -------------------------- | ---------------------------------------------------------------------------- |
| 葛如鈞                     | Ju-Chun Ko                                                                   |
| 葛如鈞委員                 | Legislator Ju-Chun Ko                                                        |
| 立法委員葛如鈞             | Legislator Ju-Chun Ko                                                        |
| 葛委員                     | Legislator Ko                                                                |
| 寶博士                     | Dr. Ko in formal context; JC in personal/manual context                      |
| 寶博                       | JC in personal/manual context; Legislator Ko in policy context               |
| 寶博辦公室                 | Legislator Ko's office in policy context; JC Ko's office in personal context |
| 中國國民黨                 | Kuomintang (KMT)                                                             |
| 台灣民眾黨                 | Taiwan People's Party (TPP)                                                  |
| 民進黨                     | Democratic Progressive Party (DPP)                                           |
| 立法院                     | Legislative Yuan                                                             |
| 行政院                     | Executive Yuan                                                               |
| 行政院長                   | Premier                                                                      |
| 國科會                     | National Science and Technology Council (NSTC)                               |
| 數發部                     | Ministry of Digital Affairs (MODA)                                           |
| 交通部                     | Ministry of Transportation and Communications (MOTC)                         |
| 教育部                     | Ministry of Education                                                        |
| 法務部                     | Ministry of Justice                                                          |
| 中央銀行 / 央行            | Central Bank                                                                 |
| 核安會                     | Nuclear Safety Commission (NSC)                                              |
| 車安中心                   | Vehicle Safety Certification Center (VSCC)                                   |
| 人工智慧基本法 / AI 基本法 | AI Basic Act                                                                 |
| 電信管理法                 | Telecommunications Management Act                                            |
| 核子反應器設施管制法       | Control Act for Nuclear Reactor Facilities                                   |
| 資通安全管理法             | Cyber Security Management Act                                                |
| 電子簽章法                 | Electronic Signatures Act                                                    |
| 個人資料保護法 / 個資法    | Personal Data Protection Act                                                 |
| 促進資料創新利用發展條例   | Act for Promoting Data Innovation and Utilization                            |
| 虛擬資產服務提供者         | Virtual Asset Service Provider (VASP)                                        |
| 虛擬資產服務提供者專法     | Virtual Asset Service Provider Act                                           |
| 低軌衛星                   | low-earth-orbit (LEO) satellite                                              |
| 海纜                       | submarine cable                                                              |
| 通訊韌性                   | communications resilience                                                    |
| 數位韌性                   | digital resilience                                                           |
| 數位人權                   | digital human rights                                                         |
| 數位平權                   | digital equity                                                               |
| AI 平權                    | AI equity                                                                    |
| AI 幣                      | AI voucher                                                                   |
| 館館有 AI                  | Libraries with AI                                                            |
| 多元宇宙                   | Plurality                                                                    |
| 區塊鏈政府                 | blockchain government                                                        |
| 比特幣戰略儲備             | Bitcoin strategic reserve                                                    |
| 自動駕駛                   | autonomous driving                                                           |
| 自動輔助駕駛               | advanced driver assistance                                                   |
| 全自動輔助駕駛 / FSD       | Full Self-Driving (FSD)                                                      |
| 自我認證                   | self-certification                                                           |
| 上市後抽測                 | post-market testing                                                          |
| 修正草案                   | amendment draft                                                              |
| 一讀付委                   | passed first reading and referred to committee                               |
| 二讀                       | second reading                                                               |
| 三讀通過                   | passed third reading                                                         |
| 召委                       | committee convener                                                           |
| 總質詢                     | general inquiry                                                              |
| 公聽會                     | public hearing                                                               |
| 附帶決議                   | attached resolution                                                          |

Never translate `葛如鈞` as `Ge Ruikun`. Avoid `JU CHUN KO` all caps unless quoting an official all-caps document title. Avoid mixing `Ko Ju-Chun`, `Juchun Ko`, and `Dr. Ge` in new copy.

## Existing Site Topics

Current `act` pages cover:

AI Basic Act, AI equity and AI vouchers, autonomous driving deployment, multi-satellite regulatory adaptation, cybersecurity and digital human rights, Bitcoin strategic reserve, blockchain government, nuclear reactor facility control reform, congress reform facts, Plurality, and AI/digital regulation adaptation.

Current `manual` pages cover:

Biography, parliamentary philosophy, document taste and formatting, reading list, academic papers, and personal interests.

Current `fragment` pages cover:

Emerging technology glossary, office toolkit, and contact guidance.

Use these pages as internal context. When adding a new article, link to related pages where relevant instead of repeating everything.

## Good Future Article Candidates

Prioritize these gaps when the user asks what else to write:

Virtual Asset Service Provider Act and VASP regulatory framework.
Electronic Signatures Act amendment and digital identity infrastructure.
ETEA and emerging technology parliamentary diplomacy.
Legislative Yuan USA Caucus and technology diplomacy.
Tools for Humanity / World entry into Taiwan and proof-of-personhood governance.
Adam Back visit and Bitcoin policy diplomacy.
Data innovation act, data governance, and public-sector data duties.
Child and youth impact assessment for AI governance.
AI New Top 10 Projects oversight and sovereign AI policy.
Cybersecurity budget follow-up for SMEs and supply-chain defense.
Digital human rights appeals mechanism for anti-fraud account takedowns.
Public library AI access implementation updates after `Libraries with AI`.
R157, R171, RDW recognition, and FMVSS follow-up after autonomous-driving inquiries.
Article 36 committee progress and international LEO satellite operators.
Nuclear restart safety review, dry storage status, SMR, and energy security updates.
Congress reform after constitutional judgment and implementation status.
Web3 white paper, blockchain public infrastructure, and RWA policy.
Plurality, vTaiwan, quadratic voting, and collaborative democracy.

## Article Structure Patterns

For `act` articles, prefer this order unless the topic calls for a simpler structure:

```mdx
---
title: "..."
description: "..."
date: YYYY-MM-DD
emoji: "..."
image: "/image/..." # optional
status: "..."
---

import Cards from "@/components/Cards.astro";
import Card from "@/components/Card.astro";
import ActProgress from "@/components/ActProgress.astro";
import NewsTopicEmbed from "@/components/NewsTopicEmbed.astro";
import Timeline from "@/components/Timeline.astro";
import TimelineItem from "@/components/TimelineItem.astro";
import { FileText, Scale } from "lucide-react";
import { YouTube } from "@astro-community/astro-embed-youtube";

# Title

Short lead paragraph that states the policy problem, Ko's position, and current status.

<ActProgress label="目前進度" value={60} status="Short current-status sentence." />

## Why It Matters

Policy context, international comparison, Taiwan-specific bottleneck, Ko's proposals, safeguards, next steps.

## 核心資源區 / Resource Hub

<Cards>
	<Card title="..." href="..." target="_blank">
		<FileText slot="icon" />
		**Label**: One compact explanation.
	</Card>
</Cards>

<NewsTopicEmbed topicId="..." lang="zh-TW" limit={5} heading="相關新聞" />

## 推動時間軸 / Timeline

<Timeline>
	<TimelineItem date="YYYY.MM.DD" title="...">
		Event summary.
	</TimelineItem>
</Timeline>
```

Use a shorter Q&A structure for fact-checking pages like congress reform or nuclear Q&A.
Use a manifesto/media structure for Plurality-style pages.
Use a biography/manual structure for personal pages.
Keep the reading flow article-first: lead/status, then main explanation or Q&A, then resources, news, timeline, and appendices. Resource Hub, news embeds, and timelines are supporting blocks; avoid placing them before readers understand the issue unless the page is primarily a resource index.

## Component Rules

Use `NewsTopicEmbed` only with a real `topicId`. Do not invent topic IDs. If no topic ID is known, omit the component and mention that a topic ID is needed.

Use `Timeline` and `TimelineItem` for legislative progress, public hearings, inquiries, government replies, media reports, and international milestones. Keep timeline dates chronological when the existing page does so; otherwise follow the page's current order.

Use `Cards` and `Card` for source hubs, bill downloads, official documents, related pages, and primary resources. Keep card copy compact. Do not put news-report links in the Resource Hub: `NewsTopicEmbed` already renders related news automatically below, so news coverage in `Cards` would duplicate it. Keep `NewsTopicEmbed` directly after the Resource Hub (or after the main article body if there is no hub), and reserve `Cards` for substantive primary resources such as bill texts and official documents.

Use `ActProgress` for compact progress or latest-status bars in `act` MDX pages instead of hand-coded progress `div`s. Import it with `import ActProgress from "@/components/ActProgress.astro"`. Props are `label`, `value` from 0 to 100, and `status`. Examples: `<ActProgress label="目前進度" value={55} status="館館有 AI 已獲教育部核定，AI 幣由行政院承諾兩個月內研議。" />` and `<ActProgress label="Current progress" value={55} status="Libraries with AI has been approved by the Ministry of Education; AI vouchers are under Executive Yuan review within two months." />`.

`ActSummary` is injected by `SharedContentTemplate.astro` for `act` pages and calls `/api/act-summary`; authors do not need to import it in MDX. Its three labels are `問題 / Problem`, `我們提出的做法 / What We Proposed`, and `對我有什麼影響 / How This Affects Me`. Do not use `目前的問題` or `Current Problem` in generated summary UI or prompts, because passed legislation may describe a past problem.

Use `YouTube` for real videos only. When an article would benefit from primary-source footage, proactively look for relevant videos in Legislator Ko's official YouTube channel or playlists; `yt-dlp --flat-playlist` is appropriate for inspecting titles and IDs before selecting embeds. Prefer a small number of videos that directly document the article's policy proposal, inquiry, public hearing, legislative milestone, or implementation update. Do not add loosely related clips, duplicate edits of the same event, political miscellany, or enough embeds to overwhelm the article. Check existing embeds first, place each selected video beside the most relevant passage or `TimelineItem`, and mirror the same YouTube ID in both language versions with localized titles. Include `params="start=..."` when deep-linking to a segment.

Use custom `div className="not-prose ..."` sparingly. Prefer existing neutral styles: `rounded-lg`, subtle borders, `bg-gray-50`, `dark:bg-white/5`, and hover outlines. Do not introduce decorative shadows or strong color fills without a strong reason.

## Writing Standards

Start with what changed, why it matters, and what Legislator Ko is asking the government to do.
Support claims with official documents, Legislative Yuan records, committee reports, government replies, credible media, office field reports, or named international references.
Separate facts from advocacy. Use clear phrases such as `Ko argues`, `the office requests`, `the Ministry responded`, and `the current status is`.
Avoid vague superlatives unless backed by evidence.
Preserve a pragmatic tone: technology should improve governance, safety, transparency, resilience, rights, and public access.
When mentioning risks, include safeguards and accountability mechanisms.
End `act` pages with concrete next steps or a public-facing call to action.

### Voice: human, a bit sharp, still rational

Write like a person making a policy case, not like a lawyer padding every sentence with liability disclaimers.

Do:

- Prefer concrete scenes, short sentences, and plain verbs over bureaucratic stacks of nouns.
- Match the sharper register already on pages such as the cell-alert section in `mobile-network-throttling-drill`: questions, mild sarcasm, and a clear ask are allowed.
- State office field reports, user impact, and Ko's demands directly when that is the point of the page.
- Keep one thin rational spine: what happened, why it is wrong or incomplete, what the government must publish or fix next.
- Demand data and accountability from the government instead of watering down the claim.

Do not:

- Over-hedge with soft padding such as `這是辦公室收到的個案，不能拿來直接概括…`, `其餘個案仍待政府與電信業者逐項查證`, `This is one office report, not a claim about every user…`, or `the remaining cases await verification case by case` unless the user explicitly asks for that caution.
- Use preachy or lecturing editorializing (說教語句), such as `不只看預算有多大，更要看最後形成多少可用的裝備、技術與產能` or lecturing the reader on what they "should actually look at".
- Insert defensive liability disclaimers or finger-wagging caveats (免責贅句), such as `這不是一次通過...特別預算，也不代表經費已全數到位` or `本頁以...為進度，不將兩者直接等同於...`. State statutory mechanisms, budget types, and facts directly instead of putting up defensive guardrails.
- Sound like a press release, a risk memo, or machine-translated policy English.
- Invent facts. Sharp tone is not a license to fabricate dates, numbers, quotes, or sources.
- Confuse boldness with conspiracy or personal attacks. Aim the edge at policy design, process failure, and missing accountability.

## Formatting Standards

Follow `.prettierrc`: tabs, double quotes, trailing commas, and wide lines where Prettier keeps them.
Use one blank line around headings and components.
In Chinese copy, keep a half-width space around English, acronyms, numbers, and symbols: `AI 基本法`, `R157`, `5 臺`, `0.1%`.
Do not align tables or indent prose manually with spaces.
Use Markdown ordered lists for sequence, not hand-typed numbering inside paragraphs.
Keep image alt text descriptive and bilingual-appropriate.

## Editing Checklist

Before finishing, verify:

Both language files exist when creating a bilingual article.
The slug is mirrored across languages.
Frontmatter matches the collection schema.
Dates are valid ISO dates and represent article date or latest major update.
Names follow the terminology dictionary.
All links are real and relevant.
All imported components are used, and unused imports are removed.
`NewsTopicEmbed` uses the correct `lang` value for the file.
Internal links are locale-prefixed: `/zh-TW/...` and `/en/...`.
The English page is localized, not machine-literal.
The Chinese and English pages are content-equivalent, with no one-sided sections, claims, resources, or timeline items.
Potential topic gaps are considered before adding duplicate coverage.
