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
export function YoutubeCard({
  videoId,
  title,
  children,
}: {
  videoId: string
  title: string
  children: React.ReactNode
}) {
  const [isOpen, setIsOpen] = useState(false)
  return (
    <>
      <motion.button layoutId={videoId} onClick={() => setIsOpen(true)} className="cursor-pointer text-left">
        <motion.img src={`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`} className="aspect-video object-cover" />
        <motion.div className="mt-2 text-xl font-bold">{title}</motion.div>
        <motion.div className="mt-1 line-clamp-2">{children}</motion.div>
      </motion.button>
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed left-0 top-0 z-50 h-full w-full bg-black bg-opacity-50"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              layoutId={videoId}
              className="fixed inset-0 z-50 m-auto h-min w-[700px] max-w-[90vw] rounded-lg bg-white shadow-xl">
              <YouTubeEmbed videoid={videoId} />
              <div className="p-4">
                <motion.div className="text-xl font-bold">{title}</motion.div>
                <motion.div className="mt-1">{children}</motion.div>
              </div>
              <motion.button
                className="absolute right-4 top-4 m-auto grid size-8 cursor-pointer place-content-center rounded-full bg-black/40 text-white shadow-2xl backdrop-blur-sm"
                onClick={() => setIsOpen(false)}>
                <X size={24} />
              </motion.button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
