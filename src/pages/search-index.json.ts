import type { APIRoute } from "astro";
import { getCollection } from "astro:content";

import { getRouteLangFromContentId, getSlugFromContentId } from "@/lib/content";
import { searchableCollections, type SearchDoc, type SearchableCollection } from "@/lib/search";
import { stripMarkdown } from "@/lib/utils";

async function getSearchDocs(collection: SearchableCollection): Promise<SearchDoc[]> {
	const entries = await getCollection(collection);

	return entries.flatMap((entry) => {
		const lang = getRouteLangFromContentId(entry.id);
		const slug = getSlugFromContentId(entry.id);
		if (!lang || !slug) return [];

		return [
			{
				id: `${collection}/${entry.id}`,
				lang,
				collection,
				slug,
				url: `/${lang}/${collection}/${slug}`,
				title: entry.data.title,
				description: entry.data.description ?? "",
				status: "status" in entry.data ? entry.data.status : undefined,
				emoji: entry.data.emoji,
				body: stripMarkdown(entry.body),
			},
		];
	});
}

export const GET: APIRoute = async () => {
	const docs = (await Promise.all(searchableCollections.map((collection) => getSearchDocs(collection))))
		.flat()
		.sort((a, b) => a.lang.localeCompare(b.lang) || a.collection.localeCompare(b.collection) || a.slug.localeCompare(b.slug));

	return new Response(JSON.stringify({ version: 1, docs }), {
		headers: {
			"Cache-Control": "public, max-age=3600",
			"Content-Type": "application/json; charset=utf-8",
		},
	});
};
