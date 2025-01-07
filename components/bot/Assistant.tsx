'use client'
import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence, useMotionValue } from 'framer-motion'
import { BotMessageSquare, Minus, Bot, RotateCcw, ArrowRight, Send, Copy, Check, X, Phone } from 'lucide-react'
import { twMerge } from 'tailwind-merge'
import { useCompletion } from 'ai/react'
import { useLocalStorage } from 'usehooks-ts'
import Markdown from 'react-markdown'
import { usePathname } from 'next/navigation'
import { useRouter } from 'next/router'
import { Conversation } from './Conversation'
const translations = {
  'zh-TW': {
    botName: 'AI 小助手',
    botFirstMessage: '👋 嗨，有什麼可以幫助你的？',
    talkToAI: '與 AI 對話',
    notice: 'AI 可能會犯錯，請仔細檢查生成的內容',
    actions: [
      `整理這頁的重點`,
      `提供相關的背景資訊`,
      `這頁的主要觀點是什麼`,
      '可以給我這個主題的詳細解釋嗎',
      '幫我生成一個這段內容的問答',
      '可以告訴我和葛如鈞有關的新聞嗎',
    ],
    voiceChat: '語音對話',
    stopVoiceChat: '停止語音對話',
  },
  'en-US': {
    botName: 'AI Assistant',
    botFirstMessage: '👋 Hi, how can I help you?',
    talkToAI: 'Talk to AI',
    notice: 'AI may make mistakes, please check the generated content carefully',
    actions: [
      'Summarize key points in English',
      'Provide background info in English',
      'Main perspective in English?',
      'Detailed explanation in English?',
      'Generate Q&A in English',
      'Tell me news about Ju-Chun KO in English',
    ],
    voiceChat: 'Voice Chat',
    stopVoiceChat: 'Stop Voice Chat',
  },
}
function localeTranslation(key: string) {
  const router = useRouter()
  const locale = router.locale || 'en-US'
  return translations[locale][key] || translations['en-US'][key]
}

