import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence, useMotionValue } from "framer-motion";
import LucideBookAudio from "~icons/lucide/book-audio";
import LucidePlay from "~icons/lucide/play";
import LucidePause from "~icons/lucide/pause";
import LucideSquare from "~icons/lucide/square";
import LucideVolume2 from "~icons/lucide/volume-2";
import LucideSettings from "~icons/lucide/settings";
import LucideX from "~icons/lucide/x";

interface VoiceReaderWindowProps {
	isOpen: boolean;
	onClose: () => void;
}

type PlayState = "idle" | "playing" | "paused";

export default function VoiceReaderWindow({ isOpen, onClose }: VoiceReaderWindowProps) {
	const [text, setText] = useState("");
	const [playState, setPlayState] = useState<PlayState>("idle");
	const [showSettings, setShowSettings] = useState(false);
	const [settings, setSettings] = useState({
		speed: 1,
		volume: 0.8,
		voice: "default",
	});
	const [progress, setProgress] = useState(0);
	const textareaRef = useRef<HTMLTextAreaElement>(null);
	const speechRef = useRef<SpeechSynthesisUtterance | null>(null);

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

	// 當視窗打開時聚焦文字區域
	useEffect(() => {
		if (isOpen) {
			setTimeout(() => textareaRef.current?.focus(), 100);
		}
	}, [isOpen]);

	// 清理語音合成
	useEffect(() => {
		return () => {
			if (speechRef.current) {
				speechSynthesis.cancel();
			}
		};
	}, []);

	const handlePlay = () => {
		if (!text.trim()) return;

		if (playState === "paused") {
			speechSynthesis.resume();
			setPlayState("playing");
			return;
		}

		// 停止當前播放
		speechSynthesis.cancel();

		const utterance = new SpeechSynthesisUtterance(text);
		speechRef.current = utterance;

		// 設定語音參數
		utterance.rate = settings.speed;
		utterance.volume = settings.volume;
		utterance.lang = "zh-TW";

		// 語音事件處理
		utterance.onstart = () => {
			setPlayState("playing");
			setProgress(0);
		};

		utterance.onend = () => {
			setPlayState("idle");
			setProgress(0);
		};

		utterance.onerror = () => {
			setPlayState("idle");
			setProgress(0);
		};

		utterance.onboundary = (event) => {
			// 計算進度
			const progressPercent = (event.charIndex / text.length) * 100;
			setProgress(progressPercent);
		};

		speechSynthesis.speak(utterance);
	};

	const handlePause = () => {
		speechSynthesis.pause();
		setPlayState("paused");
	};

	const handleStop = () => {
		speechSynthesis.cancel();
		setPlayState("idle");
		setProgress(0);
	};

	const handleSpeedChange = (speed: number) => {
		setSettings((prev) => ({ ...prev, speed }));
		// 如果正在播放，重新開始以應用新設定
		if (playState === "playing") {
			handleStop();
			setTimeout(handlePlay, 100);
		}
	};

	const handleVolumeChange = (volume: number) => {
		setSettings((prev) => ({ ...prev, volume }));
		if (speechRef.current) {
			speechRef.current.volume = volume;
		}
	};

	const sampleTexts = [
		"您好！歡迎使用語音朗讀功能。請在文字框中輸入您想要朗讀的內容。",
		"人工智慧正在改變我們的生活方式，從日常的語音助手到複雜的決策支援系統。",
		"閱讀是人類獲取知識的重要途徑，而語音朗讀則讓知識的傳播更加便利。",
	];

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
					className="fixed right-4 z-40 h-max max-h-[50vh] w-80 origin-bottom-right overflow-y-auto rounded-lg bg-white shadow-2xl ring-1 ring-black/5 backdrop-blur-xl dark:bg-gray-900 dark:ring-white/10"
				>
					{/* 標題欄 */}
					<div className="flex items-center justify-between rounded-t-lg bg-blue-600 p-3 text-white">
						<div className="flex items-center gap-2">
							<LucideBookAudio className="h-5 w-5" />
							<h3 className="font-semibold">語音朗讀</h3>
						</div>
						<div className="flex items-center gap-1">
							<motion.button
								whileTap={{ scale: 0.95 }}
								onClick={() => setShowSettings(!showSettings)}
								className="rounded p-1 transition-colors hover:bg-white/20"
								aria-label="設定"
							>
								<LucideSettings className="h-4 w-4" />
							</motion.button>
							<motion.button
								whileTap={{ scale: 0.95 }}
								onClick={onClose}
								className="rounded p-1 transition-colors hover:bg-white/20"
								aria-label="關閉"
							>
								<LucideX className="h-4 w-4" />
							</motion.button>
						</div>
					</div>

					{/* 主要內容 */}
					<div className="flex flex-col overflow-hidden">
						{/* 設定面板 */}
						<AnimatePresence>
							{showSettings && (
								<motion.div
									initial={{ height: 0, opacity: 0 }}
									animate={{ height: "auto", opacity: 1 }}
									exit={{ height: 0, opacity: 0 }}
									className="border-b border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800"
								>
									<div className="space-y-3">
										{/* 語速調整 */}
										<div>
											<label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">語速：{settings.speed}x</label>
											<input
												type="range"
												min="0.5"
												max="2"
												step="0.1"
												value={settings.speed}
												onChange={(e) => handleSpeedChange(parseFloat(e.target.value))}
												className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-200 dark:bg-gray-700"
											/>
										</div>

										{/* 音量調整 */}
										<div>
											<label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
												音量：{Math.round(settings.volume * 100)}%
											</label>
											<input
												type="range"
												min="0"
												max="1"
												step="0.1"
												value={settings.volume}
												onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
												className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-200 dark:bg-gray-700"
											/>
										</div>
									</div>
								</motion.div>
							)}
						</AnimatePresence>

						{/* 文字輸入區域 */}
						<div className="flex-1 p-3">
							<textarea
								ref={textareaRef}
								value={text}
								onChange={(e) => setText(e.target.value)}
								placeholder="在此輸入要朗讀的文字..."
								className="h-48 w-full resize-none rounded-lg border border-gray-300 p-3 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-blue-400"
							/>

							{/* 進度條 */}
							{playState !== "idle" && (
								<div className="mt-2">
									<div className="mb-1 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
										<span>播放進度</span>
										<span>{Math.round(progress)}%</span>
									</div>
									<div className="h-1 w-full rounded-full bg-gray-200 dark:bg-gray-700">
										<motion.div className="h-1 rounded-full bg-blue-500" style={{ width: `${progress}%` }} transition={{ duration: 0.1 }} />
									</div>
								</div>
							)}

							{/* 範例文字 */}
							{!text && (
								<div className="mt-2">
									<p className="mb-2 text-xs text-gray-500 dark:text-gray-400">範例文字：</p>
									<div className="space-y-1">
										{sampleTexts.map((sample, index) => (
											<button
												key={index}
												onClick={() => setText(sample)}
												className="block w-full rounded border bg-gray-100 p-2 text-left text-xs hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
											>
												{sample.substring(0, 50)}...
											</button>
										))}
									</div>
								</div>
							)}
						</div>

						{/* 控制按鈕 */}
						<div className="border-t border-gray-200 p-3 dark:border-gray-700">
							<div className="flex items-center justify-center gap-3">
								{playState === "playing" ? (
									<motion.button
										whileTap={{ scale: 0.95 }}
										onClick={handlePause}
										className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-500 text-white transition-colors hover:bg-orange-600"
										aria-label="暫停"
									>
										<LucidePause className="h-5 w-5" />
									</motion.button>
								) : (
									<motion.button
										whileTap={{ scale: 0.95 }}
										onClick={handlePlay}
										disabled={!text.trim()}
										className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500 text-white transition-colors hover:bg-green-600 disabled:cursor-not-allowed disabled:opacity-50"
										aria-label="播放"
									>
										<LucidePlay className="h-5 w-5" />
									</motion.button>
								)}

								<motion.button
									whileTap={{ scale: 0.95 }}
									onClick={handleStop}
									disabled={playState === "idle"}
									className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500 text-white transition-colors hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
									aria-label="停止"
								>
									<LucideSquare className="h-4 w-4" />
								</motion.button>

								<div className="ml-2 flex items-center gap-1">
									<LucideVolume2 className="h-4 w-4 text-gray-500 dark:text-gray-400" />
									<span className="text-xs text-gray-500 dark:text-gray-400">{Math.round(settings.volume * 100)}%</span>
								</div>
							</div>

							{/* 播放狀態 */}
							<div className="mt-2 text-center">
								<span className="text-xs text-gray-500 dark:text-gray-400">
									{playState === "playing" && "正在播放..."}
									{playState === "paused" && "已暫停"}
									{playState === "idle" && "準備就緒"}
								</span>
							</div>
						</div>
					</div>
				</motion.div>
			)}
		</AnimatePresence>
	);
}
