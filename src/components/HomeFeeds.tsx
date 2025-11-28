import { useEffect, useState } from "react";
import { Sparkles, Newspaper, BookText, Signature, User, Rss, Mic, ArrowRight, ArrowUpRight } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { ui } from "src/i18n/ui";

type SupportedLang = "en" | "zh-TW";

interface HomeFeedsProps {
	lang?: SupportedLang;
}

interface CardData {
	title?: string;
	description?: string;
	date?: string;
	icon?: string;
	link?: string;
}

interface SectionConfig {
	key: string;
	title: string;
	subtitle: string;
	href: string;
	type: "display" | "album";
	max: number;
	cards?: CardData[];
}

// Helper function to remove markdown (simplified version)
function removeMarkdown(text: string) {
	if (!text) return "";
	return text
		.replace(/!\[.*?\]\(.*?\)/g, "")
		.replace(/\[([^\]]+)\]\(.*?\)/g, "$1")
		.replace(/#{1,6}\s+/g, "")
		.replace(/(\*\*|__)(.*?)\1/g, "$2")
		.replace(/(\*|_)(.*?)\1/g, "$2")
		.replace(/`{3}[\s\S]*?`{3}/g, "")
		.replace(/`(.+?)`/g, "$1")
		.trim();
}

// Get icon component based on icon type
function getIconComponent(icon?: string) {
	const iconMap: Record<string, React.ElementType> = {
		newspaper: Newspaper,
		propose: BookText,
		cosign: Signature,
		meet: User,
		blog: Rss,
		transpal: Mic,
	};
	return (icon && iconMap[icon]) || Sparkles;
}

