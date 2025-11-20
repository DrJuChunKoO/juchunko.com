// @ts-nocheck
import { createOpenAI, type OpenAI } from "@ai-sdk/openai";
import { streamText, tool, smoothStream, convertToModelMessages, stepCountIs, UIMessage } from "ai";
import { z } from "zod";
import type { ExportedHandler, Fetcher } from "@cloudflare/workers-types";

interface Env {
	// 靜態資源綁定（wrangler.assets.binding）
	ASSETS: Fetcher;

	// Supabase 與 OpenAI 相關變數，請於 wrangler secret / vars 設定
	OPENAI_API_KEY: string;
}

// ============================================================================
// Helper Functions for Index Cards API
// ============================================================================

type CardItem = {
	title?: string;
	description?: string;
	date?: string;
	href?: string;
	icon?: string;
};

type FeedItem = {
	id: string;
	title: string;
	description?: string;
	link: string;
	pubDate?: string;
	category?: string;
	author?: string;
};

// HTML Entity Decoder
function decodeHtmlEntities(text: string | undefined): string {
	if (!text) return "";
	const namedEntities: Record<string, string> = {
		"&apos;": "'",
		"&quot;": '"',
		"&amp;": "&",
		"&lt;": "<",
		"&gt;": ">",
		"&nbsp;": "\u00a0",
		"&hellip;": "…",
		"&mdash;": "—",
		"&ndash;": "–",
		"&lsquo;": "\u2018",
		"&rsquo;": "\u2019",
		"&ldquo;": "\u201c",
		"&rdquo;": "\u201d",
	};

	return text
		.replace(/<!\[CDATA\[(.*?)\]\]>|&(?:#\d+|#x[0-9a-fA-F]+|[a-zA-Z]+);/gs, (m, c) => {
			if (c !== undefined) return c;
			return namedEntities[m] ?? m;
		})
		.trim();
}

// RSS Parser
function parseRss(xml: string): FeedItem[] {
	const items: FeedItem[] = [];
	const itemRegex = /<item>(.*?)<\/item>/gs;
	const titleRegex = /<title>([\s\S]*?)<\/title>/i;
	const linkRegex = /<link>([\s\S]*?)<\/link>/i;
	const descriptionRegex = /<description>([\s\S]*?)<\/description>/i;
	const pubDateRegex = /<pubDate>([\s\S]*?)<\/pubDate>/i;
	const categoryRegex = /<category>([\s\S]*?)<\/category>/i;
	const authorRegex = /<author>([\s\S]*?)<\/author>/i;
	const guidRegex = /<guid[^>]*>([\s\S]*?)<\/guid>/i;

	let m;
	while ((m = itemRegex.exec(xml)) !== null) {
		const itemXml = m[1];
		const titleMatch = titleRegex.exec(itemXml);
		const linkMatch = linkRegex.exec(itemXml);
		const descMatch = descriptionRegex.exec(itemXml);
		const pubMatch = pubDateRegex.exec(itemXml);
		const catMatch = categoryRegex.exec(itemXml);
		const authorMatch = authorRegex.exec(itemXml);
		const guidMatch = guidRegex.exec(itemXml);

		if (!titleMatch || !linkMatch) continue;

		const title = decodeHtmlEntities(titleMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/gs, "$1"));
		const link = linkMatch[1].trim();
		const description = descMatch ? decodeHtmlEntities(descMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/gs, "$1")) : "";
		const id = guidMatch ? guidMatch[1].trim() : link;
		const pubDate = pubMatch ? pubMatch[1].trim() : undefined;
		const category = catMatch ? decodeHtmlEntities(catMatch[1].trim()) : undefined;
		const author = authorMatch ? decodeHtmlEntities(authorMatch[1].trim()) : undefined;

		items.push({ id, title, description, link, pubDate, category, author });
	}

	return items;
}

