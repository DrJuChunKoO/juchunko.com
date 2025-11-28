import { useEffect } from "react";
import { motion, AnimatePresence, useMotionValue } from "motion/react";
import { BookAudio, X } from "lucide-react";
import ElevenLabsAudioNative from "./ElevenLabsAudioNative";
import { ui } from "src/i18n/ui";

type SupportedLang = "en" | "zh-TW";

interface VoiceReaderWindowProps {
	isOpen: boolean;
	onClose: () => void;
	lang?: SupportedLang;
}

export default function VoiceReaderWindow({ isOpen, onClose, lang = "zh-TW" }: VoiceReaderWindowProps) {
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
					className="bg-card ring-border/50 fixed right-4 z-40 h-max w-80 max-w-[calc(100vw-32px)] origin-bottom-right overflow-hidden rounded-xl shadow-lg ring-1 backdrop-blur-xl"
				>
					{/* 標題欄 */}
					<div className="bg-muted text-foreground border-border flex items-center justify-between rounded-t-lg border-b p-2 pl-4">
						<div className="flex items-center gap-2">
							<BookAudio className="h-5 w-5" />
							<h3 className="font-semibold">{ui[lang]["agent.voiceReader.title"]}</h3>
						</div>
						<div className="flex items-center gap-1">
							<motion.button
								whileTap={{ scale: 0.95 }}
								onClick={onClose}
								className="hover:bg-muted-foreground/10 text-muted-foreground hover:text-foreground cursor-pointer rounded-lg p-2 transition-colors"
								aria-label={ui[lang]["agent.voiceReader.close"]}
							>
								<X className="size-5" />
							</motion.button>
						</div>
					</div>

					{/* 主要內容 */}
					<div className="bg-card/50 p-4">
						<ElevenLabsAudioNative
							publicUserId="e826f7db9aa74a5b23ec481d0d24467f232dbc1622ceb065c98ff3c4adb99830"
							size="small"
						/>
						<p className="text-muted-foreground mt-2 text-center text-xs">{ui[lang]["agent.voiceReader.poweredBy"]}</p>
					</div>
				</motion.div>
			)}
		</AnimatePresence>
	);
}
