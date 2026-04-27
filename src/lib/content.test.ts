import assert from "node:assert/strict";
import test from "node:test";
import { contentIdMatchesLang, getRouteLangFromContentId, getSlugFromContentId } from "./content";

test("getRouteLangFromContentId maps Astro 6 normalized content locale ids to route locales", () => {
	assert.equal(getRouteLangFromContentId("zh-tw/ai-basic-act"), "zh-TW");
	assert.equal(getRouteLangFromContentId("en/ai-basic-act"), "en");
});

test("contentIdMatchesLang compares route locales against normalized content ids", () => {
	assert.equal(contentIdMatchesLang("zh-tw/ai-basic-act", "zh-TW"), true);
	assert.equal(contentIdMatchesLang("zh-tw/ai-basic-act", "en"), false);
});

test("getSlugFromContentId extracts the slug from normalized content ids", () => {
	assert.equal(getSlugFromContentId("zh-tw/ai-basic-act"), "ai-basic-act");
});
