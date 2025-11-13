import { fetchRss } from "@/lib/rss";
import { timeAgo } from "@/lib/utils";

type CardItem = {
	title?: string;
	description?: string;
	date?: string;
	href?: string;
	icon?: string;
};

export async function getIndexCards(lang: "en" | "zh-TW") {
	const result: {
		newsCards: CardItem[];
		newsFetchError: boolean;
		blogCards: CardItem[];
		blogFetchError: boolean;
		transpalCards: CardItem[];
		transpalFetchError: boolean;
		legislatorCards: CardItem[];
	} = {
		newsCards: [],
		newsFetchError: false,
		blogCards: [],
		blogFetchError: false,
		transpalCards: [],
		transpalFetchError: false,
		legislatorCards: [],
	};

	// News
	try {
		const resp = await fetch("https://aifferent.juchunko.com/api/news");
		if (resp.ok) {
			const data = await resp.json();
			const newsItems = Array.isArray(data?.data) ? data.data.slice(0, 3) : [];
			result.newsCards = newsItems.map((item: any) => ({
				title: lang === "en" ? item.title_en : item.title,
				description: lang === "en" ? item.summary_en : item.summary,
				date: timeAgo(item.time, lang),
				href: item.url,
				icon: "newspaper",
			}));
		} else {
			result.newsFetchError = true;
		}
	} catch (e) {
		console.error("getIndexCards: failed to fetch news", e);
		result.newsFetchError = true;
	}

	// Blog RSS
	try {
		const all = await fetchRss("https://blog.juchunko.com/rss.xml");
		const filtered = all.filter((it) => {
			const link = it.link || "";
			const isEnglishPost = link.includes("/en/");
			const isChinesePost = link.includes("/zh/") || (!link.includes("/en/") && !link.includes("/zh/"));
			return (lang === "en" && isEnglishPost) || (lang === "zh-TW" && isChinesePost);
		});
		const blogItems = filtered.slice(0, 3);
		result.blogCards = blogItems.map((it) => ({
			title: it.title,
			description: it.description,
			date: it.pubDate ? timeAgo(it.pubDate, lang) : "",
			href: it.link ?? "/",
			icon: "blog",
		}));
	} catch (e) {
		console.error("getIndexCards: failed to fetch blog RSS", e);
		result.blogFetchError = true;
	}

	// Transpal RSS
	try {
		const transpalItems = await fetchRss("https://transpal.juchunko.com/rss.xml");
		const tItems = (transpalItems || []).slice(0, 3);
		result.transpalCards = tItems.map((it) => ({
			title: it.title,
			description: it.description,
			date: it.pubDate ? timeAgo(it.pubDate, lang) : "",
			href: it.link ?? "/",
			icon: "transpal",
		}));
	} catch (e) {
		console.error("getIndexCards: failed to fetch transpal RSS", e);
		result.transpalFetchError = true;
	}

	// Legislator activity
	const API_BASE = "https://ly.govapi.tw/v2";
	const LEGISLATOR_TERM = 11;
	const LEGISLATOR_NAME = "葛如鈞";
	const encodedName = encodeURIComponent(LEGISLATOR_NAME);

	function asRecord(value: unknown): Record<string, unknown> | null {
		return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
	}
	function pickFirstString(value: unknown): string | null {
		if (!value) return null;
		if (Array.isArray(value)) {
			const candidate = value.find((item) => typeof item === "string" && item.trim().length > 0);
			return candidate ? candidate : null;
		}
		return typeof value === "string" && value.trim().length > 0 ? (value as string) : null;
	}
	function joinValues(value: unknown): string {
		if (!value) return "";
		if (Array.isArray(value)) {
			return value
				.map((item) => (typeof item === "string" ? item.trim() : ""))
				.filter((item) => item.length > 0)
				.join(lang === "en" ? ", " : "、");
		}
		return typeof value === "string" ? (value as string) : "";
	}
	function normalizeRocDate(value: string): string | null {
		const match = value.match(/^(\d{2,3})年(\d{1,2})月(\d{1,2})日/);
		if (!match) return null;
		const year = Number.parseInt(match[1], 10) + 1911;
		const month = match[2].padStart(2, "0");
		const day = match[3].padStart(2, "0");
		return `${year}-${month}-${day}`;
	}
	function parseToDate(value?: string | null): Date | null {
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

	async function fetchJSON(path: string) {
		const response = await fetch(`${API_BASE}${path}`, {
			method: "GET",
			headers: { accept: "application/json" },
			cache: "no-store",
		});
		if (!response.ok) throw new Error(`Failed to fetch ${path}: ${response.status} ${response.statusText}`);
		return await response.json();
	}

	try {
		const [proposeRes, cosignRes, meetsRes] = await Promise.all([
			fetchJSON(`/legislators/${LEGISLATOR_TERM}/${encodedName}/propose_bills?limit=3`),
			fetchJSON(`/legislators/${LEGISLATOR_TERM}/${encodedName}/cosign_bills?limit=3`),
			fetchJSON(`/legislators/${LEGISLATOR_TERM}/${encodedName}/meets?limit=3`),
		]);

		const mapBill = (entry: Record<string, unknown>) => {
			const id = typeof entry["議案編號"] === "string" ? entry["議案編號"] : undefined;
			if (!id) return null;
			const title = (typeof entry["議案名稱"] === "string" && entry["議案名稱"]) || id;
			const status = typeof entry["議案狀態"] === "string" ? entry["議案狀態"] : undefined;
			const law = joinValues(entry["法律編號:str"]) || joinValues(entry["法律編號"]) || undefined;
			const updatedAt =
				(typeof entry["最新進度日期"] === "string" && entry["最新進度日期"]) ||
				(typeof entry["資料抓取時間"] === "string" && entry["資料抓取時間"]) ||
				undefined;
			let url: string | undefined;
			if (typeof entry["url"] === "string") {
				url = entry["url"];
			} else if (Array.isArray(entry["相關附件"])) {
				const attachments = entry["相關附件"].map(asRecord).filter((r): r is Record<string, unknown> => !!r);
				const attachmentRecord = attachments.find((r) => typeof r["網址"] === "string");
				if (attachmentRecord) url = attachmentRecord["網址"] as string;
			}
			return { id, title, status, law, updatedAt, url };
		};

		const mapMeet = (entry: Record<string, unknown>) => {
			const id = typeof entry["會議代碼"] === "string" ? entry["會議代碼"] : undefined;
			if (!id) return null;
			const name =
				(typeof entry["標題"] === "string" && entry["標題"]) ||
				(typeof entry["會議標題"] === "string" && entry["會議標題"]) ||
				(typeof entry["name"] === "string" && entry["name"]) ||
				id;
			let date = pickFirstString(entry["日期"]);
			const meetingRecords = Array.isArray(entry["會議資料"])
				? entry["會議資料"].map(asRecord).filter((r): r is Record<string, unknown> => !!r)
				: [];
			if (!date && meetingRecords.length > 0) {
				const firstRecord = meetingRecords[0];
				date = pickFirstString(firstRecord["日期"]) || (typeof firstRecord["日期"] === "string" ? (firstRecord["日期"] as string) : null);
			}
			let url: string | undefined;
			if (Array.isArray(entry["連結"])) {
				const links = entry["連結"].map(asRecord).filter((r): r is Record<string, unknown> => !!r);
				const meetingLink = links.find((link) => typeof link["連結"] === "string" && (!link["類型"] || link["類型"] === "User"));
				if (meetingLink) url = meetingLink["連結"] as string;
			}
			if (meetingRecords.length > 0 && !url) {
				const ppgLink = meetingRecords.find((r) => typeof r["ppg_url"] === "string");
				if (ppgLink) url = ppgLink["ppg_url"] as string;
			}
			return { id, name, date, url };
		};

		const proposedBills = proposeRes?.bills?.map((entry: Record<string, unknown>) => mapBill(entry)).filter(Boolean) ?? [];
		const cosignedBills = cosignRes?.bills?.map((entry: Record<string, unknown>) => mapBill(entry)).filter(Boolean) ?? [];
		const meetList = meetsRes?.meets?.map((entry: Record<string, unknown>) => mapMeet(entry)).filter(Boolean) ?? [];

		const activities = [
			...proposedBills.map((bill: any) => ({
				id: bill.id,
				type: "propose",
				title: bill.title,
				date: parseToDate(bill.updatedAt),
				url: bill.url,
				details: {
					status: bill.status,
					law: bill.law,
				},
			})),
			...cosignedBills.map((bill: any) => ({
				id: bill.id,
				type: "cosign",
				title: bill.title,
				date: parseToDate(bill.updatedAt),
				url: bill.url,
				details: {
					status: bill.status,
					law: bill.law,
				},
			})),
			...meetList.map((meet: any) => ({
				id: meet.id,
				type: "meet",
				title: meet.name,
				date: parseToDate(meet.date),
				url: meet.url,
				details: {
					meetingType: meet.type,
					location: meet.location,
				},
			})),
		];

		activities.sort((a, b) => {
			if (a.date && b.date) return b.date.getTime() - a.date.getTime();
			if (a.date) return -1;
			if (b.date) return 1;
			return 0;
		});

		result.legislatorCards = activities.slice(0, 3).map((activity: any) => {
			const details = Object.entries(activity.details)
				.filter(([, value]) => value)
				.map(([key, value]) => `${key}: ${value}`)
				.join(lang === "en" ? ", " : "、");
			return {
				title: activity.title,
				description: details,
				date: activity.date ? timeAgo(activity.date.toISOString(), lang) : "",
				href: activity.url ? activity.url : `/${lang}/activities/${activity.id}`,
				icon: activity.type,
			};
		});
	} catch (e) {
		console.error("getIndexCards: failed to fetch legislator activity", e);
	}

	return result;
}
