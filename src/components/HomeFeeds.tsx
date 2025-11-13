"use client";
import React from "react";
import DisplayCards from "./ui/display-cards";
import AlbumCards from "./ui/album-cards";
import { ui } from "src/i18n/ui";

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
				<div className="flex w-full items-center justify-between gap-2 bg-black/5 p-4 py-3 md:p-6 md:py-4 dark:bg-white/5">
					<header>
						<h2 className="font-semibold text-slate-900 md:text-xl dark:text-white">{title}</h2>
						<p>{description}</p>
					</header>
				</div>
			</a>
		);
	};

	return (
		<div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
			<SectionCard title={titles.legislator} href="/activities">
				<DisplayCards cards={legislatorCards} />
			</SectionCard>

			<SectionCard title={titles.news} href="/news">
				<DisplayCards cards={newsCards} />
			</SectionCard>

			<SectionCard title={titles.blog} href="https://blog.juchunko.com/">
				<AlbumCards cards={blogCards} />
			</SectionCard>

			<SectionCard title={titles.transpal} href="https://transpal.juchunko.com/">
				<AlbumCards cards={transpalCards} />
			</SectionCard>
		</div>
	);
}
