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

import opengraphImages from "astro-opengraph-images";
import fs from "node:fs";
import { customRenderer } from "./src/lib/og-renderer.ts";

// https://astro.build/config
export default defineConfig({
	output: "static",
	site: "https://juchunko.com",
	markdown: {
		// 官方預設走 Rust 版 satteri，無法套用 remark 外掛；
		// 改用 @astrojs/markdown-remark，讓全形標點旁的粗體能正常解析（remark-cjk-friendly）。
		processor: unified({
			remarkPlugins: [remarkCjkFriendly, remarkCjkFriendlyGfmStrikethrough],
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
