"use client";

import { cn } from "@/lib/utils";
import { Sparkles, Newspaper, BookText, Signature, User } from "lucide-react";
import { motion } from "framer-motion";
interface DisplayCardProps {
	index?: number;
	className?: string;
	icon?: React.ReactNode;
	title?: string;
	description?: string;
	date?: string;
}

function DisplayCard({
	index = 0,
	className,
	icon = <Sparkles className="size-4" />,
	title = "Featured",
	description = "Discover amazing content",
	date = "Just now",
}: DisplayCardProps) {
	const xOffset = (index - 1) * 20;
	const yOffset = (index - 1) * -50;

	return (
		<motion.div
			className={cn(
				"bg-muted/50 relative flex h-36 w-[min(26rem,75vw)] flex-col justify-between rounded-xl border-t border-l border-white/10 bg-gradient-to-br from-black/5 to-white/5 px-6 py-4 backdrop-blur-sm select-none",
				className,
			)}
			initial={{ opacity: 0, x: `${xOffset + 50}%`, y: `200%`, rotate: `${index * 5}deg` }}
			animate={{ opacity: 1, x: `${xOffset}%`, y: `${yOffset}%`, skewY: "-6deg", rotate: "0deg" }}
			transition={{ delay: index * 0.1, duration: 0.5 }}
		>
			<div className="flex items-center gap-2">
				<span className="relative inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-gray-50/50 text-gray-500 dark:bg-white/5 dark:text-white/80">
					{icon}
				</span>
				<p className={cn("line-clamp-2 text-sm font-medium dark:text-white/80")}>{title}</p>
			</div>
			<p className="line-clamp-2 text-sm dark:text-white/50">{description}</p>
			<p className="text-muted-foreground text-xs">{date}</p>
		</motion.div>
	);
}

interface DisplayCardsProps {
	cards?: DisplayCardProps[];
}

export default function DisplayCards({ cards }: DisplayCardsProps) {
	const defaultCards = Array.from({ length: 3 }).map((_, index) => ({
		icon: <Sparkles className="size-4" />,
		title: `Featured ${index + 1}`,
		description: `Discover amazing content ${index + 1}`,
		date: "Just now",
	}));

	const displayCards = cards || defaultCards;

	const cardsToRender = displayCards.map((cardProps, index) => {
		const defaults = defaultCards[index % defaultCards.length] || ({} as DisplayCardProps);
		const result = {
			...defaults,
			...cardProps,
			className: cn(cardProps.className),
		} as DisplayCardProps;
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
		return result;
	});

	return (
		<div className="-mt-20 -mb-6 flex flex-col items-center p-6">
			{cardsToRender.map((cardProps, index) => (
				<DisplayCard key={index} index={index} {...cardProps} />
			))}
		</div>
	);
}
