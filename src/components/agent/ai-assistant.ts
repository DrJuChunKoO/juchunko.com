import { ui, type Lang } from "src/i18n/ui";

type UiKeys = keyof (typeof ui)["en"];

export type ToolLabelKey = Extract<UiKeys, `agent.assistant.tool.${string}`>;

/** Which lucide icon family a tool belongs to. Mapped to components in the React layer. */
export type ToolIconName = "view" | "search" | "feed" | "article" | "tool";

export interface ToolDescriptor {
	iconName: ToolIconName;
	labelKey: ToolLabelKey;
	/** Field on the tool input that carries the user-visible keyword, when the label has a `{keyword}` slot. */
	keywordField?: "q" | "keyword";
}

const TOOL_DESCRIPTORS: Record<string, ToolDescriptor> = {
	viewPage: { iconName: "view", labelKey: "agent.assistant.tool.viewPage" },
	searchNews: { iconName: "search", labelKey: "agent.assistant.tool.searchNews", keywordField: "q" },
	latestNews: { iconName: "feed", labelKey: "agent.assistant.tool.latestNews" },
	getNewsByUrl: { iconName: "article", labelKey: "agent.assistant.tool.getNewsByUrl" },
	searchNewsTopics: { iconName: "search", labelKey: "agent.assistant.tool.searchNewsTopics", keywordField: "q" },
	latestNewsTopics: { iconName: "feed", labelKey: "agent.assistant.tool.latestNewsTopics" },
	viewNewsTopic: { iconName: "article", labelKey: "agent.assistant.tool.viewNewsTopic" },
	semanticSiteSearch: { iconName: "search", labelKey: "agent.assistant.tool.semanticSiteSearch", keywordField: "keyword" },
	readArticle: { iconName: "article", labelKey: "agent.assistant.tool.readArticle" },
};

const FALLBACK_DESCRIPTOR: ToolDescriptor = { iconName: "tool", labelKey: "agent.assistant.tool.default" };

export function getToolDescriptor(toolName: string): ToolDescriptor {
	return TOOL_DESCRIPTORS[toolName] ?? FALLBACK_DESCRIPTOR;
}

/**
 * Fills the `{keyword}` slot in a tool label. When no keyword is available the slot and its
 * surrounding quotes are removed so the label still reads naturally in both locales.
 */
export function formatKeywordToolText(template: string, keyword?: unknown): string {
	const normalizedKeyword = typeof keyword === "string" ? keyword.trim() : "";
	if (normalizedKeyword) return template.replace("{keyword}", normalizedKeyword);

	return template
		.replace(/「\{keyword\}」/g, "")
		.replace(/"\{keyword\}"/g, "")
		.replace(/\{keyword\}/g, "")
		.replace(/\s+for\s*$/i, "")
		.replace(/\s+/g, " ")
		.trim();
}

function readToolKeyword(input: unknown, keywordField: ToolDescriptor["keywordField"]): string | undefined {
	if (!keywordField || typeof input !== "object" || input === null) return undefined;
	const value = (input as Record<string, unknown>)[keywordField];
	return typeof value === "string" ? value : undefined;
}

export function getToolLabel(lang: Lang, toolName: string, input?: unknown): string {
	const descriptor = getToolDescriptor(toolName);
	const template = ui[lang][descriptor.labelKey];
	return descriptor.keywordField ? formatKeywordToolText(template, readToolKeyword(input, descriptor.keywordField)) : template;
}

export type ToolPartState = "input-streaming" | "input-available" | "output-available" | "output-error";

export interface NormalizedToolPart {
	toolName: string;
	input?: unknown;
	state: ToolPartState;
	toolCallId?: string;
}

/** Both static (`tool-<name>`) and dynamic tool parts normalize to the same shape. */
export function normalizeToolPart(part: unknown): NormalizedToolPart | null {
	if (typeof part !== "object" || part === null) return null;

	const candidate = part as { type?: unknown; toolName?: unknown; state?: unknown; input?: unknown; args?: unknown; toolCallId?: unknown };
	const type = typeof candidate.type === "string" ? candidate.type : "";
	const state = typeof candidate.state === "string" ? (candidate.state as ToolPartState) : "input-available";
	const toolCallId = typeof candidate.toolCallId === "string" ? candidate.toolCallId : undefined;
	const input = candidate.input ?? candidate.args;

	if (type === "dynamic-tool" && typeof candidate.toolName === "string") {
		return { toolName: candidate.toolName, input, state, toolCallId };
	}

	if (type.startsWith("tool-")) {
		return { toolName: type.slice("tool-".length), input, state, toolCallId };
	}

	return null;
}

export function collectToolParts(parts: readonly unknown[] | undefined): NormalizedToolPart[] {
	if (!parts) return [];

	const toolParts: NormalizedToolPart[] = [];
	for (const part of parts) {
		const normalized = normalizeToolPart(part);
		if (normalized) toolParts.push(normalized);
	}

	return toolParts;
}

export function getLatestToolPart(parts: readonly unknown[] | undefined): NormalizedToolPart | null {
	const toolParts = collectToolParts(parts);
	return toolParts.length > 0 ? toolParts[toolParts.length - 1]! : null;
}

/** A tool marker should show a spinner until its output (or error) has landed. */
export function isToolPartRunning(state: ToolPartState): boolean {
	return state === "input-streaming" || state === "input-available";
}

interface TextLikePart {
	type?: unknown;
	text?: unknown;
}

function readPartText(part: unknown, type: "text" | "reasoning"): string | null {
	if (typeof part !== "object" || part === null) return null;
	const candidate = part as TextLikePart;
	if (candidate.type !== type || typeof candidate.text !== "string") return null;
	return candidate.text;
}

/** Joins every text part of a message into the plain string a copy action should put on the clipboard. */
export function extractMessageText(parts: readonly unknown[] | undefined): string {
	if (!parts) return "";

	return parts
		.map((part) => readPartText(part, "text"))
		.filter((text): text is string => text !== null && text !== "")
		.join("\n\n");
}

export function extractReasoningText(parts: readonly unknown[] | undefined): string {
	if (!parts) return "";

	return parts
		.map((part) => readPartText(part, "reasoning"))
		.filter((text): text is string => text !== null && text.trim() !== "")
		.join("\n\n");
}

export function hasRenderableText(parts: readonly unknown[] | undefined): boolean {
	return extractMessageText(parts) !== "";
}

export interface QuickPrompt {
	/** Button label. */
	text: string;
	/** Message actually sent to the model. */
	prompt: string;
}

const QUICK_PROMPT_IDS = ["summary", "background", "mainPoints", "explain", "quiz", "news"] as const;

export function getQuickPrompts(lang: Lang): QuickPrompt[] {
	return QUICK_PROMPT_IDS.map((id) => ({
		text: ui[lang][`agent.assistant.prompt.${id}`],
		prompt: ui[lang][`agent.assistant.prompt.${id}Text`],
	}));
}

/** Hides prompts the user already sent, so the suggestion list shrinks as the conversation grows. */
export function selectQuickPrompts(lang: Lang, sentTexts: readonly string[]): QuickPrompt[] {
	const sent = new Set(sentTexts);
	return getQuickPrompts(lang).filter((quickPrompt) => !sent.has(quickPrompt.prompt));
}

export function formatQuickPromptLabel(template: string, label: string): string {
	return template.replace("{label}", label);
}

export type ChatStatus = "submitted" | "streaming" | "ready" | "error";

export function isBusyStatus(status: ChatStatus): boolean {
	return status === "submitted" || status === "streaming";
}
