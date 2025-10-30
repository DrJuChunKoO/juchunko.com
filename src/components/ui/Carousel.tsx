import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ReactNode } from "react";

interface CarouselProps<T> {
	items: T[];
	renderItem: (item: T) => ReactNode;
	lang: "en" | "zh-TW";
	ariaLabelPrefix: string;
	getItemKey?: (item: T, index: number) => string | number;
}

const variants = {
	enter: (direction: number) => ({
		x: direction > 0 ? "100%" : "-100%",
		opacity: 0,
	}),
	center: {
		zIndex: 1,
		x: 0,
		opacity: 1,
	},
	exit: (direction: number) => ({
		zIndex: 0,
		x: direction < 0 ? "100%" : "-100%",
		opacity: 0,
	}),
};

const swipeConfidenceThreshold = 10000;

export function Carousel<T>({ items, renderItem, ariaLabelPrefix, getItemKey }: CarouselProps<T>) {
	const [[page, direction], setPage] = useState([0, 0]);

	const paginate = (newDirection: number) => {
		setPage([page + newDirection, newDirection]);
	};

	const onDragEnd = (_e: any, { offset, velocity }: { offset: { x: number; y: number }; velocity: { x: number; y: number } }) => {
		const swipe = Math.abs(offset.x) * velocity.x;

		if (swipe < -swipeConfidenceThreshold) {
			paginate(1);
		} else if (swipe > swipeConfidenceThreshold) {
			paginate(-1);
		}
	};

	if (!items || items.length === 0) {
		return null;
	}

	const index = ((page % items.length) + items.length) % items.length;
	const item = items[index];

	return (
		<div className="relative my-4 flex flex-col justify-center">
			<AnimatePresence initial={false} custom={direction} mode="popLayout">
				<motion.div
					key={page}
					custom={direction}
					variants={variants}
					initial="enter"
					animate="center"
					exit="exit"
					transition={{
						x: { type: "spring", stiffness: 350, damping: 75 },
						opacity: { duration: 0.2 },
					}}
					drag="x"
					onDragEnd={onDragEnd}
					className="h-[140px]"
				>
					{renderItem(item)}
				</motion.div>
			</AnimatePresence>

			<div className="mt-4 flex items-center justify-center gap-4">
				<button
					onClick={() => paginate(-1)}
					className="rounded-full bg-slate-100 p-1.5 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
					aria-label={`Previous ${ariaLabelPrefix}`}
				>
					<ChevronLeft className="h-5 w-5" />
				</button>
				<div className="flex items-center gap-2">
					{items.map((item, i) => (
						<button
							key={getItemKey ? getItemKey(item, i) : i}
							onClick={() => setPage([i, i > index ? 1 : -1])}
							className={`h-2 w-2 rounded-full transition-colors ${
								i === index
									? "bg-slate-800 dark:bg-slate-200"
									: "cursor-pointer bg-slate-300 hover:bg-slate-400 dark:bg-slate-600 dark:hover:bg-slate-500"
							}`}
							aria-label={`Go to ${ariaLabelPrefix} ${i + 1}`}
						/>
					))}
				</div>
				<button
					onClick={() => paginate(1)}
					className="cursor-pointer rounded-full bg-slate-100 p-1.5 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
					aria-label={`Next ${ariaLabelPrefix}`}
				>
					<ChevronRight className="h-5 w-5" />
				</button>
			</div>
		</div>
	);
}