function LinkRenderer(props: any) {
  return (
    <a href={props.href} target="_blank" rel="noreferrer">
      {props.children}
    </a>
  )
}
function Message({ from, content, showCopy = true }: { from: 'me' | 'ai'; content: string; showCopy?: boolean }) {
  const [copied, setCopied] = useState(false)
  async function copyToClipboard(text: string) {
    if ('clipboard' in navigator) {
      setCopied(true)
      await navigator.clipboard.writeText(text + '🤖')
      setTimeout(() => setCopied(false), 500)
    }
  }
  return (
    <motion.div
      initial={{ opacity: 0, x: from === 'me' ? 50 : -50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{
        opacity: 0,
        x: from === 'me' ? 50 : -50,
        height: 0,
        scale: 0,
        transition: {
          originX: from === 'me' ? 1 : 0,
        },
      }}>
      <div className={twMerge('mb-2 flex w-full items-start gap-2', from === 'me' ? 'flex-row-reverse' : '')}>
        <div
          className={twMerge(
            'group relative rounded-xl',
            from === 'me'
              ? 'rounded-br-sm border border-gray-200 text-gray-800 dark:border-neutral-600' // from user
              : 'rounded-bl-sm bg-gray-50 text-gray-800 dark:bg-neutral-600/50 dark:text-white/90', // from bot
          )}>
          {from === 'ai' && showCopy && (
            <div className="flex items-center justify-between rounded-t-lg bg-gray-100 px-3 py-2 text-sm font-bold dark:bg-neutral-800/70">
              <div className="flex items-center gap-2">
                <Bot size={16} />
                <span>{localeTranslation('botName')}</span>
              </div>
              <button onClick={() => copyToClipboard(content)} className="hover:opacity-75 active:opacity-100">
                {copied ? <Check size={16} /> : <Copy size={16} />}
              </button>
            </div>
          )}
          <Markdown
            className="prose prose-sm prose-neutral break-words px-3 py-2 text-sm dark:prose-invert"
            components={{ a: LinkRenderer }}>
            {content}
          </Markdown>
        </div>
      </div>
    </motion.div>
  )
}

export default function SpeechAI() {
  const filename = usePathname()
  const [hide, setHide] = useState(false)
  const [messageHide, setMessageHide] = useState(false)
  const y = useMotionValue(16)
  const messageContainerRef = useRef<HTMLDivElement>(null)
  const submitButtonRef = useRef<HTMLButtonElement>(null)
  const [active, setActive] = useState(false)
  const [showVoiceModal, setShowVoiceModal] = useState(false)
  const [messages, setMessages] = useLocalStorage<
    {
      content: string
      role: 'user' | 'assistant'
    }[]
  >(`speech-ai-messages-${filename}`, [])
  const { completion, input, setInput, isLoading, handleInputChange, handleSubmit } = useCompletion({
    body: {
      filename,
      messages,
    },
  })
  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    setMessages(messages.concat({ role: 'user', content: input }))
    setInput('')
    return handleSubmit(e)
  }
  function sendDefaultMessage(message: string) {
    setInput(message)
    setTimeout(() => {
      submitButtonRef.current?.click()
    }, 100)
  }

  useEffect(() => {
    if (completion) {
      if (messages.length > 0 && messages[messages.length - 1].role === 'assistant') {
        setMessages([...messages.slice(0, -1), { role: 'assistant', content: completion }])
      } else {
        setMessages([...messages, { role: 'assistant', content: completion }])
      }
    }
  }, [completion])
  useEffect(() => {
    if (messageContainerRef.current) {
      messageContainerRef.current.scrollTop = messageContainerRef.current.scrollHeight
    }
  }, [messages, active, isLoading])
  useEffect(() => {
    const isNotDocs = !filename?.startsWith('/docs')
    setHide(isNotDocs)
    setActive(false)
  }, [filename])
  useEffect(() => {
    function handleScroll() {
      const footer = document.getElementById('footer')!
      const rect = footer.getBoundingClientRect()
      const windowHeight = window.innerHeight
      const top = rect.y - windowHeight
      const isBottom = top < 0

      console.log()
      y.set(isBottom ? 16 - top : 16)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])
  if (hide) return null
  return (
    <AnimatePresence>
      {active ? (
        <motion.div
          className="fixed right-4 w-[min(400px,calc(100vw-32px))] rounded-lg bg-neutral-50 shadow-lg dark:bg-neutral-700"
          key={1}
          layoutId="speech-ai"
          style={{ bottom: y }}>
          <motion.div className="flex items-center justify-between gap-4 p-1" layoutId="speech-ai-header">
            <div className="flex items-center font-semibold text-neutral-700 dark:text-neutral-500">
              <motion.span className="p-2">
                <BotMessageSquare size={20} />
              </motion.span>
              <span>{localeTranslation('botName')}</span>
            </div>
            <div className="flex">
              <button
                className="rounded-full p-2 text-neutral-700 hover:bg-neutral-100 dark:text-neutral-500 dark:hover:bg-neutral-600"
                onClick={() => setMessages([])}>
                <RotateCcw size={20} />
              </button>
              <button
                className="rounded-full p-2 text-neutral-700 hover:bg-neutral-100 dark:text-neutral-500 dark:hover:bg-neutral-600"
                onClick={() => setActive(false)}>
                <Minus size={20} />
              </button>
            </div>
          </motion.div>

          <motion.div
            className="h-[400px] overflow-y-scroll bg-white p-2 dark:bg-neutral-800"
            ref={messageContainerRef}>
            <div className="flex items-center justify-center pb-2 text-xs text-neutral-400 dark:text-neutral-600">
              {localeTranslation('notice')}
            </div>
            <Message from="ai" content={localeTranslation('botFirstMessage')} showCopy={false} />
            <AnimatePresence>
              {messages.map((m, index) => (
                <Message from={m.role === 'user' ? 'me' : 'ai'} content={m.content} key={index} />
              ))}
            </AnimatePresence>
            <AnimatePresence>
              {!isLoading && (
                <motion.div
                  className="flex flex-col gap-2 text-gray-800 dark:text-gray-100"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}>
                  {localeTranslation('actions')
                    .filter((x) => !messages.some((m) => m.content === x))
                    .map((message, index) => (
                      <button
                        onClick={() => sendDefaultMessage(message)}
                        className="flex items-center gap-0.5 pl-3 text-left text-sm opacity-75 transition-all hover:gap-1 hover:opacity-100 active:opacity-50"
                        key={index}>
                        {message}
                        <ArrowRight size={16} strokeWidth={1.5} />
                      </button>
                    ))}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
          <form
            className="flex items-center justify-between gap-1 overflow-hidden rounded-b-lg p-1"
            onSubmit={onSubmit}>
            <input
              className={twMerge(
                'w-full flex-1 rounded-md rounded-bl-lg bg-transparent p-2 outline-none focus:border-transparent focus:shadow-none focus:ring-0',
              )}
              value={input}
              onChange={handleInputChange}
              required
            />
            <button
              type="submit"
              className="mr-1 rounded-full p-2 text-neutral-700 hover:bg-neutral-100 dark:text-neutral-500 dark:hover:bg-neutral-600"
              ref={submitButtonRef}>
              <Send size={20} />
            </button>
          </form>
        </motion.div>
      ) : showVoiceModal ? (
        <motion.div
          className="fixed right-4 w-[min(400px,calc(100vw-32px))] rounded-lg bg-neutral-50 shadow-lg dark:bg-neutral-700"
          key="voice-modal"
          layoutId="speech-ai-voice"
          style={{ bottom: y }}>
          <motion.div className="flex items-center justify-between gap-4 p-1" layoutId="speech-ai-voice-header">
            <div className="flex items-center font-semibold text-neutral-700 dark:text-neutral-500">
              <motion.span className="p-2">
                <Phone size={20} />
              </motion.span>
              <span>{localeTranslation('voiceChat')}</span>
            </div>
            <button
              className="rounded-full p-2 text-neutral-700 hover:bg-neutral-100 dark:text-neutral-500 dark:hover:bg-neutral-600"
              onClick={() => setShowVoiceModal(false)}>
              <Minus size={20} />
            </button>
          </motion.div>
          <div className="rounded-b-lg bg-white p-4 dark:bg-neutral-800">
            <Conversation />
          </div>
        </motion.div>
      ) : (
        <motion.div className="fixed right-4 flex flex-col items-end gap-2" key={0} style={{ bottom: y }}>
          <AnimatePresence>
            {!messageHide && (
              <motion.div
                className="flex origin-bottom-right flex-col items-center rounded-lg bg-neutral-100 text-sm text-neutral-500 dark:bg-neutral-600 dark:text-neutral-50"
                initial={{
                  opacity: 0,
                  x: -30,
                  scale: 0,
                }}
                animate={{
                  opacity: 1,
                  x: 0,
                  scale: 1,
                }}
                exit={{
                  opacity: 0,
                  x: -30,
                  scale: 0,
                }}
                transition={{
                  delay: 0.4,
                }}>
                <div className="flex w-full items-center justify-end rounded-t-lg bg-neutral-200 p-2 dark:bg-neutral-700">
                  <motion.button onClick={() => setMessageHide(true)}>
                    <X size={16} />
                  </motion.button>
                </div>
                <div className="flex flex-col p-2">
                  {localeTranslation('botFirstMessage')}
                  <motion.button
                    onClick={() => setActive(true)}
                    className="mt-2 rounded bg-neutral-200 px-3 py-2 font-semibold hover:bg-neutral-300 active:bg-neutral-400 dark:bg-neutral-700 dark:hover:bg-neutral-800 dark:active:bg-neutral-900">
                    {localeTranslation('talkToAI')}
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <div className="flex flex-col gap-2">
            <motion.div layoutId="speech-ai">
              <motion.button
                className="rounded-full bg-neutral-100 p-3 text-neutral-500 hover:shadow-md dark:bg-neutral-600 dark:text-neutral-50"
                onClick={() => setActive(true)}
                layoutId="speech-ai-header"
                whileTap={{ scale: 0.95 }}
                whileHover={{ scale: 1.05, y: -2 }}>
                <motion.div layoutId="speech-ai-header-icon">
                  <BotMessageSquare size={20} />
                </motion.div>
              </motion.button>
            </motion.div>
            <motion.div layoutId="speech-ai-voice">
              <motion.button
                className="rounded-full bg-neutral-100 p-3 text-neutral-500 hover:shadow-md dark:bg-neutral-600 dark:text-neutral-50"
                onClick={() => setShowVoiceModal(true)}
                layoutId="speech-ai-voice-header"
                whileTap={{ scale: 0.95 }}
                whileHover={{ scale: 1.05, y: -2 }}>
                <motion.div layoutId="speech-ai-voice-header-icon">
                  <Phone size={20} />
                </motion.div>
              </motion.button>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
