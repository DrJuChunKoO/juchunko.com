import test from "node:test";
import assert from "node:assert/strict";
import { getFeaturedAchievementMeta, getHomepageCopy, selectFeaturedEntries } from "./homepage";

test("selectFeaturedEntries keeps the curated homepage order", () => {
	const entries = [
		{ id: "zh-TW/multi-satellite-regulatory-adaptation.mdx", data: { title: "多元衛星法規調適" } },
		{ id: "zh-TW/ai-basic-act.mdx", data: { title: "AI 基本法" } },
		{ id: "zh-TW/nuclear-reactor-facility-control-act.mdx", data: { title: "核管法修法專區" } },
	];

	assert.deepEqual(
		selectFeaturedEntries(entries).map((entry) => entry.data.title),
		["AI 基本法", "核管法修法專區", "多元衛星法規調適"],
	);
});

test("getHomepageCopy exposes guided first-visit navigation", () => {
	const copy = getHomepageCopy("zh-TW");

	assert.equal(copy.hero.title, "葛如鈞．寶博士");
	assert.equal(copy.quickLinks.length, 5);
	assert.equal(copy.quickLinks[0]?.href, "/zh-TW/manual/introduction");
	assert.equal(copy.quickLinks[1]?.href, "#achievements");
	assert.equal(copy.quickLinks[4]?.title, "聯繫寶博");
});

test("getHomepageCopy assigns icon keys to quick links", () => {
	const copy = getHomepageCopy("en");

	assert.deepEqual(
		copy.quickLinks.map((link) => link.icon),
		["bio", "results", "issues", "updates", "contact"],
	);
});

test("getFeaturedAchievementMeta returns the icon for each highlighted issue", () => {
	assert.deepEqual(getFeaturedAchievementMeta("ai-basic-act", "zh-TW"), {
		icon: "ai",
		label: "AI 治理",
	});
	assert.deepEqual(getFeaturedAchievementMeta("nuclear-reactor-facility-control-act", "en"), {
		icon: "nuclear",
		label: "Energy resilience",
	});
});
