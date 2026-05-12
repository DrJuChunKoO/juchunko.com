export type NewsTopicEmbedLang = "en" | "zh-TW";

export type NewsTopicEmbedItem = {
	url: string;
	title: string;
	title_en?: string | null;
	source?: string | null;
	time: string;
};

export type NewsTopicEmbedMonth = {
	month: string;
	items: NewsTopicEmbedItem[];
};

const NEWS_TOPIC_API_BASE = "https://aifferent.juchunko.com/api/topics";

export function buildNewsTopicDetailUrl(topicId: string) {
	return `${NEWS_TOPIC_API_BASE}/${encodeURIComponent(topicId)}`;
}

export function normalizeNewsTopicLimit(limit: number | undefined) {
	if (!Number.isFinite(limit)) return 5;
	return Math.min(12, Math.max(1, Math.trunc(limit as number)));
}

export function getNewsTopicItemTitle(item: Pick<NewsTopicEmbedItem, "title" | "title_en">, lang: NewsTopicEmbedLang) {
	return lang === "en" ? item.title_en || item.title : item.title;
}

export function flattenNewsTopicItems(months: NewsTopicEmbedMonth[], limit: number | undefined) {
	return months.flatMap((month) => month.items).slice(0, normalizeNewsTopicLimit(limit));
}
