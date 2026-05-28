import { Hono } from "hono";
import actSummary from "./act-summary";
import indexCards from "./index-cards";
import chat from "./chat";
import legislatorActivity from "./legislator-activity";

const app = new Hono();

app.route("/index-cards", indexCards);
app.route("/act-summary", actSummary);
app.route("/chat", chat);
app.route("/legislator-activity", legislatorActivity);

export default app;
