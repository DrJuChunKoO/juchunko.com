import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { getFeaturedAchievementSummary, getHomepageCopy, selectFeaturedEntries } from "./homepage";

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
	assert.equal(copy.hero.secondaryCta.label, "聯繫葛如鈞");
	assert.equal(copy.sectionTitles.reading, "進一步閱讀");
});

test("getFeaturedAchievementSummary returns why-it-matters summaries for featured acts", () => {
	assert.equal(
		getFeaturedAchievementSummary("zh-TW/ai-basic-act.mdx", "zh-TW"),
		"為台灣建立 AI 發展與風險治理的共同規則，讓創新、監管與公共利益能在同一套法律框架下推進。",
	);
	assert.equal(
		getFeaturedAchievementSummary("en/nuclear-reactor-facility-control-act.mdx", "en"),
		"It reopens a legal path for extending stable low-carbon power, turning an energy dead end into a decision that can be reviewed on safety and evidence.",
	);
});

test("homepage renders featured achievements with CardLink", () => {
	const source = readFileSync(new URL("../pages/[lang]/index.astro", import.meta.url), "utf8");
	const cardLinkSource = readFileSync(new URL("../components/CardLink.astro", import.meta.url), "utf8");

	assert.match(
		source,
		/featuredActs\.map\(\(post\) =>\s*\(\s*<CardLink post=\{post\} lang=\{lang\} category="act" showDescription description=\{getFeaturedAchievementSummary\(post\.id, lang\)\} \/>\s*\)\s*\)/s,
	);
	assert.match(cardLinkSource, /showDescription/);
	assert.match(cardLinkSource, /text-muted-foreground mt-2 text-xs leading-relaxed md:text-sm/);
});

test("homepage keeps the issues archive and scroll margin anchors", () => {
	const source = readFileSync(new URL("../pages/[lang]/index.astro", import.meta.url), "utf8");

	assert.match(source, /id="issues"/);
	assert.match(source, /id="reading" class="scroll-mt-24 space-y-10 md:scroll-mt-28"/);
});

test("homepage hero CTAs use a more compact mobile size", () => {
	const source = readFileSync(new URL("../pages/[lang]/index.astro", import.meta.url), "utf8");

	assert.match(source, /rounded-full px-4 py-2 text-sm .* md:px-6 md:py-3 md:text-base/);
	assert.match(source, /ArrowRight class="size-4 .* md:size-5/);
});
