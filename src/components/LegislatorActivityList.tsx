import React, { useEffect, useRef, useState } from "react";
import { BookText, Signature, User } from "lucide-react";
import { timeAgo } from "../lib/utils";

type ActivityItem = {
	id: string;
	type: "propose" | "cosign" | "meet";
	title: string;
	date?: string | null;
	url?: string;
	status?: string;
	law?: string;
	meetingType?: string;
	location?: string;
};

type Props = {
	lang: "en" | "zh-TW";
	labels: Record<string, string>;
};

export default function LegislatorActivityList({ lang, labels }: Props) {
	const [items, setItems] = useState<ActivityItem[]>([]);
	const [page, setPage] = useState<number>(1);
	const [totalPages, setTotalPages] = useState<number | null>(null);
	const [loading, setLoading] = useState<boolean>(false);
	const [error, setError] = useState<string | null>(null);
	const sentinelRef = useRef<HTMLDivElement | null>(null);
	const observerRef = useRef<IntersectionObserver | null>(null);
	const retryAttemptsRef = useRef<number>(0);

	useEffect(() => {
		fetchActivities({ append: true, reset: false });
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	useEffect(() => {
		if (!sentinelRef.current) return;
		observerRef.current = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					if (entry.isIntersecting && !loading) {
						fetchActivities({ append: true });
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

	async function fetchActivities(opts: { append?: boolean; reset?: boolean } = {}) {
		const append = opts.append ?? true;
		const reset = opts.reset ?? false;
		const MAX_TOTAL_RETRIES = 3;

		const fetchPage = reset ? 1 : page;

		if (retryAttemptsRef.current >= MAX_TOTAL_RETRIES) {
			return;
		}

		if (loading) return;
		if (totalPages !== null && fetchPage > totalPages) return;

		setLoading(true);
		setError(null);

		const params = new URLSearchParams();
		params.set("page", String(fetchPage));
		params.set("pageSize", "20");

		try {
			// In development, this might need to point to localhost:8787 or similar if not proxied.
			// Assuming the site is set up to proxy /api requests to the worker or this runs in an environment where /api is available.
			// The NewsPage used `https://aifferent.juchunko.com/api/news`, which is an absolute URL.
			// For this new endpoint, if it's deployed to the same worker, we might need the full URL or relative if on same domain.
			// Let's assume relative `/api/legislator-activity` works if served from same origin,
            // or we might need to configure the base URL.
            // Given the user request mentions "Worker", and `NewsPage` uses a specific domain,
            // I should probably use a relative path if the main site proxies to worker,
            // OR use the worker domain if known.
            // Since I don't know the deployed worker domain for this new route yet,
            // I will use `/api/legislator-activity` and hope the dev server or prod setup handles it.
            // Wait, `NewsPage` uses `https://aifferent.juchunko.com/api/news`.
            // If I am adding to the SAME worker, maybe I should use that domain?
            // But I am adding to `src/worker/routes/api/index.ts`.
            // If `aifferent.juchunko.com` is the production worker, I can't deploy to it immediately.
            // For local dev, it should be localhost.
            // I'll use a relative path `/api/legislator-activity` which is standard for Next.js/Astro with API routes or proxy.
            // If that fails, I might need to make it configurable.

			const res = await fetch(`/api/legislator-activity?${params.toString()}`);
			if (!res.ok) {
				throw new Error(`HTTP ${res.status}`);
			}
			const payload = await res.json();
			if (!payload || !payload.success) {
				throw new Error(payload?.message || "Failed to fetch");
			}

            const data: ActivityItem[] = payload.data || [];
			const newTotalPages = payload.meta?.totalPages ?? null;

			if (reset) {
				setItems(data);
				setPage(2);
			} else if (append) {
				setItems((prev) => [...prev, ...data]);
				setPage((p) => p + 1);
			} else {
				setItems(data);
				setPage(fetchPage + 1);
			}
			setTotalPages(newTotalPages);
			retryAttemptsRef.current = 0;
		} catch (err: any) {
			console.error("Fetch error:", err);
			retryAttemptsRef.current++;
            setError(lang === "en" ? "Failed to load activities" : "無法載入活動");
		} finally {
			setLoading(false);
		}
	}

	return (
		<div className="relative">
			<ol className="relative">
				{items.map((activity) => {
					const Wrapper = activity.url ? "a" : "div";
					const wrapperProps =
						activity.url
							? {
									href: activity.url,
									target: "_blank",
									rel: "noopener noreferrer",
							  }
							: {};

                    // Construct details map for display
                    const detailsMap: Record<string, string | undefined> = {};
                    if (activity.type === "propose" || activity.type === "cosign") {
                        detailsMap[labels["billStatus"]] = activity.status;
                        detailsMap[labels["law"]] = activity.law;
                    } else if (activity.type === "meet") {
                        detailsMap[labels["meetingType"]] = activity.meetingType;
                        detailsMap[labels["location"]] = activity.location;
                    }

					return (
						<li key={activity.id} className="mb-2" data-id={activity.id}>
							<Wrapper
								className="border-accent hover:border-primary/25 group relative flex flex-col items-start overflow-hidden rounded-md border p-2 shadow-black/5 transition-all hover:bg-slate-50 dark:hover:bg-slate-800/50"
								{...wrapperProps}
							>
								<div className="mb-1 flex w-full items-center justify-between">
									<span className="flex items-center gap-2 rounded bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
										{activity.type === "propose" && <BookText className="size-4" />}
										{activity.type === "cosign" && <Signature className="size-4" />}
										{activity.type === "meet" && <User className="size-4" />}
										{labels[activity.type]}
									</span>
									<time className="text-xs leading-none font-normal text-slate-500 dark:text-slate-400">
										{activity.date ? timeAgo(activity.date, lang) : ""}
									</time>
								</div>
								<div>
									<h3 className="font-semibold text-slate-900 dark:text-white">{activity.title}</h3>
									<div className="mt-1 flex flex-col gap-0.5 text-xs text-slate-600 dark:text-slate-400">
										{Object.entries(detailsMap)
											.filter(([, value]) => value)
											.map(([key, value]) => (
												<p key={key}>
													<span className="font-medium">{key}</span>: {value}
												</p>
											))}
									</div>
								</div>
							</Wrapper>
						</li>
					);
				})}
			</ol>

            <div className="text-muted-foreground my-4 text-center text-sm">
                {loading && (lang === "en" ? "Loading..." : "載入中...")}
                {error && <span className="text-red-500">{error}</span>}
            </div>

			<div ref={sentinelRef} style={{ minHeight: 1 }} />
		</div>
	);
}
