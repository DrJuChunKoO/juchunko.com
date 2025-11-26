import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence, useMotionValue } from "motion/react";
import { BotMessageSquare, X, ArrowRight, ArrowUp } from "lucide-react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import Markdown from "markdown-to-jsx";
import { ui } from "src/i18n/ui";

type SupportedLang = "en" | "zh-TW";

interface AIAssistantWindowProps {
	isOpen: boolean;
	onClose: () => void;
	lang?: SupportedLang;
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

export default function AIAssistantWindow({ isOpen, onClose, lang = "zh-TW" }: AIAssistantWindowProps) {
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
			text: ui[lang]["agent.assistant.prompt.summary"],
			prompt: ui[lang]["agent.assistant.prompt.summaryText"],
		},
		{
			text: ui[lang]["agent.assistant.prompt.background"],
			prompt: ui[lang]["agent.assistant.prompt.backgroundText"],
		},
		{
			text: ui[lang]["agent.assistant.prompt.mainPoints"],
			prompt: ui[lang]["agent.assistant.prompt.mainPointsText"],
		},
		{
			text: ui[lang]["agent.assistant.prompt.explain"],
			prompt: ui[lang]["agent.assistant.prompt.explainText"],
		},
		{
			text: ui[lang]["agent.assistant.prompt.quiz"],
			prompt: ui[lang]["agent.assistant.prompt.quizText"],
		},
		{
			text: ui[lang]["agent.assistant.prompt.news"],
			prompt: ui[lang]["agent.assistant.prompt.newsText"],
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
					className="fixed right-4 z-40 flex w-100 origin-bottom-right flex-col rounded-lg bg-white shadow-2xl backdrop-blur-xl dark:bg-gray-900"
				>
					{/* 標題欄 */}
					<div className="flex items-center justify-between rounded-t-lg bg-gray-500 p-3 text-white">
						<div className="flex items-center gap-2">
							<BotMessageSquare className="h-5 w-5" />
							<h3 className="font-semibold">{ui[lang]["agent.assistant.title"]}</h3>
						</div>
						<div className="flex items-center gap-1">
							<motion.button
								whileTap={{ scale: 0.95 }}
								onClick={onClose}
								className="rounded p-1 transition-colors hover:bg-white/20"
								aria-label={ui[lang]["agent.assistant.close"]}
							>
								<X className="h-4 w-4" />
							</motion.button>
						</div>
					</div>

					{/* 聊天內容 */}
					<div className="h-100 overflow-y-auto border-t border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950">
						<motion.div
							className="flex flex-col space-y-3 p-4 text-sm"
							initial={{ opacity: 0, y: 10 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: 10 }}
							transition={{ delay: 0.35 }}
						>
							<div className="text-center text-xs text-gray-500">{ui[lang]["agent.assistant.disclaimer"]}</div>

							{[
								{
									id: "system",
									role: "assistant",
									parts: [{ type: "text", text: ui[lang]["agent.assistant.greeting"] }],
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
										aria-label={m.role === "user" ? ui[lang]["agent.assistant.userMessage"] : ui[lang]["agent.assistant.assistantMessage"]}
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
															<span className="text-sm text-gray-500">{ui[lang]["agent.assistant.loading"]}</span>
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
												<span className="text-sm text-gray-500">{ui[lang]["agent.assistant.loading"]}</span>
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
						aria-label={ui[lang]["agent.assistant.chatForm"]}
						onSubmit={(e) => {
							handleSubmit(e);
							setInput("");
						}}
						className="p-1"
					>
						<div className="flex gap-2 rounded-md outline outline-gray-200 has-focus:outline-blue-500 dark:outline-gray-800 dark:has-focus:outline-blue-400">
							<textarea
								className="w-full flex-1 resize-none rounded-lg bg-transparent px-3 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none dark:text-gray-100 dark:placeholder-gray-500"
								placeholder={ui[lang]["agent.assistant.placeholder"]}
								value={input}
								onChange={handleInputChange}
								onKeyDown={handleKeyDown}
								tabIndex={0}
								aria-describedby="chat-bot-instructions"
								ref={inputRef}
								rows={1}
							/>
							<button
								type="submit"
								disabled={status === "streaming" || input.trim() === ""}
								aria-label={ui[lang]["agent.assistant.send"]}
								aria-disabled={status === "streaming" || input.trim() === "" ? "true" : "false"}
								className="flex w-9 items-center justify-center rounded-r-md bg-blue-500 text-white transition-colors hover:bg-blue-600 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:opacity-50 dark:bg-blue-600 dark:hover:bg-blue-700 dark:disabled:bg-gray-800"
							>
								<ArrowUp className="size-4" />
							</button>
							<div id="chat-bot-instructions" className="sr-only">
								{ui[lang]["agent.assistant.instructions"]}
							</div>
						</div>
					</form>
				</motion.div>
			)}
		</AnimatePresence>
	);
}
