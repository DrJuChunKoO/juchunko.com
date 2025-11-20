import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence, useMotionValue } from "motion/react";
import { BotMessageSquare, Send, X, ArrowRight } from "lucide-react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import Markdown from "markdown-to-jsx";

interface AIAssistantWindowProps {
	isOpen: boolean;
	onClose: () => void;
}

// Loading dots component
function LoadingDots() {
	return (
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
					className="h-1 w-1 rounded-full bg-gray-400"
				/>
			))}
		</div>
	);
}

export default function AIAssistantWindow({ isOpen, onClose }: AIAssistantWindowProps) {
	const messagesEndRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLTextAreaElement>(null);

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

	const [input, setInput] = useState("");

	// useChat hook for API integration with transport
	const { messages, status, sendMessage } = useChat({
		transport: new DefaultChatTransport({
			api: "/api/chat",
			body: {
				filename: typeof window !== "undefined" ? window.location.pathname : "/",
			},
		}),
	});

	// Quick prompts definitions
	const quickPrompts = [
		{
			text: "重點摘要",
			prompt: "摘要此對話的重點",
		},
		{
			text: "背景資訊",
			prompt: "提供此內容的背景資訊",
		},
		{
			text: "主要觀點",
			prompt: "說明此內容的主要觀點?",
		},
		{
			text: "詳細解釋",
			prompt: "詳細解釋此內容?",
		},
		{
			text: `生成問答`,
			prompt: "為此內容生成問答",
		},
	] as { text: string; prompt: string }[];

	const sendQuickPrompt = (promptStr: string) => {
		sendMessage({ text: promptStr });
	};

	// 自動滾動到最新訊息
	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages, status]);

	// 當視窗打開時聚焦輸入框
	useEffect(() => {
		if (isOpen) {
			setTimeout(() => inputRef.current?.focus(), 100);
		}
	}, [isOpen]);

	const handleKeyDown = (e: React.KeyboardEvent) => {
		const isComposing = (e.nativeEvent as any).isComposing;
		if (e.key === "Enter" && !e.shiftKey && !isComposing) {
			e.preventDefault();
			handleSubmit();
		}
	};

	const handleSubmit = (e?: React.FormEvent) => {
		if (e) e.preventDefault();
		if (!input.trim()) return;

		sendMessage({ text: input });
		setInput("");
	};

	const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
		setInput(e.target.value);
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
							<BotMessageSquare className="h-5 w-5" />
							<h3 className="font-semibold">AI 助手</h3>
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

					{/* 聊天內容 */}
					<div className="h-96 max-h-[60vh] overflow-y-auto border-t border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950">
						<motion.div
							className="flex flex-col space-y-3 p-4 text-sm"
							initial={{ opacity: 0, y: 10 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: 10 }}
							transition={{ delay: 0.35 }}
						>
							<div className="text-center text-xs text-gray-500">AI 可能會犯錯，可能會有錯誤或不準確的回應。</div>

							{[
								{
									id: "system",
									role: "assistant",
									parts: [{ type: "text", text: "嗨，我是 AI 助手，隨時準備回答您的問題！請問有什麼我可以幫助您的？" }],
								},
								...messages,
							].map((m) => (
								<div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
									<motion.div
										className={[
											"prose prose-sm prose-neutral prose-tight max-w-[80%] rounded-lg px-3 py-1 wrap-break-word whitespace-pre-wrap",
											m.role === "user"
												? "prose-invert origin-right bg-blue-500 text-white"
												: "dark:prose-invert origin-left bg-gray-100 dark:bg-gray-800",
										].join(" ")}
										role="article"
										aria-label={m.role === "user" ? "使用者訊息" : "助理訊息"}
										initial={{
											opacity: 0,
											x: m.role === "user" ? 10 : -10,
											rotate: m.role === "user" ? 1 : -1,
										}}
										animate={{
											opacity: 1,
											x: 0,
											rotate: 0,
										}}
										exit={{
											opacity: 0,
											x: m.role === "user" ? 10 : -10,
											rotate: m.role === "user" ? -1 : 1,
										}}
										transition={{ duration: 0.2 }}
									>
										{m.parts && m.parts.length > 0 ? (
											m.parts.map((part, index) => {
												if (part.type === "text") {
													return part.text === "" ? (
														<div key={index} className="flex items-center gap-1">
															<span className="text-sm text-gray-500">載入中</span>
															<LoadingDots />
														</div>
													) : (
														<Markdown key={index}>{part.text}</Markdown>
													);
												}
												return null;
											})
										) : (
											<div className="flex items-center gap-1">
												<span className="text-sm text-gray-500">載入中</span>
												<LoadingDots />
											</div>
										)}
									</motion.div>
								</div>
							))}

							{/* Quick prompt buttons */}
							<AnimatePresence>
								{status === "ready" && (
									<motion.div
										className="-mt-1.5 flex flex-col dark:border-gray-800"
										initial={{ opacity: 0 }}
										animate={{ opacity: 1 }}
										exit={{ opacity: 0 }}
										transition={{ duration: 0.2 }}
									>
										{quickPrompts
											// filter is in messages - check parts for text content
											.filter((qp) => !messages.some((m) => m.parts?.some((part) => part.type === "text" && part.text === qp.prompt)))
											.map((qp) => (
												<button
													key={qp.text}
													onClick={() => sendQuickPrompt(qp.prompt)}
													aria-label={`快速提示: ${qp.text}`}
													aria-pressed={false}
													role="button"
													tabIndex={0}
													className="group flex cursor-pointer items-center gap-0.5 rounded p-1 text-left text-sm text-gray-500 transition-all hover:font-medium hover:tracking-wide hover:text-gray-700 disabled:opacity-50 dark:text-gray-400 dark:hover:text-gray-200"
												>
													{qp.text}
													<ArrowRight className="h-4 w-4 opacity-50 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" />
												</button>
											))}
									</motion.div>
								)}
							</AnimatePresence>
							<div ref={messagesEndRef} className="flex-1" />
						</motion.div>
					</div>
					{/* 輸入區域 */}
					<form
						role="form"
						aria-label="聊天表單"
						onSubmit={(e) => {
							handleSubmit(e);
							setInput("");
						}}
						className="dark:border-gray-800"
					>
						<div className="flex items-center gap-2 rounded-b-lg border-t border-gray-200 p-3 dark:border-gray-800">
							<textarea
								className="h-10 w-full flex-1 resize-none rounded-lg border border-gray-300 bg-transparent px-3 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500 dark:focus:border-blue-400"
								placeholder="請輸入您的問題..."
								value={input}
								onChange={handleInputChange}
								onKeyDown={handleKeyDown}
								tabIndex={0}
								aria-describedby="chat-bot-instructions"
								ref={inputRef}
							/>
							<button
								type="submit"
								disabled={status === "streaming" || input.trim() === ""}
								aria-label="送出訊息"
								aria-disabled={status === "streaming" || input.trim() === "" ? "true" : "false"}
								className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500 text-white transition-colors hover:bg-blue-600 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:opacity-50 dark:bg-blue-600 dark:hover:bg-blue-700 dark:disabled:bg-gray-800"
							>
								<Send className="h-4 w-4" />
							</button>
							<div id="chat-bot-instructions" className="sr-only">
								按下 Enter 鍵送出訊息
							</div>
						</div>
					</form>
				</motion.div>
			)}
		</AnimatePresence>
	);
}
