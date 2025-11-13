"use client";
import React from "react";
import DisplayCards from "./ui/display-cards";
import AlbumCards from "./ui/album-cards";
import { ui } from "src/i18n/ui";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { LazyMotion, domAnimation } from "motion/react";

type CardItem = {
	title?: string;
	description?: string;
	date?: string;
	href?: string;
	icon?: string;
};

interface Props {
	lang: "en" | "zh-TW";
	legislatorCards?: CardItem[];
	newsCards?: CardItem[];
	blogCards?: CardItem[];
	transpalCards?: CardItem[];
}

export default function HomeFeeds({ lang, legislatorCards = [], newsCards = [], blogCards = [], transpalCards = [] }: Props) {
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

	const SectionCard: React.FC<{
		title: string;
		href?: string;
		description?: string;
		children: React.ReactNode;
	}> = ({ title, href = "#", description = "", children }) => {
		return (
			<a
				className="group relative block overflow-hidden rounded-lg bg-gray-50 transition-colors hover:bg-gray-100 dark:bg-white/5 dark:hover:bg-white/10"
				href={href}
				target={href.startsWith("http") ? "_blank" : "_self"}
			>
				<div>{children}</div>
				<div className="relative z-10 flex w-full items-center justify-between gap-2 bg-black/5 p-4 py-3 md:p-6 md:py-4 dark:bg-white/5">
					<header>
						<h2 className="font-semibold text-slate-900 md:text-xl dark:text-white">{title}</h2>
						<p className="line-clamp-1 text-sm opacity-75 md:text-base"> {description}</p>
					</header>
					{href.startsWith("http") ? (
						<ArrowUpRight className="size-6 text-gray-600 transition-transform group-hover:translate-x-1 dark:text-gray-300" />
					) : (
						<ArrowRight className="size-6 text-gray-600 transition-transform group-hover:translate-x-1 dark:text-gray-300" />
					)}
				</div>
			</a>
		);
	};

	return (
		<div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
			<LazyMotion features={domAnimation}>
				<SectionCard title={titles.legislator} description={subtitles.legislator} href="/activities">
					<DisplayCards cards={legislatorCards.toReversed()} />
				</SectionCard>

				<SectionCard title={titles.news} description={subtitles.news} href="/news">
					<DisplayCards cards={newsCards.toReversed()} />
				</SectionCard>

				<SectionCard title={titles.blog} description={subtitles.blog} href="https://blog.juchunko.com/">
					<AlbumCards cards={blogCards} />
				</SectionCard>

				<SectionCard title={titles.transpal} description={subtitles.transpal} href="https://transpal.juchunko.com/">
					<AlbumCards cards={transpalCards.toReversed()} />
				</SectionCard>
			</LazyMotion>
		</div>
	);
}
