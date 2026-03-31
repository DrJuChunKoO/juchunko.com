export type TopicArchiveNewsItem = {
	url: string;
	title: string;
	title_en?: string | null;
	source?: string | null;
	time: string;
};

export type TopicArchiveCard = {
	id: string;
	emoji: string | null;
	title: string;
	summary: string | null;
	latestNewsTime: string;
	totalNewsCount: number;
	monthNewsCount: number;
	latestItems: TopicArchiveNewsItem[];
};

export function formatNewsTopicsLabel(lang: "en" | "zh-TW") {
	return lang === "zh-TW" ? "新聞主題" : "News Topics";
}

export function formatArchiveMonthLabel(month: string, lang: "en" | "zh-TW") {
	const [year, monthNumber] = month.split("-");
	if (!year || !monthNumber) return month;

	if (lang === "zh-TW") {
		return `${year}年${Number(monthNumber)}月`;
	}

	const date = new Date(`${month}-01T00:00:00Z`);
	return new Intl.DateTimeFormat("en-US", {
		month: "long",
		year: "numeric",
		timeZone: "UTC",
	}).format(date);
}

export function formatTopicMeta(topic: TopicArchiveCard, lang: "en" | "zh-TW") {
	if (lang === "zh-TW") {
		return `本月 ${topic.monthNewsCount} 篇・共 ${topic.totalNewsCount} 篇`;
	}

	return `${topic.monthNewsCount} this month - ${topic.totalNewsCount} total`;
}

export function getTopicPreviewItems(topic: TopicArchiveCard, limit = 5) {
	return topic.latestItems.slice(0, limit);
}

export function getVisibleMonthKeys(months: string[], visibleMonthCount: number) {
	return months.slice(0, Math.max(0, visibleMonthCount));
}
