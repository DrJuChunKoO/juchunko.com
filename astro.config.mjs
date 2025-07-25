// @ts-check
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';

import sitemap from '@astrojs/sitemap';
import partytown from '@astrojs/partytown';
import mdx from '@astrojs/mdx';

// https://astro.build/config
export default defineConfig({
  integrations: [react(), sitemap(), partytown(), mdx()]
});