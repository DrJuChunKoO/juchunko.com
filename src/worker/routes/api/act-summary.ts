import { Hono } from "hono";
import { createOpenAICompatible, type OpenAICompatibleProvider } from "@ai-sdk/openai-compatible";
import { generateText, NoObjectGeneratedError, Output } from "ai";
import { z } from "zod";
import type { Env } from "../../types";

export const ACT_SUMMARY_CACHE_CONTROL = "public, s-maxage=604800, stale-while-revalidate=86400";

const actSummarySchema = z.object({
	problem: z.string().trim().min(1).describe("The problem this issue page is addressing."),
	changes: z.string().trim().min(1).describe("The concrete proposals, actions, or policy changes described on the page."),
	impact: z.string().trim().min(1).describe("How the issue affects general readers or the public."),
});

const langSchema = z.union([z.literal("zh-TW"), z.literal("en")]);
const slugSchema = z.string().regex(/^[a-z0-9][a-z0-9-]*$/);

type ActSummary = z.infer<typeof actSummarySchema>;
type ActSummaryField = keyof ActSummary;

const summaryFieldLabels = {
	problem: ["problem", "Problem", "問題", "目前的問題"],
	changes: ["changes", "What We Proposed", "我們提出的做法", "我們的做法", "做法"],
	impact: ["impact", "How This Affects Me", "對我有什麼影響", "影響"],
} as const satisfies Record<ActSummaryField, readonly string[]>;

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
- The structured output must use exactly these field keys: problem, changes, impact.
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
- 結構化輸出必須使用這三個欄位鍵名：problem, changes, impact。
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

function toRecord(value: unknown): Record<string, unknown> | null {
	return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

function normalizeKey(key: string) {
	return key.toLocaleLowerCase().replace(/[\s:_-]+/g, "");
}

function readLabeledString(record: Record<string, unknown>, field: ActSummaryField) {
	for (const label of summaryFieldLabels[field]) {
		const directValue = record[label];
		if (typeof directValue === "string") return directValue;
	}

	const normalizedLabels = new Set(summaryFieldLabels[field].map(normalizeKey));
	for (const [key, value] of Object.entries(record)) {
		if (typeof value === "string" && normalizedLabels.has(normalizeKey(key))) return value;
	}

	return undefined;
}

function normalizeActSummaryCandidate(value: unknown): ActSummary | null {
	const record = toRecord(value);
	if (!record) return null;

	const directResult = actSummarySchema.safeParse({
		problem: readLabeledString(record, "problem"),
		changes: readLabeledString(record, "changes"),
		impact: readLabeledString(record, "impact"),
	});
	if (directResult.success) return directResult.data;

	return normalizeActSummaryCandidate(record.summary);
}

function stripCodeFence(text: string) {
	return text
		.trim()
		.replace(/^```(?:json)?\s*/i, "")
		.replace(/```$/i, "")
		.trim();
}

function parseJsonSummary(text: string): ActSummary | null {
	const trimmed = stripCodeFence(text);
	const candidates = [trimmed];
	const jsonStart = trimmed.indexOf("{");
	const jsonEnd = trimmed.lastIndexOf("}");
	if (jsonStart !== -1 && jsonEnd > jsonStart) candidates.push(trimmed.slice(jsonStart, jsonEnd + 1));

	for (const candidate of candidates) {
		try {
			const parsed = JSON.parse(candidate) as unknown;
			const summary = normalizeActSummaryCandidate(parsed);
			if (summary) return summary;
		} catch {
			// Continue with other candidates and section parsing below.
		}
	}

	return null;
}

function matchSectionStart(line: string): { field: ActSummaryField; content: string } | null {
	const normalizedLine = line
		.trim()
		.replace(/^#{1,6}\s*/, "")
		.replace(/^[-*]\s*/, "");

	for (const [field, labels] of Object.entries(summaryFieldLabels) as [ActSummaryField, readonly string[]][]) {
		for (const label of labels) {
			if (!normalizedLine.toLocaleLowerCase().startsWith(label.toLocaleLowerCase())) continue;
			const content = normalizedLine
				.slice(label.length)
				.replace(/^\s*[:：-]\s*/, "")
				.trim();
			return { field, content };
		}
	}

	return null;
}

function parseSectionSummary(text: string): ActSummary | null {
	let currentField: ActSummaryField | null = null;
	const sections: Record<ActSummaryField, string[]> = { problem: [], changes: [], impact: [] };

	for (const rawLine of text.split(/\r?\n/)) {
		const line = rawLine.trim();
		if (!line) continue;

		const sectionStart = matchSectionStart(line);
		if (sectionStart) {
			currentField = sectionStart.field;
			if (sectionStart.content) sections[currentField].push(sectionStart.content);
			continue;
		}

		if (currentField) sections[currentField].push(line);
	}

	const result = actSummarySchema.safeParse({
		problem: sections.problem.join(" "),
		changes: sections.changes.join(" "),
		impact: sections.impact.join(" "),
	});

	return result.success ? result.data : null;
}

export function parseActSummaryOutput(text: string): ActSummary | null {
	return parseJsonSummary(text) ?? parseSectionSummary(text);
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
	try {
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
	} catch (error) {
		if (NoObjectGeneratedError.isInstance(error)) {
			const summary = parseActSummaryOutput(error.text);
			if (summary) return summary;
		}

		throw error;
	}
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
