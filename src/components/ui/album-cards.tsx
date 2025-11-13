import type React from "react";
import { cn } from "@/lib/utils";
import { Sparkles, Newspaper, BookText, Signature, User, Rss, Mic } from "lucide-react";
import * as m from "motion/react-m";
import { removeMarkdown } from "@excalidraw/markdown-to-text";
import useIsSafari from "@/hooks/useIsSafari";
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
	const isSafari = useIsSafari();
	const scale = 0.95 + index * 0.05;
	const yOffset = (index - 1) * -70;
	const baseClass =
		"relative flex h-36 w-[min(26rem,75vw)] transform-gpu flex-col justify-between rounded-xl border bg-gradient-to-b px-6 py-4 drop-shadow-xs will-change-transform select-none";
	return isSafari ? (
		<m.div
			className={cn(
				baseClass,
				!isSafari && "backdrop-blur-sm",
				isSafari ? "from-muted to-muted/75" : "from-muted/50 to-muted/25",
				className,
			)}
			style={{ opacity: 1, y: `${yOffset}%`, scale: scale }}
			key="safari"
		>
			<div className="flex items-center gap-2">
				<span className="relative inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-gray-50/50 text-gray-500 dark:bg-white/5 dark:text-white/80">
					{icon}
				</span>
				<p className={cn("line-clamp-1 text-sm font-medium dark:text-white/80")}>{title}</p>
			</div>
			<p className="line-clamp-2 text-sm dark:text-white/50">{removeMarkdown(description)}</p>
			<p className="text-muted-foreground text-xs">{date}</p>
		</m.div>
	) : (
		<m.div
			className={cn(
				baseClass,
				!isSafari && "backdrop-blur-sm",
				isSafari ? "from-muted to-muted/75" : "from-muted/50 to-muted/25",
				className,
			)}
			initial={{ opacity: 0, y: `200%` }}
			animate={{ opacity: 1, y: `${yOffset}%`, scale: scale }}
			transition={{ delay: isSafari ? 0 : index * 0.1, duration: isSafari ? 0 : 0.5 }}
			key="not-safari"
		>
			<div className="flex items-center gap-2">
				<span className="relative inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-gray-50/50 text-gray-500 dark:bg-white/5 dark:text-white/80">
					{icon}
				</span>
				<p className={cn("line-clamp-1 text-sm font-medium dark:text-white/80")}>{title}</p>
			</div>
			<p className="line-clamp-2 text-sm dark:text-white/50">{removeMarkdown(description)}</p>
			<p className="text-muted-foreground text-xs">{date}</p>
		</m.div>
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
		<div className="-my-24 flex flex-col items-center p-6">
			{cardsToRender.map((cardProps, index) => (
				<AlbumCard key={index} index={index} {...cardProps} />
			))}
		</div>
	);
}
