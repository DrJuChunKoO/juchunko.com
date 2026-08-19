import { useEffect, useState } from "react";
import { ArrowRight, Newspaper } from "lucide-react";

import { selectMediaAttentionTopics, type MediaAttentionTopic } from "./media-attention";

type SupportedLang = "en" | "zh-TW";

interface MediaAttentionProps {
	lang: SupportedLang;
}

interface ArchiveMonthResponse {
	success: boolean;
	months?: Array<{ month: string }>;
}

interface ArchiveResponse {
	success: boolean;
	months?: Array<{ topics: MediaAttentionTopic[] }>;
}

export default function MediaAttention({ lang }: MediaAttentionProps) {
	const [topics, setTopics] = useState<MediaAttentionTopic[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const controller = new AbortController();

		async function loadTopics() {
			try {
				const monthResponse = await fetch("https://aifferent.juchunko.com/api/news/archive/months?months=1", {
					signal: controller.signal,
				});
				if (!monthResponse.ok) throw new Error(`Failed to load media attention month: HTTP ${monthResponse.status}`);

				const monthPayload = (await monthResponse.json()) as ArchiveMonthResponse;
				const month = monthPayload.success ? monthPayload.months?.[0]?.month : undefined;
				if (!month) throw new Error("Failed to load media attention month: empty response");

				const archiveResponse = await fetch(
					`https://aifferent.juchunko.com/api/news/archive?month=${encodeURIComponent(month)}&previewLimit=1`,
					{ signal: controller.signal },
				);
				if (!archiveResponse.ok) throw new Error(`Failed to load media attention topics: HTTP ${archiveResponse.status}`);

				const archivePayload = (await archiveResponse.json()) as ArchiveResponse;
				const monthTopics = archivePayload.success ? archivePayload.months?.[0]?.topics : undefined;
				setTopics(selectMediaAttentionTopics(monthTopics ?? []));
			} catch (error) {
				if (!controller.signal.aborted) console.error("Failed to load media attention:", error);
			} finally {
				if (!controller.signal.aborted) setLoading(false);
			}
		}

		loadTopics();
		return () => controller.abort();
	}, []);

	if (!loading && topics.length === 0) return null;

	const copy =
		lang === "zh-TW"
			? {
					loading: "媒體關注資料載入中",
					count: (count: number) => `本月 ${count} 篇相關報導`,
					news: "查看新聞時間線",
				}
			: {
					loading: "Loading media attention",
					count: (count: number) => `${count} related stories this month`,
					news: "View news timeline",
				};

	return (
		<div className="grid gap-3 md:grid-cols-3 md:gap-6" aria-busy={loading} aria-label={loading ? copy.loading : undefined}>
			{loading
				? Array.from({ length: 3 }, (_, index) => <div key={index} className="bg-muted/50 h-44 animate-pulse rounded-lg" />)
				: topics.map((topic) => {
						const title = lang === "en" ? topic.titleEn || topic.title : topic.title;
						const summary = lang === "en" ? topic.summaryEn || topic.summary : topic.summary;
						const newsHref = `/${lang}/news?topic=${encodeURIComponent(topic.id)}`;

						return (
							<a
								key={topic.id}
								href={newsHref}
								className="group bg-muted/50 hover:bg-muted hover:outline-primary/50 flex min-h-44 flex-col rounded-lg p-4 transition-colors hover:outline-2 hover:outline-offset-2 md:p-6"
							>
								<div className="mb-3 flex items-center justify-between gap-3">
									<span className="text-2xl" aria-hidden="true">
										{topic.emoji || "📰"}
									</span>
									<span className="text-muted-foreground inline-flex items-center gap-1 text-xs font-medium">
										<Newspaper className="size-3.5" />
										{copy.count(topic.monthNewsCount)}
									</span>
								</div>
								<h3 className="text-foreground font-semibold md:text-lg">{title}</h3>
								{summary && <p className="text-muted-foreground mt-2 line-clamp-2 text-sm leading-relaxed">{summary}</p>}
								<span className="text-foreground mt-auto inline-flex items-center gap-1 pt-4 text-sm font-medium">
									{copy.news}
									<ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
								</span>
							</a>
						);
					})}
		</div>
	);
}
