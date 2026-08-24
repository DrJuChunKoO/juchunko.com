import React, { useEffect, useState } from "react";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { timeAgo } from "../lib/utils";
import {
	buildNewsTopicDetailUrl,
	flattenNewsTopicItems,
	getNewsTopicItemTitle,
	normalizeNewsTopicLimit,
	type NewsTopicEmbedItem,
	type NewsTopicEmbedLang,
	type NewsTopicEmbedMonth,
} from "./news-topic-embed";
import { getNewsSourceLogo } from "./news-source-logo";

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
		storyCount: (count: number) => `共 ${count} 則新聞`,
	},
	en: {
		loading: "Loading news topic...",
		error: "Unable to load this news topic right now.",
		viewTopic: "View full news topic",
		storyCount: (count: number) => `${count} stories`,
	},
} as const;

function getTopicTitle(topic: NonNullable<NewsTopicEmbedResponse["topic"]>, lang: NewsTopicEmbedLang) {
	return lang === "en" ? topic.titleEn || topic.title : topic.title;
}

function getTopicSummary(topic: NonNullable<NewsTopicEmbedResponse["topic"]>, lang: NewsTopicEmbedLang) {
	return lang === "en" ? topic.summaryEn || topic.summary : topic.summary;
}

function StoryLink({ item, lang }: { item: NewsTopicEmbedItem; lang: NewsTopicEmbedLang }) {
	const sourceMark = item.source?.trim().charAt(0) || "N";
	const sourceLogo = getNewsSourceLogo(item.source);

	return (
		<a
			href={item.url}
			target="_blank"
			rel="noopener noreferrer"
			className="group grid grid-cols-[2.25rem_minmax(0,1fr)_auto] items-center gap-3 rounded-lg px-2 py-3 no-underline transition-[background-color,transform] duration-150 ease-out hover:bg-gray-100 active:scale-[0.99] dark:hover:bg-white/6"
		>
			<span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-black/8 bg-white text-xs font-semibold text-gray-600 dark:border-white/10 dark:bg-white/5 dark:text-gray-300">
				{sourceLogo ? (
					<img
						src={sourceLogo}
						alt=""
						className="size-full rounded-[0.45rem] object-contain p-1 saturate-[0.35] transition-[filter] duration-150 ease-out group-hover:saturate-100"
						loading="lazy"
						decoding="async"
					/>
				) : (
					sourceMark
				)}
			</span>
			<div className="min-w-0 flex-1">
				<p className="text-sm leading-5 font-medium text-gray-900 sm:text-[15px] dark:text-gray-100">{getNewsTopicItemTitle(item, lang)}</p>
				<div className="mt-1 flex flex-wrap items-center text-xs text-gray-500 dark:text-gray-400">
					{item.source && (
						<>
							<span>{item.source}</span>
							<span className="mx-1.5 text-gray-300 dark:text-gray-600">/</span>
						</>
					)}
					<span>{timeAgo(item.time, lang)}</span>
				</div>
			</div>
			<span
				aria-hidden="true"
				className="flex size-8 shrink-0 items-center justify-center text-gray-400 transition-colors duration-150 ease-out group-hover:text-black dark:text-gray-500 dark:group-hover:text-white"
			>
				<span className="relative size-4 overflow-hidden">
					<ArrowUpRight className="absolute inset-0 size-4 transition-transform duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-full group-hover:-translate-y-full motion-reduce:transition-none motion-reduce:group-hover:translate-none" />
					<ArrowUpRight className="absolute inset-0 size-4 translate-x-[-100%] translate-y-full transition-transform duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-none motion-reduce:hidden" />
				</span>
			</span>
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
		<section className="not-prose my-8 overflow-hidden rounded-2xl border border-black/10 bg-white dark:border-white/10 dark:bg-white/3">
			<div className="grid grid-cols-[2.25rem_minmax(0,1fr)] items-start gap-3 px-5 py-5 sm:px-6 sm:py-6">
				<div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-lg dark:bg-white/8">
					<span aria-hidden="true">{data.topic.emoji || "📰"}</span>
				</div>
				<div className="min-w-0">
					<p className="mb-1.5 text-xs font-medium text-gray-500 dark:text-gray-400">
						{heading || localeLabels.storyCount(data.totalNewsCount ?? stories.length)}
					</p>
					<h3 className="text-lg leading-snug font-semibold tracking-[-0.02em] text-gray-950 sm:text-xl dark:text-white">
						{getTopicTitle(data.topic, lang)}
					</h3>
					{summary && <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600 dark:text-gray-300">{summary}</p>}
				</div>
			</div>

			<div className="grid border-t border-black/8 px-3 py-2 sm:px-4 dark:border-white/8">
				{stories.map((item) => (
					<StoryLink key={item.url} item={item} lang={lang} />
				))}
			</div>

			<div className="flex flex-wrap items-center justify-between gap-3 border-t border-black/8 bg-gray-50/70 px-5 py-3 sm:px-6 dark:border-white/8 dark:bg-white/3">
				<div className="text-xs font-medium text-gray-500 dark:text-gray-400">
					{localeLabels.storyCount(data.totalNewsCount ?? stories.length)}
				</div>
				<a
					href={newsPageHref}
					className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-lg bg-black px-4 text-xs font-semibold text-white no-underline transition-[background-color,transform] duration-150 ease-out hover:bg-black/75 active:scale-[0.97] dark:bg-white dark:text-black dark:hover:bg-white/80"
				>
					{localeLabels.viewTopic}
					<ArrowRight className="size-3.5" />
				</a>
			</div>
		</section>
	);
}
