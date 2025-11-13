import { Carousel } from "./ui/Carousel";
import { timeAgo } from "../lib/utils";

export interface NewsItem {
	id: string;
	url: string;
	title: string;
	title_en: string;
	summary: string;
	summary_en: string;
	source: string;
	time: string;
}

interface NewsCarouselProps {
	news: NewsItem[];
	lang: "en" | "zh-TW";
	labels: {
		news: string;
		source: string;
	};
}

export function NewsCarousel({ news, lang, labels }: NewsCarouselProps) {
	const renderItem = (item: NewsItem) => (
		<a href={item.url} target="_blank" rel="noopener noreferrer" className="card-link h-full no-underline">
			<div className="bg-card text-card-foreground hover:bg-muted flex h-full w-full flex-col justify-between rounded-lg border p-4 transition-colors">
				<div>
					<h3 className="line-clamp-2 text-base leading-tight font-bold">{lang === "en" ? item.title_en : item.title}</h3>
					<p className="text-muted-foreground mt-1 line-clamp-2 text-sm">{lang === "en" ? item.summary_en : item.summary}</p>
				</div>
				<div className="text-muted-foreground mt-2 flex items-center gap-2 text-xs">
					<span>{item.source}</span>
					<span>·</span>
					<span>{timeAgo(item.time, lang)}</span>
				</div>
			</div>
		</a>
	);

	return <Carousel items={news} renderItem={renderItem} lang={lang} ariaLabelPrefix={labels.news} />;
}
