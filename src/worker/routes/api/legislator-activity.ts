import { Hono } from "hono";
import type { Env } from "../../types";

const app = new Hono<{ Bindings: Env }>();

const API_BASE = "https://ly.govapi.tw/v2";
const LEGISLATOR_TERM = 11;
const LEGISLATOR_NAME = "葛如鈞";
const encodedName = encodeURIComponent(LEGISLATOR_NAME);

interface BillActivity {
	id: string;
	title: string;
	status?: string;
	law?: string;
	updatedAt?: string;
	url?: string;
	meetingCode?: string;
}

interface MeetActivity {
	id: string;
	name: string;
	type?: string;
	date?: string;
	location?: string;
	url?: string;
	updatedAt?: string;
}

export type ActivityItem = {
	id: string;
	type: "propose" | "cosign" | "meet";
	title: string;
	date?: string | null; // ISO string
	url?: string;
	// Raw details for frontend to format
	status?: string;
	law?: string;
	meetingType?: string;
	location?: string;
};

async function fetchJSON<T>(path: string, params?: Record<string, string | number>): Promise<T | null> {
	const url = new URL(`${API_BASE}${path}`);
	if (params) {
		Object.entries(params).forEach(([key, value]) => {
			url.searchParams.append(key, String(value));
		});
	}

	const response = await fetch(url.toString(), {
		method: "GET",
		headers: { accept: "application/json" },
	});

	if (!response.ok) {
		return null;
	}

	return (await response.json()) as T;
}

