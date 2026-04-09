import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("AI assistant window re-syncs footer avoidance when loading changes its height", () => {
	const source = readFileSync(new URL("./AIAssistantWindow.tsx", import.meta.url), "utf8");

	assert.match(source, /ResizeObserver/);
	assert.match(source, /observer\.observe\(/);
	assert.match(source, /observer\.disconnect\(\)/);
});
