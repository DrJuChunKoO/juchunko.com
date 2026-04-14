import test from "node:test";
import assert from "node:assert/strict";
import { buildTopicDetailToolResult, buildTopicListToolResult } from "./chat-news-tools";

test("buildTopicListToolResult keeps ids and bilingual titles for tool chaining", () => {
	const result = buildTopicListToolResult(
		[
			{
				id: "topic-1",
				title: "NCC 人事案",
				titleEn: "NCC Personnel Appointments",
				summary: "NCC 委員提名與審查進度。",
				summaryEn: "Progress on NCC commissioner nominations and review.",
				emoji: "📡",
				newsCount: 6,
				latestNewsTime: "2026-03-01T09:00:00+08:00",
				firstNewsTime: "2026-02-20T09:00:00+08:00",
			},
		],
		"NCC",
	);

	assert.equal(result.query, "NCC");
	assert.equal(result.topics[0]?.id, "topic-1");
	assert.equal(result.topics[0]?.titleEn, "NCC Personnel Appointments");
	assert.equal(result.topics[0]?.newsCount, 6);
});

test("buildTopicDetailToolResult keeps topic timeline months and story urls", () => {
	const result = buildTopicDetailToolResult({
		topic: {
			id: "topic-1",
			title: "NCC 人事案",
			titleEn: "NCC Personnel Appointments",
			summary: "NCC 委員提名與審查進度。",
			summaryEn: "Progress on NCC commissioner nominations and review.",
			emoji: "📡",
			newsCount: 6,
			latestNewsTime: "2026-03-01T09:00:00+08:00",
			firstNewsTime: "2026-02-20T09:00:00+08:00",
		},
		totalNewsCount: 2,
		months: [
			{
				month: "2026-03",
				items: [
					{
						url: "https://example.com/1",
						title: "NCC 委員審查",
						titleEn: "NCC Review",
						source: "中央社",
						time: "2026-03-01T09:00:00+08:00",
					},
				],
			},
		],
	});

	assert.equal(result.topic.id, "topic-1");
	assert.equal(result.months[0]?.month, "2026-03");
	assert.equal(result.months[0]?.items[0]?.url, "https://example.com/1");
	assert.equal(result.totalNewsCount, 2);
});
