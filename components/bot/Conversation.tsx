'use client'

import { useRouter } from 'next/router'

const translations = {
  'zh-TW': {
    connecting: '連線中...',
    listening: '正在聆聽',
    speaking: '正在說話',
    startCall: '和 AI 寶博通話',
  },
  'en-US': {
    connecting: 'Connecting...',
    listening: 'Listening',
    speaking: 'Speaking',
    startCall: 'Call AI Assistant',
  },
}

function localeTranslation(key: string) {
  const router = useRouter()
  const locale = router.locale || 'en-US'
  return translations[locale][key] || translations['en-US'][key]
}

export function Conversation() {
  return <div className="flex flex-col items-center gap-4 p-4"></div>
}
