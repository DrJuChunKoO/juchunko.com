// @ts-check
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import Icons from "unplugin-icons/vite";

import react from "@astrojs/react";

import sitemap from "@astrojs/sitemap";
import partytown from "@astrojs/partytown";
import mdx from "@astrojs/mdx";
import { unified } from "@astrojs/markdown-remark";
import remarkCjkFriendly from "remark-cjk-friendly";
import remarkCjkFriendlyGfmStrikethrough from "remark-cjk-friendly-gfm-strikethrough";
import rehypeExternalLinks from "rehype-external-links";

import opengraphImages from "astro-opengraph-images";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { customRenderer } from "./src/lib/og-renderer.ts";

// Preload eager island chunks (client:load / client:only) so the browser fetches them during
// HTML parse and caches them in the module map. Without this, Astro's island loader issues a
// single lazy import() at end-of-body; a large chunk (e.g. ~1 MB Agent island) can then
// intermittently fail on slow/spotty connections with "Failed to fetch dynamically imported module".
// client:visible islands are intentionally skipped to keep their lazy behavior.
function preloadIslandChunks() {
	return {
		name: "preload-island-chunks",
		hooks: {
			"astro:build:done": ({ dir, logger }) => {
				const root = fileURLToPath(dir);
				const htmlFiles = [];
				(function walk(current) {
					for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
						const full = path.join(current, entry.name);
						if (entry.isDirectory()) walk(full);
						else if (full.endsWith(".html")) htmlFiles.push(full);
					}
				})(root);

				let injected = 0;
				for (const file of htmlFiles) {
					const html = fs.readFileSync(file, "utf8");
					const hrefs = new Set();
					for (const tag of html.matchAll(/<astro-island\b[^>]*>/g)) {
						const attrs = tag[0];
						if (!/(^|\s)client="(?:load|only)"/.test(attrs)) continue;
						for (const attr of ["component-url", "renderer-url"]) {
							const match = attrs.match(new RegExp(`${attr}="([^"]+)"`));
							if (match && match[1].startsWith("/")) hrefs.add(match[1]);
						}
					}
					if (hrefs.size === 0) continue;
					const links = [...hrefs]
						.sort()
						.map((href) => `<link rel="modulepreload" href="${href}">`)
						.join("");
					if (html.includes(links)) continue;
					fs.writeFileSync(file, html.replace("</head>", `${links}</head>`));
					injected += hrefs.size;
				}
				logger.info(`preload-island-chunks: injected ${injected} modulepreload links across ${htmlFiles.length} pages`);
			},
		},
	};
}

// https://astro.build/config
export default defineConfig({
	output: "static",
	site: "https://juchunko.com",
	markdown: {
		// 官方預設走 Rust 版 satteri，無法套用 remark 外掛；
		// 改用 @astrojs/markdown-remark，讓全形標點旁的粗體能正常解析（remark-cjk-friendly）。
		// MDX 會繼承此 processor；rehype-external-links 讓文章內 http(s) 外連預設新分頁開啟。
		processor: unified({
			remarkPlugins: [remarkCjkFriendly, remarkCjkFriendlyGfmStrikethrough],
			rehypePlugins: [
				[
					rehypeExternalLinks,
					{
						target: "_blank",
						rel: ["noopener", "noreferrer"],
					},
				],
			],
		}),
	},
	integrations: [
		react(),
		sitemap({
			i18n: {
				defaultLocale: "zh-TW",
				locales: {
					"zh-TW": "zh-TW",
					en: "en",
				},
			},
		}),
		partytown({
			config: {
				forward: ["dataLayer.push"],
			},
		}),
		mdx(),
		preloadIslandChunks(),
		opengraphImages({
			render: customRenderer,
			options: {
				fonts: [
					{
						name: "TikTok Sans",
						weight: 400,
						style: "normal",
						data: fs.readFileSync("node_modules/@expo-google-fonts/tiktok-sans/400Regular/TikTokSans_400Regular.ttf"),
					},
					{
						name: "TikTok Sans",
						weight: 700,
						style: "normal",
						data: fs.readFileSync("node_modules/@expo-google-fonts/tiktok-sans/700Bold/TikTokSans_700Bold.ttf"),
					},
					{
						name: "Noto Sans TC",
						weight: 400,
						style: "normal",
						data: fs.readFileSync("node_modules/@expo-google-fonts/noto-sans-tc/400Regular/NotoSansTC_400Regular.ttf"),
					},
					{
						name: "Noto Sans TC",
						weight: 700,
						style: "normal",
						data: fs.readFileSync("node_modules/@expo-google-fonts/noto-sans-tc/700Bold/NotoSansTC_700Bold.ttf"),
					},
				],
			},
		}),
	],
	i18n: {
		locales: ["zh-TW", "en"],
		defaultLocale: "zh-TW",
		routing: {
			prefixDefaultLocale: true,
			redirectToDefaultLocale: false,
		},
	},
	vite: {
		plugins: [
			tailwindcss(),
			Icons({
				autoInstall: true,
				compiler: "jsx",
				jsx: "react",
			}),
		],
		build: {
			assetsInlineLimit: 0,
			chunkSizeWarningLimit: 5000,
			rollupOptions: {
				external: ["@resvg/resvg-js", "jsdom"],
			},
		},
		optimizeDeps: {
			exclude: ["@resvg/resvg-js", "jsdom"],
			include: ["@sparkjsdev/spark", "three"],
		},
		ssr: {
			external: ["@resvg/resvg-js", "jsdom"],
		},
		server: {
			proxy: {
				"/api": {
					target: "https://juchunko.com/",
					changeOrigin: true,
				},
			},
		},
	},
});
