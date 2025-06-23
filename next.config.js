import nextra from 'nextra'

const withNextra = nextra({
  theme: 'nextra-theme-docs',
  themeConfig: './theme.config.tsx',
})

export default withNextra({
  reactStrictMode: true,
  i18n: {
    locales: ['en-US', 'zh-TW'],
    defaultLocale: 'zh-TW',
  },
  experimental: {
    /**
     * Exclude client-only diagram libraries from the server bundle to shrink the Cloudflare Worker size.
     * They are rendered on the client, the server never needs these heavy libs.
     */
    outputFileTracingExcludes: {
      '*': ['node_modules/mermaid/**', 'node_modules/elkjs/**', 'node_modules/cytoscape/**'],
    },
  },
})

// If you have other Next.js configurations, you can pass them as the parameter:
// module.exports = withNextra({ /* other next.js config */ })
