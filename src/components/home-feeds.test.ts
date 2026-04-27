import test from "node:test";
import assert from "node:assert/strict";
import { getHomeFeedHeadingTag } from "./HomeFeeds";

test("getHomeFeedHeadingTag returns the requested semantic heading tag", () => {
	assert.equal(getHomeFeedHeadingTag(3), "h3");
});
