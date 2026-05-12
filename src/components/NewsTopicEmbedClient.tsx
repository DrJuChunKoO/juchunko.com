import React, { useEffect, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import {
	buildNewsTopicDetailUrl,
	flattenNewsTopicItems,
	getNewsTopicItemTitle,
	normalizeNewsTopicLimit,
	type NewsTopicEmbedItem,
	type NewsTopicEmbedLang,
	type NewsTopicEmbedMonth,
} from "./news-topic-embed";

type NewsTopicEmbedResponse = {
	success: boolean;
	topic?: {
		id: string;
		emoji?: string | null;
		title: string;
		titleEn?: string | null;
		summary?: string | null;
		summaryEn?: string | null;
	};
	totalNewsCount?: number;
	months?: NewsTopicEmbedMonth[];
	error?: string;
};

type NewsTopicEmbedClientProps = {
	topicId: string;
	lang?: NewsTopicEmbedLang;
	limit?: number;
	heading?: string;
	showSummary?: boolean;
};

const labels = {
	"zh-TW": {
		loading: "新聞主題載入中...",
		error: "目前無法載入新聞主題報導。",
		viewTopic: "查看完整新聞主題",
		storyCount: (count: number) => `同一主題共 ${count} 則新聞`,
	},
	en: {
		loading: "Loading news topic...",
		error: "Unable to load this news topic right now.",
		viewTopic: "View full news topic",
		storyCount: (count: number) => `${count} stories in this topic`,
	},
} as const;

function formatDate(value: string, lang: NewsTopicEmbedLang) {
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return value;

	return new Intl.DateTimeFormat(lang === "en" ? "en-US" : "zh-TW", {
		month: "short",
		day: "numeric",
		timeZone: "Asia/Taipei",
	}).format(date);
}

function getTopicTitle(topic: NonNullable<NewsTopicEmbedResponse["topic"]>, lang: NewsTopicEmbedLang) {
	return lang === "en" ? topic.titleEn || topic.title : topic.title;
}

function getTopicSummary(topic: NonNullable<NewsTopicEmbedResponse["topic"]>, lang: NewsTopicEmbedLang) {
	return lang === "en" ? topic.summaryEn || topic.summary : topic.summary;
}

function StoryLink({ item, lang }: { item: NewsTopicEmbedItem; lang: NewsTopicEmbedLang }) {
	return (
		<a
			href={item.url}
			target="_blank"
			rel="noreferrer"
			className="group hover:outline-primary/50 flex items-start gap-3 rounded-lg border border-black/5 bg-white/70 px-3 py-2 no-underline transition hover:border-black/10 hover:bg-white hover:outline-2 hover:outline-offset-2 dark:border-white/10 dark:bg-white/3 dark:hover:bg-white/6"
		>
			<div className="min-w-0 flex-1">
				<p className="line-clamp-2 text-sm leading-6 font-medium text-gray-900 dark:text-white">{getNewsTopicItemTitle(item, lang)}</p>
				<div className="mt-1 flex flex-wrap items-center text-xs text-gray-500 dark:text-gray-400">
					<span>{formatDate(item.time, lang)}</span>
					{item.source && (
						<>
							<span className="mx-1 text-gray-500">·</span>
							<span>{item.source}</span>
						</>
					)}
				</div>
			</div>
			<ArrowUpRight className="mt-0.5 size-4 shrink-0 text-gray-400 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-gray-700 dark:group-hover:text-white" />
		</a>
	);
}

export default function NewsTopicEmbedClient({
	topicId,
	lang = "zh-TW",
	limit = 5,
	heading,
	showSummary = true,
}: NewsTopicEmbedClientProps) {
	const [data, setData] = useState<NewsTopicEmbedResponse | null>(null);
	const [error, setError] = useState(false);
	const localeLabels = labels[lang];
	const displayLimit = normalizeNewsTopicLimit(limit);

	useEffect(() => {
		const controller = new AbortController();
		setError(false);
		setData(null);

		async function loadTopic() {
			try {
				const response = await fetch(buildNewsTopicDetailUrl(topicId), { signal: controller.signal });
				if (!response.ok) throw new Error(`HTTP ${response.status}`);

				const payload = (await response.json()) as NewsTopicEmbedResponse;
				if (!payload.success || !payload.topic) throw new Error(payload.error || "Failed to load topic");
				setData(payload);
			} catch (err) {
				if (!controller.signal.aborted) {
					console.error("Failed to load news topic", err);
					setError(true);
				}
			}
		}

		void loadTopic();

		return () => controller.abort();
	}, [topicId]);

	if (error) {
		return (
			<div className="not-prose rounded-lg border border-red-200 bg-red-50/80 p-4 text-sm text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
				{localeLabels.error}
			</div>
		);
	}

	if (!data?.topic) {
		return (
			<div className="not-prose rounded-lg border border-dashed border-black/10 p-5 text-sm text-gray-500 dark:border-white/10 dark:text-gray-400">
				{localeLabels.loading}
			</div>
		);
	}

	const stories = flattenNewsTopicItems(data.months ?? [], displayLimit);
	const summary = showSummary ? getTopicSummary(data.topic, lang) : null;
	const newsPageHref = `/${lang}/news?topic=${encodeURIComponent(topicId)}`;

	return (
		<section className="not-prose my-8 overflow-hidden rounded-2xl border">
			<div className="border-b p-4 dark:border-white/10">
				<div className="flex items-start gap-4">
					<div className="flex min-w-0 flex-1 flex-col gap-1">
						<div className="text-sm text-gray-500 dark:text-gray-400">
							{heading || localeLabels.storyCount(data.totalNewsCount ?? stories.length)}
						</div>
						<h3 className="text-xl leading-tight font-semibold text-gray-900 dark:text-white">{getTopicTitle(data.topic, lang)}</h3>
						{summary && <p className="max-w-2xl text-sm leading-6 text-gray-600 dark:text-gray-300">{summary}</p>}
					</div>
				</div>
			</div>

			<div className="grid gap-2 p-4">
				{stories.map((item) => (
					<StoryLink key={item.url} item={item} lang={lang} />
				))}
			</div>

			<div className="border-border relative flex items-center justify-between border-t">
				<div className="px-4 py-1 text-sm text-gray-500 dark:text-gray-400">
					{localeLabels.storyCount(data.totalNewsCount ?? stories.length)}
				</div>
				<a
					href={newsPageHref}
					className="hover:outline-primary/50 mx-4 my-2 inline-flex h-9 items-center justify-center gap-1 rounded-lg border border-black/10 px-3 text-sm font-medium text-gray-700 no-underline backdrop-blur-sm transition hover:bg-black/4 hover:outline-2 hover:outline-offset-2 dark:border-white/10 dark:text-gray-300 dark:hover:bg-white/5 dark:hover:text-white"
				>
					{localeLabels.viewTopic}
					<ArrowUpRight className="h-4 w-4" />
				</a>
			</div>
		</section>
	);
}
