import React, { useCallback, useEffect, useRef, useState } from "react";
import { QueryClient, useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { ArrowUpRight, Search, X } from "lucide-react";
import { Loader } from "./Loader";
import { AnimatePresence, motion } from "motion/react";
import { useTranslations } from "../i18n/utils";
import { timeAgo } from "../lib/utils";
import {
	createNewsPageRequestError,
	formatArchiveMonthLabel,
	formatArchiveMonthSummary,
	formatSearchResultsHint,
	formatStoryCount,
	formatTopicMeta,
	formatTopicTotalNewsCount,
	getNewsPageErrorMessage,
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

type NewsPageLang = "en" | "zh-TW";

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
		throw createNewsPageRequestError("newsPage.search.error", `HTTP ${res.status}`);
	}
	const payload = await res.json();
	if (!payload || !payload.success) {
		throw createNewsPageRequestError("newsPage.search.error", payload?.message || payload?.error || "Failed to fetch");
	}
	return payload;
}

async function fetchArchiveMonthIndex(): Promise<ArchiveMonthIndexEntry[]> {
	const params = new URLSearchParams({
		months: String(ARCHIVE_MONTHS),
	});

	const res = await fetch(`https://aifferent.juchunko.com/api/news/archive/months?${params.toString()}`);
	if (!res.ok) {
		throw createNewsPageRequestError("newsPage.archive.error", `HTTP ${res.status}`);
	}

	const payload = (await res.json()) as ArchiveMonthIndexResponse;
	if (!payload.success) {
		throw createNewsPageRequestError("newsPage.archive.error", payload.error || "Failed to load news topics");
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
		throw createNewsPageRequestError("newsPage.archive.error", `HTTP ${res.status}`);
	}

	const payload = (await res.json()) as ArchiveMonthResponse;
	if (!payload.success) {
		throw createNewsPageRequestError("newsPage.archive.error", payload.error || "Failed to load month topics");
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
		throw createNewsPageRequestError("newsPage.topic.timelineError", `HTTP ${res.status}`);
	}

	const payload = (await res.json()) as TopicDetailResponse;
	if (!payload.success) {
		throw createNewsPageRequestError("newsPage.topic.timelineError", payload.error || "Failed to load topic");
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

function getLocalizedNewsTitle(item: { title?: string; title_en?: string | null }, lang: NewsPageLang) {
	return lang === "en" ? item.title_en || item.title || "" : item.title || "";
}

function LoadingState() {
	return (
		<div className="flex items-center justify-center rounded-2xl border border-dashed border-black/10 p-10 text-sm text-gray-500 dark:border-white/10 dark:text-gray-400">
			<Loader />
		</div>
	);
}

function EmptyState({ children }: { children: React.ReactNode }) {
	return (
		<div className="rounded-2xl border border-dashed border-black/10 p-8 text-center text-sm text-gray-500 dark:border-white/10 dark:text-gray-400">
			{children}
		</div>
	);
}

function ErrorAlert({ children }: { children: React.ReactNode }) {
	return (
		<div className="rounded-2xl border border-red-200 bg-red-50/80 p-4 text-sm text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
			{children}
		</div>
	);
}

function TopicNewsLink({ item, lang }: { item: NewsItem | TopicArchiveNewsItem; lang: NewsPageLang }) {
	return (
		<a
			href={item.url}
			target="_blank"
			rel="noopener noreferrer"
			className="group hover:outline-primary/50 flex items-start gap-3 rounded-lg border border-black/5 bg-white/70 px-3 py-2 transition hover:border-black/10 hover:bg-white hover:outline-2 hover:outline-offset-2 dark:border-white/10 dark:bg-white/3 dark:hover:bg-white/6"
		>
			<div className="min-w-0 flex-1">
				<p className="text-sm leading-6 font-medium text-gray-900 dark:text-white">{getLocalizedNewsTitle(item, lang)}</p>
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
			<ArrowUpRight className="mt-0.5 size-4 shrink-0 text-gray-400 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-gray-700 dark:group-hover:text-white" />
		</a>
	);
}

function TopicCard({
	topic,
	lang,
	onOpenTopic,
}: {
	topic: TopicArchiveCard;
	lang: NewsPageLang;
	onOpenTopic: (topic: TopicArchiveCard) => void;
}) {
	const t = useTranslations(lang);

	return (
		<article className="overflow-hidden rounded-2xl border">
			<div className="relative flex flex-col gap-4 p-4 md:flex-row md:items-start md:justify-between">
				<div className="flex min-w-0 flex-1 flex-col gap-1">
					<h3 className="text-lg leading-snug font-semibold text-gray-900 dark:text-white">{getTopicDisplayTitle(topic, lang)}</h3>
					{getTopicDisplaySummary(topic, lang) && (
						<p className="max-w-2xl text-sm leading-6 text-gray-600 dark:text-gray-300">{getTopicDisplaySummary(topic, lang)}</p>
					)}
				</div>

				<button
					type="button"
					onClick={() => onOpenTopic(topic)}
					className="hover:outline-primary/50 inline-flex h-11 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-black/10 px-4 text-sm font-medium backdrop-blur-sm transition hover:bg-black/4 hover:outline-2 hover:outline-offset-2 dark:border-white/10 dark:hover:bg-white/5"
				>
					{t("newsPage.topic.viewMore")}
				</button>
			</div>

			<div className="grid gap-2 p-4 pt-0">
				{getTopicPreviewItems(topic).map((item) => (
					<TopicNewsLink key={item.url} item={item} lang={lang} />
				))}
			</div>
			<div className="border-border relative flex items-center justify-between border-t">
				<div className="px-4 py-1 text-sm text-gray-500 dark:text-gray-400">{formatTopicMeta(topic, lang)}</div>
				<div className="to-border bg-linear-to-r from-transparent px-4 py-1 text-2xl">{topic.emoji || "📰"}</div>
			</div>
		</article>
	);
}

function SearchForm({
	lang,
	searchDraft,
	searchQuery,
	onSearchDraftChange,
	onSubmit,
	onClear,
}: {
	lang: NewsPageLang;
	searchDraft: string;
	searchQuery: string;
	onSearchDraftChange: (value: string) => void;
	onSubmit: (event: React.FormEvent) => void;
	onClear: () => void;
}) {
	const t = useTranslations(lang);

	return (
		<section className="mb-8">
			<form id="news-search-form-react" onSubmit={onSubmit}>
				<label className="sr-only" htmlFor="q-react">
					{t("newsPage.search.label")}
				</label>
				<div className="group focus-within:outline-primary/50 relative flex items-center rounded-2xl border border-black/15 bg-white outline outline-2 outline-transparent transition-all focus-within:border-black/30 focus-within:outline-offset-2 dark:border-white/15 dark:bg-white/5 dark:focus-within:border-white/30">
					<Search className="pointer-events-none absolute left-5 size-5 shrink-0 text-black/30 transition group-focus-within:text-black/60 dark:text-white/30 dark:group-focus-within:text-white/60" />
					<input
						id="q-react"
						name="q"
						type="search"
						value={searchDraft}
						onChange={(event) => onSearchDraftChange(event.target.value)}
						placeholder={t("newsPage.search.placeholder")}
						className="h-14 min-w-0 flex-1 bg-transparent pr-4 pl-14 text-base outline-none placeholder:text-black/30 dark:placeholder:text-white/30"
					/>
					<div className="flex shrink-0 items-center gap-1 pr-2">
						{searchQuery && (
							<button
								type="button"
								onClick={onClear}
								className="hover:outline-primary/50 inline-flex h-9 cursor-pointer items-center justify-center rounded-lg px-3 text-sm font-medium text-black/40 transition hover:bg-black/5 hover:text-black/70 hover:outline-2 hover:outline-offset-2 dark:text-white/40 dark:hover:bg-white/8 dark:hover:text-white/70"
							>
								{t("newsPage.search.clear")}
							</button>
						)}
						<button
							type="submit"
							className="hover:outline-primary/50 inline-flex h-10 cursor-pointer items-center justify-center rounded-lg bg-black px-4 text-sm font-medium text-white transition hover:bg-black/80 hover:outline-2 hover:outline-offset-2 dark:bg-white dark:text-black dark:hover:bg-white/85"
						>
							{t("newsPage.search.submit")}
						</button>
					</div>
				</div>
			</form>
			{searchQuery && <p className="mt-3 px-1 text-sm text-black/40 dark:text-white/40">{formatSearchResultsHint(searchQuery, lang)}</p>}
		</section>
	);
}

function SearchResultsSection({
	lang,
	searchQuery,
	searchItems,
	isSearchLoading,
	isFetchingNextPage,
	isSearchError,
	searchError,
}: {
	lang: NewsPageLang;
	searchQuery: string;
	searchItems: NewsItem[];
	isSearchLoading: boolean;
	isFetchingNextPage: boolean;
	isSearchError: boolean;
	searchError: unknown;
}) {
	const t = useTranslations(lang);

	return (
		<section className="grid gap-3">
			{searchItems.map((item, index) => (
				<TopicNewsLink key={`${item.url}-${index}`} item={item} lang={lang} />
			))}

			<div className="my-4 flex items-center justify-center text-sm text-gray-500 dark:text-gray-400">
				{(isSearchLoading || isFetchingNextPage) && <Loader />}
			</div>

			{isSearchError && (
				<div className="my-4 text-center text-sm text-red-500">{getNewsPageErrorMessage(searchError, lang, "newsPage.search.error")}</div>
			)}

			{!isSearchLoading && !isSearchError && searchItems.length === 0 && <EmptyState>{t("newsPage.search.empty")}</EmptyState>}

			{searchQuery && <div id="news-search-sentinel" style={{ minHeight: 1 }} />}
		</section>
	);
}

function ArchiveSection({
	lang,
	isMonthIndexLoading,
	isMonthIndexError,
	monthIndexError,
	archiveEmpty,
	visibleMonths,
	totalMonths,
	onOpenTopic,
}: {
	lang: NewsPageLang;
	isMonthIndexLoading: boolean;
	isMonthIndexError: boolean;
	monthIndexError: unknown;
	archiveEmpty: boolean;
	visibleMonths: ArchiveMonthIndexEntry[];
	totalMonths: number;
	onOpenTopic: (topic: TopicArchiveCard) => void;
}) {
	const t = useTranslations(lang);

	return (
		<section className="space-y-10">
			{isMonthIndexLoading && <LoadingState />}

			{isMonthIndexError && <ErrorAlert>{getNewsPageErrorMessage(monthIndexError, lang, "newsPage.archive.error")}</ErrorAlert>}

			{archiveEmpty && <EmptyState>{t("newsPage.archive.empty")}</EmptyState>}

			{visibleMonths.map((monthMeta) => (
				<MonthTopicsSection key={monthMeta.month} monthMeta={monthMeta} lang={lang} onOpenTopic={onOpenTopic} />
			))}

			{visibleMonths.length > 0 && visibleMonths.length < totalMonths && (
				<>
					<div className="text-center text-sm text-gray-500 dark:text-gray-400">{t("newsPage.archive.loadNext")}</div>
					<div id="news-months-sentinel" style={{ minHeight: 1 }} />
				</>
			)}

			{visibleMonths.length > 0 && visibleMonths.length >= totalMonths && (
				<div className="text-center text-sm text-gray-500 dark:text-gray-400">{t("newsPage.archive.allLoaded")}</div>
			)}
		</section>
	);
}

function TopicDialog({
	lang,
	selectedTopicId,
	selectedTopicPreview,
	selectedTopic,
	isTopicLoading,
	isTopicError,
	topicError,
	onClose,
	onExitComplete,
}: {
	lang: NewsPageLang;
	selectedTopicId: string | null;
	selectedTopicPreview: TopicArchiveCard | null;
	selectedTopic: TopicDetailResponse | undefined;
	isTopicLoading: boolean;
	isTopicError: boolean;
	topicError: unknown;
	onClose: () => void;
	onExitComplete: () => void;
}) {
	const t = useTranslations(lang);
	const topicTitle = selectedTopic?.topic
		? lang === "en"
			? selectedTopic.topic.titleEn || selectedTopic.topic.title
			: selectedTopic.topic.title
		: selectedTopicPreview
			? getTopicDisplayTitle(selectedTopicPreview, lang)
			: null;
	const topicSummary = selectedTopic?.topic
		? lang === "en"
			? selectedTopic.topic.summaryEn || selectedTopic.topic.summary
			: selectedTopic.topic.summary
		: selectedTopicPreview
			? getTopicDisplaySummary(selectedTopicPreview, lang)
			: null;

	return (
		<AnimatePresence initial={false} onExitComplete={onExitComplete}>
			{selectedTopicId && (
				<motion.div
					className={dialogLayerClassNames.overlay}
					onClick={onClose}
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
						<div className="border-b p-4 dark:border-white/10">
							<div className="flex gap-4">
								<div className="flex min-w-0 flex-1 flex-col gap-1">
									{topicTitle ? (
										<>
											<h2 className="text-xl leading-tight font-semibold text-gray-900 dark:text-white">{topicTitle}</h2>
											{topicSummary && <p className="max-w-2xl text-sm leading-6 text-gray-600 dark:text-gray-300">{topicSummary}</p>}
										</>
									) : (
										<div className="flex items-center py-1">
											<Loader />
										</div>
									)}
								</div>

								<div className="flex flex-col items-end justify-between">
									<button
										type="button"
										onClick={onClose}
										aria-label={t("newsPage.topic.close")}
										className="hover:outline-primary/50 inline-flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-black/10 text-sm font-medium backdrop-blur-sm transition hover:bg-black/4 hover:outline-2 hover:outline-offset-2 dark:border-white/10 dark:hover:bg-white/5"
									>
										<X className="size-4" />
									</button>
								</div>
							</div>
						</div>

						<div className="max-h-[65vh] overflow-y-auto p-4">
							{isTopicLoading && (
								<div className="flex items-center justify-center py-12">
									<Loader />
								</div>
							)}

							{isTopicError && <ErrorAlert>{getNewsPageErrorMessage(topicError, lang, "newsPage.topic.timelineError")}</ErrorAlert>}

							{selectedTopic?.months?.map((month) => (
								<section key={month.month} className="mb-8 last:mb-0">
									<div className="mb-2 flex items-center justify-between gap-2">
										<h3 className="text-lg font-semibold text-gray-900 dark:text-white">{formatArchiveMonthLabel(month.month, lang)}</h3>
										<p className="text-xs text-gray-500 dark:text-gray-400">{formatStoryCount(month.items.length, lang)}</p>
									</div>

									<div className="grid gap-2">
										{month.items.map((item) => (
											<TopicNewsLink key={item.url} item={item} lang={lang} />
										))}
									</div>
								</section>
							))}
						</div>

						<div className="border-border relative flex items-center justify-between border-t">
							<div className="px-4 py-1 text-sm text-gray-500 dark:text-gray-400">
								{selectedTopic && formatTopicTotalNewsCount(selectedTopic.totalNewsCount, lang)}
							</div>
							<div className="to-border bg-linear-to-r from-transparent px-4 py-1 text-2xl">
								{selectedTopic?.topic?.emoji || selectedTopicPreview?.emoji || "📰"}
							</div>
						</div>
					</motion.div>
				</motion.div>
			)}
		</AnimatePresence>
	);
}

function MonthTopicsSection({
	monthMeta,
	lang,
	onOpenTopic,
}: {
	monthMeta: ArchiveMonthIndexEntry;
	lang: NewsPageLang;
	onOpenTopic: (topic: TopicArchiveCard) => void;
}) {
	const t = useTranslations(lang);

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
		<section id={`month-${monthMeta.month}`} className="space-y-4">
			<div className="flex items-center justify-between gap-4">
				<h2 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">
					{formatArchiveMonthLabel(monthMeta.month, lang)}
				</h2>

				<p className="text-sm text-gray-500 dark:text-gray-400">
					{formatArchiveMonthSummary(monthMeta.topicCount, monthMeta.newsCount, lang)}
				</p>
			</div>

			{isLoading && <LoadingState />}

			{isError && <ErrorAlert>{getNewsPageErrorMessage(error, lang, "newsPage.archive.error")}</ErrorAlert>}

			{archiveMonth && archiveMonth.topics.length === 0 && !isLoading && !isError && (
				<EmptyState>{t("newsPage.archive.monthEmpty")}</EmptyState>
			)}

			{archiveMonth && archiveMonth.topics.length > 0 && (
				<div className="space-y-4">
					{archiveMonth.topics.map((topic) => (
						<TopicCard key={`${monthMeta.month}-${topic.id}`} topic={topic} lang={lang} onOpenTopic={onOpenTopic} />
					))}
				</div>
			)}
		</section>
	);
}

export default function NewsPage({ lang }: { lang: NewsPageLang }) {
	const [searchDraft, setSearchDraft] = useState("");
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedTopicPreview, setSelectedTopicPreview] = useState<TopicArchiveCard | null>(null);
	const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
	const [visibleMonthCount, setVisibleMonthCount] = useState(1);

	// Map topic id → month string, populated as months load
	const topicMonthMapRef = useRef<Map<string, string>>(new Map());
	// Track whether initial URL ?topic has been handled
	const initialTopicHandledRef = useRef(false);

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
		error: topicError,
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

	// Build/update topic→month map as archive month data loads
	useEffect(() => {
		if (!archiveMonthIndex) return;
		// We rely on MonthTopicsSection to populate the map when it renders,
		// but for the initial URL topic lookup we need the month index only to
		// figure out which month to expand; the actual preview data comes later.
	}, [archiveMonthIndex]);

	// popstate: sync state when user navigates back/forward
	useEffect(() => {
		const onPopState = () => {
			const params = new URLSearchParams(window.location.search);
			const topicId = params.get("topic");
			if (topicId) {
				setSelectedTopicId(topicId);
			} else {
				setSelectedTopicId(null);
				setSelectedTopicPreview(null);
			}
		};
		window.addEventListener("popstate", onPopState);
		return () => window.removeEventListener("popstate", onPopState);
	}, []);

	// Initial URL topic: once archiveMonthIndex is loaded, handle ?topic in URL
	useEffect(() => {
		if (initialTopicHandledRef.current) return;
		if (!archiveMonthIndex || archiveMonthIndex.length === 0) return;

		const params = new URLSearchParams(window.location.search);
		const topicId = params.get("topic");
		if (!topicId) {
			initialTopicHandledRef.current = true;
			return;
		}

		initialTopicHandledRef.current = true;

		// Find which month contains this topic from the cached query data
		// We need to expand months until we find it; start by revealing all months
		// progressively until the topic's month section is in the DOM.
		const allMonthKeys = archiveMonthIndex.map((m) => m.month);

		// Try to find the month from already-loaded query cache
		const findMonthForTopic = (): string | null => {
			for (const monthKey of allMonthKeys) {
				const cached = queryClient.getQueryData<ArchiveMonth | null>(["news-archive-month", monthKey]);
				if (cached?.topics.some((t) => t.id === topicId)) {
					return monthKey;
				}
			}
			return null;
		};

		const scrollAndOpen = (monthKey: string) => {
			// Ensure the month is visible
			const monthIndex = allMonthKeys.indexOf(monthKey);
			if (monthIndex >= 0) {
				setVisibleMonthCount((c) => Math.max(c, monthIndex + 1));
			}

			// Wait for the section to render, then scroll and open dialog
			const tryScrollAndOpen = (attempts = 0) => {
				const section = document.getElementById(`month-${monthKey}`);
				if (section) {
					section.scrollIntoView({ behavior: "smooth", block: "start" });
					// Find the topic preview from cache and open dialog
					const cached = queryClient.getQueryData<ArchiveMonth | null>(["news-archive-month", monthKey]);
					const topicPreview = cached?.topics.find((t) => t.id === topicId) ?? null;
					setSelectedTopicPreview(topicPreview);
					setSelectedTopicId(topicId);
				} else if (attempts < 20) {
					setTimeout(() => tryScrollAndOpen(attempts + 1), 100);
				}
			};
			tryScrollAndOpen();
		};

		// Check if we already know the month
		const knownMonth = findMonthForTopic();
		if (knownMonth) {
			scrollAndOpen(knownMonth);
			return;
		}

		// Otherwise open dialog immediately (data will load via useQuery),
		// and try to find the month as months fetch in the background
		setSelectedTopicId(topicId);

		const findAndScrollWhenReady = (attempts = 0) => {
			const month = findMonthForTopic();
			if (month) {
				scrollAndOpen(month);
			} else if (attempts < 30) {
				setTimeout(() => findAndScrollWhenReady(attempts + 1), 200);
			}
		};
		findAndScrollWhenReady();
	}, [archiveMonthIndex]);

	const handleSearchSubmit = (event: React.FormEvent) => {
		event.preventDefault();
		setSearchQuery(searchDraft.trim());
	};

	const clearSearch = () => {
		setSearchDraft("");
		setSearchQuery("");
	};

	const openTopicDialog = useCallback((topic: TopicArchiveCard) => {
		setSelectedTopicPreview(topic);
		setSelectedTopicId(topic.id);
		const url = new URL(window.location.href);
		url.searchParams.set("topic", topic.id);
		window.history.pushState({ topicId: topic.id }, "", url.toString());
	}, []);

	const closeTopicDialog = useCallback(() => {
		setSelectedTopicId(null);
		const url = new URL(window.location.href);
		url.searchParams.delete("topic");
		window.history.pushState({}, "", url.toString());
	}, []);

	const archiveEmpty = !isMonthIndexLoading && !isMonthIndexError && (archiveMonthIndex?.length ?? 0) === 0;

	return (
		<div>
			<SearchForm
				lang={lang}
				searchDraft={searchDraft}
				searchQuery={searchQuery}
				onSearchDraftChange={setSearchDraft}
				onSubmit={handleSearchSubmit}
				onClear={clearSearch}
			/>

			{searchQuery ? (
				<SearchResultsSection
					lang={lang}
					searchQuery={searchQuery}
					searchItems={searchItems}
					isSearchLoading={isSearchLoading}
					isFetchingNextPage={isFetchingNextPage}
					isSearchError={isSearchError}
					searchError={searchError}
				/>
			) : (
				<ArchiveSection
					lang={lang}
					isMonthIndexLoading={isMonthIndexLoading}
					isMonthIndexError={isMonthIndexError}
					monthIndexError={monthIndexError}
					archiveEmpty={archiveEmpty}
					visibleMonths={visibleMonths}
					totalMonths={archiveMonthIndex?.length ?? 0}
					onOpenTopic={openTopicDialog}
				/>
			)}

			<TopicDialog
				lang={lang}
				selectedTopicId={selectedTopicId}
				selectedTopicPreview={selectedTopicPreview}
				selectedTopic={selectedTopic}
				isTopicLoading={isTopicLoading}
				isTopicError={isTopicError}
				topicError={topicError}
				onClose={closeTopicDialog}
				onExitComplete={() => setSelectedTopicPreview(null)}
			/>
		</div>
	);
}
