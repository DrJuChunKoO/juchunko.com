// @ts-check
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import Icons from "unplugin-icons/vite";

import react from "@astrojs/react";

import sitemap from "@astrojs/sitemap";
import partytown from "@astrojs/partytown";
import mdx from "@astrojs/mdx";

import opengraphImages from "astro-opengraph-images";
import fs from "node:fs";
import { customRenderer } from "./src/lib/og-renderer";

// https://astro.build/config
export default defineConfig({
	output: "static",
	site: "https://beta.juchunko.com",
	integrations: [
		react(),
		sitemap(),
		partytown(),
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
			rollupOptions: {
				external: ["@resvg/resvg-js", "jsdom"],
				output: {
					manualChunks: {
						react: ["react", "react-dom"],
					},
				},
			},
		},
		optimizeDeps: {
			exclude: ["@resvg/resvg-js", "jsdom"],
		},
		ssr: {
			external: ["@resvg/resvg-js", "jsdom"],
		},
		server: {
			proxy: {
				"/api": {
					target: "https://beta.juchunko.com/",
					changeOrigin: true,
				},
			},
		},
	},
});
