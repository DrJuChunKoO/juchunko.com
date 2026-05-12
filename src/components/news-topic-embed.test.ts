import test from "node:test";
import assert from "node:assert/strict";
import { buildNewsTopicDetailUrl, normalizeNewsTopicLimit } from "./news-topic-embed";

test("buildNewsTopicDetailUrl encodes topic ids", () => {
	assert.equal(
		buildNewsTopicDetailUrl("AI 平權/館館有 AI"),
		"https://aifferent.juchunko.com/api/topics/AI%20%E5%B9%B3%E6%AC%8A%2F%E9%A4%A8%E9%A4%A8%E6%9C%89%20AI",
	);
});

test("normalizeNewsTopicLimit keeps limits within display bounds", () => {
	assert.equal(normalizeNewsTopicLimit(undefined), 5);
	assert.equal(normalizeNewsTopicLimit(0), 1);
	assert.equal(normalizeNewsTopicLimit(3), 3);
	assert.equal(normalizeNewsTopicLimit(99), 12);
});
