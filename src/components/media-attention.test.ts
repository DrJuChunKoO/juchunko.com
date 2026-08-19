import test from "node:test";
import assert from "node:assert/strict";

import { selectMediaAttentionTopics, type MediaAttentionTopic } from "./media-attention";

test("selectMediaAttentionTopics ranks current-month coverage before recency", () => {
	const topics: MediaAttentionTopic[] = [
		{ id: "new", emoji: null, title: "New", summary: null, latestNewsTime: "2026-08-19", totalNewsCount: 1, monthNewsCount: 1 },
		{ id: "popular", emoji: null, title: "Popular", summary: null, latestNewsTime: "2026-08-10", totalNewsCount: 20, monthNewsCount: 8 },
		{ id: "medium", emoji: null, title: "Medium", summary: null, latestNewsTime: "2026-08-18", totalNewsCount: 5, monthNewsCount: 5 },
	];

	assert.deepEqual(
		selectMediaAttentionTopics(topics, 2).map((topic) => topic.id),
		["popular", "medium"],
	);
});
