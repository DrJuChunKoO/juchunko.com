import { Hono } from "hono";
import type { Env } from "../../types";
import { getIndexCards } from "../../data/index-cards";

const app = new Hono<{ Bindings: Env }>();

app.get("/", async (c) => {
	const lang = (c.req.query("lang") as "en" | "zh-TW") || "zh-TW";

	// Try to get from cache first
	const cache = caches.default;
	const cacheUrl = new URL(c.req.url);
	let response = await cache.match(cacheUrl);

	if (response) {
		// Return cached response
		return response;
	}

	// Cache miss - fetch fresh data
	try {
		const data = await getIndexCards(lang);

		// Create response with cache headers
		response = c.json(data);
		response.headers.set("Cache-Control", "public, max-age=86400"); // 1 day
		response.headers.set("Access-Control-Allow-Origin", "*");

		// Store in cache
		await cache.put(cacheUrl, response.clone());

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
