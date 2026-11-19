import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { INDEXNOW_KEY, buildSubmission, changedUrls } from "./indexnow";

const manifest = (pages: Record<string, string>) => ({ version: 1 as const, pages });

test("changedUrls submits every page on the first deploy", () => {
	assert.deepEqual(changedUrls(null, manifest({ "https://juchunko.com/en/act/b": "1", "https://juchunko.com/en/act/a": "2" })), [
		"https://juchunko.com/en/act/a",
		"https://juchunko.com/en/act/b",
	]);
});

test("changedUrls returns only new and edited pages", () => {
	const previous = manifest({
		"https://juchunko.com/en/act/same": "1",
		"https://juchunko.com/en/act/edited": "1",
		"https://juchunko.com/en/act/removed": "1",
	});
	const next = manifest({
		"https://juchunko.com/en/act/same": "1",
		"https://juchunko.com/en/act/edited": "2",
		"https://juchunko.com/en/act/new": "1",
	});
	assert.deepEqual(changedUrls(previous, next), ["https://juchunko.com/en/act/edited", "https://juchunko.com/en/act/new"]);
});

test("the key file served from public/ matches the submitted key", () => {
	const submission = buildSubmission([]);
	assert.equal(readFileSync(new URL(`../../public/${INDEXNOW_KEY}.txt`, import.meta.url), "utf8"), submission.key);
	assert.equal(submission.keyLocation, `https://juchunko.com/${INDEXNOW_KEY}.txt`);
});
