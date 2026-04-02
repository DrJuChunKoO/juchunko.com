import test from "node:test";
import assert from "node:assert/strict";
import {
	createNewsPageRequestError,
	formatArchiveMonthLabel,
	formatArchiveMonthSummary,
	formatNewsTopicsLabel,
	formatSearchResultsHint,
	getTopicDisplaySummary,
	getTopicDisplayTitle,
	getNewsPageErrorMessage,
	formatTopicMeta,
	formatTopicTotalNewsCount,
	formatStoryCount,
	getTopicPreviewItems,
	getVisibleMonthKeys,
	type TopicArchiveCard,
} from "./news-page-format";

const topic: TopicArchiveCard = {
	id: "ai-basic-act",
	emoji: "🤖",
	title: "AI 基本法",
	titleEn: "AI Basic Act",
	summary: null,
	summaryEn: null,
	latestNewsTime: "2026-03-18T09:00:00+08:00",
	totalNewsCount: 8,
	monthNewsCount: 3,
	latestItems: [
		{
			url: "https://example.com/3",
			title: "第三則",
			title_en: "Third",
			source: "中央社",
			time: "2026-03-18T09:00:00+08:00",
		},
		{
			url: "https://example.com/2",
			title: "第二則",
			title_en: "Second",
			source: "自由時報",
			time: "2026-03-17T09:00:00+08:00",
		},
		{
			url: "https://example.com/1",
			title: "第一則",
			title_en: "First",
			source: "聯合報",
			time: "2026-03-16T09:00:00+08:00",
		},
	],
};

test("formatArchiveMonthLabel returns localized labels", () => {
	assert.equal(formatArchiveMonthLabel("2026-03", "zh-TW"), "2026年3月");
	assert.equal(formatArchiveMonthLabel("2026-03", "en"), "March 2026");
});

test("formatNewsTopicsLabel uses the new wording instead of archive", () => {
	assert.equal(formatNewsTopicsLabel("zh-TW"), "新聞主題");
	assert.equal(formatNewsTopicsLabel("en"), "News Topics");
});

test("formatTopicMeta returns localized monthly and total counts", () => {
	assert.equal(formatTopicMeta(topic, "zh-TW"), "本月 3 篇・共 8 篇");
	assert.equal(formatTopicMeta(topic, "en"), "3 this month - 8 total");
});

test("formatArchiveMonthSummary returns localized topic and story counts", () => {
	assert.equal(formatArchiveMonthSummary(2, 5, "zh-TW"), "2 個主題・5 則新聞");
	assert.equal(formatArchiveMonthSummary(2, 5, "en"), "2 topics · 5 stories");
});

test("formatSearchResultsHint inserts the active query into localized copy", () => {
	assert.equal(
		formatSearchResultsHint("AI", "zh-TW"),
		'目前顯示「AI」的搜尋結果；清除後可回到新聞主題。',
	);
	assert.equal(
		formatSearchResultsHint("AI", "en"),
		'Showing search results for "AI". Clear to return to news topics.',
	);
});

test("formatTopicTotalNewsCount localizes the selected topic total", () => {
	assert.equal(formatTopicTotalNewsCount(12, "zh-TW"), "同一主題共 12 則新聞");
	assert.equal(formatTopicTotalNewsCount(12, "en"), "12 news items across the same topic");
});

test("formatStoryCount localizes topic timeline month counts", () => {
	assert.equal(formatStoryCount(3, "zh-TW"), "3 則新聞");
	assert.equal(formatStoryCount(3, "en"), "3 stories");
});

test("getNewsPageErrorMessage prefers localized request errors over backend details", () => {
	const error = createNewsPageRequestError("newsPage.search.error", "backend said something in English");

	assert.equal(getNewsPageErrorMessage(error, "zh-TW", "newsPage.archive.error"), "載入新聞失敗");
	assert.equal(getNewsPageErrorMessage(error, "en", "newsPage.archive.error"), "Failed to load news");
});

test("getNewsPageErrorMessage falls back to the requested localized key for unknown errors", () => {
	assert.equal(getNewsPageErrorMessage(new Error("boom"), "zh-TW", "newsPage.archive.error"), "載入新聞主題失敗");
	assert.equal(getNewsPageErrorMessage(new Error("boom"), "en", "newsPage.topic.timelineError"), "Failed to load topic timeline");
});

test("getTopicDisplayTitle uses English topic title when available", () => {
	assert.equal(getTopicDisplayTitle(topic, "en"), "AI Basic Act");
	assert.equal(getTopicDisplayTitle(topic, "zh-TW"), "AI 基本法");
});

test("getTopicDisplaySummary falls back to Chinese when English summary is missing", () => {
	assert.equal(
		getTopicDisplaySummary(
			{
				...topic,
				summary: "聚焦 AI 基本法與治理框架的立法進度。",
				summaryEn: null,
			},
			"en",
		),
		"聚焦 AI 基本法與治理框架的立法進度。",
	);
	assert.equal(
		getTopicDisplaySummary(
			{
				...topic,
				summary: "聚焦 AI 基本法與治理框架的立法進度。",
				summaryEn: "Tracks the legislative progress of Taiwan's AI Basic Act.",
			},
			"en",
		),
		"Tracks the legislative progress of Taiwan's AI Basic Act.",
	);
});

test("getTopicPreviewItems caps preview lists to five items", () => {
	assert.equal(getTopicPreviewItems(topic).length, 3);
	assert.equal(
		getTopicPreviewItems({
			...topic,
			latestItems: Array.from({ length: 7 }, (_, index) => ({
				url: `https://example.com/${index}`,
				title: `新聞 ${index}`,
				title_en: `News ${index}`,
				source: "中央社",
				time: `2026-03-${String(20 - index).padStart(2, "0")}T09:00:00+08:00`,
			})),
		}).length,
		5,
	);
});

test("getVisibleMonthKeys reveals one month at a time for infinite scrolling", () => {
	assert.deepEqual(getVisibleMonthKeys(["2026-03", "2026-02", "2026-01"], 1), ["2026-03"]);
	assert.deepEqual(getVisibleMonthKeys(["2026-03", "2026-02", "2026-01"], 2), ["2026-03", "2026-02"]);
	assert.deepEqual(getVisibleMonthKeys(["2026-03", "2026-02", "2026-01"], 99), ["2026-03", "2026-02", "2026-01"]);
});
