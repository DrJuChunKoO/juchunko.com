import type { Lang } from "src/i18n/ui";

export type ContentCollection = "fragment" | "manual" | "act";

export interface ActSummaryLabels {
	heading: string;
	problem: string;
	changes: string;
	impact: string;
}

export interface ActSummaryData {
	problem: string;
	changes: string;
	impact: string;
}

export function shouldShowActSummary(collection: ContentCollection, slug: string | undefined): slug is string {
	return collection === "act" && Boolean(slug);
}

export function getActSummaryLabels(lang: Lang): ActSummaryLabels {
	return lang === "zh-TW"
		? {
				heading: "議題摘要",
				problem: "目前的問題",
				changes: "我們提出的做法",
				impact: "對我有什麼影響",
			}
		: {
				heading: "Issue Summary",
				problem: "Current Problem",
				changes: "What We Proposed",
				impact: "How This Affects Me",
			};
}

export function isActSummaryData(summary: unknown): summary is ActSummaryData {
	if (!summary || typeof summary !== "object") return false;
	const fields = summary as Partial<Record<keyof ActSummaryData, unknown>>;
	return isNonEmptyString(fields.problem) && isNonEmptyString(fields.changes) && isNonEmptyString(fields.impact);
}

function isNonEmptyString(value: unknown): value is string {
	return typeof value === "string" && value.trim().length > 0;
}
