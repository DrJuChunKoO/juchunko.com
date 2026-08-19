export interface MediaAttentionTopic {
	id: string;
	emoji: string | null;
	title: string;
	titleEn?: string | null;
	summary: string | null;
	summaryEn?: string | null;
	latestNewsTime: string;
	totalNewsCount: number;
	monthNewsCount: number;
}

export function selectMediaAttentionTopics(topics: readonly MediaAttentionTopic[], limit = 3) {
	return topics
		.slice()
		.sort((a, b) => b.monthNewsCount - a.monthNewsCount || Date.parse(b.latestNewsTime) - Date.parse(a.latestNewsTime))
		.slice(0, limit);
}
