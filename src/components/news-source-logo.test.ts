import test from "node:test";
import assert from "node:assert/strict";
import { getNewsSourceLogo, newsSourceLogos } from "./news-source-logo";

test("maps high-frequency news sources to local logo assets", () => {
	assert.equal(getNewsSourceLogo("UDN"), "/news-logos/udn.png");
	assert.equal(getNewsSourceLogo("中央社"), "/news-logos/cna.png");
	assert.equal(getNewsSourceLogo("Focus Taiwan - CNA English News"), "/news-logos/cna.png");
	assert.ok(Object.keys(newsSourceLogos).length >= 20);
});

test("normalizes source whitespace and falls back for unknown sources", () => {
	assert.equal(getNewsSourceLogo(" TVBS新聞網 "), "/news-logos/tvbs.png");
	assert.equal(getNewsSourceLogo("Unknown News"), null);
	assert.equal(getNewsSourceLogo(null), null);
});
