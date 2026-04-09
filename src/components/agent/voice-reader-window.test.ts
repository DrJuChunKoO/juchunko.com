import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("voice reader window re-syncs footer avoidance when its height changes", () => {
	const source = readFileSync(new URL("./VoiceReaderWindow.tsx", import.meta.url), "utf8");

	assert.match(source, /ResizeObserver/);
	assert.match(source, /observer\.observe\(/);
	assert.match(source, /observer\.disconnect\(\)/);
});
