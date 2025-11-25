import { Hono } from "hono";
import api from "./routes/api";
import type { Env } from "./types";

const app = new Hono<{ Bindings: Env }>();

// API routes
app.route("/api", api);

// Redirects
app.get("/en-US/docs/news", (c) =>
	c.redirect("https://beta.juchunko.com/en/news", 301),
);
app.get("/docs/news", (c) =>
	c.redirect("https://beta.juchunko.com/zh-TW/news", 301),
);

app.get("/en-US/docs/*", (c) => {
	const path = c.req.path.replace("/en-US/docs/", "");
	if (path.startsWith("act/") || path.startsWith("manual/")) {
		return c.redirect(`/en/${path}`, 301);
	}
	return c.redirect(`/en/fragment/${path}`, 301);
});

app.get("/docs/*", (c) => {
	const path = c.req.path.replace("/docs/", "");
	if (path.startsWith("act/") || path.startsWith("manual/")) {
		return c.redirect(`/zh-TW/${path}`, 301);
	}
	return c.redirect(`/zh-TW/fragment/${path}`, 301);
});

// Static assets fallback - serve all other requests through Cloudflare Workers Assets
app.all("*", (c) => {
	return c.env.ASSETS.fetch(c.req.raw);
});

export default app;
