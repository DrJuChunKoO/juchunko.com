import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import Nav, { resolveNavLang } from "./Nav";

test("resolveNavLang prefers URL locale and falls back to browser language on root", () => {
	assert.equal(resolveNavLang("/en/news", "zh-TW"), "en");
	assert.equal(resolveNavLang("/", "en-US"), "en");
	assert.equal(resolveNavLang("/", "zh-CN"), "zh-TW");
	assert.equal(resolveNavLang("/", undefined, "zh-TW"), "zh-TW");
});

test("react nav renders the translated links for the requested locale", () => {
	const markup = renderToStaticMarkup(createElement(Nav, { lang: "en" }));

	assert.match(markup, /href="\/en"/);
	assert.match(markup, />Ju Chun Ko</);
	assert.match(markup, />Blog</);
	assert.match(markup, /aria-controls="mobile-nav"/);
});

test("mobile nav stays attached to the sticky header instead of using fixed positioning", () => {
	const markup = renderToStaticMarkup(createElement(Nav, { lang: "en" }));

	assert.match(markup, /id="mobile-nav"/);
	assert.doesNotMatch(markup, /nav-menu[^\"]*fixed/);
	assert.match(markup, /nav-menu[^\"]*absolute/);
	assert.match(markup, /nav-menu[^\"]*top-full/);
	assert.match(markup, /nav-menu[^\"]*min-h-\[calc\(100svh-4rem\)\]/);
	assert.match(markup, /nav-menu[^\"]*overflow-y-auto/);
});

test("page layout hydrates the react nav on load", () => {
	const layoutSource = readFileSync(new URL("../layouts/PageLayout.astro", import.meta.url), "utf8");

	assert.match(layoutSource, /import Nav from "\.\.\/components\/Nav";/);
	assert.match(layoutSource, /<Nav lang={lang} client:load \/>/);
});
