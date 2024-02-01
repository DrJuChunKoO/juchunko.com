import { DocsThemeConfig } from 'nextra-theme-docs'
import { useRouter } from 'next/router'

const config: DocsThemeConfig = {
  logo: <span className="nx-font-semibold">JUCHUNKO</span>,
  project: {
    link: 'https://github.com/dAAAb/juchunko.com',
  },
  docsRepositoryBase: 'https://github.com/dAAAb/juchunko.com',
  useNextSeoProps() {
    const { asPath } = useRouter()
    if (asPath !== '/') {
      return {
        titleTemplate: '%s – JUCHUNKO.COM',
      }
    }
  },
  footer: {
    text: '©2024 JUCHUNKO.COM All rights reserved.',
  },
  nextThemes: {
    defaultTheme: 'dark',
  },
  gitTimestamp: <></>,
}

export default config
