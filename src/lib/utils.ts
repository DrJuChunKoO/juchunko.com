import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function timeAgo(dateString: string, lang: "zh-TW" | "en"): string {
	const date = new Date(dateString);
	const now = new Date();
	const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

	if (seconds >= 0) {
		const intervals = {
			"zh-TW": [
				{ value: 31536000, unit: " 年前" },
				{ value: 2592000, unit: " 個月前" },
				{ value: 86400, unit: " 天前" },
				{ value: 3600, unit: " 小時前" },
				{ value: 60, unit: " 分鐘前" },
			],
			en: [
				{ value: 31536000, unit: " years ago" },
				{ value: 2592000, unit: " months ago" },
				{ value: 86400, unit: " days ago" },
				{ value: 3600, unit: " hours ago" },
				{ value: 60, unit: " minutes ago" },
			],
		};

		for (const interval of intervals[lang]) {
			const value = Math.floor(seconds / interval.value);
			if (value > 0) {
				return value + interval.unit;
			}
		}

		return lang === "zh-TW" ? "今天" : "Today";
	} else {
		const futureSeconds = -seconds;
		const futureIntervals = {
			"zh-TW": [
				{ value: 31536000, unit: " 年後" },
				{ value: 2592000, unit: " 個月後" },
				{ value: 86400, unit: " 天後" },
				{ value: 3600, unit: " 小時後" },
				{ value: 60, unit: " 分鐘後" },
			],
			en: [
				{ value: 31536000, unit: " years from now" },
				{ value: 2592000, unit: " months from now" },
				{ value: 86400, unit: " days from now" },
				{ value: 3600, unit: " hours from now" },
				{ value: 60, unit: " minutes from now" },
			],
		};

		for (const interval of futureIntervals[lang]) {
			const value = Math.floor(futureSeconds / interval.value);
			if (value > 0) {
				if (lang === "en") {
					return `in ${value}${interval.unit.replace("s from now", " from now")}`;
				}
				return value + interval.unit;
			}
		}

		return lang === "zh-TW" ? "今天" : "Today";
	}
}
