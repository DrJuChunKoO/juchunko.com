// Time Ago Formatter
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

// Date parsing utilities
export function normalizeRocDate(value: string): string | null {
	const match = value.match(/^(\d{2,3})年(\d{1,2})月(\d{1,2})日/);
	if (!match) return null;
	const year = Number.parseInt(match[1], 10) + 1911;
	const month = match[2].padStart(2, "0");
	const day = match[3].padStart(2, "0");
	return `${year}-${month}-${day}`;
}

export function parseToDate(value?: string | null): Date | null {
	if (!value) return null;
	const trimmed = value.trim();
	if (!trimmed) return null;
	const roc = normalizeRocDate(trimmed);
	if (roc) {
		const parsedRoc = Date.parse(roc);
		if (!Number.isNaN(parsedRoc)) return new Date(parsedRoc);
	}
	const normalized = trimmed.replace(/\//g, "-");
	const parsed = Date.parse(normalized);
	if (!Number.isNaN(parsed)) return new Date(parsed);
	return null;
}
