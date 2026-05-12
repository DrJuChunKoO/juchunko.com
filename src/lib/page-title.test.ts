import assert from "node:assert/strict";
import { test } from "node:test";

import { getPageTitles } from "./page-title";

test("getPageTitles keeps site name in document title but not social title for posts", () => {
	assert.deepEqual(getPageTitles({ postTitle: "AI 基本法", siteTitle: "科技立委葛如鈞．寶博士" }), {
		documentTitle: "AI 基本法 | 科技立委葛如鈞．寶博士",
		socialTitle: "AI 基本法",
	});
});
