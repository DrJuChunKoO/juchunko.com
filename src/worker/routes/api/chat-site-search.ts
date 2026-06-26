import type { Lang } from "@/i18n/ui";
import { searchDocs, type SearchDoc } from "@/lib/search";

const SITE_ORIGIN = "https://juchunko.com";
const GITHUB_CONTENT_BASE_URL = "https://github.com/DrJuChunKoO/juchunko.com/raw/refs/heads/astro";
const supportedLangs = new Set<Lang>(["en", "zh-TW"]);
const supportedContentCategories = new Set(["act", "manual", "fragment"]);

export interface SearchIndexPayload {
	version: number;
	docs: SearchDoc[];
}

export function inferLangFromFilename(filename: string): Lang {
	const [, lang] = filename.split("/");
	return supportedLangs.has(lang as Lang) ? (lang as Lang) : "zh-TW";
}

export function contentFilePathFromArticleUrl(inputUrl: string): string {
	const url = new URL(inputUrl, SITE_ORIGIN);
	if (url.origin !== SITE_ORIGIN) {
		throw new Error("Only juchunko.com article URLs are supported");
	}

	const [lang, contentCategory, ...slugParts] = url.pathname.replace(/^\/+|\/+$/g, "").split("/");
	if (!supportedLangs.has(lang as Lang)) {
		throw new Error("Article URL must start with /en or /zh-TW");
	}
	if (!supportedContentCategories.has(contentCategory)) {
		throw new Error("Article URL must point to act, manual, or fragment content");
	}
	if (slugParts.length === 0 || slugParts.some((part) => !part || part === "." || part === "..")) {
		throw new Error("Article URL is missing a valid slug");
	}

	return `src/content/${contentCategory}/${lang}/${slugParts.join("/")}.mdx`;
}

export function githubContentUrlFromArticleUrl(inputUrl: string): string {
	return `${GITHUB_CONTENT_BASE_URL}/${contentFilePathFromArticleUrl(inputUrl)}`;
}

export function buildSiteSearchToolResult(docs: SearchDoc[], keyword: string, lang: Lang, limit = 8) {
	const results = searchDocs(docs, keyword, lang, limit).map((result) => {
		const bodyMatch = result.matches?.find((match) => match.key === "body");
		const body = result.item.body;
		const start = bodyMatch?.indices[0]?.[0] ?? 0;
		const snippetStart = Math.max(0, start - 40);
		const snippet = body.slice(snippetStart, snippetStart + 220).trim();

		return {
			title: result.item.title,
			url: `${SITE_ORIGIN}${result.item.url}`,
			lang: result.item.lang,
			collection: result.item.collection,
			description: result.item.description,
			status: result.item.status,
			snippet: `${snippetStart > 0 ? "..." : ""}${snippet}${snippetStart + 220 < body.length ? "..." : ""}`,
		};
	});

	return {
		query: keyword,
		lang,
		resultCount: results.length,
		results,
	};
}
