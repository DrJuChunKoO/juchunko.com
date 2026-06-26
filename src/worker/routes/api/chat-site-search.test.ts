import assert from "node:assert/strict";
import test from "node:test";

import {
	buildSiteSearchToolResult,
	contentFilePathFromArticleUrl,
	githubContentUrlFromArticleUrl,
	inferLangFromFilename,
} from "./chat-site-search";
import type { SearchDoc } from "@/lib/search";

test("inferLangFromFilename reads the route language", () => {
	assert.equal(inferLangFromFilename("/en/act/ai-basic-act"), "en");
	assert.equal(inferLangFromFilename("/zh-TW/manual/introduction"), "zh-TW");
	assert.equal(inferLangFromFilename("/"), "zh-TW");
});

test("contentFilePathFromArticleUrl maps site article URLs to MDX paths", () => {
	assert.equal(contentFilePathFromArticleUrl("https://juchunko.com/zh-TW/act/ai-basic-act"), "src/content/act/zh-TW/ai-basic-act.mdx");
	assert.equal(contentFilePathFromArticleUrl("/en/manual/introduction/"), "src/content/manual/en/introduction.mdx");
});

test("githubContentUrlFromArticleUrl uses the astro branch raw content URL", () => {
	assert.equal(
		githubContentUrlFromArticleUrl("/en/fragment/contact"),
		"https://github.com/DrJuChunKoO/juchunko.com/raw/refs/heads/astro/src/content/fragment/en/contact.mdx",
	);
});

test("contentFilePathFromArticleUrl rejects non-site and non-content URLs", () => {
	assert.throws(() => contentFilePathFromArticleUrl("https://example.com/en/act/ai-basic-act"), /Only juchunko.com/);
	assert.throws(() => contentFilePathFromArticleUrl("/en/news"), /act, manual, or fragment/);
	assert.throws(() => contentFilePathFromArticleUrl("/en/act/"), /valid slug/);
});

test("buildSiteSearchToolResult searches only the requested language", () => {
	const docs: SearchDoc[] = [
		{
			id: "act/zh-TW/cybersecurity.mdx",
			lang: "zh-TW",
			collection: "act",
			slug: "cybersecurity",
			url: "/zh-TW/act/cybersecurity",
			title: "資安法案",
			description: "資安防護",
			emoji: "🛡️",
			body: "資安政策與防護措施。",
		},
		{
			id: "act/en/cybersecurity.mdx",
			lang: "en",
			collection: "act",
			slug: "cybersecurity",
			url: "/en/act/cybersecurity",
			title: "Cybersecurity Act",
			description: "Cybersecurity protections",
			emoji: "🛡️",
			body: "Cybersecurity policy and protection measures.",
		},
	];

	const result = buildSiteSearchToolResult(docs, "cybersecurity", "en");

	assert.equal(result.resultCount, 1);
	assert.equal(result.results[0].url, "https://juchunko.com/en/act/cybersecurity");
});
