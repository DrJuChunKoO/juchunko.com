import test from "node:test";
import assert from "node:assert/strict";

import type { Fetcher } from "@cloudflare/workers-types";
import { acceptsMarkdown, fetchNegotiatedAsset, getMarkdownAssetPath } from "./content-negotiation";

test("acceptsMarkdown respects an explicit zero quality value", () => {
	assert.equal(acceptsMarkdown("text/html, text/markdown"), true);
	assert.equal(acceptsMarkdown("text/markdown; q=0, text/html"), false);
});

test("getMarkdownAssetPath maps home and article URLs", () => {
	assert.equal(getMarkdownAssetPath("/"), "/llms.txt");
	assert.equal(getMarkdownAssetPath("/en/fragment/contact"), "/en/fragment/contact.md");
	assert.equal(getMarkdownAssetPath("/zh-TW/act/ai-basic-act/"), "/zh-TW/act/ai-basic-act.md");
	assert.equal(getMarkdownAssetPath("/favicon.png"), undefined);
});

test("canonical pages negotiate markdown and preserve existing Vary values", async () => {
	let requestedPath = "";
	const assets = {
		fetch(request: Request) {
			requestedPath = new URL(request.url).pathname;
			return Promise.resolve(
				new Response("# AI Basic Act", {
					headers: { "Content-Type": "text/plain", Vary: "Accept-Encoding" },
				}),
			);
		},
	} as unknown as Fetcher;

	const response = await fetchNegotiatedAsset(
		new Request("https://juchunko.com/en/act/ai-basic-act", { headers: { Accept: "text/markdown" } }),
		assets,
	);

	assert.equal(requestedPath, "/en/act/ai-basic-act.md");
	assert.equal(response.headers.get("Content-Type"), "text/markdown; charset=utf-8");
	assert.equal(response.headers.get("Vary"), "Accept-Encoding, Accept");
});

test("canonical HTML responses also vary on Accept", async () => {
	const assets = {
		fetch() {
			return Promise.resolve(new Response("<h1>AI Basic Act</h1>", { headers: { "Content-Type": "text/html" } }));
		},
	} as unknown as Fetcher;

	const response = await fetchNegotiatedAsset(
		new Request("https://juchunko.com/en/act/ai-basic-act", { headers: { Accept: "text/html" } }),
		assets,
	);

	assert.equal(response.headers.get("Content-Type"), "text/html");
	assert.equal(response.headers.get("Vary"), "Accept");
});
