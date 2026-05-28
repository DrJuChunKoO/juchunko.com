import test from "node:test";
import assert from "node:assert/strict";

import { ACT_SUMMARY_CACHE_CONTROL, buildActSummaryPrompt } from "./act-summary";

test("buildActSummaryPrompt asks for the fixed issue summary sections", () => {
	const prompt = buildActSummaryPrompt({
		lang: "zh-TW",
		title: "AI 基本法",
		body: "# AI 基本法\n\n立法院三讀通過人工智慧基本法。",
	});

	assert.match(prompt, /議題摘要/);
	assert.match(prompt, /問題/);
	assert.match(prompt, /我們提出的做法/);
	assert.match(prompt, /對我有什麼影響/);
	assert.doesNotMatch(prompt, /目前的問題/);
	assert.match(prompt, /結構化輸出 schema/);
});

test("buildActSummaryPrompt uses a separate English prompt for English summaries", () => {
	const prompt = buildActSummaryPrompt({
		lang: "en",
		title: "AI Basic Act",
		body: "# AI Basic Act\n\nThe Legislative Yuan passed the AI Basic Act.",
	});

	assert.match(prompt, /Issue Summary/);
	assert.match(prompt, /Problem/);
	assert.match(prompt, /What We Proposed/);
	assert.match(prompt, /How This Affects Me/);
	assert.doesNotMatch(prompt, /Current Problem/);
	assert.doesNotMatch(prompt, /你正在/);
	assert.doesNotMatch(prompt, /議題摘要/);
	assert.doesNotMatch(prompt, /目前的問題/);
});

test("ACT_SUMMARY_CACHE_CONTROL keeps generated summaries cacheable for seven days", () => {
	assert.equal(ACT_SUMMARY_CACHE_CONTROL, "public, s-maxage=604800, stale-while-revalidate=86400");
});