async function fetchRss(url: string): Promise<FeedItem[]> {
	try {
		const res = await fetch(url, { method: "GET", headers: { accept: "application/xml" } });
		if (!res.ok) throw new Error(`Failed to fetch RSS: ${res.status} ${res.statusText}`);
		const xml = await res.text();
		return parseRss(xml);
	} catch (e) {
		console.error(e);
		return [];
	}
}

// Time Ago Formatter
function timeAgo(dateString: string, lang: "zh-TW" | "en"): string {
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

// i18n translations (minimal needed for legislator activity)
const translations = {
	"zh-TW": {
		"home.legislatorActivity.billStatus": "議案狀態",
		"home.legislatorActivity.law": "法律編號",
		"home.legislatorActivity.meetingType": "會議類型",
		"home.legislatorActivity.location": "地點",
	},
	en: {
		"home.legislatorActivity.billStatus": "Bill Status",
		"home.legislatorActivity.law": "Law Number",
		"home.legislatorActivity.meetingType": "Meeting Type",
		"home.legislatorActivity.location": "Location",
	},
};

function useTranslations(lang: "en" | "zh-TW") {
	return (key: string) => translations[lang][key] || key;
}

// Main function to get index cards data
async function getIndexCards(lang: "en" | "zh-TW") {
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
				title: lang === "en" ? decodeHtmlEntities(item.title_en) : decodeHtmlEntities(item.title),
				date: `${item.source}‧${timeAgo(item.time, lang)}`,
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
			const t = useTranslations(lang);
			function mapDetailKeyToI18nKey(key: string) {
				switch (key) {
					case "status":
						return "home.legislatorActivity.billStatus";
					case "law":
						return "home.legislatorActivity.law";
					case "meetingType":
						return "home.legislatorActivity.meetingType";
					case "location":
						return "home.legislatorActivity.location";
					default:
						return key;
				}
			}

			const details = Object.entries(activity.details)
				.filter(([, value]) => value)
				.map(([key, value]) => `${t(mapDetailKeyToI18nKey(key))}: ${value}`)
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

// ============================================================================
// Main Worker Export
// ============================================================================


export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		// API 端點 -------------------------------------------------------------
		const url = new URL(request.url);

		// Index Cards API endpoint
		if (request.method === "GET" && url.pathname === "/api/index-cards") {
			const lang = url.searchParams.get("lang") as "en" | "zh-TW" || "zh-TW";
			const cacheKey = `index-cards-${lang}`;

			// Try to get from cache first
			const cache = caches.default;
			const cacheUrl = new URL(request.url);
			let response = await cache.match(cacheUrl);

			if (response) {
				// Return cached response
				return response;
			}

			// Cache miss - fetch fresh data
			try {
				const data = await getIndexCards(lang);

				// Create response with cache headers
				response = new Response(JSON.stringify(data), {
					headers: {
						"Content-Type": "application/json",
						"Cache-Control": "public, max-age=86400", // 1 day
						"Access-Control-Allow-Origin": "*",
					},
				});

				// Store in cache
				await cache.put(cacheUrl, response.clone());

				return response;
			} catch (error) {
				console.error("Failed to fetch index cards:", error);
				return new Response(
					JSON.stringify({
						error: "Failed to fetch data",
						message: error instanceof Error ? error.message : String(error)
					}),
					{
						status: 500,
						headers: {
							"Content-Type": "application/json",
							"Access-Control-Allow-Origin": "*",
						},
					}
				);
			}
		}

		if (request.method === "POST" && url.pathname === "/api/chat") {
			// --------------------------------------------------------------
			// 初始化 OpenAI provider – 放在 handler 內才能拿到正確 env
			// --------------------------------------------------------------

			const openai: OpenAI = createOpenAI({
				apiKey: env.OPENAI_API_KEY,
				baseURL: "https://gateway.ai.cloudflare.com/v1/3f1f83a939b2fc99ca45fd8987962514/juchunko-com/openai",
			});

			// --------------------------------------------------------------
			// 解析請求 body
			// --------------------------------------------------------------
			let body: any;
			try {
				body = await request.json();
			} catch {
				return new Response("Invalid JSON body", {
					status: 400,
				});
			}

			const { messages = [], filename = "/" }: { messages: UIMessage[]; filename: string } = body;
			// 系統提示詞
			const systemPrompt = `你是國民黨立委葛如鈞（寶博士）網站的 AI 助手
  - 盡可能簡短、友善回答
  - 盡可能使用工具來提供使用者盡可能準確與完整的資訊
  - 請以使用者的語言回答問題，目前新聞只有中文結果，若使用者不是用中文進行提問，請翻譯成使用者的語言
	- 新聞來源有多個，會出現重複新聞，請自行總結後再和使用者說，並附上所有網址和來源名稱，像這樣 [自由時報](https://xxx) [中央社](https://xxx)
	- 如果使用者想要搜尋新聞，請使用 'searchNews' 工具(範例: searchNews q=關鍵字)。
	- 如果使用者想要列出最新新聞，請使用 'latestNews' 工具(範例: latestNews count=10)。
  - 葛如鈞=寶博士=Ju-Chun KO
<viewPage>
current page: https://juchunko.com${filename}
</viewPage>`;

			// --------------------------------------------------------------
			// 執行 LLM，並注入各種 tool
			// --------------------------------------------------------------
			const result = streamText({
				model: openai("gpt-4.1-mini"),
				messages: [{ role: "system", content: systemPrompt }, ...convertToModelMessages(messages)],
				tools: {
					// ----------------- 讀取目前頁面 -----------------
					viewPage: tool({
						description: "Get the current page content",
						inputSchema: z.object({}).strict(),
						execute: async () => {
							try {
								// 路由轉換邏輯：
								// path: /en/act/ai-basic-act/
								// actual file: src/content/act/en/ai-basic-act.mdx
								// path: /zh-TW/fragment/tools/
								// actual file: src/content/fragment/en/tools.mdx

								// 解析路由：/{lang}/{contentType}/{slug}
								const cleanFilename = filename.replace(/^\/+|\/+$/g, ""); // 移除前後斜線
								const pathParts = cleanFilename.split("/");

								if (pathParts.length >= 3) {
									const [lang, contentCategory, ...slugParts] = pathParts;
									const slug = slugParts.join("/"); // 處理可能有多層的 slug

									// 組合實際檔案路徑：/src/content/{contentType}/{lang}/{slug}.mdx
									const actualFilePath = `src/content/${contentCategory}/${lang}/${slug}.mdx`;
									const fileData = await fetch(`https://github.com/DrJuChunKoO/juchunko.com/raw/refs/heads/astro/${actualFilePath}`).then(
										(res) => {
											if (!res.ok) {
												throw new Error(`HTTP ${res.status}: ${res.statusText}`);
											}
											return res.text();
										},
									);

									return `base: https://juchunko.com/\n目前頁面內容：\n${fileData}`;
								} else {
									return `base: https://juchunko.com/\n目前頁面內容：\n無效的路由格式，無法解析檔案路徑。`;
								}
							} catch (error) {
								console.error("Error fetching file data:", error);
								return `base: https://juchunko.com/\n目前頁面內容：\n無法讀取目前頁面內容：${error.message}`;
							}
						},
					}),
					// ----------------- 搜尋新聞 / 列出最新新聞 -----------------
					searchNews: tool({
						description: "Search news by query. Returns a readable summary with urls and sources.",
						inputSchema: z
							.object({
								q: z.string().min(1),
								page: z.number().int().positive().optional(),
								pageSize: z.number().int().positive().optional(),
								lang: z.union([z.literal("en"), z.literal("zh-TW")]).optional(),
							})
							.strict(),
						execute: async (input) => {
							try {
								const { q, page = 1, pageSize = 20 } = input as any;
								const params = new URLSearchParams();
								params.set("page", String(page));
								params.set("pageSize", String(pageSize));
								params.set("q", q);

								const res = await fetch(`https://aifferent.juchunko.com/api/news?${params.toString()}`);
								if (!res.ok) {
									throw new Error(`HTTP ${res.status}: ${res.statusText}`);
								}
								const payload = await res.json();
								if (!payload || !payload.success) {
									throw new Error(payload?.message || "Failed to fetch news");
								}
								let data = payload.data || [];

								// dedupe by url to avoid duplicate links
								const seen = new Set();
								data = data.filter((it: any) => {
									const u = String(it?.url || "");
									if (!u) return true;
									if (seen.has(u)) return false;
									seen.add(u);
									return true;
								});
								const totalPages = payload.totalPages ?? null;

								if (!data || data.length === 0) {
									return `搜尋結果為空。`;
								}

								// Format concise result list for the model
								const formatted = data
									.slice(0, pageSize)
									.map((i: any, idx: number) => {
										const title = i.title || i.title_en || "(no title)";
										const src = i.source || "未知來源";
										const time = i.time || "";
										const url = i.url || "";
										return `${idx + 1}. ${title} (${src}) - ${time} - ${url}`;
									})
									.join("\n");

								return `搜尋新聞結果（query=${q}，page=${page}，pageSize=${pageSize}，totalPages=${totalPages}）:\n${formatted}`;
							} catch (error: any) {
								console.error("searchNews error:", error);
								return `搜尋新聞失敗：${error.message || String(error)}`;
							}
						},
					}),
					latestNews: tool({
						description: "Get latest news items; pass count (pageSize) to control how many are returned.",
						inputSchema: z
							.object({
								count: z.number().int().positive().optional(),
								lang: z.union([z.literal("en"), z.literal("zh-TW")]).optional(),
							})
							.strict(),
						execute: async (input) => {
							try {
								const { count = 10 } = input as any;
								const params = new URLSearchParams();
								params.set("page", String(1));
								params.set("pageSize", String(count));

								const res = await fetch(`https://aifferent.juchunko.com/api/news?${params.toString()}`);
								if (!res.ok) {
									throw new Error(`HTTP ${res.status}: ${res.statusText}`);
								}
								const payload = await res.json();
								if (!payload || !payload.success) {
									throw new Error(payload?.message || "Failed to fetch news");
								}
								let data = payload.data || [];
								const seen = new Set();
								data = data.filter((it: any) => {
									const u = String(it?.url || "");
									if (!u) return true;
									if (seen.has(u)) return false;
									seen.add(u);
									return true;
								});

								if (!data || data.length === 0) {
									return `目前沒有最新新聞。`;
								}

								const formatted = data
									.slice(0, count)
									.map((i: any, idx: number) => {
										const title = i.title || i.title_en || "(no title)";
										const src = i.source || "未知來源";
										const time = i.time || "";
										const url = i.url || "";
										return `${idx + 1}. ${title} (${src}) - ${time} - ${url}`;
									})
									.join("\n");

								return `最新新聞（count=${count}）:\n${formatted}`;
							} catch (error: any) {
								console.error("latestNews error:", error);
								return `取得最新新聞失敗：${error.message || String(error)}`;
							}
						},
					}),
				},
				stopWhen: stepCountIs(5),
				experimental_transform: smoothStream({
					chunking: /[\u4E00-\u9FFF]|\S+\s+/,
				}),
			});

			const response = result.toUIMessageStreamResponse();
			// 附加 CORS 標頭 (以及 Vercel AI stream header)
			response.headers.set("Content-Type", "text/event-stream");
			response.headers.set("Cache-Control", "no-cache");
			response.headers.set("Connection", "keep-alive");
			return response;
		}

		// 非上述路由 – 直接回傳靜態檔
		return env.ASSETS.fetch(request);
	},
} satisfies ExportedHandler<Env>;
