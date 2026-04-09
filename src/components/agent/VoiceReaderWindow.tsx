import { useEffect, useRef } from "react";
import { motion, AnimatePresence, useMotionValue } from "motion/react";
import { BookAudio, X } from "lucide-react";
import TTSPlayer from "./TTSPlayer";
import { ui } from "src/i18n/ui";

type SupportedLang = "en" | "zh-TW";

interface VoiceReaderWindowProps {
	isOpen: boolean;
	onClose: () => void;
	lang?: SupportedLang;
}

export default function VoiceReaderWindow({ isOpen, onClose, lang = "zh-TW" }: VoiceReaderWindowProps) {
	const y = useMotionValue(16);
	const windowRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!isOpen) return;

		function syncWindowOffset() {
			const footer = document.getElementById("footer");
			if (!footer) {
				y.set(16);
				return;
			}
			const rect = footer.getBoundingClientRect();
			const windowHeight = window.innerHeight;
			const top = rect.y - windowHeight;
			const isBottom = top < 0;

			y.set(isBottom ? 16 - top : 16);
		}

		window.addEventListener("scroll", syncWindowOffset);
		window.addEventListener("resize", syncWindowOffset);

		const observer =
			typeof ResizeObserver === "undefined" || !windowRef.current
				? null
				: new ResizeObserver(() => {
						requestAnimationFrame(syncWindowOffset);
					});

		if (observer && windowRef.current) {
			observer.observe(windowRef.current);
		}

		syncWindowOffset();

		return () => {
			window.removeEventListener("scroll", syncWindowOffset);
			window.removeEventListener("resize", syncWindowOffset);
			if (observer) {
				observer.disconnect();
			}
		};
	}, [isOpen, y]);

	return (
		<AnimatePresence>
			{isOpen && (
				<motion.div
					ref={windowRef}
					initial={{ opacity: 0, scale: 0.5, y: 16 }}
					animate={{
						opacity: 1,
						scale: 1,
						y: 0,
					}}
					exit={{ opacity: 0, scale: 0.5, y: 16 }}
					transition={{ type: "spring", stiffness: 300, damping: 30 }}
					style={{ bottom: y }}
					className="ring-border/50 bg-card/75 fixed right-4 z-40 w-[420px] max-w-[calc(100vw-32px)] origin-bottom-right rounded-xl shadow-lg ring-1 backdrop-blur-xl"
				>
					<div className="bg-muted text-foreground border-border flex items-center justify-between rounded-t-lg border-b p-2 pl-4">
						<div className="flex items-center gap-2">
							<BookAudio className="text-primary h-5 w-5" />
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

					<TTSPlayer isOpen={isOpen} lang={lang} />
				</motion.div>
			)}
		</AnimatePresence>
	);
}
