'use client'

import { useConversation } from '@11labs/react'
import { useCallback } from 'react'
import { Mic, Loader2, Phone, PhoneOff, UserRound } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { twMerge } from 'tailwind-merge'
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
  const conversation = useConversation({
    onConnect: () => console.log('Connected'),
    onDisconnect: () => console.log('Disconnected'),
    onMessage: (message) => console.log('Message:', message),
    onError: (error) => console.error('Error:', error),
  })

  const startConversation = useCallback(async () => {
    try {
      // Request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true })

      // Start the conversation with your agent
      await conversation.startSession({
        agentId: '4Wh96G5InzCrZUpH6K4Y', // Replace with your agent ID
      })
    } catch (error) {
      console.error('Failed to start conversation:', error)
    }
  }, [conversation])

  const stopConversation = useCallback(async () => {
    await conversation.endSession()
  }, [conversation])

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      <div className="flex w-full flex-col items-center gap-4">
        <AnimatePresence mode="wait">
          {conversation.status === 'connected' ? (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              key="active"
              className="relative">
              <div
                className={twMerge(
                  'flex h-24 w-24 items-center justify-center rounded-full border-4',
                  conversation.isSpeaking
                    ? 'border-blue-500 bg-blue-50 text-blue-500 dark:border-blue-400 dark:bg-blue-950 dark:text-blue-400'
                    : 'border-green-500 bg-green-50 text-green-500 dark:border-green-400 dark:bg-green-950 dark:text-green-400',
                )}>
                {conversation.isSpeaking ? (
                  <UserRound className="h-12 w-12 animate-pulse" />
                ) : (
                  <Mic className="h-12 w-12 animate-pulse" />
                )}
              </div>
              <motion.button
                onClick={stopConversation}
                className="absolute -right-2 -top-2 rounded-full bg-red-500 p-2 text-white shadow-lg hover:bg-red-600"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}>
                <PhoneOff className="h-4 w-4" />
              </motion.button>
            </motion.div>
          ) : conversation.status === 'connecting' ? (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              key="connecting"
              className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-yellow-500 bg-yellow-50 text-yellow-500 dark:border-yellow-400 dark:bg-yellow-950 dark:text-yellow-400">
              <Loader2 className="h-12 w-12 animate-spin" />
            </motion.div>
          ) : (
            <motion.button
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              key="start"
              onClick={startConversation}
              className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-neutral-200 bg-neutral-50 text-neutral-500 transition-colors hover:border-neutral-300 hover:bg-neutral-100 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:border-neutral-500 dark:hover:bg-neutral-700"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}>
              <Phone className="h-12 w-12" />
            </motion.button>
          )}
        </AnimatePresence>

        <div className="text-center text-sm text-neutral-500 dark:text-neutral-400">
          {conversation.status === 'connected'
            ? conversation.isSpeaking
              ? localeTranslation('speaking')
              : localeTranslation('listening')
            : conversation.status === 'connecting'
              ? localeTranslation('connecting')
              : localeTranslation('startCall')}
        </div>
      </div>
    </div>
  )
}
