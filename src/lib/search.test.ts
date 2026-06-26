import assert from "node:assert/strict";
import test from "node:test";

import { searchDocs, type SearchDoc } from "./search";

const docs: SearchDoc[] = [
	{
		id: "act/zh-TW/ai-basic-act.mdx",
		lang: "zh-TW",
		collection: "act",
		slug: "ai-basic-act",
		url: "/zh-TW/act/ai-basic-act",
		title: "人工智慧基本法",
		description: "建立 AI 治理原則。",
		status: "三讀通過",
		emoji: "🤖",
		body: "人工智慧基本法處理透明、公平與責任治理。",
	},
	{
		id: "act/en/ai-basic-act.mdx",
		lang: "en",
		collection: "act",
		slug: "ai-basic-act",
		url: "/en/act/ai-basic-act",
		title: "AI Basic Act",
		description: "Establishes AI governance principles.",
		status: "Passed Third Reading",
		emoji: "🤖",
		body: "The AI Basic Act covers transparency, fairness, and accountability.",
	},
	{
		id: "manual/zh-TW/thinking.mdx",
		lang: "zh-TW",
		collection: "manual",
		slug: "thinking",
		url: "/zh-TW/manual/thinking",
		title: "思考方式",
		description: "關於問問題與做決策。",
		emoji: "🧠",
		body: "這篇文章描述如何提出問題。",
	},
];

test("searchDocs separates results by language", () => {
	const results = searchDocs(docs, "AI", "en");

	assert.equal(results.length, 1);
	assert.equal(results[0].item.lang, "en");
	assert.equal(results[0].item.url, "/en/act/ai-basic-act");
});

test("searchDocs supports Traditional Chinese substring matches", () => {
	const results = searchDocs(docs, "人工智慧", "zh-TW");

	assert.equal(results.length, 1);
	assert.equal(results[0].item.title, "人工智慧基本法");
});

test("searchDocs prioritizes title matches", () => {
	const results = searchDocs(docs, "思考方式", "zh-TW");

	assert.equal(results[0].item.slug, "thinking");
});

test("searchDocs returns no results for empty queries", () => {
	assert.deepEqual(searchDocs(docs, "   ", "zh-TW"), []);
});
