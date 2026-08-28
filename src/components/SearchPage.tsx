import { useDeferredValue, useEffect, useState, startTransition, type FormEvent } from "react";
import { ArrowUpRight, Search, X } from "lucide-react";

import { ui, type Lang } from "@/i18n/ui";
import { cn } from "@/lib/utils";
import { searchDocs, type SearchDoc, type SearchResult } from "@/lib/search";
import { Loader } from "./Loader";

interface SearchIndexPayload {
	version: number;
	docs: SearchDoc[];
}

interface SearchPageProps {
	lang: Lang;
}

const BODY_SNIPPET_LENGTH = 160;

function getCopy(lang: Lang) {
	return ui[lang] as Record<string, string>;
}

function getCollectionLabel(doc: SearchDoc, copy: Record<string, string>) {
	if (doc.collection === "act") return copy["cat.acts"];
	if (doc.collection === "manual") return copy["cat.manuals"];
	return copy["cat.fragments"];
}

function getSnippet(result: SearchResult) {
	const bodyMatch = result.matches?.find((match) => match.key === "body");
	const body = result.item.body;
	if (!bodyMatch?.indices.length) return body.slice(0, BODY_SNIPPET_LENGTH);

	const [start] = bodyMatch.indices[0];
	const snippetStart = Math.max(0, start - 40);
	const snippet = body.slice(snippetStart, snippetStart + BODY_SNIPPET_LENGTH).trim();
	return `${snippetStart > 0 ? "..." : ""}${snippet}${snippetStart + BODY_SNIPPET_LENGTH < body.length ? "..." : ""}`;
}

export default function SearchPage({ lang }: SearchPageProps) {
	const copy = getCopy(lang);
	const [docs, setDocs] = useState<SearchDoc[]>([]);
	const [searchDraft, setSearchDraft] = useState("");
	const [searchQuery, setSearchQuery] = useState("");
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const deferredQuery = useDeferredValue(searchQuery);
	const results = searchDocs(docs, deferredQuery, lang, 20);

	useEffect(() => {
		const initialQuery = new URLSearchParams(window.location.search).get("q") ?? "";
		setSearchDraft(initialQuery);
		setSearchQuery(initialQuery);
	}, []);

	useEffect(() => {
		let cancelled = false;

		async function loadIndex() {
			try {
				const response = await fetch("/search-index.json");
				if (!response.ok) throw new Error(`HTTP ${response.status}`);
				const payload = (await response.json()) as SearchIndexPayload;
				if (!cancelled) setDocs(payload.docs.filter((doc) => doc.lang === lang));
			} catch (err) {
				console.error("Failed to load search index", err);
				if (!cancelled) setError(copy["search.error"]);
			} finally {
				if (!cancelled) setIsLoading(false);
			}
		}

		loadIndex();
		return () => {
			cancelled = true;
		};
	}, [copy, lang]);

	useEffect(() => {
		const params = new URLSearchParams(window.location.search);
		if (searchQuery) {
			params.set("q", searchQuery);
		} else {
			params.delete("q");
		}
		const queryString = params.toString();
		const nextUrl = queryString ? `${window.location.pathname}?${queryString}` : window.location.pathname;
		window.history.replaceState(null, "", nextUrl);
	}, [searchQuery]);

	const submitSearch = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		startTransition(() => setSearchQuery(searchDraft.trim()));
	};

	const clearSearch = () => {
		setSearchDraft("");
		startTransition(() => setSearchQuery(""));
	};

	return (
		<div className="space-y-6">
			<form onSubmit={submitSearch} className="border-border/70 bg-card/70 flex items-center gap-2 rounded-xl border p-2 backdrop-blur">
				<Search className="text-muted-foreground ml-3 size-5 shrink-0" aria-hidden="true" />
				<label className="sr-only" htmlFor="site-search-input">
					{copy["search.label"]}
				</label>
				<input
					id="site-search-input"
					type="search"
					value={searchDraft}
					onChange={(event) => setSearchDraft(event.target.value)}
					placeholder={copy["search.placeholder"]}
					className="text-foreground placeholder:text-muted-foreground min-w-0 flex-1 bg-transparent px-1 py-3 text-base outline-none [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden"
				/>
				{searchDraft ? (
					<button
						type="button"
						onClick={clearSearch}
						className="text-muted-foreground hover:text-foreground hover:bg-muted rounded-full p-2 transition-colors motion-safe:active:scale-[0.97]"
					>
						<span className="sr-only">{copy["search.clear"]}</span>
						<X className="size-4" aria-hidden="true" />
					</button>
				) : null}
				<button
					type="submit"
					className="bg-foreground text-background hover:bg-foreground/85 rounded-lg px-4 py-3 text-sm font-medium transition-colors motion-safe:active:scale-[0.97]"
				>
					{copy["search.submit"]}
				</button>
			</form>

			{isLoading ? (
				<div className="text-muted-foreground flex items-center gap-2 text-sm">
					<Loader size={16} />
					{copy["search.loading"]}
				</div>
			) : error ? (
				<p className="text-sm text-red-600 dark:text-red-400">{error}</p>
			) : deferredQuery ? (
				<p className="text-muted-foreground text-sm">
					{copy["search.resultsHint"].replace("{query}", deferredQuery).replace("{count}", String(results.length))}
				</p>
			) : null}

			{!isLoading && !error && deferredQuery && results.length === 0 ? (
				<div className="border-border/70 bg-muted/30 text-muted-foreground rounded-xl border p-6 text-sm">{copy["search.empty"]}</div>
			) : null}

			<div className="space-y-3">
				{results.map((result) => {
					const doc = result.item;
					return (
						<a
							key={doc.id}
							href={doc.url}
							className={cn(
								"border-border/70 bg-card/60 hover:border-foreground/35 group block rounded-xl border p-4 transition-colors",
								"hover:bg-muted/30 focus-visible:border-foreground/35 focus-visible:outline-primary focus-visible:outline-2 focus-visible:outline-offset-2",
							)}
						>
							<div className="flex items-start gap-3">
								<span className="text-2xl" aria-hidden="true">
									{doc.emoji}
								</span>
								<div className="min-w-0 flex-1 space-y-2">
									<div className="flex items-start justify-between gap-3">
										<div>
											<p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">{getCollectionLabel(doc, copy)}</p>
											<h2 className="text-foreground group-hover:text-foreground/80 text-lg font-semibold tracking-tight">{doc.title}</h2>
										</div>
										<ArrowUpRight className="text-muted-foreground mt-1 size-4 shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
									</div>
									{doc.status ? <p className="text-muted-foreground text-xs">{doc.status}</p> : null}
									<p className="text-muted-foreground line-clamp-3 text-sm leading-relaxed">{doc.description || getSnippet(result)}</p>
								</div>
							</div>
						</a>
					);
				})}
			</div>
		</div>
	);
}
