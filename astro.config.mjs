// @ts-check
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import Icons from "unplugin-icons/vite";

import react from "@astrojs/react";

import sitemap from "@astrojs/sitemap";
import partytown from "@astrojs/partytown";
import mdx from "@astrojs/mdx";

// https://astro.build/config
export default defineConfig({
  integrations: [react(), sitemap(), partytown(), mdx()],
  i18n: {
    locales: ["zh-TW", "en"],
    defaultLocale: "zh-TW",
    routing: {
      prefixDefaultLocale: true,
    },
  },
  vite: {
    plugins: [
      tailwindcss(),
      Icons({
        compiler: "astro",
      }),
    ],
  },
});
