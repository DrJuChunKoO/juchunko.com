import { createHash } from "node:crypto";
import type { APIRoute } from "astro";
import { getCollection } from "astro:content";

import { SITE_HOST, type IndexNowManifest } from "@/lib/indexnow";
import { getRouteLangFromContentId, getSlugFromContentId } from "@/lib/content";
import { searchableCollections } from "@/lib/search";

export const GET: APIRoute = async () => {
	const pages: IndexNowManifest["pages"] = {};

	for (const collection of searchableCollections) {
		for (const entry of await getCollection(collection)) {
			const lang = getRouteLangFromContentId(entry.id);
			const slug = getSlugFromContentId(entry.id);
			if (!lang || !slug) continue;

			const hash = createHash("sha256")
				.update(JSON.stringify(entry.data))
				.update(entry.body ?? "")
				.digest("hex")
				.slice(0, 16);
			pages[`https://${SITE_HOST}/${lang}/${collection}/${slug}/`] = hash;
		}
	}

	const manifest: IndexNowManifest = { version: 1, pages };
	return new Response(JSON.stringify(manifest), { headers: { "Content-Type": "application/json" } });
};
