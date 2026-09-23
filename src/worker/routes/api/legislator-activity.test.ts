import test from "node:test";
import assert from "node:assert/strict";
import type { Env } from "../../types";
import app, { LEGISLATOR_ACTIVITY_CACHE_CONTROL } from "./legislator-activity";

function setupCache(t: { after: (fn: () => void) => void }) {
	const previous = Object.getOwnPropertyDescriptor(globalThis, "caches");
	let writes = 0;
	Object.defineProperty(globalThis, "caches", {
		configurable: true,
		value: {
			default: {
				match: async () => undefined,
				put: async () => {
					writes++;
				},
			},
		},
	});
	t.after(() => {
		if (previous) Object.defineProperty(globalThis, "caches", previous);
		else Reflect.deleteProperty(globalThis, "caches");
	});
	return () => writes;
}

function request(query = "") {
	return app.fetch(new Request(`https://example.com/?${query}`), {} as Env, {
		waitUntil() {},
		passThroughOnException() {},
		props: {},
	});
}

test("upstream HTTP failures return an error without caching empty results", async (t) => {
	const writes = setupCache(t);
	t.mock.method(console, "error", () => {});
	t.mock.method(globalThis, "fetch", async (input: string | URL | Request) =>
		String(input).includes("propose_bills") ? new Response(null, { status: 503 }) : Response.json({ bills: [], meets: [] }),
	);

	const response = await request();
	assert.equal(response.status, 500);
	assert.match((await response.json()).message, /propose_bills.*HTTP 503/);
	assert.equal(writes(), 0);
});

test("valid empty lists return cacheable success, but malformed lists do not", async (t) => {
	const writes = setupCache(t);
	const fetchMock = t.mock.method(globalThis, "fetch", async () => Response.json({ bills: [], meets: [] }));

	const response = await request();
	assert.equal(response.status, 200);
	assert.equal(response.headers.get("Cache-Control"), LEGISLATOR_ACTIVITY_CACHE_CONTROL);
	assert.deepEqual(await response.json(), { success: true, data: [], meta: { page: 1, pageSize: 20, totalItems: 0, totalPages: 0 } });
	assert.equal(writes(), 1);

	fetchMock.mock.restore();
	t.mock.method(console, "error", () => {});
	t.mock.method(globalThis, "fetch", async () => Response.json({}));
	const malformed = await request();
	assert.equal(malformed.status, 500);
	assert.equal(writes(), 1);
});

test("invalid pagination is rejected before cache lookup or upstream fetch", async (t) => {
	const writes = setupCache(t);
	const fetchMock = t.mock.method(globalThis, "fetch", async () => Response.json({ bills: [], meets: [] }));

	for (const query of [
		"page=0",
		"page=-1",
		"page=1.5",
		"page=1x",
		"page=51",
		"pageSize=0",
		"pageSize=101",
		"pageSize=2e1",
		"page=11&pageSize=100",
	]) {
		const response = await request(query);
		assert.equal(response.status, 400, query);
		assert.equal((await response.json()).success, false);
	}
	assert.equal(fetchMock.mock.callCount(), 0);
	assert.equal(writes(), 0);
});

test("allowed pagination bounds the upstream fetch limit", async (t) => {
	setupCache(t);
	const urls: URL[] = [];
	t.mock.method(globalThis, "fetch", async (input: string | URL | Request) => {
		urls.push(new URL(String(input)));
		return Response.json({ bills: [], meets: [] });
	});

	const response = await request("page=50&pageSize=20");
	assert.equal(response.status, 200);
	assert.equal(urls.length, 3);
	assert.ok(urls.every((url) => url.searchParams.get("limit") === "1000"));
});
