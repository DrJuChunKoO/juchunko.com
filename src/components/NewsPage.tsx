import React, { useState, useEffect } from "react";
import { QueryClient, useInfiniteQuery } from "@tanstack/react-query";
import { ArrowUpRight } from "lucide-react";

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
						className="bg-primary text-primary-foreground inline-flex h-11 items-center rounded-lg px-4 transition-colors"
					>
						{lang === "en" ? "Search" : "搜尋"}
					</button>
					{searchQuery && (
						<button
							onClick={clearSearch}
							className="bg-muted text-muted-foreground inline-flex h-11 items-center rounded-lg px-4 transition-colors"
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
						<a
							key={`${item.url}-${idx}`}
							href={item.url}
							target="_blank"
							rel="noopener noreferrer"
							className="group bg-muted/50 hover:bg-muted relative flex items-center gap-4 rounded-xl p-5 no-underline transition-all"
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
							<ArrowUpRight className="size-5 shrink-0 -translate-x-0.5 translate-y-0.5 opacity-0 transition-all group-hover:translate-none group-hover:opacity-100" />
						</a>
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
		</div>
	);
}
