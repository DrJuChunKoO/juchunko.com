import { Hono } from "hono";
import { createOpenAICompatible, type OpenAICompatibleProvider } from "@ai-sdk/openai-compatible";
import { generateText, Output } from "ai";
import { z } from "zod";
import type { Env } from "../../types";

export const ACT_SUMMARY_CACHE_CONTROL = "public, s-maxage=604800, stale-while-revalidate=86400";

const actSummarySchema = z.object({
	problem: z.string().trim().min(1),
	changes: z.string().trim().min(1),
	impact: z.string().trim().min(1),
});

const langSchema = z.union([z.literal("zh-TW"), z.literal("en")]);
const slugSchema = z.string().regex(/^[a-z0-9][a-z0-9-]*$/);

type ActSummary = z.infer<typeof actSummarySchema>;

export function buildActSummaryPrompt({ lang, title, body }: { lang: "zh-TW" | "en"; title: string; body: string }) {
	const mdx = body.slice(0, 24000);

	if (lang === "en") {
		return `You are generating an "Issue Summary" for an issue page on juchunko.com.

Use only the MDX content below. Do not add facts that are not supported by the page.

Summary language: English
Summary sections:
- Problem
- What We Proposed
- How This Affects Me

Rules:
- Write 1 to 2 sentences for each field.
- Use clear, concrete language for general readers. Avoid slogans and vague praise.
- "What We Proposed" may include bills, amendments, advocacy, inquiries, negotiations, oversight, or completed policy actions.
- Return the result through the provided structured output schema.

Page title: ${title}

MDX content:
---BEGIN MDX---
${mdx}
---END MDX---`;
	}

	return `你正在為 juchunko.com 的議題頁產生「議題摘要」。

請只根據下方 MDX 內容，產生給一般民眾閱讀的頁首摘要。不可補充頁面沒有提到的事實。

摘要語言：繁體中文
摘要欄位：
- 問題
- 我們提出的做法
- 對我有什麼影響

限制：
- 每個欄位 1 到 2 句。
- 語氣清楚、具體，避免空泛口號。
- 「我們提出的做法」可以涵蓋提案、修法、倡議、質詢、協商、監督或已完成的政策行動。
- 請透過提供的結構化輸出 schema 回傳結果。

頁面標題：${title}

MDX 內容：
---BEGIN MDX---
${mdx}
---END MDX---`;
}

function getTitleFromMdx(body: string) {
	const titleMatch = body.match(/^title:\s*["']?(.+?)["']?\s*$/m);
	return titleMatch?.[1]?.trim() || "";
}

async function fetchActMdx(lang: "zh-TW" | "en", slug: string) {
	const sourcePath = `src/content/act/${lang}/${slug}.mdx`;
	const response = await fetch(`https://github.com/DrJuChunKoO/juchunko.com/raw/refs/heads/astro/${sourcePath}`);
	if (!response.ok) {
		throw new Error(`Failed to fetch act content: HTTP ${response.status}`);
	}
	const body = await response.text();
	return { body, sourcePath, title: getTitleFromMdx(body) };
}

async function generateActSummary(openrouter: OpenAICompatibleProvider, lang: "zh-TW" | "en", title: string, body: string) {
	const result = await generateText({
		model: openrouter.chatModel("@preset/website-chatbot"),
		output: Output.object({
			name: "ActSummary",
			description: "A three-part public-facing issue summary for a legislative issue page.",
			schema: actSummarySchema,
		}),
		prompt: buildActSummaryPrompt({ lang, title, body }),
	});

	return result.output;
}

const app = new Hono<{ Bindings: Env }>();

app.get("/", async (c) => {
	const langResult = langSchema.safeParse(c.req.query("lang"));
	const slugResult = slugSchema.safeParse(c.req.query("slug"));

	if (!langResult.success || !slugResult.success) {
		return c.json({ success: false, error: "Invalid lang or slug" }, 400);
	}

	try {
		const { body, sourcePath, title } = await fetchActMdx(langResult.data, slugResult.data);
		const openrouter = createOpenAICompatible({
			name: "openrouter",
			apiKey: c.env.OPENROUTER_API_KEY,
			baseURL: "https://gateway.ai.cloudflare.com/v1/3f1f83a939b2fc99ca45fd8987962514/juchunko-com/openrouter",
			includeUsage: true,
		});
		const summary = await generateActSummary(openrouter, langResult.data, title, body);

		c.header("Cache-Control", ACT_SUMMARY_CACHE_CONTROL);
		return c.json({
			success: true,
			title,
			summary,
			generatedAt: new Date().toISOString(),
			sourcePath,
		});
	} catch (error) {
		console.error("act-summary error:", error);
		return c.json({ success: false, error: "Failed to generate act summary" }, 502);
	}
});

export default app;
