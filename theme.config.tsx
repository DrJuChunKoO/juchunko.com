import { DocsThemeConfig } from 'nextra-theme-docs'
import { useRouter } from 'next/router'
import Footer from './components/footer'
import { usePathname } from 'next/navigation'
import ElevenLabsAudioNative from './components/bot/ElevenLabsAudioNative'
const translations = {
  'zh-TW': {
    logo: '科技立委葛如鈞．寶博士',
    toc: '目錄',
    search_placeholder: '搜尋⋯⋯',
    edit_this_page: '在 GitHub 編輯這個頁面',
  },
  'en-US': {
    logo: 'JU CHUN KO',
    toc: 'Table of Contents',
    search_placeholder: 'Search...',
    edit_this_page: 'Edit this page on GitHub',
  },
}
function localeTranslation(key: string) {
  const router = useRouter()
  const locale = router.locale || 'en-US'
  return translations[locale][key] || translations['en-US'][key]
}
const config: DocsThemeConfig = {
  logo: () => <span className="nx-font-semibold">{localeTranslation('logo')}</span>,
  project: {
    link: 'https://github.com/DrJuChunKoO/juchunko.com',
  },
  banner: {
    key: 'ai-basic-act',
    text: <a href="https://juchunko.com/docs/act/ai-basic-act">查看「AI 基本法」法案資訊 →</a>,
  },
  docsRepositoryBase: 'https://github.com/DrJuChunKoO/juchunko.com/blob/main',
  useNextSeoProps() {
    const { asPath, locale } = useRouter()
    if (asPath !== '/') {
      return {
        titleTemplate: locale === 'zh-TW' ? '%s - 科技立委葛如鈞．寶博士' : '%s - JU CHUN KO',
      }
    } else {
      return {
        title:
          locale === 'zh-TW'
            ? '先進國會・共識未來 - 科技立委葛如鈞．寶博士'
            : 'Emerging Congress, Converging Consensus - JU CHUN KO',
      }
    }
  },
  head: () => {
    const router = useRouter()
    const locale = router.locale || 'en-US'
    if (locale === 'zh-TW') {
      return (
        <>
          <link rel="icon" type="image/svg+xml" href="/favicon.png" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <meta
            property="og:description"
            content="歡迎來到葛如鈞（寶博士）的寶博宇宙說明書，在這裡你可以學會如何操作、使用和召喚多元宇宙列車以及公僕寶博。"
          />
          <meta property="og:image" content="https://juchunko.com/ogimage.png" />
        </>
      )
    } else {
      return (
        <>
          <link rel="icon" type="image/svg+xml" href="/favicon.png" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <meta
            property="og:description"
            content="Welcome to the instruction manual for Dr. Ju Chun Ko's universe. Here you can learn how to operate, use, and summon the Multiverse Train and Public Servant Bot."
          />
          <meta property="og:image" content="https://juchunko.com/ogimage-en.png" />
        </>
      )
    }
  },
  main({ children }) {
    const pathname = usePathname()
    return (
      <div key={pathname}>
        <ElevenLabsAudioNative publicUserId="e826f7db9aa74a5b23ec481d0d24467f232dbc1622ceb065c98ff3c4adb99830" />
        {children}
      </div>
    )
  },
  footer: {
    component: Footer,
  },
  feedback: {
    content: null,
  },
  editLink: {
    text: () => localeTranslation('edit_this_page'),
  },
  nextThemes: {
    defaultTheme: 'system',
  },
  gitTimestamp: <></>,
  search: {
    placeholder: () => localeTranslation('search_placeholder'),
  },
  toc: {
    title: () => localeTranslation('toc'),
  },
  i18n: [
    { locale: 'en-US', text: 'English' },
    { locale: 'zh-TW', text: '中文' },
  ],
}

export default config
