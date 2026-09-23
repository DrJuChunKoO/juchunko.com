import test from "node:test";
import assert from "node:assert/strict";
import { getLanguageUrl } from "./LanguageSelector";

test("switches a locale-prefixed path without dropping query or hash", () => {
	assert.equal(
		getLanguageUrl(new URL("https://juchunko.com/zh-TW/news?topic=abc#month-2026-09"), "en"),
		"/en/news?topic=abc#month-2026-09",
	);
	assert.equal(getLanguageUrl(new URL("https://juchunko.com/en?foo=bar#intro"), "zh-TW"), "/zh-TW?foo=bar#intro");
});

test("prefixes the root and does not mistake a similarly named path for a locale", () => {
	assert.equal(getLanguageUrl(new URL("https://juchunko.com/?q=abc#top"), "en"), "/en?q=abc#top");
	assert.equal(getLanguageUrl(new URL("https://juchunko.com/enough?foo=bar"), "zh-TW"), "/zh-TW/enough?foo=bar");
});
