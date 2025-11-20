import { Hono } from "hono";
import api from "./routes/api";
import type { Env } from "./types";

const app = new Hono<{ Bindings: Env }>();

// API routes
app.route("/api", api);

// Static assets fallback - serve all other requests through Cloudflare Workers Assets
app.all("*", (c) => {
	return c.env.ASSETS.fetch(c.req.raw);
});

export default app;
