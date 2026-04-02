import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("desktop nav stays fixed and page content leaves space for it", () => {
	const navSource = readFileSync(new URL("./Nav.astro", import.meta.url), "utf8");
	const layoutSource = readFileSync(new URL("../layouts/PageLayout.astro", import.meta.url), "utf8");

	assert.match(navSource, /fixed inset-x-0 top-0 z-40/);
	assert.match(navSource, /bg-background\/75/);
	assert.match(layoutSource, /bg-card pt-20 pb-10 md:max-w-\[90vw\] md:pt-20 md:pb-16/);
});
