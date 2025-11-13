import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import LucidePhone from "~icons/lucide/phone";
import LucidePhoneOff from "~icons/lucide/phone-off";
import LucideMic from "~icons/lucide/mic";
import LucideMicOff from "~icons/lucide/mic-off";
import LucideX from "~icons/lucide/x";

interface PhoneCallInterfaceProps {
	isOpen: boolean;
	onClose: () => void;
}

const CALL_STATES = {
	IDLE: "idle",
	CALLING: "calling",
	CONNECTED: "connected",
	ENDED: "ended",
} as const;

type CallState = (typeof CALL_STATES)[keyof typeof CALL_STATES];

export default function PhoneCallInterface({ isOpen, onClose }: PhoneCallInterfaceProps) {
	const [callState, setCallState] = useState<CallState>(CALL_STATES.IDLE);
	const [isMuted, setIsMuted] = useState(false);
	const [callDuration, setCallDuration] = useState(0);

	// 模擬通話計時器
	useEffect(() => {
		let interval: NodeJS.Timeout;
		if (callState === CALL_STATES.CONNECTED) {
			interval = setInterval(() => {
				setCallDuration((prev) => prev + 1);
			}, 1000);
		}
		return () => clearInterval(interval);
	}, [callState]);

	// 重置狀態當關閉時
	useEffect(() => {
		if (!isOpen) {
			setCallState(CALL_STATES.IDLE);
			setCallDuration(0);
			setIsMuted(false);
		}
	}, [isOpen]);

	const handleCall = () => {
		setCallState(CALL_STATES.CALLING);
		// 模擬連線過程
		setTimeout(() => {
			setCallState(CALL_STATES.CONNECTED);
		}, 3000);
	};

	const handleEndCall = () => {
		setCallState(CALL_STATES.ENDED);
		setTimeout(() => {
			onClose();
		}, 2000);
	};

	const formatDuration = (seconds: number) => {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
	};

	const getStatusText = () => {
		switch (callState) {
			case CALL_STATES.CALLING:
				return "正在撥號...";
			case CALL_STATES.CONNECTED:
				return "通話中";
			case CALL_STATES.ENDED:
				return "通話結束";
			default:
				return "準備撥號";
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
						onClick={onClose}
						className="absolute top-6 right-6 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-lg transition-colors hover:bg-white/20"
						aria-label="關閉通話介面"
					>
						<LucideX className="h-6 w-6" />
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
								animate={callState === CALL_STATES.CONNECTED ? { scale: [1, 1.05, 1] } : {}}
							>
								<script type="module" src="https://unpkg.com/@splinetool/viewer@1.0.18/build/spline-viewer.js"></script>
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
							<h2 className="mb-2 text-3xl font-bold">AI 寶博</h2>
							<p className="text-lg text-white/80">{getStatusText()}</p>
							{callState === CALL_STATES.CONNECTED && (
								<motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-2 text-sm text-white/60">
									{formatDuration(callDuration)}
								</motion.p>
							)}
						</motion.div>

						{/* 通話狀態指示器 */}
						{callState === CALL_STATES.CALLING && (
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
							{callState === CALL_STATES.IDLE && (
								<motion.button
									whileTap={{ scale: 0.95 }}
									whileHover={{ scale: 1.05 }}
									onClick={handleCall}
									className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500 text-white shadow-lg transition-colors hover:bg-green-600"
									aria-label="撥打電話"
								>
									<LucidePhone className="h-8 w-8" />
								</motion.button>
							)}

							{(callState === CALL_STATES.CALLING || callState === CALL_STATES.CONNECTED) && (
								<>
									{/* 靜音按鈕 */}
									<motion.button
										whileTap={{ scale: 0.95 }}
										whileHover={{ scale: 1.05 }}
										onClick={() => setIsMuted(!isMuted)}
										className={`flex h-14 w-14 items-center justify-center rounded-full text-white shadow-lg transition-colors ${
											isMuted ? "bg-red-500 hover:bg-red-600" : "bg-gray-600 hover:bg-gray-700"
										}`}
										aria-label={isMuted ? "取消靜音" : "靜音"}
									>
										{isMuted ? <LucideMicOff className="h-6 w-6" /> : <LucideMic className="h-6 w-6" />}
									</motion.button>

									{/* 掛斷按鈕 */}
									<motion.button
										whileTap={{ scale: 0.95 }}
										whileHover={{ scale: 1.05 }}
										onClick={handleEndCall}
										className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500 text-white shadow-lg transition-colors hover:bg-red-600"
										aria-label="結束通話"
									>
										<LucidePhoneOff className="h-8 w-8" />
									</motion.button>
								</>
							)}
						</motion.div>

						{/* 結束通話訊息 */}
						{callState === CALL_STATES.ENDED && (
							<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-4 text-center">
								<p className="text-white/80">感謝您的通話！</p>
							</motion.div>
						)}
					</div>
				</motion.div>
			)}
		</AnimatePresence>
	);
}
