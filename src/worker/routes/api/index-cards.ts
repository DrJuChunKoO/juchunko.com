import { Hono } from "hono";
import type { Env } from "../../types";
import { getIndexCards } from "../../data/index-cards";
import { matchEdgeCache, putEdgeCache } from "../../lib/cache";

const app = new Hono<{ Bindings: Env }>();

export const INDEX_CARDS_CACHE_CONTROL = "public, max-age=900, s-maxage=900, stale-while-revalidate=300";

app.get("/", async (c) => {
	const lang = (c.req.query("lang") as "en" | "zh-TW") || "zh-TW";

	const cacheKey = new URL(c.req.url);
	cacheKey.searchParams.set("lang", lang);
	cacheKey.searchParams.sort();

	const cached = await matchEdgeCache(cacheKey.toString());
	if (cached) {
		return cached;
	}

	try {
		const data = await getIndexCards(lang);
		const response = c.json(data);
		response.headers.set("Cache-Control", INDEX_CARDS_CACHE_CONTROL);
		response.headers.set("Access-Control-Allow-Origin", "*");
		putEdgeCache(c.executionCtx, cacheKey.toString(), response);
		return response;
	} catch (error) {
		console.error("Failed to fetch index cards:", error);
		return c.json(
			{
				error: "Failed to fetch data",
				message: error instanceof Error ? error.message : String(error),
			},
			500,
		);
	}
});

export default app;
