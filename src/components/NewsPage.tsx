import React, { useEffect, useState } from "react";
import { QueryClient, useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { ArrowUpRight, ExternalLink, Loader2, Search, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { timeAgo } from "../lib/utils";
import {
	formatArchiveMonthLabel,
	formatNewsTopicsLabel,
	formatTopicMeta,
	getTopicDisplaySummary,
	getTopicDisplayTitle,
	getTopicPreviewItems,
	getVisibleMonthKeys,
	type TopicArchiveCard,
	type TopicArchiveNewsItem,
} from "./news-page-format";
import { applyDialogScrollLock } from "./news-page-scroll-lock";
import { dialogBackdropVariants, dialogLayerClassNames, dialogPanelVariants } from "./news-page-motion";

const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			staleTime: 1000 * 60 * 5,
			gcTime: 1000 * 60 * 10,
			retry: 3,
			refetchOnWindowFocus: false,
		},
	},
});

type NewsItem = {
	url: string;
	time: string;
	title?: string;
	title_en?: string | null;
	source?: string | null;
};

type NewsResponse = {
	success: boolean;
	data: NewsItem[];
	totalPages: number;
	message?: string;
};

type ArchiveMonth = {
	month: string;
	topics: TopicArchiveCard[];
};

type ArchiveMonthResponse = {
	success: boolean;
	months: ArchiveMonth[];
	totalMonths: number;
	error?: string;
};

type ArchiveMonthIndexEntry = {
	month: string;
	newsCount: number;
	topicCount: number;
	latestNewsTime: string;
};

type ArchiveMonthIndexResponse = {
	success: boolean;
	months: ArchiveMonthIndexEntry[];
	totalMonths: number;
	error?: string;
};

type TopicDetailResponse = {
	success: boolean;
	topic: {
		id: string;
		emoji: string | null;
		title: string;
		titleEn?: string | null;
		summary: string | null;
		summaryEn?: string | null;
		newsCount: number;
		latestNewsTime: string | null;
		firstNewsTime: string | null;
	};
	totalNewsCount: number;
	months: Array<{
		month: string;
		items: TopicArchiveNewsItem[];
	}>;
	error?: string;
};

const PAGE_SIZE = 20;
const ARCHIVE_MONTHS = 240;

function mapTopicNewsItem(item: any): TopicArchiveNewsItem {
	return {
		url: item.url,
		title: item.title,
		title_en: item.title_en ?? item.titleEn ?? null,
		source: item.source ?? null,
		time: item.time,
	};
}

function mapTopicCard(card: any): TopicArchiveCard {
	return {
		id: card.id,
		emoji: card.emoji ?? null,
		title: card.title,
		titleEn: card.titleEn ?? card.title_en ?? null,
		summary: card.summary ?? null,
		summaryEn: card.summaryEn ?? card.summary_en ?? null,
		latestNewsTime: card.latestNewsTime,
		totalNewsCount: card.totalNewsCount,
		monthNewsCount: card.monthNewsCount,
		latestItems: Array.isArray(card.latestItems) ? card.latestItems.map(mapTopicNewsItem) : [],
	};
}

async function fetchNews({ pageParam = 1, query = "" }: { pageParam?: number; query?: string }): Promise<NewsResponse> {
	const params = new URLSearchParams();
	params.set("page", String(pageParam));
	params.set("pageSize", String(PAGE_SIZE));
	if (query) params.set("q", query);

	const res = await fetch(`https://aifferent.juchunko.com/api/news?${params.toString()}`);
	if (!res.ok) {
		throw new Error("Server returned error");
	}
	const payload = await res.json();
	if (!payload || !payload.success) {
		throw new Error(payload?.message || payload?.error || "Failed to fetch");
	}
	return payload;
}

async function fetchArchiveMonthIndex(): Promise<ArchiveMonthIndexEntry[]> {
	const params = new URLSearchParams({
		months: String(ARCHIVE_MONTHS),
	});

	const res = await fetch(`https://aifferent.juchunko.com/api/news/archive/months?${params.toString()}`);
	if (!res.ok) {
		throw new Error("Server returned error");
	}

	const payload = (await res.json()) as ArchiveMonthIndexResponse;
	if (!payload.success) {
		throw new Error(payload.error || "Failed to load news topics");
	}

	return Array.isArray(payload.months) ? payload.months : [];
}

