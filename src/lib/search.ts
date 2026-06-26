import Fuse from "fuse.js";

import type { Lang } from "@/i18n/ui";

export const searchableCollections = ["act", "manual", "fragment"] as const;

export type SearchableCollection = (typeof searchableCollections)[number];

export interface SearchDoc {
	id: string;
	lang: Lang;
	collection: SearchableCollection;
	slug: string;
	url: string;
	title: string;
	description: string;
	status?: string;
	emoji: string;
	body: string;
}

export type SearchResult = Fuse.FuseResult<SearchDoc>;

export function buildFuseOptions(): Fuse.IFuseOptions<SearchDoc> {
	return {
		includeMatches: true,
		ignoreLocation: true,
		minMatchCharLength: 2,
		threshold: 0.4,
		keys: [
			{ name: "title", weight: 0.5 },
			{ name: "description", weight: 0.25 },
			{ name: "status", weight: 0.15 },
			{ name: "body", weight: 0.1 },
		],
	};
}

export function searchDocs(docs: SearchDoc[], query: string, lang: Lang, limit = 10): SearchResult[] {
	const normalizedQuery = query.trim();
	if (!normalizedQuery) return [];

	const localizedDocs = docs.filter((doc) => doc.lang === lang);
	const fuse = new Fuse(localizedDocs, buildFuseOptions());
	return fuse.search(normalizedQuery, { limit });
}
