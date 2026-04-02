import { useTranslations } from "../i18n/utils";

type SupportedLang = "en" | "zh-TW";

type NewsPageMessageKey =
	| "newsPage.search.error"
	| "newsPage.archive.error"
	| "newsPage.topic.timelineError";

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
	titleEn?: string | null;
	summary: string | null;
	summaryEn?: string | null;
	latestNewsTime: string;
	totalNewsCount: number;
	monthNewsCount: number;
	latestItems: TopicArchiveNewsItem[];
};

function replacePlaceholders(template: string, values: Record<string, number | string>) {
	let result = template;

	for (const [key, value] of Object.entries(values)) {
		result = result.split(`{${key}}`).join(String(value));
	}

	return result;
}

export class NewsPageRequestError extends Error {
	translationKey: NewsPageMessageKey;
	detail?: string;

	constructor(translationKey: NewsPageMessageKey, detail?: string) {
		super(detail ?? translationKey);
		this.name = "NewsPageRequestError";
		this.translationKey = translationKey;
		this.detail = detail;
		Object.setPrototypeOf(this, NewsPageRequestError.prototype);
	}
}

export function createNewsPageRequestError(translationKey: NewsPageMessageKey, detail?: string) {
	return new NewsPageRequestError(translationKey, detail);
}

export function getNewsPageErrorMessage(error: unknown, lang: SupportedLang, fallbackKey: NewsPageMessageKey) {
	const t = useTranslations(lang);

	if (error instanceof NewsPageRequestError) {
		return t(error.translationKey);
	}

	return t(fallbackKey);
}

export function formatNewsTopicsLabel(lang: SupportedLang) {
	return useTranslations(lang)("newsPage.topics.label");
}

export function formatArchiveMonthLabel(month: string, lang: SupportedLang) {
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

export function formatArchiveMonthSummary(topicCount: number, newsCount: number, lang: SupportedLang) {
	return replacePlaceholders(useTranslations(lang)("newsPage.archive.monthSummary"), {
		topicCount,
		newsCount,
	});
}

export function formatSearchResultsHint(query: string, lang: SupportedLang) {
	return replacePlaceholders(useTranslations(lang)("newsPage.search.resultsHint"), {
		query,
	});
}

export function formatTopicMeta(topic: TopicArchiveCard, lang: SupportedLang) {
	return replacePlaceholders(useTranslations(lang)("newsPage.topic.meta"), {
		monthNewsCount: topic.monthNewsCount,
		totalNewsCount: topic.totalNewsCount,
	});
}

export function formatTopicTotalNewsCount(totalNewsCount: number, lang: SupportedLang) {
	return replacePlaceholders(useTranslations(lang)("newsPage.topic.totalCount"), {
		totalNewsCount,
	});
}

export function formatStoryCount(newsCount: number, lang: SupportedLang) {
	return replacePlaceholders(useTranslations(lang)("newsPage.topic.storyCount"), {
		newsCount,
	});
}

export function getTopicDisplayTitle(topic: TopicArchiveCard, lang: SupportedLang) {
	if (lang === "en") {
		return topic.titleEn || topic.title;
	}

	return topic.title;
}

export function getTopicDisplaySummary(topic: TopicArchiveCard, lang: SupportedLang) {
	if (lang === "en") {
		return topic.summaryEn || topic.summary;
	}

	return topic.summary;
}

export function getTopicPreviewItems(topic: TopicArchiveCard, limit = 5) {
	return topic.latestItems.slice(0, limit);
}

export function getVisibleMonthKeys(months: string[], visibleMonthCount: number) {
	return months.slice(0, Math.max(0, visibleMonthCount));
}
