import test from "node:test";
import assert from "node:assert/strict";

import { ACT_SUMMARY_CACHE_CONTROL, buildActSummaryPrompt, parseActSummaryOutput } from "./act-summary";

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
	assert.match(prompt, /problem, changes, impact/);
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
	assert.match(prompt, /problem, changes, impact/);
});

test("parseActSummaryOutput recovers JSON with localized labels", () => {
	const summary = parseActSummaryOutput(`\`\`\`json
{
  "問題": "臺灣需要從洗錢防制登記走向完整虛擬資產專法。",
  "我們提出的做法": "葛如鈞提出委員版本，推動許可制、客戶保護、穩定幣規範與過渡安排。",
  "對我有什麼影響": "民眾使用虛擬資產服務時，會有更清楚的平台責任、資產保護與市場秩序規則。"
}
\`\`\``);

	assert.deepEqual(summary, {
		problem: "臺灣需要從洗錢防制登記走向完整虛擬資產專法。",
		changes: "葛如鈞提出委員版本，推動許可制、客戶保護、穩定幣規範與過渡安排。",
		impact: "民眾使用虛擬資產服務時，會有更清楚的平台責任、資產保護與市場秩序規則。",
	});
});

test("parseActSummaryOutput recovers markdown sections", () => {
	const summary = parseActSummaryOutput(`## Problem
Taiwan needed a dedicated framework for virtual asset services.

## What We Proposed
Ko proposed licensing, customer asset protection, stablecoin rules, and transition arrangements.

## How This Affects Me
Users get clearer platform duties, safeguards, and market-order rules.`);

	assert.deepEqual(summary, {
		problem: "Taiwan needed a dedicated framework for virtual asset services.",
		changes: "Ko proposed licensing, customer asset protection, stablecoin rules, and transition arrangements.",
		impact: "Users get clearer platform duties, safeguards, and market-order rules.",
	});
});

test("ACT_SUMMARY_CACHE_CONTROL keeps generated summaries cacheable for seven days", () => {
	assert.equal(ACT_SUMMARY_CACHE_CONTROL, "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400");
});
