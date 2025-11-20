import type { Fetcher } from "@cloudflare/workers-types";

export type CardItem = {
	title?: string;
	description?: string;
	date?: string;
	href?: string;
	icon?: string;
};

export type FeedItem = {
	id: string;
	title: string;
	description?: string;
	link: string;
	pubDate?: string;
	category?: string;
	author?: string;
};

export interface Env {
	// 靜態資源綁定（wrangler.assets.binding）
	ASSETS: Fetcher;

	// Supabase 與 OpenAI 相關變數，請於 wrangler secret / vars 設定
	OPENAI_API_KEY: string;
}
