type CfCacheInit = RequestInit & {
	cf?: {
		cacheTtl?: number;
		cacheEverything?: boolean;
	};
};

export function getDefaultCache(): Cache {
	return (caches as CacheStorage & { default: Cache }).default;
}

export async function matchEdgeCache(request: Request | string): Promise<Response | undefined> {
	return getDefaultCache().match(request);
}

export function putEdgeCache(ctx: { waitUntil: (promise: Promise<unknown>) => void }, request: Request | string, response: Response) {
	ctx.waitUntil(getDefaultCache().put(request, response.clone()));
}

/** Cache third-party subrequests via Cloudflare's HTTP cache (tiered). */
export function cachedFetch(input: string | URL | Request, init: CfCacheInit = {}, cacheTtlSeconds = 900): Promise<Response> {
	return fetch(input, {
		...init,
		cf: {
			...init.cf,
			cacheTtl: init.cf?.cacheTtl ?? cacheTtlSeconds,
			cacheEverything: init.cf?.cacheEverything ?? true,
		},
	});
}
