import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
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

	assert.equal(copy.hero.title, "科技立委葛如鈞．寶博士");
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

test("homepage keeps the issues archive and scroll margin anchors", () => {
	const source = readFileSync(new URL("../pages/[lang]/index.astro", import.meta.url), "utf8");

	assert.match(source, /id="issues"/);
	assert.match(source, /id="reading" class="scroll-mt-24 space-y-10 md:scroll-mt-28"/);
});
