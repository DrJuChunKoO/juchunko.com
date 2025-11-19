import React, { useEffect, useRef, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import Markdown from "markdown-to-jsx";

type NewsItem = {
	url: string;
	time: string;
	title?: string;
	title_en?: string;
	source?: string;
};

export default function NewsPage({ lang }: { lang: "en" | "zh-TW" }) {
	const [items, setItems] = useState<NewsItem[]>([]);
	const [page, setPage] = useState<number>(1);
	const pageSize = 20;
	const [totalPages, setTotalPages] = useState<number | null>(null);
	const [loading, setLoading] = useState<boolean>(false);
	const [error, setError] = useState<string | null>(null);
	const [q, setQ] = useState<string>("");
	const sentinelRef = useRef<HTMLDivElement | null>(null);
	const observerRef = useRef<IntersectionObserver | null>(null);
	const retryAttemptsRef = useRef<number>(0); // total retry attempts across fetches

	useEffect(() => {
		// load first page on mount
		fetchNews({ append: true, reset: false });
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	useEffect(() => {
		// set up intersection observer for infinite scroll
		if (!sentinelRef.current) return;
		observerRef.current = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					if (entry.isIntersecting && !loading) {
						fetchNews({ append: true });
					}
				}
			},
			{ root: null, rootMargin: "200px", threshold: 0.1 },
		);
		observerRef.current.observe(sentinelRef.current);
		return () => {
			observerRef.current?.disconnect();
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [sentinelRef.current, loading]);

	async function fetchNews(opts: { append?: boolean; reset?: boolean } = {}) {
		const append = opts.append ?? true;
		const reset = opts.reset ?? false;
		const MAX_TOTAL_RETRIES = 5; // global max attempts across failures

		// if resetting, start from page 1
		const fetchPage = reset ? 1 : page;

		// stop early if we've exhausted retries
		if (retryAttemptsRef.current >= MAX_TOTAL_RETRIES) {
			const msg = lang === "en" ? "Max retry attempts reached" : "已達最大重試次數";
			setError(msg);
			observerRef.current?.disconnect();
			return;
		}

		if (loading) return;
		if (totalPages !== null && fetchPage > totalPages) return;

		setLoading(true);
		setError(null);

		const params = new URLSearchParams();
		params.set("page", String(fetchPage));
		params.set("pageSize", String(pageSize));
		if (q) params.set("q", q);

		let attempt = 0;
		const PER_FETCH_MAX = 3; // limit retries per single fetch call to avoid long loops
		while (attempt < PER_FETCH_MAX && retryAttemptsRef.current < MAX_TOTAL_RETRIES) {
			try {
				const res = await fetch(`https://aifferent.juchunko.com/api/news?${params.toString()}`);
				if (!res.ok) {
					throw new Error(lang === "en" ? "Server returned error" : "伺服器錯誤");
				}
				const payload = await res.json();
				if (!payload || !payload.success) {
					throw new Error(payload?.message || (lang === "en" ? "Failed to fetch" : "取得失敗"));
				}
				const data: NewsItem[] = payload.data || [];
				const newTotalPages = payload.totalPages ?? null;

				if (reset) {
					setItems(data);
					setPage(2); // next page will be 2
				} else if (append) {
					// append new items
					setItems((prev) => [...prev, ...data]);
					setPage((p) => p + 1);
				} else {
					// replace
					setItems(data);
					setPage(fetchPage + 1);
				}
				setTotalPages(newTotalPages);

				// success => reset global retry counter for future fetches
				retryAttemptsRef.current = 0;
				break;
			} catch (err: any) {
				attempt++;
				retryAttemptsRef.current++;
				console.warn(`fetchNews attempt ${attempt} failed (global ${retryAttemptsRef.current}):`, err);

				// if we've hit the global limit, stop and disconnect observer to prevent further attempts
				if (retryAttemptsRef.current >= MAX_TOTAL_RETRIES) {
					const msg = lang === "en" ? "Max retry attempts reached" : "已達最大重試次數";
					setError(msg);
					observerRef.current?.disconnect();
					break;
				}

				// small exponential backoff before retrying
				const backoff = Math.min(3000, 300 * Math.pow(2, attempt));
				await new Promise((r) => setTimeout(r, backoff));
				// continue to next attempt
			}
		}

		setLoading(false);
	}

	function handleSearchSubmit(e?: React.FormEvent) {
		e?.preventDefault();
		// reset paging and fetch first page with q
		setItems([]);
		setPage(1);
		setTotalPages(null);
		fetchNews({ append: false, reset: true });
	}

	function clearSearch() {
		setQ("");
		setItems([]);
		setPage(1);
		setTotalPages(null);
		fetchNews({ append: false, reset: true });
	}

	function timeAgo(ts?: string) {
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
	}

	return (
		<div>
			<section className="mb-6">
				<form
					id="news-search-form-react"
					className="flex gap-2"
					onSubmit={(e) => {
						handleSearchSubmit(e);
					}}
				>
					<label className="sr-only" htmlFor="q-react">
						{lang === "en" ? "Search" : "搜尋"}
					</label>
					<input
						id="q-react"
						name="q"
						type="search"
						value={q}
						onChange={(e) => setQ(e.target.value)}
						placeholder={lang === "en" ? "Search news..." : "搜尋新聞..."}
						className="focus-visible:border-primary/50 focus-visible:ring-primary/25 h-11 flex-1 rounded-lg border px-3 py-2 outline-0 transition-all focus-visible:ring-2"
					/>
					<button
						type="submit"
						className="bg-primary text-primary-foreground inline-flex h-11 items-center rounded-lg px-4 transition-colors"
					>
						{lang === "en" ? "Search" : "搜尋"}
					</button>
					{/* optional clear button */}
					{q ? (
						<button
							onClick={clearSearch}
							className="bg-muted text-muted-foreground inline-flex h-11 items-center rounded-lg px-4 transition-colors"
						>
							{lang === "en" ? "Clear" : "清除"}
						</button>
					) : null}
				</form>
			</section>

			<section id="news-results" className="grid gap-3">
				{items.map((item, idx) => {
					const title = lang === "en" ? item.title_en || item.title || "" : item.title || "";
					return (
						<a
							key={idx}
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

			<div className="text-muted-foreground my-4 text-center text-sm">{loading ? (lang === "en" ? "Loading…" : "載入中…") : null}</div>
			{error ? <div className="my-4 text-center text-sm text-red-500">{error}</div> : null}

			{/* sentinel */}
			<div ref={sentinelRef} style={{ minHeight: 1 }} />
		</div>
	);
}
