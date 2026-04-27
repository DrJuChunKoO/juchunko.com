import test from "node:test";
import assert from "node:assert/strict";
import { getIndexCards } from "./index-cards";

function createJsonResponse(payload: unknown) {
	return new Response(JSON.stringify(payload), {
		status: 200,
		headers: {
			"Content-Type": "application/json",
		},
	});
}

function createXmlResponse(xml: string) {
	return new Response(xml, {
		status: 200,
		headers: {
			"Content-Type": "application/xml",
		},
	});
}

test("getIndexCards keeps available legislator cards when one legislator feed fails", async () => {
	const originalFetch = globalThis.fetch;
	const originalConsoleError = console.error;

	globalThis.fetch = async (input: string | URL | Request) => {
		const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;

		if (url === "https://aifferent.juchunko.com/api/news") {
			return createJsonResponse({ data: [] });
		}

		if (url.startsWith("https://blog.juchunko.com/rss.xml")) {
			return createXmlResponse("<rss><channel></channel></rss>");
		}

		if (url.startsWith("https://transpal.juchunko.com/rss.xml")) {
			return createXmlResponse("<rss><channel></channel></rss>");
		}

		if (url.includes("/propose_bills?limit=3")) {
			return createJsonResponse({
				bills: [
					{
						議案編號: "proposal-1",
						議案名稱: "提案法案",
						議案狀態: "排入院會",
						"法律編號:str": ["學校衛生法"],
						最新進度日期: "2026-03-24",
						url: "https://example.com/proposal-1",
					},
				],
			});
		}

		if (url.includes("/cosign_bills?limit=3")) {
			return createJsonResponse({
				bills: [
					{
						議案編號: "cosign-1",
						議案名稱: "連署法案",
						議案狀態: "交付審查",
						"法律編號:str": ["教師法"],
						最新進度日期: "2026-03-23",
						url: "https://example.com/cosign-1",
					},
				],
			});
		}

		if (url.includes("/meets?limit=3")) {
			throw new Error("meet endpoint unavailable");
		}

		throw new Error(`Unexpected fetch: ${url}`);
	};
	console.error = () => {};

	try {
		const result = await getIndexCards("zh-TW");

		assert.equal(result.legislatorCards.length, 2);
		assert.equal(result.legislatorCards[0]?.title, "提案法案");
		assert.equal(result.legislatorCards[1]?.title, "連署法案");
	} finally {
		globalThis.fetch = originalFetch;
		console.error = originalConsoleError;
	}
});

test("getIndexCards selects the newest localized blog RSS items by publication date", async () => {
	const originalFetch = globalThis.fetch;

	globalThis.fetch = async (input: string | URL | Request) => {
		const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;

		if (url === "https://aifferent.juchunko.com/api/news") {
			return createJsonResponse({ data: [] });
		}

		if (url.startsWith("https://blog.juchunko.com/rss.xml")) {
			return createXmlResponse(`
				<rss><channel>
					<item>
						<title>兩年前的文章</title>
						<link>https://blog.juchunko.com/zh/old-post/</link>
						<pubDate>Tue, 09 Apr 2024 00:00:00 GMT</pubDate>
					</item>
					<item>
						<title>4/9 最新文章</title>
						<link>https://blog.juchunko.com/zh/latest-post/</link>
						<pubDate>Thu, 09 Apr 2026 00:00:00 GMT</pubDate>
					</item>
					<item>
						<title>English newest post</title>
						<link>https://blog.juchunko.com/en/latest-post/</link>
						<pubDate>Fri, 10 Apr 2026 00:00:00 GMT</pubDate>
					</item>
					<item>
						<title>次新文章</title>
						<link>https://blog.juchunko.com/zh/second-post/</link>
						<pubDate>Wed, 08 Apr 2026 00:00:00 GMT</pubDate>
					</item>
				</channel></rss>
			`);
		}

		if (url.startsWith("https://transpal.juchunko.com/rss.xml")) {
			return createXmlResponse("<rss><channel></channel></rss>");
		}

		if (url.includes("/propose_bills?limit=3") || url.includes("/cosign_bills?limit=3")) {
			return createJsonResponse({ bills: [] });
		}

		if (url.includes("/meets?limit=3")) {
			return createJsonResponse({ meets: [] });
		}

		throw new Error(`Unexpected fetch: ${url}`);
	};

	try {
		const result = await getIndexCards("zh-TW");

		assert.deepEqual(
			result.blogCards.map((card) => card.title),
			["4/9 最新文章", "次新文章", "兩年前的文章"],
		);
	} finally {
		globalThis.fetch = originalFetch;
	}
});
