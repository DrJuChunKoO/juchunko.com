import type { Fetcher } from "@cloudflare/workers-types";

const markdownAssetPaths: Record<string, string> = {
	"/": "/llms.txt",
	"/en": "/llms.txt",
	"/en/": "/llms.txt",
	"/zh-TW": "/llms.txt",
	"/zh-TW/": "/llms.txt",
};

export function acceptsMarkdown(accept: string | null) {
	return Boolean(
		accept
			?.split(",")
			.map((value) => value.trim().split(";"))
			.some(
				([mediaType, ...parameters]) =>
					mediaType.toLowerCase() === "text/markdown" && parameters.every((parameter) => !/^q\s*=\s*0(?:\.0*)?$/i.test(parameter.trim())),
			),
	);
}

export function getMarkdownAssetPath(path: string) {
	const normalizedPath = path.length > 1 && path.endsWith("/") ? path.slice(0, -1) : path;
	return (
		markdownAssetPaths[path] ??
		markdownAssetPaths[normalizedPath] ??
		(/^\/(?:en|zh-TW)\/(?:act|manual|fragment)\/[^/]+$/.test(normalizedPath) ? `${normalizedPath}.md` : undefined)
	);
}

function addVary(response: Response, value: string) {
	const result = new Response(response.body, response);
	const vary = result.headers.get("Vary");
	const values = vary
		?.split(",")
		.map((item) => item.trim())
		.filter(Boolean);
	if (!values?.some((item) => item.toLowerCase() === value.toLowerCase())) {
		result.headers.set("Vary", [...(values ?? []), value].join(", "));
	}
	return result;
}

export async function fetchNegotiatedAsset(request: Request, assets: Fetcher) {
	const url = new URL(request.url);
	const markdownPath = getMarkdownAssetPath(url.pathname);
	const canNegotiate = (request.method === "GET" || request.method === "HEAD") && Boolean(markdownPath);
	const serveMarkdown = canNegotiate && acceptsMarkdown(request.headers.get("Accept"));

	if (serveMarkdown && markdownPath) {
		url.pathname = markdownPath;
	}

	const assetRequest = serveMarkdown ? new Request(url, { method: request.method, headers: request.headers }) : request;
	const assetResponse = await assets.fetch(assetRequest);
	if (!canNegotiate) return assetResponse;

	const response = addVary(assetResponse, "Accept");
	if (serveMarkdown) {
		response.headers.set("Content-Type", "text/markdown; charset=utf-8");
	}
	return response;
}
