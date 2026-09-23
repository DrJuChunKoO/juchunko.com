import test from "node:test";
import assert from "node:assert/strict";
import { closeTopicHistory, getTopicMonthKeys } from "./NewsPage";

test("closing a topic opened on the page goes back instead of pushing a closed entry", () => {
	const calls: string[] = [];
	const history = {
		state: { newsTopicDialogId: "opened-here" },
		back: () => calls.push("back"),
		replaceState: () => calls.push("replace"),
	};
	closeTopicHistory(history, new URL("https://juchunko.com/en/news?topic=abc#archive"), "opened-here");
	assert.deepEqual(calls, ["back"]);
});

test("closing a direct deep link removes the topic in place and preserves other URL state", () => {
	const state = { other: "value" };
	const calls: Array<{ state: unknown; url: string }> = [];
	const history = {
		state,
		back: () => assert.fail("should not leave the page"),
		replaceState: (newState: unknown, _unused: string, url?: string | URL | null) => calls.push({ state: newState, url: String(url) }),
	};
	closeTopicHistory(history, new URL("https://juchunko.com/en/news?q=foo&topic=abc#archive"), null);
	assert.deepEqual(calls, [{ state, url: "https://juchunko.com/en/news?q=foo#archive" }]);

	closeTopicHistory(history, new URL("https://juchunko.com/en/news?topic=abc"), "different-entry");
	assert.equal(calls[1].url, "https://juchunko.com/en/news");
});

test("deep links search the topic's latest archive month first, then fall back to the rest", () => {
	const months = ["2026-09", "2026-08", "2026-07"];
	assert.deepEqual(getTopicMonthKeys(months, "2026-07-14T12:00:00Z"), ["2026-07", "2026-09", "2026-08"]);
	assert.deepEqual(getTopicMonthKeys(months, "2025-01-01T00:00:00Z"), months);
	assert.deepEqual(getTopicMonthKeys(months, null), months);
});
