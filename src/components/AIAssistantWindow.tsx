import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence, useMotionValue } from "framer-motion";
import LucideBotMessageSquare from "~icons/lucide/bot-message-square";
import LucideSend from "~icons/lucide/send";
import LucideX from "~icons/lucide/x";

interface Message {
	id: string;
	content: string;
	sender: "user" | "ai";
	timestamp: Date;
}

interface AIAssistantWindowProps {
	isOpen: boolean;
	onClose: () => void;
}

export default function AIAssistantWindow({ isOpen, onClose }: AIAssistantWindowProps) {
	const [messages, setMessages] = useState<Message[]>([
		{
			id: "welcome",
			content: "您好！我是 AI 寶博，有什麼可以幫助您的嗎？",
			sender: "ai",
			timestamp: new Date(),
		},
	]);
	const [inputValue, setInputValue] = useState("");
	const [isTyping, setIsTyping] = useState(false);
	const messagesEndRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);

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

	// 自動滾動到最新訊息
	const scrollToBottom = () => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	};

	useEffect(() => {
		scrollToBottom();
	}, [messages]);

	// 當視窗打開時聚焦輸入框
	useEffect(() => {
		if (isOpen) {
			setTimeout(() => inputRef.current?.focus(), 100);
		}
	}, [isOpen]);

	const handleSendMessage = async () => {
		if (!inputValue.trim()) return;

		const userMessage: Message = {
			id: Date.now().toString(),
			content: inputValue,
			sender: "user",
			timestamp: new Date(),
		};

		setMessages((prev) => [...prev, userMessage]);
		setInputValue("");
		setIsTyping(true);

		// 模擬 AI 回應
		setTimeout(() => {
			const aiResponses = [
				"這是一個很好的問題！讓我想想...",
				"我明白您的想法，這裡有幾個建議：",
				"根據我的理解，這種情況通常需要...",
				"感謝您的提問！我建議您可以嘗試...",
				"這個問題很有趣，從我的角度來看...",
			];

			const randomResponse = aiResponses[Math.floor(Math.random() * aiResponses.length)];

			const aiMessage: Message = {
				id: (Date.now() + 1).toString(),
				content: randomResponse,
				sender: "ai",
				timestamp: new Date(),
			};

			setMessages((prev) => [...prev, aiMessage]);
			setIsTyping(false);
		}, 1500);
	};

	const handleKeyPress = (e: React.KeyboardEvent) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			handleSendMessage();
		}
	};

	const formatTime = (date: Date) => {
		return date.toLocaleTimeString("zh-TW", {
			hour: "2-digit",
			minute: "2-digit",
		});
	};

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
					className="fixed right-4 z-40 flex h-120 w-80 origin-bottom-right flex-col rounded-lg bg-white shadow-2xl ring-1 ring-black/5 backdrop-blur-xl dark:bg-gray-900 dark:ring-white/10"
				>
					{/* 標題欄 */}
					<div className="flex items-center justify-between rounded-t-lg bg-gray-500 p-3 text-white">
						<div className="flex items-center gap-2">
							<LucideBotMessageSquare className="h-5 w-5" />
							<h3 className="font-semibold">AI 助手</h3>
						</div>
						<div className="flex items-center gap-1">
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

					{/* 聊天內容 */}
					<div className="flex flex-1 flex-col gap-3 overflow-y-auto p-3">
						{/* 訊息列表 */}

						{messages.map((message) => (
							<motion.div
								key={message.id}
								initial={{ opacity: 0, y: 10 }}
								animate={{ opacity: 1, y: 0 }}
								className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
							>
								<div
									className={`max-w-[80%] rounded-lg p-2 px-3 text-sm ${
										message.sender === "user" ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
									}`}
								>
									<p className="whitespace-pre-wrap">{message.content}</p>
								</div>
							</motion.div>
						))}

						{/* AI 輸入中指示器 */}
						{isTyping && (
							<motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-start">
								<div className="rounded-lg bg-gray-100 p-2 dark:bg-gray-800">
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
												className="h-2 w-2 rounded-full bg-gray-400"
											/>
										))}
									</div>
								</div>
							</motion.div>
						)}
						<div ref={messagesEndRef} />
					</div>
					{/* 輸入區域 */}
					<div className="border-t border-gray-200 p-3 dark:border-gray-700">
						<div className="flex items-center gap-2">
							<input
								ref={inputRef}
								type="text"
								value={inputValue}
								onChange={(e) => setInputValue(e.target.value)}
								onKeyDown={handleKeyPress}
								placeholder="輸入訊息..."
								className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-blue-400"
								disabled={isTyping}
							/>
							<motion.button
								whileTap={{ scale: 0.95 }}
								onClick={handleSendMessage}
								disabled={!inputValue.trim() || isTyping}
								className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500 text-white transition-colors hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
								aria-label="發送訊息"
							>
								<LucideSend className="h-4 w-4" />
							</motion.button>
						</div>
					</div>
				</motion.div>
			)}
		</AnimatePresence>
	);
}
