import { useEffect } from "react";
import { motion, AnimatePresence, useMotionValue } from "motion/react";
import { BookAudio, X } from "lucide-react";
import ElevenLabsAudioNative from "./ElevenLabsAudioNative";

interface VoiceReaderWindowProps {
	isOpen: boolean;
	onClose: () => void;
}

export default function VoiceReaderWindow({ isOpen, onClose }: VoiceReaderWindowProps) {
	// 以 y 控制與底部距離，避免覆蓋 footer
	const y = useMotionValue(16);

	useEffect(() => {
		function handleScroll() {
			const footer = document.getElementById("footer");
			if (!footer) return;
			const rect = footer.getBoundingClientRect();
			const windowHeight = window.innerHeight;
			const top = rect.y - windowHeight;
			const isBottom = top < 0;

			y.set(isBottom ? 16 - top : 16);
		}
		window.addEventListener("scroll", handleScroll);
		handleScroll();
		return () => window.removeEventListener("scroll", handleScroll);
	}, []);

	return (
		<AnimatePresence>
			{isOpen && (
				<motion.div
					initial={{ opacity: 0, scale: 0.5, y: 16 }}
					animate={{
						opacity: 1,
						scale: 1,
						y: 0,
					}}
					exit={{ opacity: 0, scale: 0.5, y: 16 }}
					transition={{ type: "spring", stiffness: 300, damping: 30 }}
					style={{ bottom: y }}
					className="fixed right-4 z-40 h-max w-80 origin-bottom-right overflow-hidden rounded-lg bg-white shadow-2xl ring-1 ring-black/5 backdrop-blur-xl dark:bg-gray-900 dark:ring-white/10"
				>
					{/* 標題欄 */}
					<div className="flex items-center justify-between bg-blue-600 p-3 text-white">
						<div className="flex items-center gap-2">
							<BookAudio className="h-5 w-5" />
							<h3 className="font-semibold">語音朗讀</h3>
						</div>
						<div className="flex items-center gap-1">
							<motion.button
								whileTap={{ scale: 0.95 }}
								onClick={onClose}
								className="rounded p-1 transition-colors hover:bg-white/20"
								aria-label="關閉"
							>
								<X className="h-4 w-4" />
							</motion.button>
						</div>
					</div>

					{/* 主要內容 */}
					<div>
						<ElevenLabsAudioNative
							publicUserId="e826f7db9aa74a5b23ec481d0d24467f232dbc1622ceb065c98ff3c4adb99830"
							size="small"
							textColorRgba="rgba(0, 0, 0, 1.0)"
							backgroundColorRgba="rgba(255, 255, 255, 1.0)"
						/>
						<p className="p-2 text-center text-xs text-gray-500 dark:text-gray-400">由 ElevenLabs 提供技術支援</p>
					</div>
				</motion.div>
			)}
		</AnimatePresence>
	);
}
