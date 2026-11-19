import { z } from "zod";

export const INDEXNOW_KEY = "d6b168ad4d8fb5e122d698f33872b4b6";
export const SITE_HOST = "juchunko.com";
export const MANIFEST_PATH = "/indexnow-manifest.json";

export const manifestSchema = z.object({
	version: z.literal(1),
	pages: z.record(z.string(), z.string()),
});

export type IndexNowManifest = z.infer<typeof manifestSchema>;

export function changedUrls(previous: IndexNowManifest | null, next: IndexNowManifest): string[] {
	return Object.entries(next.pages)
		.filter(([url, hash]) => previous?.pages[url] !== hash)
		.map(([url]) => url)
		.sort();
}

export function buildSubmission(urls: string[]) {
	return {
		host: SITE_HOST,
		key: INDEXNOW_KEY,
		keyLocation: `https://${SITE_HOST}/${INDEXNOW_KEY}.txt`,
		urlList: urls,
	};
}
