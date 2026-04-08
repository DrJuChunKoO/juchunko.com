import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("homepage blog feed keeps API order so newest card stays at the bottom", () => {
	const source = readFileSync(new URL("./HomeFeeds.tsx", import.meta.url), "utf8");

	assert.match(source, /config\.key === "blog"\) \{\s*cards = data\.blogCards \|\| \[];/s);
	assert.doesNotMatch(source, /config\.key === "blog"\) \{\s*cards = .*?\.reverse\(\);/s);
});
