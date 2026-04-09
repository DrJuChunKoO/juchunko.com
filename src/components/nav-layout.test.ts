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

test("github and theme toggle buttons use the same foreground color treatment", () => {
	const markup = renderToStaticMarkup(createElement(Nav, { lang: "en" }));

	assert.match(
		markup,
		/href="https:\/\/github\.com\/DrJuChunKoO\/juchunko\.com"[^>]*class="[^"]*text-muted-foreground[^"]*hover:text-foreground/,
	);
	assert.match(markup, /aria-label="Toggle dark mode"[^>]*class="[^"]*text-muted-foreground[^"]*hover:text-foreground/);
});

test("mobile nav stays attached to the sticky header instead of using fixed positioning", () => {
	const markup = renderToStaticMarkup(createElement(Nav, { lang: "en" }));
	const navSource = readFileSync(new URL("./Nav.tsx", import.meta.url), "utf8");

	assert.match(markup, /aria-controls="mobile-nav"/);
	assert.doesNotMatch(markup, /id="mobile-nav"/);
	assert.match(navSource, /\{isMenuOpen && \(/);
	assert.match(navSource, /id="mobile-nav"/);
	assert.doesNotMatch(navSource, /nav-menu[^\"]*fixed/);
	assert.match(navSource, /nav-menu text-foreground inset-x-0 top-full z-50 overflow-y-auto/);
});

test("page layout hydrates the react nav on load", () => {
	const layoutSource = readFileSync(new URL("../layouts/PageLayout.astro", import.meta.url), "utf8");

	assert.match(layoutSource, /import Nav from "\.\.\/components\/Nav";/);
	assert.match(layoutSource, /<Nav lang={lang} client:load \/>/);
});

test("root layout bootstraps the stored theme in head before hydration", () => {
	const layoutSource = readFileSync(new URL("../layouts/Layout.astro", import.meta.url), "utf8");

	assert.match(layoutSource, /<head>[\s\S]*<script is:inline>/);
	assert.match(layoutSource, /localStorage\.getItem\("theme"\)/);
	assert.match(layoutSource, /matchMedia\("\(prefers-color-scheme: dark\)"\)/);
	assert.match(layoutSource, /documentElement\.classList\.toggle\("dark", dark\)/);
	assert.match(layoutSource, /closest\("\[data-theme-toggle\]"\)/);
});
