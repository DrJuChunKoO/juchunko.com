// Shared RSS helper utilities used by multiple components
export type FeedItem = {
	id: string;
	title: string;
	description?: string;
	link: string;
	pubDate?: string;
	category?: string;
	author?: string;
};

export function decodeHtmlEntities(text: string | undefined): string {
	if (!text) return "";
	const namedEntities: Record<string, string> = {
		"&apos;": "'",
		"&quot;": '"',
		"&amp;": "&",
		"&lt;": "<",
		"&gt;": ">",
		"&nbsp;": "\u00a0",
		"&hellip;": "…",
		"&mdash;": "—",
		"&ndash;": "–",
		"&lsquo;": "‘",
		"&rsquo;": "’",
		"&ldquo;": "“",
		"&rdquo;": "”",
	};

	return text
		.replace(/<!\[CDATA\[(.*?)\]\]>|&(?:#\d+|#x[0-9a-fA-F]+|[a-zA-Z]+);/gs, (m, c) => {
			if (c !== undefined) return c;
			return namedEntities[m] ?? m;
		})
		.trim();
}

export async function fetchRss(url: string): Promise<FeedItem[]> {
	try {
		const res = await fetch(url, { method: "GET", headers: { accept: "application/xml" }, cache: "no-store" });
		if (!res.ok) throw new Error(`Failed to fetch RSS: ${res.status} ${res.statusText}`);
		const xml = await res.text();
		return parseRss(xml);
	} catch (e) {
		console.error(e);
		return [];
	}
}

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