async function fetchArchiveMonth(month: string): Promise<ArchiveMonth | null> {
	const params = new URLSearchParams({
		month,
		previewLimit: "5",
	});

	const res = await fetch(`https://aifferent.juchunko.com/api/news/archive?${params.toString()}`);
	if (!res.ok) {
		throw new Error("Server returned error");
	}

	const payload = (await res.json()) as ArchiveMonthResponse;
	if (!payload.success) {
		throw new Error(payload.error || "Failed to load month topics");
	}

	const monthEntry = Array.isArray(payload.months) ? payload.months[0] : null;
	if (!monthEntry) {
		return null;
	}

	return {
		month: monthEntry.month,
		topics: Array.isArray(monthEntry.topics) ? monthEntry.topics.map(mapTopicCard) : [],
	};
}

async function fetchTopicDetail(topicId: string): Promise<TopicDetailResponse> {
	const res = await fetch(`https://aifferent.juchunko.com/api/topics/${encodeURIComponent(topicId)}`);
	if (!res.ok) {
		throw new Error("Server returned error");
	}

	const payload = (await res.json()) as TopicDetailResponse;
	if (!payload.success) {
		throw new Error(payload.error || "Failed to load topic");
	}

	return {
		...payload,
		months: Array.isArray(payload.months)
			? payload.months.map((month) => ({
					month: month.month,
					items: Array.isArray(month.items) ? month.items.map(mapTopicNewsItem) : [],
				}))
			: [],
	};
}

function MonthTopicsSection({
	monthMeta,
	lang,
	onOpenTopic,
}: {
	monthMeta: ArchiveMonthIndexEntry;
	lang: "en" | "zh-TW";
	onOpenTopic: (topic: TopicArchiveCard) => void;
}) {
	const {
		data: archiveMonth,
		isLoading,
		isError,
		error,
	} = useQuery(
		{
			queryKey: ["news-archive-month", monthMeta.month],
			queryFn: () => fetchArchiveMonth(monthMeta.month),
		},
		queryClient,
	);

	return (
		<section className="space-y-4">
			<div className="flex items-center justify-between gap-4">
				<h2 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">
					{formatArchiveMonthLabel(monthMeta.month, lang)}
				</h2>

				<p className="text-sm text-gray-500 dark:text-gray-400">
					{lang === "en"
						? `${monthMeta.topicCount} topics · ${monthMeta.newsCount} stories`
						: `${monthMeta.topicCount} 個主題・${monthMeta.newsCount} 則新聞`}
				</p>
			</div>

			{isLoading && (
				<div className="flex items-center justify-center rounded-2xl border border-dashed border-black/10 p-10 text-sm text-gray-500 dark:border-white/10 dark:text-gray-400">
					{lang === "en" ? "Loading news topics..." : "新聞主題載入中..."}
				</div>
			)}

			{isError && (
				<div className="rounded-2xl border border-red-200 bg-red-50/80 p-4 text-sm text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
					{error?.message || (lang === "en" ? "Failed to load news topics" : "載入新聞主題失敗")}
				</div>
			)}

			{archiveMonth && archiveMonth.topics.length === 0 && !isLoading && !isError && (
				<div className="rounded-2xl border border-dashed border-black/10 p-8 text-center text-sm text-gray-500 dark:border-white/10 dark:text-gray-400">
					{lang === "en" ? "No news topics in this month yet." : "這個月份目前還沒有新聞主題。"}
				</div>
			)}

			{archiveMonth && archiveMonth.topics.length > 0 && (
				<div className="space-y-4">
					{archiveMonth.topics.map((topic) => (
						<article key={`${monthMeta.month}-${topic.id}`} className="rounded-2xl border p-4">
							<div className="relative flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
								<div className="pointer-events-none absolute right-0 text-4xl opacity-25 max-md:top-0 md:bottom-0 md:text-6xl">
									{topic.emoji || "📰"}
								</div>
								<div className="flex min-w-0 flex-1 flex-col gap-1">
									<h3 className="text-lg leading-snug font-semibold text-gray-900 dark:text-white">{getTopicDisplayTitle(topic, lang)}</h3>
									<p className="text-sm text-gray-500 dark:text-gray-400">{formatTopicMeta(topic, lang)}</p>
									{getTopicDisplaySummary(topic, lang) && (
										<p className="max-w-2xl text-sm leading-6 text-gray-600 dark:text-gray-300">{getTopicDisplaySummary(topic, lang)}</p>
									)}
								</div>

								<button
									type="button"
									onClick={() => onOpenTopic(topic)}
									className="inline-flex h-11 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-black/10 px-4 text-sm font-medium backdrop-blur-sm transition hover:bg-black/[0.04] dark:border-white/10 dark:hover:bg-white/5"
								>
									{lang === "en" ? "View more" : "查看更多"}
								</button>
							</div>

							<div className="mt-4 grid gap-2">
								{getTopicPreviewItems(topic).map((item) => {
									const title = lang === "en" ? item.title_en || item.title : item.title;
									return (
										<a
											key={item.url}
											href={item.url}
											target="_blank"
											rel="noopener noreferrer"
											className="group flex items-start gap-3 rounded-lg border border-black/5 bg-white/70 px-3 py-2 transition hover:border-black/10 hover:bg-white dark:border-white/10 dark:bg-white/[0.03] dark:hover:bg-white/[0.06]"
										>
											<div className="min-w-0 flex-1">
												<p className="text-sm leading-6 font-medium text-gray-900 dark:text-white">{title}</p>
												<div className="mt-1 flex flex-wrap items-center text-xs text-gray-500 dark:text-gray-400">
													<span>{timeAgo(item.time, lang)}</span>
													{item.source && (
														<>
															<span className="mx-1 text-gray-500">·</span>
															<span>{item.source}</span>
														</>
													)}
												</div>
											</div>
											<ExternalLink className="mt-0.5 size-4 shrink-0 text-gray-400 transition group-hover:text-gray-700 dark:group-hover:text-white" />
										</a>
									);
								})}
							</div>
						</article>
					))}
				</div>
			)}
		</section>
	);
}

