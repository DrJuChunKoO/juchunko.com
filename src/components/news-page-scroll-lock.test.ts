import test from "node:test";
import assert from "node:assert/strict";
import { applyDialogScrollLock } from "./news-page-scroll-lock";

test("applyDialogScrollLock locks both html and body scrolling and restores prior styles", () => {
	const documentLike = {
		documentElement: {
			style: {
				overflow: "auto",
				overscrollBehavior: "auto",
			},
		},
		body: {
			style: {
				overflow: "scroll",
				touchAction: "manipulation",
			},
		},
	};

	const restore = applyDialogScrollLock(documentLike as unknown as Document);

	assert.equal(documentLike.documentElement.style.overflow, "hidden");
	assert.equal(documentLike.documentElement.style.overscrollBehavior, "none");
	assert.equal(documentLike.body.style.overflow, "hidden");
	assert.equal(documentLike.body.style.touchAction, "none");

	restore();

	assert.equal(documentLike.documentElement.style.overflow, "auto");
	assert.equal(documentLike.documentElement.style.overscrollBehavior, "auto");
	assert.equal(documentLike.body.style.overflow, "scroll");
	assert.equal(documentLike.body.style.touchAction, "manipulation");
});
