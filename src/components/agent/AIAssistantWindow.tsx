import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence, useMotionValue } from "motion/react";
import { Bot, BotMessageSquare, X, ArrowRight, ArrowUp, Wrench, Eye, Search, Rss, Newspaper } from "lucide-react";
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
					className="size-0.5 rounded-full bg-gray-400"
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

	const getToolUI = (toolName: string, args?: any, iconClass: string = "size-4") => {
		if (toolName === "viewPage") {
			return {
				icon: <Eye className={iconClass} />,
				text: ui[lang]["agent.assistant.tool.viewPage"],
			};
		}
		if (toolName === "searchNews") {
			return {
				icon: <Search className={iconClass} />,
				text: ui[lang]["agent.assistant.tool.searchNews"].replace("{keyword}", args?.keyword || ""),
			};
		}
		if (toolName === "latestNews") {
			return {
				icon: <Rss className={iconClass} />,
				text: ui[lang]["agent.assistant.tool.latestNews"],
			};
		}
		if (toolName === "getNewsByUrl") {
			return {
				icon: <Newspaper className={iconClass} />,
				text: ui[lang]["agent.assistant.tool.getNewsByUrl"],
			};
		}
		if (toolName === "semanticSiteSearch") {
			return {
				icon: <Search className={iconClass} />,
				text: ui[lang]["agent.assistant.tool.semanticSiteSearch"].replace("{keyword}", args?.keyword || ""),
			};
		}
		return {
			icon: <Wrench className={iconClass} />,
			text: ui[lang]["agent.assistant.tool.default"],
		};
	};

	const getStatusUI = () => {
		if (status !== "submitted" && status !== "streaming") return null;

		const lastMessage = messages[messages.length - 1];
		if (lastMessage?.role === "assistant" && lastMessage.parts) {
			const lastPart = lastMessage.parts[lastMessage.parts.length - 1];
			if (lastPart?.type?.startsWith("tool-")) {
				const toolName = lastPart.type.replace("tool-", "");
				return getToolUI(toolName, (lastPart as any).args, "size-4");
			}
		}

		return {
			icon: <Bot className="size-4" />,
			text: ui[lang]["agent.assistant.thinking"],
		};
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
					className="ring-border/50 bg-card/75 fixed right-4 z-40 flex w-100 origin-bottom-right flex-col overflow-hidden rounded-xl shadow-2xl ring-1 backdrop-blur-xl"
				>
					{/* 標題欄 */}
					<div className="bg-muted text-foreground border-border flex items-center justify-between rounded-t-lg border-b p-2 pl-4">
						<div className="flex items-center gap-2">
							<Bot className="text-primary h-5 w-5" />
							<h3 className="font-semibold">{ui[lang]["agent.assistant.title"]}</h3>
						</div>
						<div className="flex items-center gap-1">
							<motion.button
								whileTap={{ scale: 0.95 }}
								onClick={onClose}
								className="hover:bg-muted-foreground/10 text-muted-foreground hover:text-foreground cursor-pointer rounded-lg p-2 transition-colors"
								aria-label={ui[lang]["agent.assistant.close"]}
							>
								<X className="size-5" />
							</motion.button>
						</div>
					</div>

					{/* 聊天內容 */}
					<div className="bg-card/50 h-100 overflow-y-auto">
						<motion.div
							className="flex flex-col space-y-3 p-4 text-sm"
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: 20 }}
							transition={{ delay: 0.2 }}
						>
							<div className="text-muted-foreground text-center text-xs">{ui[lang]["agent.assistant.disclaimer"]}</div>

							{[
								{
									id: "system",
									role: "assistant",
									parts: [{ type: "text", text: ui[lang]["agent.assistant.greeting"] }],
									toolInvocations: undefined,
								},
								...messages,
							].map((m) => (
								<div key={m.id} className={`flex flex-col gap-2 ${m.role === "user" ? "items-end" : "items-start"}`}>
									{/* Text Content - Rendered inside bubble */}
									{m.parts && m.parts.some((part) => part.type === "text" && part.text !== "") && (
										<motion.div
											className={[
												"prose prose-sm prose-neutral prose-tight max-w-[80%] rounded-2xl px-4 py-2 wrap-break-word whitespace-pre-wrap",
												m.role === "user"
													? "prose-invert bg-primary text-primary-foreground origin-right"
													: "dark:prose-invert bg-muted text-foreground border-border/50 origin-left border",
											].join(" ")}
											role="article"
											aria-label={
												m.role === "user" ? ui[lang]["agent.assistant.userMessage"] : ui[lang]["agent.assistant.assistantMessage"]
											}
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
											{m.parts.map((part, index) => {
												if (part.type === "text") {
													return part.text === "" ? null : <Markdown key={index}>{part.text}</Markdown>;
												}
												return null;
											})}
										</motion.div>
									)}
								</div>
							))}

							{/* Thinking Indicator for 'submitted' state or when waiting for response */}
							{(() => {
								const statusUI = getStatusUI();
								if (!statusUI) return null;
								return (
									<motion.div
										initial={{ opacity: 0, y: 5 }}
										animate={{ opacity: 1, y: 0 }}
										className="text-muted-foreground ml-1 flex items-center gap-1 text-sm"
									>
										{statusUI.icon}
										<span>{statusUI.text}</span>
										<LoadingDots />
									</motion.div>
								);
							})()}

							{/* Quick prompt buttons */}
							<AnimatePresence>
								{status === "ready" && (
									<motion.div
										className="-mt-1.5 flex flex-col"
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
													className="group text-muted-foreground hover:text-foreground flex cursor-pointer items-center gap-0.5 rounded p-1 text-left text-sm transition-all hover:font-medium hover:tracking-wide disabled:opacity-50"
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
						className="p-2"
					>
						<div className="bg-muted/50 ring-border/50 focus-within:ring-primary/50 focus-within:bg-muted flex gap-2 rounded-lg p-1 ring-1 transition-all">
							<textarea
								className="text-foreground placeholder-muted-foreground w-full flex-1 resize-none bg-transparent px-3 py-2 text-sm outline-none"
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
								className="bg-primary text-primary-foreground hover:bg-primary/90 disabled:bg-primary/5 disabled:text-primary/25 flex w-9 items-center justify-center rounded-lg transition-all disabled:cursor-not-allowed"
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
