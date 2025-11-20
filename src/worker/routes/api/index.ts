import { Hono } from "hono";
import indexCards from "./index-cards";
import chat from "./chat";

const app = new Hono();

app.route("/index-cards", indexCards);
app.route("/chat", chat);

export default app;