export default function NewsPage({ lang }: { lang: "en" | "zh-TW" }) {
	const [searchDraft, setSearchDraft] = useState("");
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedTopicPreview, setSelectedTopicPreview] = useState<TopicArchiveCard | null>(null);
	const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
	const [visibleMonthCount, setVisibleMonthCount] = useState(1);

	const {
		data: archiveMonthIndex,
		isLoading: isMonthIndexLoading,
		isError: isMonthIndexError,
		error: monthIndexError,
	} = useQuery(
		{
			queryKey: ["news-archive-month-index", ARCHIVE_MONTHS],
			queryFn: fetchArchiveMonthIndex,
		},
		queryClient,
	);

	const {
		data: selectedTopic,
		isLoading: isTopicLoading,
		isError: isTopicError,
	} = useQuery(
		{
			queryKey: ["topic-detail", selectedTopicId],
			queryFn: () => fetchTopicDetail(selectedTopicId as string),
			enabled: Boolean(selectedTopicId),
		},
		queryClient,
	);

	const {
		data: searchData,
		error: searchError,
		fetchNextPage,
		hasNextPage,
		isFetchingNextPage,
		isLoading: isSearchLoading,
		isError: isSearchError,
	} = useInfiniteQuery(
		{
			queryKey: ["news-search", searchQuery],
			queryFn: ({ pageParam }) => fetchNews({ pageParam, query: searchQuery }),
			initialPageParam: 1,
			getNextPageParam: (lastPage, pages) => {
				if (pages.length < lastPage.totalPages) {
					return pages.length + 1;
				}
				return undefined;
			},
			enabled: Boolean(searchQuery),
		},
		queryClient,
	);

	const searchItems = searchData?.pages.flatMap((page) => page.data) || [];
	const visibleMonthKeys = getVisibleMonthKeys(
		(archiveMonthIndex ?? []).map((month) => month.month),
		visibleMonthCount,
	);
	const visibleMonths = (archiveMonthIndex ?? []).filter((month) => visibleMonthKeys.includes(month.month));

	useEffect(() => {
		if (!searchQuery) return;

		const observer = new IntersectionObserver(
			(entries) => {
				if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
					fetchNextPage();
				}
			},
			{ rootMargin: "200px" },
		);

		const sentinel = document.getElementById("news-search-sentinel");
		if (sentinel) {
			observer.observe(sentinel);
		}

		return () => observer.disconnect();
	}, [fetchNextPage, hasNextPage, isFetchingNextPage, searchQuery]);

	useEffect(() => {
		if (searchQuery) return;

		const totalMonths = archiveMonthIndex?.length ?? 0;
		if (totalMonths === 0 || visibleMonthCount >= totalMonths) return;

		const observer = new IntersectionObserver(
			(entries) => {
				if (entries[0]?.isIntersecting) {
					setVisibleMonthCount((current) => Math.min(current + 1, totalMonths));
				}
			},
			{ rootMargin: "320px" },
		);

		const sentinel = document.getElementById("news-months-sentinel");
		if (sentinel) {
			observer.observe(sentinel);
		}

		return () => observer.disconnect();
	}, [archiveMonthIndex, searchQuery, visibleMonthCount]);

	useEffect(() => {
		if (!searchQuery) {
			setVisibleMonthCount(1);
		}
	}, [searchQuery]);

	useEffect(() => {
		if (selectedTopicId) {
			return applyDialogScrollLock(document);
		}
	}, [selectedTopicId]);

	const handleSearchSubmit = (event: React.FormEvent) => {
		event.preventDefault();
		setSearchQuery(searchDraft.trim());
	};

	const clearSearch = () => {
		setSearchDraft("");
		setSearchQuery("");
	};

	const openTopicDialog = (topic: TopicArchiveCard) => {
		setSelectedTopicPreview(topic);
		setSelectedTopicId(topic.id);
	};

	const closeTopicDialog = () => {
		setSelectedTopicId(null);
	};

	const archiveEmpty = !isMonthIndexLoading && !isMonthIndexError && (archiveMonthIndex?.length ?? 0) === 0;

	return (
		<div>
			<section className="mb-8 rounded-xl border bg-white/80 p-4 backdrop-blur-sm dark:bg-white/5">
				<form id="news-search-form-react" className="flex flex-col gap-2 md:flex-row" onSubmit={handleSearchSubmit}>
					<label className="sr-only" htmlFor="q-react">
						{lang === "en" ? "Search" : "搜尋"}
					</label>
					<div className="relative flex-1">
						<Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-gray-400" />
						<input
							id="q-react"
							name="q"
							type="search"
							value={searchDraft}
							onChange={(event) => setSearchDraft(event.target.value)}
							placeholder={lang === "en" ? "Search news by keyword..." : "輸入關鍵字搜尋新聞..."}
							className="h-12 w-full rounded-lg border border-black/10 bg-transparent pr-4 pl-10 outline-0 transition focus-visible:border-black/30 dark:border-white/10 dark:focus-visible:border-white/30"
						/>
					</div>
					<div className="flex gap-2">
						<button
							type="submit"
							className="inline-flex h-12 cursor-pointer items-center justify-center rounded-lg bg-black px-5 text-sm font-medium text-white transition hover:bg-black/85 dark:bg-white dark:text-black dark:hover:bg-white/85"
						>
							{lang === "en" ? "Search" : "搜尋"}
						</button>
						{searchQuery && (
							<button
								type="button"
								onClick={clearSearch}
								className="inline-flex h-12 cursor-pointer items-center justify-center rounded-xl border border-black/10 px-4 text-sm font-medium transition hover:bg-black/[0.03] dark:border-white/10 dark:hover:bg-white/5"
							>
								{lang === "en" ? "Clear" : "清除"}
							</button>
						)}
					</div>
				</form>
				{searchQuery && (
					<p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
						{lang === "en"
							? `Showing search results for “${searchQuery}”. Clear to return to news topics.`
							: `目前顯示「${searchQuery}」的搜尋結果；清除後可回到新聞主題。`}
					</p>
				)}
			</section>

			{searchQuery ? (
				<section className="grid gap-3">
					{searchItems.map((item, index) => {
						const title = lang === "en" ? item.title_en || item.title || "" : item.title || "";
						return (
							<a
								key={`${item.url}-${index}`}
								href={item.url}
								target="_blank"
								rel="noopener noreferrer"
								className="group rounded-2xl border border-black/5 bg-white/85 p-5 text-left shadow-sm shadow-black/5 transition hover:-translate-y-0.5 hover:border-black/10 hover:shadow-md dark:border-white/10 dark:bg-white/5 dark:hover:border-white/20"
							>
								<div className="flex items-start justify-between gap-4">
									<div className="min-w-0 flex-1">
										<h3 className="text-base leading-snug font-semibold text-gray-900 dark:text-white">{title}</h3>
										<div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
											{item.source && <span>{item.source}</span>}
											<span>{timeAgo(item.time, lang)}</span>
										</div>
									</div>
									<ArrowUpRight className="mt-0.5 size-4 shrink-0 text-gray-400 transition group-hover:text-gray-700 dark:group-hover:text-white" />
								</div>
							</a>
						);
					})}

					<div className="my-4 text-center text-sm text-gray-500 dark:text-gray-400">
						{isSearchLoading && (lang === "en" ? "Loading search results..." : "搜尋結果載入中...")}
						{isFetchingNextPage && (lang === "en" ? "Loading more..." : "載入更多中...")}
					</div>

					{isSearchError && (
						<div className="my-4 text-center text-sm text-red-500">
							{searchError?.message || (lang === "en" ? "Failed to load news" : "載入新聞失敗")}
						</div>
					)}

					{!isSearchLoading && !isSearchError && searchItems.length === 0 && (
						<div className="rounded-2xl border border-dashed border-black/10 p-8 text-center text-sm text-gray-500 dark:border-white/10 dark:text-gray-400">
							{lang === "en" ? "No news found for this keyword." : "找不到符合關鍵字的新聞。"}
						</div>
					)}

					<div id="news-search-sentinel" style={{ minHeight: 1 }} />
				</section>
			) : (
				<section className="space-y-10">
					{isMonthIndexLoading && (
						<div className="flex items-center justify-center rounded-2xl border border-dashed border-black/10 p-10 text-sm text-gray-500 dark:border-white/10 dark:text-gray-400">
							{lang === "en" ? "Loading news topics..." : "新聞主題載入中..."}
						</div>
					)}

					{isMonthIndexError && (
						<div className="rounded-2xl border border-red-200 bg-red-50/80 p-4 text-sm text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
							{monthIndexError?.message || (lang === "en" ? "Failed to load news topics" : "載入新聞主題失敗")}
						</div>
					)}

					{archiveEmpty && (
						<div className="rounded-2xl border border-dashed border-black/10 p-8 text-center text-sm text-gray-500 dark:border-white/10 dark:text-gray-400">
							{lang === "en" ? "No news topics yet." : "目前尚無可瀏覽的新聞主題。"}
						</div>
					)}

					{visibleMonths.map((monthMeta) => (
						<MonthTopicsSection key={monthMeta.month} monthMeta={monthMeta} lang={lang} onOpenTopic={openTopicDialog} />
					))}

					{visibleMonths.length > 0 && visibleMonths.length < (archiveMonthIndex?.length ?? 0) && (
						<>
							<div className="text-center text-sm text-gray-500 dark:text-gray-400">
								{lang === "en" ? "Scroll to load the next month..." : "往下捲動以載入下一個月份..."}
							</div>
							<div id="news-months-sentinel" style={{ minHeight: 1 }} />
						</>
					)}

					{visibleMonths.length > 0 && visibleMonths.length >= (archiveMonthIndex?.length ?? 0) && (
						<div className="text-center text-sm text-gray-500 dark:text-gray-400">
							{lang === "en" ? "All available months are loaded." : "已載入所有可用月份。"}
						</div>
					)}
				</section>
			)}

			<AnimatePresence initial={false} onExitComplete={() => setSelectedTopicPreview(null)}>
				{selectedTopicId && (
					<motion.div
						className={dialogLayerClassNames.overlay}
						onClick={closeTopicDialog}
						variants={dialogBackdropVariants}
						initial="closed"
						animate="open"
						exit="closed"
					>
						<motion.div
							className={dialogLayerClassNames.panel}
							onClick={(event) => event.stopPropagation()}
							variants={dialogPanelVariants}
							initial="closed"
							animate="open"
							exit="closed"
						>
							<div className="border-b border-black/5 px-5 py-4 dark:border-white/10">
								<div className="flex items-start justify-between gap-4">
									<div className="min-w-0 flex-1">
										{selectedTopic?.topic ? (
											<div className="flex items-start gap-3">
												<div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-black/[0.04] text-2xl dark:bg-white/8">
													{selectedTopic.topic.emoji || selectedTopicPreview?.emoji || "📰"}
												</div>
												<div className="min-w-0 flex-1">
													<h2 className="text-2xl leading-tight font-semibold text-gray-900 dark:text-white">
														{lang === "en" ? selectedTopic.topic.titleEn || selectedTopic.topic.title : selectedTopic.topic.title}
													</h2>
													<p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
														{lang === "en"
															? `${selectedTopic.totalNewsCount} news items across the same topic`
															: `同一主題共 ${selectedTopic.totalNewsCount} 則新聞`}
													</p>
													{(lang === "en" ? selectedTopic.topic.summaryEn || selectedTopic.topic.summary : selectedTopic.topic.summary) && (
														<p className="mt-3 max-w-2xl text-sm leading-6 text-gray-600 dark:text-gray-300">
															{lang === "en" ? selectedTopic.topic.summaryEn || selectedTopic.topic.summary : selectedTopic.topic.summary}
														</p>
													)}
												</div>
											</div>
										) : selectedTopicPreview ? (
											<div className="mt-3 flex items-start gap-3">
												<div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-black/[0.04] text-2xl dark:bg-white/8">
													{selectedTopicPreview.emoji || "📰"}
												</div>
												<div className="min-w-0 flex-1">
													<h2 className="text-2xl leading-tight font-semibold text-gray-900 dark:text-white">
														{getTopicDisplayTitle(selectedTopicPreview, lang)}
													</h2>
													{getTopicDisplaySummary(selectedTopicPreview, lang) && (
														<p className="mt-3 max-w-2xl text-sm leading-6 text-gray-600 dark:text-gray-300">
															{getTopicDisplaySummary(selectedTopicPreview, lang)}
														</p>
													)}
												</div>
											</div>
										) : (
											<h2 className="text-lg font-semibold text-gray-900 dark:text-white">
												{lang === "en" ? "Loading topic..." : "主題載入中..."}
											</h2>
										)}
									</div>

									<button
										type="button"
										onClick={closeTopicDialog}
										className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-black/10 transition hover:bg-black/[0.04] dark:border-white/10 dark:hover:bg-white/5"
									>
										<X className="size-4" />
									</button>
								</div>
							</div>

							<div className="max-h-[65vh] overflow-y-auto px-5 py-5">
								{isTopicLoading && (
									<div className="flex items-center justify-center py-12 text-gray-500 dark:text-gray-400">
										<Loader2 className="size-5 animate-spin" />
									</div>
								)}

								{isTopicError && (
									<div className="rounded-2xl border border-red-200 bg-red-50/80 p-4 text-sm text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
										{lang === "en" ? "Failed to load topic timeline" : "載入主題時間線失敗"}
									</div>
								)}

								{selectedTopic?.months?.map((month) => (
									<section key={month.month} className="mb-8 last:mb-0">
										<div className="mb-3 flex items-center justify-between gap-3">
											<h3 className="text-lg font-semibold text-gray-900 dark:text-white">{formatArchiveMonthLabel(month.month, lang)}</h3>
											<p className="text-xs text-gray-500 dark:text-gray-400">
												{lang === "en" ? `${month.items.length} stories` : `${month.items.length} 則新聞`}
											</p>
										</div>

										<div className="grid gap-2">
											{month.items.map((item) => {
												const title = lang === "en" ? item.title_en || item.title : item.title;
												return (
													<a
														key={item.url}
														href={item.url}
														target="_blank"
														rel="noopener noreferrer"
														className="group flex items-start gap-3 rounded-2xl border border-black/5 px-4 py-3 transition hover:border-black/10 hover:bg-black/[0.02] dark:border-white/10 dark:hover:bg-white/[0.03]"
													>
														<div className="min-w-0 flex-1">
															<p className="text-sm leading-6 font-medium text-gray-900 dark:text-white">{title}</p>
															<div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
																{item.source && <span>{item.source}</span>}
																<span>{timeAgo(item.time, lang)}</span>
															</div>
														</div>
														<ArrowUpRight className="mt-0.5 size-4 shrink-0 text-gray-400 transition group-hover:text-gray-700 dark:group-hover:text-white" />
													</a>
												);
											})}
										</div>
									</section>
								))}
							</div>
						</motion.div>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}
