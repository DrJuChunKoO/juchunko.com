import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { useConversation, ConversationProvider } from "@elevenlabs/react";
import { X, Phone, PhoneOff } from "lucide-react";
import { ui } from "src/i18n/ui";
import GaussianSplatViewer from "./GaussianSplatViewer";

type SupportedLang = "en" | "zh-TW";

interface PhoneCallInterfaceProps {
	isOpen: boolean;
	onClose: () => void;
	lang?: SupportedLang;
}

function PhoneCallInterfaceInner({ isOpen, onClose, lang = "zh-TW" }: PhoneCallInterfaceProps) {
	const conversation = useConversation();
	const [callDuration, setCallDuration] = useState(0);
	const prefersReduced = Boolean(useReducedMotion());
	const dialogRef = useRef<HTMLDivElement>(null);
	const closeButtonRef = useRef<HTMLButtonElement>(null);
	const openerRef = useRef<HTMLElement | null>(null);
	const wasOpenRef = useRef(false);
	// const [isMuted, setIsMuted] = useState(false);

	useEffect(() => {
		if (isOpen && !wasOpenRef.current) {
			openerRef.current =
				document.activeElement instanceof HTMLElement && document.activeElement !== document.body ? document.activeElement : null;
			closeButtonRef.current?.focus();
		} else if (!isOpen && wasOpenRef.current) {
			const opener = openerRef.current;
			const fallback = ['[data-agent-launcher="toggle"]', '[data-agent-launcher="phone"]']
				.flatMap((selector) => Array.from(document.querySelectorAll<HTMLElement>(selector)))
				.find((element) => element.getClientRects().length > 0);
			(opener?.isConnected ? opener : fallback)?.focus();
			openerRef.current = null;
		}
		wasOpenRef.current = isOpen;
	}, [isOpen]);

	useEffect(() => {
		if (!isOpen) return;

		function keepFocusInside(event: FocusEvent) {
			if (event.target instanceof Node && !dialogRef.current?.contains(event.target)) closeButtonRef.current?.focus();
		}

		document.addEventListener("focusin", keepFocusInside);
		return () => document.removeEventListener("focusin", keepFocusInside);
	}, [isOpen]);

	// 通話計時器
	useEffect(() => {
		let interval: NodeJS.Timeout;
		if (conversation.status === "connected") {
			interval = setInterval(() => {
				setCallDuration((prev) => prev + 1);
			}, 1000);
		} else {
			setCallDuration(0);
		}
		return () => clearInterval(interval);
	}, [conversation.status]);

	// 重置狀態當關閉時
	useEffect(() => {
		if (!isOpen) {
			if (conversation.status === "connected") {
				conversation.endSession();
			}
			setCallDuration(0);
			// setIsMuted(false);
		}
	}, [isOpen, conversation]);

	const handleCall = useCallback(async () => {
		try {
			await navigator.mediaDevices.getUserMedia({ audio: true });
			await conversation.startSession({
				agentId: "4Wh96G5InzCrZUpH6K4Y",
				connectionType: "webrtc",
			});
		} catch (error) {
			console.error("Failed to start conversation:", error);
		}
	}, [conversation]);

	const handleEndCall = useCallback(async () => {
		await conversation.endSession();
		setTimeout(() => {
			onClose();
		}, 1000);
	}, [conversation, onClose]);

	const handleDialogKeyDown = (event: React.KeyboardEvent) => {
		if (event.key === "Escape") {
			event.preventDefault();
			void handleEndCall();
			return;
		}
		if (event.key !== "Tab") return;
		const focusable = dialogRef.current?.querySelectorAll<HTMLElement>('button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])');
		if (!focusable?.length) return;
		const first = focusable[0];
		const last = focusable[focusable.length - 1];
		if (event.shiftKey && document.activeElement === first) {
			event.preventDefault();
			last.focus();
		} else if (!event.shiftKey && document.activeElement === last) {
			event.preventDefault();
			first.focus();
		}
	};

	const formatDuration = (seconds: number) => {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
	};

	const getStatusText = () => {
		switch (conversation.status) {
			case "connecting":
				return ui[lang]["agent.phone.status.connecting"];
			case "connected":
				return conversation.isSpeaking ? ui[lang]["agent.phone.status.speaking"] : ui[lang]["agent.phone.status.connected"];
			default:
				return ui[lang]["agent.phone.status.ready"];
		}
	};

	return (
		<AnimatePresence>
			{isOpen && (
				<motion.div
					ref={dialogRef}
					role="dialog"
					aria-modal="true"
					aria-label={ui[lang]["agent.phone.aiName"]}
					onKeyDown={handleDialogKeyDown}
					initial={prefersReduced ? { opacity: 0 } : { opacity: 0, scale: 1.25 }}
					animate={prefersReduced ? { opacity: 1 } : { opacity: 1, scale: 1 }}
					exit={prefersReduced ? { opacity: 0 } : { opacity: 0, scale: 1.25 }}
					transition={prefersReduced ? { duration: 0.1 } : { duration: 0.3 }}
					className="fixed inset-0 z-50 flex flex-col items-center overflow-y-auto bg-black/90 backdrop-blur-md"
				>
					{/* 關閉按鈕 */}
					<motion.button
						ref={closeButtonRef}
						initial={prefersReduced ? { opacity: 0 } : { opacity: 0, scale: 0.8, transition: { delay: 0.5 } }}
						animate={prefersReduced ? { opacity: 1 } : { opacity: 1, scale: 1 }}
						transition={prefersReduced ? { duration: 0.1 } : undefined}
						onClick={handleEndCall}
						className="focus-visible:ring-ring fixed top-[max(env(safe-area-inset-top),1rem)] right-[max(env(safe-area-inset-right),1rem)] z-20 flex h-12 w-12 cursor-pointer items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-lg transition-colors hover:bg-white/50 focus-visible:ring-2"
						aria-label={ui[lang]["agent.phone.closeInterface"]}
					>
						<X className="h-6 w-6" />
					</motion.button>

					{/* 主要內容 */}
					<div className="relative z-10 my-auto flex w-full flex-col items-center px-4 py-20 text-white">
						{/* AI 頭像 */}
						<motion.div
							initial={prefersReduced ? { opacity: 0 } : { scale: 0.8, opacity: 0 }}
							animate={prefersReduced ? { opacity: 1 } : { scale: 1, opacity: 1 }}
							transition={prefersReduced ? { duration: 0.1 } : { delay: 0.1 }}
							className="mb-8"
						>
							<motion.div
								className="relative mx-auto my-5 aspect-square w-[min(75vw,300px,35svh)] overflow-hidden rounded-lg md:w-[min(350px,40svh)]"
								transition={prefersReduced ? { duration: 0 } : { duration: 2, repeat: Infinity }}
								animate={!prefersReduced && conversation.status === "connected" ? { scale: [1, 1.05, 1] } : {}}
							>
								<GaussianSplatViewer url="/scene.ply" className="absolute inset-0" />
							</motion.div>
						</motion.div>
						{/* 聯絡人資訊 */}
						<motion.div
							initial={prefersReduced ? { opacity: 0 } : { y: 20, opacity: 0 }}
							animate={prefersReduced ? { opacity: 1 } : { y: 0, opacity: 1 }}
							transition={prefersReduced ? { duration: 0.1 } : { delay: 0.2 }}
							className="mb-4 text-center"
						>
							<h2 className="mb-2 text-3xl font-bold">{ui[lang]["agent.phone.aiName"]}</h2>
							<p className="text-muted-foreground text-lg">{getStatusText()}</p>
							{conversation.status === "connected" && (
								<motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-muted-foreground/80 mt-2 text-sm">
									{formatDuration(callDuration)}
								</motion.p>
							)}
						</motion.div>

						{/* 通話狀態指示器 */}
						{conversation.status === "connecting" && (
							<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-8">
								<div className="flex space-x-1">
									{[0, 1, 2].map((i) => (
										<motion.div
											key={i}
											animate={prefersReduced ? { opacity: 1 } : { scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
											transition={prefersReduced ? { duration: 0 } : { duration: 1, repeat: Infinity, delay: i * 0.2 }}
											className="bg-primary h-2 w-2 rounded-full"
										/>
									))}
								</div>
							</motion.div>
						)}

						{/* 控制按鈕 */}
						<motion.div
							initial={prefersReduced ? { opacity: 0 } : { y: 20, opacity: 0 }}
							animate={prefersReduced ? { opacity: 1 } : { y: 0, opacity: 1 }}
							transition={prefersReduced ? { duration: 0.1 } : { delay: 0.3 }}
							className="flex space-x-6"
						>
							{conversation.status === "disconnected" && (
								<motion.button
									whileTap={prefersReduced ? undefined : { scale: 0.95 }}
									whileHover={prefersReduced ? undefined : { scale: 1.05 }}
									onClick={handleCall}
									className="focus-visible:ring-ring flex h-16 w-16 cursor-pointer items-center justify-center rounded-full bg-green-500 text-white shadow-lg transition-colors hover:bg-green-600 focus-visible:ring-2"
									aria-label={ui[lang]["agent.phone.dial"]}
								>
									<Phone className="h-8 w-8" />
								</motion.button>
							)}

							{(conversation.status === "connected" || conversation.status === "connecting") && (
								<motion.button
									whileTap={prefersReduced ? undefined : { scale: 0.95 }}
									whileHover={prefersReduced ? undefined : { scale: 1.05 }}
									onClick={handleEndCall}
									className="bg-destructive text-destructive-foreground hover:bg-destructive/90 focus-visible:ring-ring flex h-16 w-16 cursor-pointer items-center justify-center rounded-full shadow-lg transition-colors focus-visible:ring-2"
									aria-label={ui[lang]["agent.phone.endCall"]}
								>
									<PhoneOff className="h-8 w-8" />
								</motion.button>
							)}
						</motion.div>
					</div>
				</motion.div>
			)}
		</AnimatePresence>
	);
}

export default function PhoneCallInterface(props: PhoneCallInterfaceProps) {
	return (
		<ConversationProvider>
			<PhoneCallInterfaceInner {...props} />
		</ConversationProvider>
	);
}
