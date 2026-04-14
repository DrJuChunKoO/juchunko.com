import test from "node:test";
import assert from "node:assert/strict";
import { dialogBackdropVariants, dialogLayerClassNames, dialogPanelVariants } from "./news-page-motion";

test("dialog layer uses a single overlay so AnimatePresence controls full entry and exit", () => {
	assert.ok(dialogLayerClassNames.overlay.includes("fixed inset-0 z-50"));
	assert.ok(dialogLayerClassNames.overlay.includes("bg-black/55"));
	assert.equal(Object.keys(dialogLayerClassNames).length, 2, "only overlay and panel — no separate backdrop layer");
});

test("dialog panel animates with scale and opacity, not position", () => {
	assert.deepEqual(dialogPanelVariants.open, {
		opacity: 1,
		scale: 1,
		transition: {
			type: "spring",
			stiffness: 380,
			damping: 30,
			mass: 0.8,
		},
	});
	assert.deepEqual(dialogPanelVariants.closed, {
		opacity: 0,
		scale: 0.95,
		transition: { duration: 0.15, ease: [0.4, 0, 1, 1] },
	});
	assert.deepEqual(dialogBackdropVariants.open, {
		opacity: 1,
		transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] },
	});
	assert.deepEqual(dialogBackdropVariants.closed, {
		opacity: 0,
		transition: { duration: 0.15, ease: [0.4, 0, 1, 1] },
	});
});