export default function HomeFeeds({ lang = "zh-TW" }: HomeFeedsProps) {
	const titles = {
		legislator: ui[lang]["home.legislatorActivity.title"],
		news: ui[lang]["home.news.title"],
		blog: ui[lang]["home.blogRss.title"],
		transpal: ui[lang]["home.transpalRss.title"],
	};

	const subtitles = {
		legislator: ui[lang]["home.legislatorActivity.subtitle"],
		news: ui[lang]["home.news.subtitle"],
		blog: ui[lang]["home.blogRss.subtitle"],
		transpal: ui[lang]["home.transpalRss.subtitle"],
	};

	const sectionsConfig: SectionConfig[] = [
		{
			key: "news",
			title: titles.news,
			subtitle: subtitles.news,
			href: `/${lang}/news`,
			type: "display",
			max: 3,
		},
		{
			key: "legislator",
			title: titles.legislator,
			subtitle: subtitles.legislator,
			href: `/${lang}/activities`,
			type: "display",
			max: 3,
		},
		{
			key: "blog",
			title: titles.blog,
			subtitle: subtitles.blog,
			href: `https://blog.juchunko.com/`,
			type: "album",
			max: 3,
		},
		{
			key: "transpal",
			title: titles.transpal,
			subtitle: subtitles.transpal,
			href: `https://transpal.juchunko.com/`,
			type: "album",
			max: 3,
		},
	];

	const [sections, setSections] = useState<SectionConfig[]>(sectionsConfig);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		async function loadHomeFeeds() {
			try {
				const response = await fetch(`/api/index-cards?lang=${lang}`);
				if (!response.ok) {
					throw new Error(`HTTP ${response.status}: ${response.statusText}`);
				}

				const data = await response.json();

				const loadedSections = sectionsConfig.map((config) => {
					let cards: CardData[] = [];
					if (config.key === "news") {
						cards = data.newsCards || [];
					} else if (config.key === "legislator") {
						cards = (data.legislatorCards || []).slice().reverse();
					} else if (config.key === "blog") {
						cards = (data.blogCards || []).reverse();
					} else if (config.key === "transpal") {
						cards = data.transpalCards || [];
					}
					return { ...config, cards };
				});

				setSections(loadedSections);
				setLoading(false);
			} catch (error) {
				console.error("Failed to load home feeds:", error);
				// Keep loading true or handle error state if needed,
				// but for now we might just want to show skeletons or nothing?
				// The original code kept skeletons visible on error.
			}
		}

		loadHomeFeeds();
	}, [lang]);

	// Utility: calculate transform style for display layout
	const getDisplayTransform = (index: number) => {
		const xOffset = (index - 1) * 20;
		const yOffset = (index - 1) * -50;
		return {
			transform: `translate(${xOffset}%, ${yOffset}%) skewY(5deg) rotate(0.5deg)`,
			zIndex: 3 - index,
		};
	};

	// Utility: calculate transform style for album layout
	const getAlbumTransform = (index: number) => {
		const baseOffset = 50;
		const offsetDecay = 0.6;
		const position = index - 1;
		const yOffset = -position * (baseOffset * Math.pow(offsetDecay, Math.abs(position)));
		const baseScale = 1;
		const scaleDecay = 0.95;
		const scale = baseScale * Math.pow(scaleDecay, index);
		return {
			transform: `translateY(${yOffset}%) scale(${scale})`,
			zIndex: 3 - index,
		};
	};

	return (
		<div
			className="mb-4 flex gap-4 max-lg:-mx-4 max-lg:-mt-2 max-lg:overflow-x-auto max-lg:px-4 max-lg:py-2 lg:grid lg:grid-cols-2"
			data-lang={lang}
		>
			{sections.map((sec, sIndex) => (
				<a
					key={sec.key}
					className="group bg-muted/50 hover:bg-muted hover:outline-primary/50 relative flex shrink-0 flex-col overflow-hidden rounded-lg transition-colors hover:outline-2 hover:outline-offset-2 max-lg:w-[50vw] max-md:w-[70vw]"
					href={sec.href}
					target={sec.href && sec.href.startsWith("http") ? "_blank" : "_self"}
				>
					{loading ? (
						<div className="p-4 md:p-6">
							<div className="h-60" />
						</div>
					) : (
						<div className="p-4 md:p-6">
							<div className="relative flex h-60 flex-col data-[type=display]:max-md:scale-75" data-type={sec.type}>
								<AnimatePresence>
									{(sec.cards || []).slice(0, sec.max).map((c, index) => {
										const style = sec.type === "display" ? getDisplayTransform(index) : getAlbumTransform(index);
										const Icon = getIconComponent(c.icon);

										return (
											<motion.div
												key={`${sec.key}-${index}`}
												initial={{ opacity: 0, y: 64, scale: 0.8 }}
												animate={{ opacity: 1, ...style }}
												transition={{
													duration: 0.48,
													ease: [0.2, 0.9, 0.2, 1],
													delay: sIndex * 0.15 + (3 - index) * 0.12,
												}}
												className="border-muted-foreground/10 from-muted/50 to-muted/25 absolute top-1/2 left-1/2 w-[min(26rem,65vw)] -translate-x-1/2 -translate-y-1/2 transform-gpu rounded-xl border px-6 py-4 backdrop-blur-sm select-none data-[type=album]:bg-linear-to-b data-[type=display]:bg-linear-to-br"
												data-type={sec.type}
											>
												<div className={c.description ? "flex h-28 flex-col justify-between" : "flex h-18 flex-col justify-center gap-3"}>
													<div className="flex items-center gap-2">
														<span className="relative inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-50/50 text-base text-gray-500 drop-shadow-md dark:bg-white/5 dark:text-white/80">
															<Icon className="h-4 w-4" />
														</span>
														<p className="line-clamp-2 text-sm font-medium dark:text-white/80">{c.title || ""}</p>
													</div>
													{c.description && <p className="line-clamp-2 text-sm dark:text-white/50">{removeMarkdown(c.description)}</p>}
													<p className="text-muted-foreground text-xs">{c.date || ""}</p>
												</div>
											</motion.div>
										);
									})}
								</AnimatePresence>
							</div>
						</div>
					)}
					<div className="text-foreground relative z-10 flex w-full items-center justify-between gap-2 bg-black/5 p-4 py-3 backdrop-blur-sm md:p-6 md:py-4 dark:bg-white/5">
						<header>
							<h2 className="line-clamp-1 font-semibold md:text-xl">{sec.title}</h2>
							<p className="text-muted-foreground line-clamp-1 text-sm opacity-75 md:text-base">{sec.subtitle}</p>
						</header>
						{sec.href && sec.href.startsWith("http") ? (
							<ArrowUpRight className="h-6 w-6 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
						) : (
							<ArrowRight className="h-6 w-6 transition-transform group-hover:translate-x-0.5" />
						)}
					</div>
				</a>
			))}
		</div>
	);
}
