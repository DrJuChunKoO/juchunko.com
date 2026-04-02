type TopicListItem = {
	id: string;
	title: string;
	titleEn: string | null;
	summary: string | null;
	summaryEn: string | null;
	emoji: string | null;
	newsCount: number;
	latestNewsTime: string | null;
	firstNewsTime: string | null;
};

type TopicDetailItem = {
	topic: TopicListItem;
	totalNewsCount: number;
	months: Array<{
		month: string;
		items: Array<{
			url: string;
			title: string;
			titleEn: string | null;
			source: string | null;
			time: string;
		}>;
	}>;
};

export function buildTopicListToolResult(topics: TopicListItem[], query?: string) {
	return {
		query: query ?? null,
		totalTopics: topics.length,
		topics: topics.map((topic) => ({
			id: topic.id,
			emoji: topic.emoji,
			title: topic.title,
			titleEn: topic.titleEn,
			summary: topic.summary,
			summaryEn: topic.summaryEn,
			newsCount: topic.newsCount,
			latestNewsTime: topic.latestNewsTime,
			firstNewsTime: topic.firstNewsTime,
		})),
	};
}

export function buildTopicDetailToolResult(detail: TopicDetailItem) {
	return {
		topic: {
			id: detail.topic.id,
			emoji: detail.topic.emoji,
			title: detail.topic.title,
			titleEn: detail.topic.titleEn,
			summary: detail.topic.summary,
			summaryEn: detail.topic.summaryEn,
			newsCount: detail.topic.newsCount,
			latestNewsTime: detail.topic.latestNewsTime,
			firstNewsTime: detail.topic.firstNewsTime,
		},
		totalNewsCount: detail.totalNewsCount,
		months: detail.months.map((month) => ({
			month: month.month,
			items: month.items.map((item) => ({
				url: item.url,
				title: item.title,
				titleEn: item.titleEn,
				source: item.source,
				time: item.time,
			})),
		})),
	};
}
