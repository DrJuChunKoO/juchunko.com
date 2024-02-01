import { useState } from 'react'
import { YouTubeEmbed } from '@next/third-parties/google'
import { motion, AnimatePresence } from 'framer-motion'
import { twMerge } from 'tailwind-merge'
import { X } from 'lucide-react'
export function Cards({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={twMerge(
        'grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] items-start gap-x-4 gap-y-6',
        className,
      )}>
      {children}
    </div>
  )
}
export function YoutubeCard({ videoId, title, description }: { videoId: string; title: string; description: string }) {
  const [isOpen, setIsOpen] = useState(null)
  const variants = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  }
  const button = {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1, transition: { delay: 0.5, type: 'spring' } },
    exit: { opacity: 0, scale: 0.9 },
  }
  return (
    <>
      <motion.div
        layoutId={videoId}
        onClick={() => setIsOpen(true)}
        className="relative z-0 cursor-pointer bg-transparent @container">
        <motion.img
          src={`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`}
          className="block aspect-video object-cover"
        />
        <div className="mt-2.5 text-lg font-bold leading-tight">{title}</div>
        <div className="mt-1 line-clamp-2 text-sm">{description}</div>
      </motion.div>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial="initial"
            animate="animate"
            exit="exit"
            variants={variants}
            className="fixed inset-0 z-50 flex items-center justify-center bg-white/50 text-black backdrop-blur dark:bg-black/50 dark:text-white"
            onClick={() => setIsOpen(null)}>
            <motion.button
              variants={button}
              className="absolute right-4 top-4 z-20 cursor-pointer rounded-full border border-black/20 bg-white/80 p-2  dark:border-white/20 dark:bg-black/80"
              onClick={() => setIsOpen(null)}>
              <X size={32} strokeWidth={1} />
            </motion.button>
            <motion.div layoutId={videoId} className="z-10 flex w-[90%] max-w-[1000px] flex-col">
              <div className="overflow-hidden rounded-lg shadow-2xl">
                <YouTubeEmbed videoid={videoId} />
              </div>
              <div className="pt-5">
                <div className="text-lg font-bold leading-tight">{title}</div>
                <div className="mt-2 text-sm">{description}</div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}