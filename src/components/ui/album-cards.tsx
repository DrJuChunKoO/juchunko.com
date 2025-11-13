import { useMediaQuery } from "usehooks-ts";
import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Sparkles, Newspaper, BookText, Signature, User, Rss, Mic } from "lucide-react";
import { motion } from "motion/react";
import { removeMarkdown } from "@excalidraw/markdown-to-text";
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
	const scale = 0.95 + index * 0.05;
	const yOffset = (index - 1) * -70;

	// Detect Safari to avoid applying backdrop blur (Safari has known issues with backdrop-filter)
	const [isSafari, setIsSafari] = useState(false);
	useEffect(() => {
		if (typeof navigator === "undefined") return;
		const ua = navigator.userAgent || "";
		const vendor = navigator.vendor || "";
		const isIOS = /iP(hone|od|ad)/.test(ua);
		// Safari UAs include 'Safari' but exclude common other browsers' markers
		const isSafariBrowser = /Safari/.test(ua) && !/Chrome|Chromium|CriOS|FxiOS|Edg|OPR/.test(ua);
		// On iOS, vendor may help indicate WebKit/Safari
		setIsSafari(isSafariBrowser || (isIOS && vendor.includes("Apple")));
	}, []);

	const Wrapper = ({ children }: { children: React.ReactNode }) =>
		isSafari ? (
			<motion.div
				className={cn(
					"bg-muted/50 relative flex h-36 w-[min(26rem,75vw)] transform-gpu flex-col justify-between rounded-xl bg-gradient-to-b px-6 py-4 drop-shadow-xs select-none",
					"from-[#E6E8E8] to-[#f3f5f5] dark:from-[#31302F] dark:to-[#31302F]",
					className,
				)}
				style={{ opacity: 1, y: `${yOffset}%`, scale: scale }}
			>
				{children}
			</motion.div>
		) : (
			<motion.div
				className={cn(
					"bg-muted/50 relative flex h-36 w-[min(26rem,75vw)] transform-gpu flex-col justify-between rounded-xl bg-gradient-to-b px-6 py-4 drop-shadow-xs select-none",
					"from-[#E6E8E8]/50 to-[#E6E8E8]/25 backdrop-blur-sm dark:from-[#31302F]/50 dark:to-[#31302F]/25",
					className,
				)}
				initial={{ opacity: 0, y: `200%` }}
				animate={{ opacity: 1, y: `${yOffset}%`, scale: scale }}
				transition={{ delay: index * 0.1, duration: 0.5 }}
			>
				{children}
			</motion.div>
		);
	return (
		<Wrapper>
			<div className="flex items-center gap-2">
				<span className="relative inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-gray-50/50 text-gray-500 dark:bg-white/5 dark:text-white/80">
					{icon}
				</span>
				<p className={cn("line-clamp-1 text-sm font-medium dark:text-white/80")}>{title}</p>
			</div>
			<p className="line-clamp-2 text-sm dark:text-white/50">{removeMarkdown(description)}</p>
			<p className="text-muted-foreground text-xs">{date}</p>
		</Wrapper>
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
	const matches = useMediaQuery("(min-width: 640px)");
	return matches ? (
		<div className="-my-24 hidden flex-col items-center p-6 sm:flex">
			{cardsToRender.map((cardProps, index) => (
				<AlbumCard key={index} index={index} {...cardProps} />
			))}
		</div>
	) : null;
}