function asRecord(value: unknown): Record<string, unknown> | null {
	return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function pickFirstString(value: unknown): string | null {
	if (!value) return null;
	if (Array.isArray(value)) {
		const candidate = value.find((item) => typeof item === "string" && item.trim().length > 0);
		return candidate ? candidate : null;
	}
	return typeof value === "string" && value.trim().length > 0 ? value : null;
}

function joinValues(value: unknown): string {
	if (!value) return "";
	if (Array.isArray(value)) {
		return value
			.map((item) => (typeof item === "string" ? item.trim() : ""))
			.filter((item) => item.length > 0)
			.join("、");
	}
	return typeof value === "string" ? value : "";
}

function normalizeRocDate(value: string): string | null {
	const match = value.match(/^(\d{2,3})年(\d{1,2})月(\d{1,2})日/);
	if (!match) return null;
	const year = parseInt(match[1], 10) + 1911;
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
		if (!isNaN(parsedRoc)) {
			return new Date(parsedRoc);
		}
	}

	const normalized = trimmed.replace(/\//g, "-");
	const parsed = Date.parse(normalized);
	if (!isNaN(parsed)) {
		return new Date(parsed);
	}

	return null;
}

function mapBillActivity(entry: Record<string, unknown>): BillActivity | null {
	const id = typeof entry["議案編號"] === "string" ? entry["議案編號"] : undefined;
	if (!id) return null;

	const title = (typeof entry["議案名稱"] === "string" && entry["議案名稱"]) || id;

	const status = typeof entry["議案狀態"] === "string" ? entry["議案狀態"] : undefined;
	const law = joinValues(entry["法律編號:str"]) || joinValues(entry["法律編號"]) || undefined;
	const updatedAt =
		(typeof entry["最新進度日期"] === "string" && entry["最新進度日期"]) ||
		(typeof entry["資料抓取時間"] === "string" && entry["資料抓取時間"]) ||
		undefined;
	const meetingCode = typeof entry["會議代碼"] === "string" ? entry["會議代碼"] : undefined;

	let url: string | undefined;
	if (typeof entry["url"] === "string") {
		url = entry["url"];
	} else if (Array.isArray(entry["相關附件"])) {
		const attachments = entry["相關附件"].map(asRecord).filter((record): record is Record<string, unknown> => !!record);
		const attachmentRecord = attachments.find((record) => typeof record["網址"] === "string");
		if (attachmentRecord) {
			url = attachmentRecord["網址"] as string;
		}
	}

	return {
		id,
		title,
		status,
		law,
		updatedAt,
		url,
		meetingCode,
	};
}

function mapMeetActivity(entry: Record<string, unknown>): MeetActivity | null {
	const id = typeof entry["會議代碼"] === "string" ? entry["會議代碼"] : undefined;
	if (!id) return null;

	const name =
		(typeof entry["標題"] === "string" && entry["標題"]) ||
		(typeof entry["會議標題"] === "string" && entry["會議標題"]) ||
		(typeof entry["name"] === "string" && entry["name"]) ||
		id;

	const type = typeof entry["會議種類"] === "string" ? entry["會議種類"] : undefined;
	let date = pickFirstString(entry["日期"]);

	const meetingRecords = Array.isArray(entry["會議資料"])
		? entry["會議資料"].map(asRecord).filter((record): record is Record<string, unknown> => !!record)
		: [];

	if (!date && meetingRecords.length > 0) {
		const firstRecord = meetingRecords[0];
		date = pickFirstString(firstRecord["日期"]) || (typeof firstRecord["日期"] === "string" ? (firstRecord["日期"] as string) : null);
	}

	const location = typeof entry["地點"] === "string" ? entry["地點"] : undefined;

	let url: string | undefined;
	if (Array.isArray(entry["連結"])) {
		const links = entry["連結"].map(asRecord).filter((record): record is Record<string, unknown> => !!record);
		const meetingLink = links.find((link) => typeof link["連結"] === "string" && (!link["類型"] || link["類型"] === "User"));
		if (meetingLink) {
			url = meetingLink["連結"] as string;
		}
	}
	if (!url && meetingRecords.length > 0) {
		const ppgLink = meetingRecords.find((record) => typeof record["ppg_url"] === "string");
		if (ppgLink) {
			url = ppgLink["ppg_url"] as string;
		}
	}

	const updatedAt = (typeof entry["資料抓取時間"] === "string" && entry["資料抓取時間"]) || undefined;

	return {
		id,
		name,
		type,
		date: date ?? undefined,
		location,
		url,
		updatedAt,
	};
}

type BillsResponse = {
	bills?: Record<string, unknown>[];
};

type MeetsResponse = {
	meets?: Record<string, unknown>[];
};

app.get("/", async (c) => {
	const page = parseInt(c.req.query("page") || "1", 10);
	const pageSize = parseInt(c.req.query("pageSize") || "20", 10);

	// Try to get from cache first
	const cache = caches.default;
	const cacheUrl = new URL(c.req.url);
	let response = await cache.match(cacheUrl);

	if (response) {
		return response;
	}

	// Strategy: Fetch a large chunk from the beginning of each list (page=1, limit=N)
	// to ensure we have enough items to merge and sort correctly.
	// This simulates a "merged" view of multiple data sources.
	const fetchLimit = Math.max(100, page * pageSize);

	try {
		const [proposeRes, cosignRes, meetsRes] = await Promise.all([
			fetchJSON<BillsResponse>(`/legislators/${LEGISLATOR_TERM}/${encodedName}/propose_bills`, {
				page: 1,
				limit: fetchLimit,
			}),
			fetchJSON<BillsResponse>(`/legislators/${LEGISLATOR_TERM}/${encodedName}/cosign_bills`, {
				page: 1,
				limit: fetchLimit,
			}),
			fetchJSON<MeetsResponse>(`/legislators/${LEGISLATOR_TERM}/${encodedName}/meets`, {
				page: 1,
				limit: fetchLimit,
			}),
		]);

		const proposedBills = proposeRes?.bills?.map((entry) => mapBillActivity(entry)).filter((item): item is BillActivity => !!item) ?? [];

		const cosignedBills = cosignRes?.bills?.map((entry) => mapBillActivity(entry)).filter((item): item is BillActivity => !!item) ?? [];

		const meetList = meetsRes?.meets?.map((entry) => mapMeetActivity(entry)).filter((item): item is MeetActivity => !!item) ?? [];

		const activities: ActivityItem[] = [
			...proposedBills.map(
				(bill): ActivityItem => ({
					id: bill.id,
					type: "propose",
					title: bill.title,
					date: parseToDate(bill.updatedAt)?.toISOString() || null,
					url: bill.url,
					status: bill.status,
					law: bill.law,
				}),
			),
			...cosignedBills.map(
				(bill): ActivityItem => ({
					id: bill.id,
					type: "cosign",
					title: bill.title,
					date: parseToDate(bill.updatedAt)?.toISOString() || null,
					url: bill.url,
					status: bill.status,
					law: bill.law,
				}),
			),
			...meetList.map(
				(meet): ActivityItem => ({
					id: meet.id,
					type: "meet",
					title: meet.name,
					date: parseToDate(meet.date)?.toISOString() || null,
					url: meet.url,
					meetingType: meet.type,
					location: meet.location,
				}),
			),
		];

		activities.sort((a, b) => {
			const dateA = a.date ? new Date(a.date).getTime() : 0;
			const dateB = b.date ? new Date(b.date).getTime() : 0;
			// Descending order
			return dateB - dateA;
		});

		// Pagination
		const startIndex = (page - 1) * pageSize;
		const endIndex = startIndex + pageSize;
		const pagedActivities = activities.slice(startIndex, endIndex);
		const totalItems = activities.length;
		const totalPages = Math.ceil(totalItems / pageSize);

		response = c.json({
			success: true,
			data: pagedActivities,
			meta: {
				page,
				pageSize,
				totalItems,
				totalPages,
			},
		});

		// Cache for 1 day
		response.headers.set("Cache-Control", "public, max-age=86400");
		c.executionCtx.waitUntil(cache.put(cacheUrl, response.clone()));

		return response;
	} catch (error: any) {
		console.error("Failed to fetch legislator activity:", error);
		return c.json({ success: false, message: error.message }, 500);
	}
});

export default app;
