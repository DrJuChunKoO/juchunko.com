import { useEffect, useRef, useState } from "react";
import { BotMessageSquare, FilePenLine, Lightbulb, TriangleAlert } from "lucide-react";
import { motion, useReducedMotion, type Variants } from "motion/react";

import type { Lang } from "src/i18n/ui";
import { openAIAssistant } from "./agent/events";
import { getActSummaryLabels, isActSummaryData, shouldShowActSummary, type ActSummaryData, type ContentCollection } from "./act-summary";

interface ActSummaryProps {
	collection: ContentCollection;
	lang: Lang;
	slug?: string;
}

const sectionVariants: Variants = {
	hidden: { opacity: 0, y: 12, filter: "blur(4px)" },
	visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.34, ease: [0.22, 1, 0.36, 1], staggerChildren: 0.06 } },
};

const itemVariants: Variants = {
	hidden: { opacity: 0, y: 8 },
	visible: { opacity: 1, y: 0, transition: { duration: 0.26, ease: [0.22, 1, 0.36, 1] } },
};

export default function ActSummary({ collection, lang, slug }: ActSummaryProps) {
	const sectionRef = useRef<HTMLElement>(null);
	const [summary, setSummary] = useState<ActSummaryData | null>(null);
	const [dismissed, setDismissed] = useState(false);
	const prefersReducedMotion = Boolean(useReducedMotion());
	const labels = getActSummaryLabels(lang);
	const showShell = shouldShowActSummary(collection, slug) && !dismissed;

	useEffect(() => {
		if (!showShell) return;

		const section = sectionRef.current;
		const host = section?.closest("astro-island") ?? section;
		const firstHeading = document.querySelector("#content h1");
		if (host && firstHeading) firstHeading.insertAdjacentElement("afterend", host);
	}, [showShell]);

	useEffect(() => {
		if (!showShell) return;

		const controller = new AbortController();

		fetch(`/api/act-summary?lang=${encodeURIComponent(lang)}&slug=${encodeURIComponent(slug)}`, { signal: controller.signal })
			.then((response) => {
				if (!response.ok) throw new Error(`HTTP ${response.status}`);
				return response.json();
			})
			.then((payload) => {
				if (!payload?.success || !isActSummaryData(payload.summary)) {
					setDismissed(true);
					return;
				}

				setSummary(payload.summary);
			})
			.catch((error: unknown) => {
				if (error instanceof DOMException && error.name === "AbortError") return;
				setDismissed(true);
			});

		return () => controller.abort();
	}, [lang, showShell, slug]);

	if (!showShell) return null;

	const fields = [
		{ key: "problem", label: labels.problem, Icon: TriangleAlert },
		{ key: "changes", label: labels.changes, Icon: FilePenLine },
		{ key: "impact", label: labels.impact, Icon: Lightbulb },
	] as const;

	return (
		<motion.section
			ref={sectionRef}
			id="act-summary"
			className="not-prose my-6 overflow-hidden rounded-lg border border-black/5 bg-gray-50 p-3 dark:border-white/10 dark:bg-white/5"
			aria-live="polite"
			hidden={!summary}
			initial={prefersReducedMotion ? false : "hidden"}
			animate={summary ? "visible" : "hidden"}
			variants={prefersReducedMotion ? undefined : sectionVariants}
		>
			<div className="flex flex-col gap-3">
				<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
					<h2 className="mt-1 mb-0 text-lg leading-tight font-semibold tracking-tight text-gray-950 dark:text-white">{labels.heading}</h2>
					<button
						type="button"
						className="hover:outline-primary/50 inline-flex w-fit items-center gap-2 rounded-full bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 hover:outline-2 hover:outline-offset-2 dark:bg-white/10 dark:text-gray-200 dark:hover:bg-white/15"
						onClick={openAIAssistant}
					>
						<BotMessageSquare className="size-4" aria-hidden="true" strokeWidth={1.8} />
						{labels.discussWithAI}
					</button>
				</div>
				<div className="grid min-w-0 flex-1 divide-y divide-black/5 rounded-md bg-white md:grid-cols-3 md:divide-x md:divide-y-0 dark:divide-white/10 dark:bg-white/5">
					{fields.map(({ key, label, Icon }) => (
						<motion.div key={key} className="flex min-w-0 flex-col gap-3 p-3" variants={prefersReducedMotion ? undefined : itemVariants}>
							<span className="bg-primary/5 text-primary flex size-8 shrink-0 items-center justify-center rounded-lg dark:bg-white/10 dark:text-white/80">
								<Icon className="size-4" aria-hidden="true" strokeWidth={1.8} />
							</span>
							<div className="min-w-0 flex-1">
								<h3 className="m-0 text-sm leading-5 font-semibold text-gray-950 dark:text-white">{label}</h3>
								<p className="mt-1 text-sm leading-6 text-gray-600 dark:text-gray-300">{summary?.[key]}</p>
							</div>
						</motion.div>
					))}
				</div>
			</div>
		</motion.section>
	);
}
