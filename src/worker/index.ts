// @ts-nocheck
import { createOpenAI, type OpenAI } from "@ai-sdk/openai";
import { streamText, tool, smoothStream, embed, convertToModelMessages } from "ai";
import { z } from "zod";
import type { ExportedHandler, Fetcher } from "@cloudflare/workers-types";

interface Env {
	// 靜態資源綁定（wrangler.assets.binding）
	ASSETS: Fetcher;

	// Supabase 與 OpenAI 相關變數，請於 wrangler secret / vars 設定
	OPENAI_API_KEY: string;
}

export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		// API 端點 -------------------------------------------------------------
		if (request.method === "POST" && new URL(request.url).pathname === "/api/chat") {
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

			const { messages = [], filename = "/" } = body;
			// 系統提示詞
			const systemPrompt = `你是國民黨立委葛如鈞（寶博士）網站的 AI 助手
  - 盡可能簡短、友善回答
  - 盡可能使用工具來提供使用者盡可能準確與完整的資訊
  - 請以使用者的語言回答問題，目前新聞只有中文結果，若使用者不是用中文進行提問，請翻譯成使用者的語言
  - 新聞來源有多個，會出現重複新聞，請自行總結後再和使用者說，並附上所有網址和來源名稱，像這樣 [自由時報](https://xxx) [中央社](https://xxx)
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
				},
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
