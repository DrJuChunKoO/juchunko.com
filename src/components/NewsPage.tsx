import React, { useState, useEffect } from "react";
import { QueryClient, useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { ArrowUpRight, ArrowRight, X, ExternalLink, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			staleTime: 1000 * 60 * 5, // 5 minutes
			gcTime: 1000 * 60 * 10, // 10 minutes
			retry: 3,
			refetchOnWindowFocus: false,
		},
	},
});

type NewsItem = {
	url: string;
	time: string;
	title?: string;
	title_en?: string;
	source?: string;
};

type NewsResponse = {
	success: boolean;
	data: NewsItem[];
	totalPages: number;
	message?: string;
};

const PAGE_SIZE = 20;

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
		throw new Error(payload?.message || "Failed to fetch");
	}
	return payload;
}

export default function NewsPage({ lang }: { lang: "en" | "zh-TW" }) {
	const [searchQuery, setSearchQuery] = useState<string>("");
	const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);

	// Query for related news when a news item is selected
	const {
		data: relatedData,
		isLoading: isRelatedLoading,
		isError: isRelatedError,
	} = useQuery(
		{
			queryKey: ["relatedNews", selectedNews?.title],
			queryFn: async () => {
				if (!selectedNews?.title) return null;
				const params = new URLSearchParams();
				params.set("page", "1");
				params.set("pageSize", "10");
				params.set("q", selectedNews.title);
				const res = await fetch(`https://aifferent.juchunko.com/api/news?${params.toString()}`);
				if (!res.ok) throw new Error("Server returned error");
				const payload = await res.json();
				if (!payload || !payload.success) throw new Error(payload?.message || "Failed to fetch");
				// Sort by date descending and exclude the selected news itself
				const sorted = (payload.data as NewsItem[])
					.filter((item) => item.url !== selectedNews.url)
					.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
				return sorted;
			},
			enabled: !!selectedNews?.title,
			staleTime: 1000 * 60 * 5,
		},
		queryClient,
	);

	const { data, error, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError, refetch } = useInfiniteQuery(
		{
			queryKey: ["news", searchQuery],
			queryFn: ({ pageParam }) => fetchNews({ pageParam, query: searchQuery }),
			initialPageParam: 1,
			getNextPageParam: (lastPage, pages) => {
				if (pages.length < lastPage.totalPages) {
					return pages.length + 1;
				}
				return undefined;
			},
			staleTime: 1000 * 60 * 5, // 5 minutes
		},
		queryClient,
	);

	// Flatten all pages into a single array
	const items = data?.pages.flatMap((page) => page.data) || [];

	const handleSearchSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		refetch();
	};

	const clearSearch = () => {
		setSearchQuery("");
		refetch();
	};

	const timeAgo = (ts?: string) => {
		if (!ts) return "";
		try {
			const diff = Date.now() - new Date(ts).getTime();
			const s = Math.floor(diff / 1000);
			if (s < 60) return lang === "en" ? "just now" : "剛剛";
			const m = Math.floor(s / 60);
			if (m < 60) return `${m}${lang === "en" ? "m" : "分鐘"}`;
			const h = Math.floor(m / 60);
			if (h < 24) return `${h}${lang === "en" ? "h" : "小時"}`;
			const d = Math.floor(h / 24);
			return `${d}${lang === "en" ? "d" : "天"}`;
		} catch {
			return "";
		}
	};

	// Intersection Observer for infinite scroll
	useEffect(() => {
		const observer = new IntersectionObserver(
			(entries) => {
				if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
					fetchNextPage();
				}
			},
			{ rootMargin: "200px" },
		);

		const sentinel = document.getElementById("news-sentinel");
		if (sentinel) {
			observer.observe(sentinel);
		}

		return () => observer.disconnect();
	}, [hasNextPage, isFetchingNextPage, fetchNextPage]);

	return (
		<div>
			<section className="mb-6">
				<form id="news-search-form-react" className="flex gap-2" onSubmit={handleSearchSubmit}>
					<label className="sr-only" htmlFor="q-react">
						{lang === "en" ? "Search" : "搜尋"}
					</label>
					<input
						id="q-react"
						name="q"
						type="search"
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						placeholder={lang === "en" ? "Search news..." : "搜尋新聞..."}
						className="focus-visible:border-primary/50 focus-visible:ring-primary/25 h-11 flex-1 rounded-lg border px-3 py-2 outline-0 transition-all focus-visible:ring-2"
					/>
					<button
						type="submit"
						className="bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary/80 inline-flex h-11 cursor-pointer items-center rounded-lg px-4 transition-colors active:scale-[0.98]"
					>
						{lang === "en" ? "Search" : "搜尋"}
					</button>
					{searchQuery && (
						<button
							onClick={clearSearch}
							className="bg-muted text-muted-foreground hover:bg-muted/80 active:bg-muted/70 inline-flex h-11 cursor-pointer items-center rounded-lg px-4 transition-colors active:scale-[0.98]"
						>
							{lang === "en" ? "Clear" : "清除"}
						</button>
					)}
				</form>
			</section>

			<section id="news-results" className="grid gap-3">
				{items.map((item, idx) => {
					const title = lang === "en" ? item.title_en || item.title || "" : item.title || "";
					return (
						<button
							key={`${item.url}-${idx}`}
							onClick={() => setSelectedNews(item)}
							className="group bg-muted/50 hover:bg-muted relative flex w-full cursor-pointer items-center gap-4 rounded-xl p-5 text-left transition-all"
						>
							{/* News icon */}
							<div className="bg-muted-foreground/10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-2xl">📰</div>

							{/* Content */}
							<div className="min-w-0 flex-1">
								<h3 className="text-primary mb-2 text-base leading-snug font-semibold transition-colors">{title}</h3>
								<div className="text-muted-foreground flex items-center text-xs">
									{item.source && <span>{item.source}‧</span>}
									<span>{timeAgo(item.time)}</span>
								</div>
							</div>

							{/* Arrow icon */}
							<ArrowRight className="size-5 shrink-0 -translate-x-0.5 opacity-0 transition-all group-hover:translate-none group-hover:opacity-100" />
						</button>
					);
				})}
			</section>

			<div className="text-muted-foreground my-4 text-center text-sm">
				{isLoading && (lang === "en" ? "Loading…" : "載入中…")}
				{isFetchingNextPage && (lang === "en" ? "Loading…" : "載入中…")}
			</div>
			{isError && (
				<div className="my-4 text-center text-sm text-red-500">
					{error?.message || (lang === "en" ? "Failed to load news" : "載入新聞失敗")}
				</div>
			)}

			{/* Sentinel for infinite scroll */}
			<div id="news-sentinel" style={{ minHeight: 1 }} />

			{/* Modal for related news */}
			<AnimatePresence>
				{selectedNews && (
					<motion.div
						className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4 pt-16"
						onClick={() => setSelectedNews(null)}
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						transition={{ duration: 0.2 }}
					>
						<motion.div
							className="bg-background relative max-h-[80vh] w-full max-w-2xl overflow-hidden rounded-2xl shadow-xl"
							onClick={(e) => e.stopPropagation()}
							initial={{ opacity: 0, scale: 0.95, y: 20 }}
							animate={{ opacity: 1, scale: 1, y: 0 }}
							exit={{ opacity: 0, scale: 0.95, y: 20 }}
							transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
						>
							{/* Modal Header */}
							<div className="border-b p-4">
								<div className="flex items-start justify-between gap-4">
									<div className="min-w-0 flex-1">
										<h2 className="text-lg leading-snug font-semibold">
											{lang === "en" ? selectedNews.title_en || selectedNews.title : selectedNews.title}
										</h2>
										<div className="text-muted-foreground mt-1 flex items-center gap-2 text-sm">
											{selectedNews.source && <span>{selectedNews.source}</span>}
											<span>•</span>
											<span>{timeAgo(selectedNews.time)}</span>
										</div>
									</div>
									<button
										onClick={() => setSelectedNews(null)}
										className="text-muted-foreground hover:text-foreground hover:bg-muted-foreground/10 shrink-0 cursor-pointer rounded-full p-1 transition-colors"
									>
										<X className="size-5" />
									</button>
								</div>
								<a
									href={selectedNews.url}
									target="_blank"
									rel="noopener noreferrer"
									className="text-primary mt-3 inline-flex items-center gap-1 text-sm font-medium hover:underline"
								>
									{lang === "en" ? "View original article" : "查看原始文章"}
									<ExternalLink className="size-4" />
								</a>
							</div>

							{/* Related News */}
							<div className="max-h-[50vh] overflow-y-auto p-4">
								<h3 className="text-muted-foreground mb-3 text-sm font-medium">{lang === "en" ? "Related News" : "相關新聞"}</h3>

								{isRelatedLoading && (
									<div className="flex items-center justify-center py-8">
										<Loader2 className="text-muted-foreground size-6 animate-spin" />
									</div>
								)}

								{isRelatedError && (
									<div className="py-4 text-center text-sm text-red-500">
										{lang === "en" ? "Failed to load related news" : "載入相關新聞失敗"}
									</div>
								)}

								{relatedData && relatedData.length === 0 && (
									<div className="text-muted-foreground py-4 text-center text-sm">
										{lang === "en" ? "No related news found" : "找不到相關新聞"}
									</div>
								)}

								{relatedData && relatedData.length > 0 && (
									<div className="grid gap-2">
										{relatedData.map((item, idx) => {
											const title = lang === "en" ? item.title_en || item.title || "" : item.title || "";
											return (
												<motion.a
													key={`related-${item.url}-${idx}`}
													href={item.url}
													target="_blank"
													rel="noopener noreferrer"
													className="group bg-muted/50 hover:bg-muted flex items-center gap-3 rounded-lg p-3 no-underline transition-colors"
													initial={{ opacity: 0, x: -10 }}
													animate={{ opacity: 1, x: 0 }}
													transition={{ duration: 0.25, delay: idx * 0.05 }}
												>
													<div className="min-w-0 flex-1">
														<h4 className="text-primary text-sm leading-snug font-medium">{title}</h4>
														<div className="text-muted-foreground mt-1 flex items-center text-xs">
															{item.source && <span>{item.source}‧</span>}
															<span>{timeAgo(item.time)}</span>
														</div>
													</div>
													{/* Arrow icon */}
													<ArrowUpRight className="size-5 shrink-0 -translate-x-0.5 translate-y-0.5 opacity-0 transition-all group-hover:translate-none group-hover:opacity-100" />
												</motion.a>
											);
										})}
									</div>
								)}
							</div>
						</motion.div>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}
