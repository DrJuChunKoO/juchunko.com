import type { FeedItem } from "../types";
import { decodeHtmlEntities } from "./html";

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

export async function fetchRss(url: string): Promise<FeedItem[]> {
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
