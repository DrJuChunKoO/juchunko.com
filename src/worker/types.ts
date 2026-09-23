export interface AssetFetcher {
	fetch(request: Request): Promise<Response>;
}

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
	ASSETS: AssetFetcher;

	// Supabase 與 OpenRouter 相關變數，請於 wrangler secret / vars 設定
	OPENROUTER_API_KEY: string;
}
