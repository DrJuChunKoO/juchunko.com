"use client";

import { cn } from "@/lib/utils";
import { Sparkles, Newspaper, BookText, Signature, User, Rss, Mic } from "lucide-react";
import { motion } from "framer-motion";
interface AlbumCardProps {
	index?: number;
	className?: string;
	icon?: React.ReactNode;
	title?: string;
	description?: string;
	date?: string;
}

function AlbumCard({
	index = 0,
	className,
	icon = <Sparkles className="size-4" />,
	title = "Featured",
	description = "Discover amazing content",
	date = "Just now",
}: AlbumCardProps) {
	const scale = 1 + index * 0.05;
	const yOffset = (index - 1) * -70;

	return (
		<motion.div
			className={cn(
				"bg-muted/50 relative flex h-36 w-[min(26rem,75vw)] flex-col justify-between rounded-xl border-t border-gray-50/50 bg-gradient-to-b from-[#E6E8E8]/50 to-[#E6E8E8]/25 px-6 py-4 backdrop-blur-sm select-none dark:border-white/10 dark:from-[#31302F]/50 dark:to-[#31302F]/25",
				className,
			)}
			initial={{ opacity: 0, y: `200%` }}
			animate={{ opacity: 1, y: `${yOffset}%`, scale: scale }}
			transition={{ delay: index * 0.1, duration: 0.5 }}
		>
			<div className="flex items-center gap-2">
				<span className="relative inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-gray-50/50 text-gray-500 dark:bg-white/5 dark:text-white/80">
					{icon}
				</span>
				<p className={cn("line-clamp-1 text-sm font-medium dark:text-white/80")}>{title}</p>
			</div>
			<p className="line-clamp-2 text-sm dark:text-white/50">{description}</p>
			<p className="text-muted-foreground text-xs">{date}</p>
		</motion.div>
	);
}

interface AlbumCardsProps {
	cards?: AlbumCardProps[];
}

export default function AlbumCards({ cards }: AlbumCardsProps) {
	const defaultCards = Array.from({ length: 3 }).map((_, index) => ({
		icon: <Sparkles className="size-4" />,
		title: `Featured ${index + 1}`,
		description: `Discover amazing content ${index + 1}`,
		date: "Just now",
	}));

	const albumCards = cards || defaultCards;

	const cardsToRender = albumCards.map((cardProps, index) => {
		const defaults = defaultCards[index % defaultCards.length] || ({} as AlbumCardProps);
		const result = {
			...defaults,
			...cardProps,
			className: cn(cardProps.className),
		} as AlbumCardProps;
		if (result.icon === "newspaper") {
			result.icon = <Newspaper className="size-4" />;
		}
		if (result.icon === "propose") {
			result.icon = <BookText className="size-4" />;
		}
		if (result.icon === "cosign") {
			result.icon = <Signature className="size-4" />;
		}
		if (result.icon === "meet") {
			result.icon = <User className="size-4" />;
		}
		if (result.icon === "blog") {
			result.icon = <Rss className="size-4" />;
		}
		if (result.icon === "transpal") {
			result.icon = <Mic className="size-4" />;
		}
		return result;
	});

	return (
		<div className="-my-20 flex flex-col items-center">
			{cardsToRender.map((cardProps, index) => (
				<AlbumCard key={index} index={index} {...cardProps} />
			))}
		</div>
	);
}
