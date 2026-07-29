import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
	collectToolParts,
	extractMessageText,
	extractReasoningText,
	formatKeywordToolText,
	formatQuickPromptLabel,
	getLatestToolPart,
	getToolDescriptor,
	getToolLabel,
	hasRenderableText,
	isBusyStatus,
	isToolPartRunning,
	selectQuickPrompts,
} from "./ai-assistant";

describe("formatKeywordToolText", () => {
	it("fills the keyword slot when a keyword is available", () => {
		assert.equal(formatKeywordToolText('Search news for "{keyword}"', "AI 基本法"), 'Search news for "AI 基本法"');
		assert.equal(formatKeywordToolText("搜尋「{keyword}」相關新聞", "AI 基本法"), "搜尋「AI 基本法」相關新聞");
	});

	it("drops the slot and its quotes when no keyword is available", () => {
		assert.equal(formatKeywordToolText('Search news for "{keyword}"'), "Search news");
		assert.equal(formatKeywordToolText("搜尋「{keyword}」相關新聞"), "搜尋相關新聞");
		assert.equal(formatKeywordToolText('Search news for "{keyword}"', "   "), "Search news");
		assert.equal(formatKeywordToolText('Search news for "{keyword}"', 42), "Search news");
	});
});

describe("getToolDescriptor", () => {
	it("maps known tools to their icon family", () => {
		assert.equal(getToolDescriptor("viewPage").iconName, "view");
		assert.equal(getToolDescriptor("semanticSiteSearch").iconName, "search");
		assert.equal(getToolDescriptor("latestNewsTopics").iconName, "feed");
		assert.equal(getToolDescriptor("readArticle").iconName, "article");
	});

	it("falls back to the generic tool descriptor", () => {
		assert.deepEqual(getToolDescriptor("somethingNew"), {
			iconName: "tool",
			labelKey: "agent.assistant.tool.default",
		});
	});
});

describe("getToolLabel", () => {
	it("localizes labels in both locales", () => {
		assert.equal(getToolLabel("en", "viewPage"), "View page content");
		assert.equal(getToolLabel("zh-TW", "viewPage"), "查看頁面內容");
	});

	it("reads the keyword from the tool input field the tool actually uses", () => {
		assert.equal(getToolLabel("en", "searchNews", { q: "digital ministry" }), 'Search news for "digital ministry"');
		assert.equal(getToolLabel("zh-TW", "semanticSiteSearch", { keyword: "數位發展部" }), "搜尋「數位發展部」網站內容");
	});

	it("ignores a keyword stored under the wrong field", () => {
		assert.equal(getToolLabel("en", "searchNews", { keyword: "digital ministry" }), "Search news");
	});

	it("falls back for unknown tools", () => {
		assert.equal(getToolLabel("en", "mysteryTool"), "Using tool");
		assert.equal(getToolLabel("zh-TW", "mysteryTool"), "使用工具");
	});
});

describe("collectToolParts", () => {
	it("normalizes static and dynamic tool parts to one shape", () => {
		const toolParts = collectToolParts([
			{ type: "step-start" },
			{ type: "text", text: "hello" },
			{ type: "tool-searchNews", state: "output-available", input: { q: "AI" }, toolCallId: "call-1" },
			{ type: "dynamic-tool", toolName: "viewPage", state: "input-streaming", toolCallId: "call-2" },
		]);

		assert.deepEqual(toolParts, [
			{ toolName: "searchNews", input: { q: "AI" }, state: "output-available", toolCallId: "call-1" },
			{ toolName: "viewPage", input: undefined, state: "input-streaming", toolCallId: "call-2" },
		]);
	});

	it("accepts the legacy args field and defaults the state", () => {
		assert.deepEqual(collectToolParts([{ type: "tool-searchNews", args: { q: "AI" } }]), [
			{ toolName: "searchNews", input: { q: "AI" }, state: "input-available", toolCallId: undefined },
		]);
	});

	it("ignores missing and non-tool parts", () => {
		assert.deepEqual(collectToolParts(undefined), []);
		assert.deepEqual(collectToolParts([null, "text", { type: "reasoning", text: "hmm" }]), []);
	});

	it("returns the newest tool part for the status row", () => {
		const latest = getLatestToolPart([
			{ type: "tool-viewPage", state: "output-available" },
			{ type: "tool-readArticle", state: "input-available" },
		]);

		assert.equal(latest?.toolName, "readArticle");
		assert.equal(getLatestToolPart([{ type: "text", text: "hi" }]), null);
	});
});

describe("isToolPartRunning", () => {
	it("only treats pre-output states as running", () => {
		assert.equal(isToolPartRunning("input-streaming"), true);
		assert.equal(isToolPartRunning("input-available"), true);
		assert.equal(isToolPartRunning("output-available"), false);
		assert.equal(isToolPartRunning("output-error"), false);
	});
});

describe("extractMessageText", () => {
	it("joins text parts and skips everything else", () => {
		const parts = [
			{ type: "reasoning", text: "internal" },
			{ type: "text", text: "first" },
			{ type: "text", text: "" },
			{ type: "tool-viewPage", state: "output-available" },
			{ type: "text", text: "second" },
		];

		assert.equal(extractMessageText(parts), "first\n\nsecond");
		assert.equal(hasRenderableText(parts), true);
	});

	it("reports no renderable text for empty or streaming-only messages", () => {
		assert.equal(extractMessageText(undefined), "");
		assert.equal(hasRenderableText([{ type: "text", text: "" }]), false);
		assert.equal(hasRenderableText([{ type: "tool-viewPage", state: "input-available" }]), false);
	});
});

describe("extractReasoningText", () => {
	it("collects reasoning parts separately from the answer", () => {
		assert.equal(
			extractReasoningText([
				{ type: "reasoning", text: "step one" },
				{ type: "text", text: "answer" },
				{ type: "reasoning", text: "step two" },
			]),
			"step one\n\nstep two",
		);
		assert.equal(extractReasoningText([{ type: "reasoning", text: "   " }]), "");
		assert.equal(extractReasoningText(undefined), "");
	});
});

describe("selectQuickPrompts", () => {
	it("returns every prompt for a fresh conversation", () => {
		assert.equal(selectQuickPrompts("zh-TW", []).length, 6);
		assert.equal(selectQuickPrompts("en", []).length, 6);
	});

	it("hides prompts the user already sent", () => {
		const [first] = selectQuickPrompts("en", []);
		assert.ok(first);

		const remaining = selectQuickPrompts("en", [first.prompt]);
		assert.equal(remaining.length, 5);
		assert.equal(
			remaining.some((quickPrompt) => quickPrompt.prompt === first.prompt),
			false,
		);
	});

	it("keeps labels and prompts localized", () => {
		const [zhFirst] = selectQuickPrompts("zh-TW", []);
		assert.equal(zhFirst?.text, "📝 此頁重點");
		assert.equal(zhFirst?.prompt, "整理此頁面的重點");
	});
});

describe("formatQuickPromptLabel", () => {
	it("fills the label slot in both locales", () => {
		assert.equal(formatQuickPromptLabel("Quick prompt: {label}", "📝 Page summary"), "Quick prompt: 📝 Page summary");
		assert.equal(formatQuickPromptLabel("快速提示：{label}", "📝 此頁重點"), "快速提示：📝 此頁重點");
	});
});

describe("isBusyStatus", () => {
	it("treats submitted and streaming as busy", () => {
		assert.equal(isBusyStatus("submitted"), true);
		assert.equal(isBusyStatus("streaming"), true);
		assert.equal(isBusyStatus("ready"), false);
		assert.equal(isBusyStatus("error"), false);
	});
});
