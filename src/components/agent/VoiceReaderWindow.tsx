import { useEffect, useRef } from "react";
import { motion, AnimatePresence, useMotionValue, useReducedMotion } from "motion/react";
import { BookAudio, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import TTSPlayer from "./TTSPlayer";
import { ui } from "src/i18n/ui";

type SupportedLang = "en" | "zh-TW";

interface VoiceReaderWindowProps {
	isOpen: boolean;
	onClose: () => void;
	opener?: HTMLElement | null;
	lang?: SupportedLang;
}

export default function VoiceReaderWindow({ isOpen, onClose, opener, lang = "zh-TW" }: VoiceReaderWindowProps) {
	const y = useMotionValue(16);
	const windowRef = useRef<HTMLDivElement>(null);
	const closeButtonRef = useRef<HTMLButtonElement>(null);
	const wasOpenRef = useRef(false);
	const openerRef = useRef<HTMLElement | null>(null);
	const prefersReduced = Boolean(useReducedMotion());

	useEffect(() => {
		if (!isOpen) return;

		function handleEscape(event: KeyboardEvent) {
			if (event.key === "Escape") onClose();
		}

		window.addEventListener("keydown", handleEscape);
		return () => window.removeEventListener("keydown", handleEscape);
	}, [isOpen, onClose]);

	useEffect(() => {
		if (!wasOpenRef.current && isOpen) openerRef.current = opener ?? null;

		if (wasOpenRef.current && !isOpen) {
			let focusTarget = openerRef.current;
			if (!focusTarget?.isConnected) {
				focusTarget =
					Array.from(document.querySelectorAll<HTMLElement>('[data-agent-launcher="voice-reader"], [data-agent-launcher="toggle"]')).find(
						(element) => element.getClientRects().length > 0,
					) ?? null;
			}
			focusTarget?.focus();
			openerRef.current = null;
		}
		wasOpenRef.current = isOpen;
	}, [isOpen, opener]);

	useEffect(() => {
		if (!isOpen) return;
		const focusTimer = setTimeout(() => closeButtonRef.current?.focus(), 0);
		return () => clearTimeout(focusTimer);
	}, [isOpen]);

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
					initial={prefersReduced ? { opacity: 0 } : { opacity: 0, scale: 0.5, y: 16 }}
					animate={
						prefersReduced
							? { opacity: 1 }
							: {
									opacity: 1,
									scale: 1,
									y: 0,
								}
					}
					exit={prefersReduced ? { opacity: 0 } : { opacity: 0, scale: 0.5, y: 16 }}
					transition={prefersReduced ? { duration: 0.15 } : { type: "spring", stiffness: 300, damping: 30 }}
					style={{ bottom: y }}
					role="dialog"
					aria-label={ui[lang]["agent.voiceReader.title"]}
					className="ring-border/50 bg-card/75 fixed right-4 z-40 w-100 max-w-[calc(100vw-32px)] origin-bottom-right overflow-hidden rounded-[calc(var(--radius-xl)+8px)] shadow-lg ring-1 backdrop-blur-xl"
				>
					<div className="bg-muted text-foreground border-border flex items-center justify-between gap-2 border-b p-2 pl-4">
						<div className="flex items-center gap-2">
							<BookAudio className="text-primary h-5 w-5" />
							<h3 className="font-semibold">{ui[lang]["agent.voiceReader.title"]}</h3>
						</div>
						<div className="flex items-center gap-1">
							<Button
								ref={closeButtonRef}
								variant="ghost"
								size="icon-sm"
								onClick={onClose}
								className="text-muted-foreground hover:text-foreground cursor-pointer rounded-lg"
								aria-label={ui[lang]["agent.voiceReader.close"]}
							>
								<X />
							</Button>
						</div>
					</div>

					<TTSPlayer isOpen={isOpen} lang={lang} />
				</motion.div>
			)}
		</AnimatePresence>
	);
}
