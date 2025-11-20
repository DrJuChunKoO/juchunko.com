// HTML Entity Decoder
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
		"&lsquo;": "\u2018",
		"&rsquo;": "\u2019",
		"&ldquo;": "\u201c",
		"&rdquo;": "\u201d",
	};

	return text
		.replace(/<!\[CDATA\[(.*?)\]\]>|&(?:#\d+|#x[0-9a-fA-F]+|[a-zA-Z]+);/gs, (m, c) => {
			if (c !== undefined) return c;
			return namedEntities[m] ?? m;
		})
		.trim();
}
