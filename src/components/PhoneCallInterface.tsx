import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useConversation } from "@elevenlabs/react";
import { X, Phone, PhoneOff } from "lucide-react";
import { ui } from "src/i18n/ui";

type SupportedLang = "en" | "zh-TW";

interface PhoneCallInterfaceProps {
	isOpen: boolean;
	onClose: () => void;
	lang?: SupportedLang;
}

export default function PhoneCallInterface({ isOpen, onClose, lang = "zh-TW" }: PhoneCallInterfaceProps) {
	const conversation = useConversation();
	const [callDuration, setCallDuration] = useState(0);
	// const [isMuted, setIsMuted] = useState(false);

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
			case "disconnecting":
				return ui[lang]["agent.phone.status.disconnecting"];
			default:
				return ui[lang]["agent.phone.status.ready"];
		}
	};

	return (
		<AnimatePresence>
			{isOpen && (
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0, scale: 1.25, filter: "blur(8px)" }}
					transition={{ duration: 0.3 }}
					className="fixed inset-0 z-50 flex items-center justify-center bg-black"
				>
					{/* 關閉按鈕 */}
					<motion.button
						initial={{ opacity: 0, scale: 0.8 }}
						animate={{ opacity: 1, scale: 1 }}
						transition={{ delay: 0.2 }}
						onClick={handleEndCall}
						className="absolute top-6 right-6 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-lg transition-colors hover:bg-white/20"
						aria-label={ui[lang]["agent.phone.closeInterface"]}
					>
						<X className="h-6 w-6" />
					</motion.button>

					{/* 主要內容 */}
					<div className="relative z-10 flex flex-col items-center text-white">
						{/* AI 頭像 */}
						<motion.div
							initial={{ scale: 0.8, opacity: 0 }}
							animate={{ scale: 1, opacity: 1 }}
							transition={{ delay: 0.1 }}
							className="mb-8"
						>
							<motion.div
								className="relative mx-auto my-5 aspect-square w-full overflow-hidden rounded-lg md:w-[350px]"
								transition={{ duration: 2, repeat: Infinity }}
								animate={conversation.status === "connected" ? { scale: [1, 1.05, 1] } : {}}
							>
								{/* @ts-ignore */}
								<spline-viewer
									className="absolute inset-0"
									loading-anim-type="spinner-big-light"
									url="https://prod.spline.design/XpiiBrX-wdVvPksO/scene.splinecode"
								/>
							</motion.div>
						</motion.div>
						{/* 聯絡人資訊 */}
						<motion.div
							initial={{ y: 20, opacity: 0 }}
							animate={{ y: 0, opacity: 1 }}
							transition={{ delay: 0.2 }}
							className="mb-4 text-center"
						>
							<h2 className="mb-2 text-3xl font-bold">{ui[lang]["agent.phone.aiName"]}</h2>
							<p className="text-lg text-white/80">{getStatusText()}</p>
							{conversation.status === "connected" && (
								<motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-2 text-sm text-white/60">
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
											animate={{
												scale: [1, 1.2, 1],
												opacity: [0.5, 1, 0.5],
											}}
											transition={{
												duration: 1,
												repeat: Infinity,
												delay: i * 0.2,
											}}
											className="h-2 w-2 rounded-full bg-white"
										/>
									))}
								</div>
							</motion.div>
						)}

						{/* 控制按鈕 */}
						<motion.div
							initial={{ y: 20, opacity: 0 }}
							animate={{ y: 0, opacity: 1 }}
							transition={{ delay: 0.3 }}
							className="flex space-x-6"
						>
							{conversation.status === "disconnected" && (
								<motion.button
									whileTap={{ scale: 0.95 }}
									whileHover={{ scale: 1.05 }}
									onClick={handleCall}
									className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500 text-white shadow-lg transition-colors hover:bg-green-600"
									aria-label={ui[lang]["agent.phone.dial"]}
								>
									<Phone className="h-8 w-8" />
								</motion.button>
							)}

							{(conversation.status === "connected" || conversation.status === "connecting") && (
								<motion.button
									whileTap={{ scale: 0.95 }}
									whileHover={{ scale: 1.05 }}
									onClick={handleEndCall}
									className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500 text-white shadow-lg transition-colors hover:bg-red-600"
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
