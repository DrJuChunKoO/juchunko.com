import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
	ArrowDown,
	ArrowRight,
	ArrowUp,
	Bot,
	Check,
	ChevronDown,
	Copy,
	Eye,
	Lightbulb,
	Maximize2,
	Minimize2,
	Newspaper,
	RefreshCw,
	Rss,
	Search,
	Square,
	TriangleAlert,
	Wrench,
	X,
	type LucideIcon,
} from "lucide-react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, isTextUIPart } from "ai";
import Markdown from "markdown-to-jsx";

import { applyDialogScrollLock } from "@/components/news-page-scroll-lock";
import { Bubble, BubbleContent } from "@/components/ui/bubble";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Marker, MarkerContent, MarkerIcon } from "@/components/ui/marker";
import { Message, MessageContent, MessageFooter } from "@/components/ui/message";
import {
	MessageScroller,
	MessageScrollerButton,
	MessageScrollerContent,
	MessageScrollerItem,
	MessageScrollerProvider,
	MessageScrollerViewport,
} from "@/components/ui/message-scroller";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { ui } from "src/i18n/ui";
import {
	collectToolParts,
	extractMessageText,
	extractReasoningText,
	formatQuickPromptLabel,
	getToolDescriptor,
	getToolLabel,
	hasRenderableText,
	isBusyStatus,
	isToolPartRunning,
	selectQuickPrompts,
	type NormalizedToolPart,
	type QuickPrompt,
	type ToolIconName,
} from "./ai-assistant";

type SupportedLang = "en" | "zh-TW";

interface AIAssistantWindowProps {
	isOpen: boolean;
	onClose: () => void;
	lang?: SupportedLang;
}

const TOOL_ICONS: Record<ToolIconName, LucideIcon> = {
	view: Eye,
	search: Search,
	feed: Rss,
	article: Newspaper,
	tool: Wrench,
};

/** One persistent row per tool call, so the activity stays readable after the answer lands. */
function ToolMarker({ lang, toolPart }: { lang: SupportedLang; toolPart: NormalizedToolPart }) {
	const running = isToolPartRunning(toolPart.state);
	const failed = toolPart.state === "output-error";
	const ToolIcon = TOOL_ICONS[getToolDescriptor(toolPart.toolName).iconName];
	const label = getToolLabel(lang, toolPart.toolName, toolPart.input);

	return (
		<Marker role={running ? "status" : undefined} className={cn(failed && "text-destructive")}>
			<MarkerIcon>{running ? <Spinner /> : <ToolIcon />}</MarkerIcon>
			<MarkerContent className={cn(running && "shimmer")}>
				{failed ? `${label} · ${ui[lang]["agent.assistant.toolFailed"]}` : label}
			</MarkerContent>
		</Marker>
	);
}

function ReasoningDisclosure({ label, text }: { label: string; text: string }) {
	return (
		<Collapsible>
			<CollapsibleTrigger
				className="group/reasoning text-muted-foreground hover:text-foreground flex cursor-pointer items-center gap-2 text-sm transition-colors"
				render={<button type="button" />}
			>
				<Lightbulb className="size-4" />
				{label}
				<ChevronDown className="size-3.5 transition-transform duration-150 group-data-panel-open/reasoning:rotate-180" />
			</CollapsibleTrigger>
			<CollapsibleContent className="border-border text-muted-foreground h-(--collapsible-panel-height) overflow-hidden text-xs whitespace-pre-wrap transition-[height] duration-200 ease-out data-ending-style:h-0 data-starting-style:h-0">
				<div className="border-border mt-2 border-s ps-3">{text}</div>
			</CollapsibleContent>
		</Collapsible>
	);
}

function QuickPromptList({
	quickPrompts,
	ariaLabelTemplate,
	onSelect,
	className,
}: {
	quickPrompts: QuickPrompt[];
	ariaLabelTemplate: string;
	onSelect: (prompt: string) => void;
	className?: string;
}) {
	return (
		<div className={cn("flex flex-col", className)}>
			{quickPrompts.map((quickPrompt) => (
				<button
					key={quickPrompt.text}
					type="button"
					onClick={() => onSelect(quickPrompt.prompt)}
					aria-label={formatQuickPromptLabel(ariaLabelTemplate, quickPrompt.text)}
					className="group text-muted-foreground hover:text-foreground flex cursor-pointer items-center gap-0.5 rounded p-1 text-left text-sm transition-all hover:font-medium hover:tracking-wide"
				>
					{quickPrompt.text}
					<ArrowRight className="size-4 opacity-50 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" />
				</button>
			))}
		</div>
	);
}

export default function AIAssistantWindow({ isOpen, onClose, lang = "zh-TW" }: AIAssistantWindowProps) {
	const inputRef = useRef<HTMLTextAreaElement>(null);
	const windowRef = useRef<HTMLDivElement>(null);
	const copyResetRef = useRef<ReturnType<typeof setTimeout>>(undefined);

	const [input, setInput] = useState("");
	const [expanded, setExpanded] = useState(false);
	const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
	const [windowOffset, setWindowOffset] = useState(16);

	const prefersReducedMotion = Boolean(useReducedMotion());

	// 開啟／關閉用彈簧；layout（小窗 ↔ 全螢幕）另調一組，避免過度拉伸感
	const openSpring = prefersReducedMotion ? { duration: 0.15 } : { type: "spring" as const, stiffness: 300, damping: 30 };
	const layoutSpring = prefersReducedMotion ? { duration: 0 } : { type: "spring" as const, stiffness: 420, damping: 36, mass: 0.85 };

	const transport = useMemo(
		() =>
			new DefaultChatTransport({
				api: "/api/chat",
				prepareSendMessagesRequest: ({ messages }) => ({
					body: {
						messages,
						filename: typeof window === "undefined" ? "/" : window.location.pathname,
					},
				}),
			}),
		[],
	);

	const { messages, status, sendMessage, stop, regenerate, error, clearError } = useChat({ transport });

	const busy = isBusyStatus(status);

	useEffect(() => {
		if (!isOpen || expanded) return;

		function syncWindowOffset() {
			const footer = document.getElementById("footer");
			if (!footer) {
				setWindowOffset(16);
				return;
			}
			const rect = footer.getBoundingClientRect();
			const top = rect.y - window.innerHeight;
			const isBottom = top < 0;

			setWindowOffset(isBottom ? 16 - top : 16);
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
	}, [isOpen, expanded]);

	// 全螢幕時鎖住頁面滾動，關閉後還原
	useEffect(() => {
		if (!isOpen || !expanded) return;
		return applyDialogScrollLock(document);
	}, [isOpen, expanded]);

	// 關閉視窗時回到浮動模式
	useEffect(() => {
		if (!isOpen) setExpanded(false);
	}, [isOpen]);

	// Esc 先離開全螢幕，再關閉視窗
	useEffect(() => {
		if (!isOpen) return;

		function handleEscape(event: KeyboardEvent) {
			if (event.key !== "Escape") return;
			if (expanded) {
				setExpanded(false);
				return;
			}
			onClose();
		}

		window.addEventListener("keydown", handleEscape);
		return () => window.removeEventListener("keydown", handleEscape);
	}, [isOpen, expanded, onClose]);

	useEffect(() => {
		if (isOpen) {
			const focusTimer = setTimeout(() => inputRef.current?.focus(), 100);
			return () => clearTimeout(focusTimer);
		}
	}, [isOpen]);

	useEffect(() => () => clearTimeout(copyResetRef.current), []);

	// 使用者只會看到本地化的錯誤訊息，實際原因保留在 console 供除錯
	useEffect(() => {
		if (error) console.error("AI assistant chat request failed", error);
	}, [error]);

	const sentTexts = useMemo(
		() => messages.filter((message) => message.role === "user").map((message) => extractMessageText(message.parts)),
		[messages],
	);
	const quickPrompts = useMemo(() => selectQuickPrompts(lang, sentTexts), [lang, sentTexts]);

	const submitPrompt = useCallback(
		(text: string) => {
			const trimmed = text.trim();
			if (!trimmed || busy) return;
			if (status === "error") clearError();
			sendMessage({ text: trimmed });
		},
		[busy, clearError, sendMessage, status],
	);

	const handleSubmit = (event?: React.FormEvent) => {
		event?.preventDefault();
		if (!input.trim()) return;
		submitPrompt(input);
		setInput("");
	};

	const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
		if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
			event.preventDefault();
			handleSubmit();
		}
	};

	const handleRetry = useCallback(() => {
		if (status === "error") clearError();
		void regenerate();
	}, [clearError, regenerate, status]);

	const handleCopy = useCallback(async (messageId: string, text: string) => {
		try {
			await navigator.clipboard.writeText(text);
			setCopiedMessageId(messageId);
			clearTimeout(copyResetRef.current);
			copyResetRef.current = setTimeout(() => setCopiedMessageId(null), 2000);
		} catch (copyError) {
			// 剪貼簿權限可能被拒絕，僅記錄不中斷對話
			console.error("Failed to copy assistant message", copyError);
		}
	}, []);

	const lastMessage = messages[messages.length - 1];
	const lastAssistantMessage = lastMessage?.role === "assistant" ? lastMessage : undefined;
	const hasRunningTool = lastAssistantMessage
		? collectToolParts(lastAssistantMessage.parts).some((toolPart) => isToolPartRunning(toolPart.state))
		: false;
	// 只有在還沒有任何工具或文字可看時才顯示「思考中」，避免與工具列重複
	const showThinking = busy && !hasRunningTool && !hasRenderableText(lastAssistantMessage?.parts);
	const canRetry = !busy && lastAssistantMessage !== undefined;

	return (
		<motion.div layoutRoot className="pointer-events-none fixed inset-0">
			{/* 全螢幕時的背景遮罩：點擊可收合回小窗 */}
			<AnimatePresence>
				{isOpen && expanded && (
					<motion.div
						key="ai-assistant-backdrop"
						aria-hidden
						className="pointer-events-auto fixed inset-0 z-40 bg-black/40"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						transition={{ duration: prefersReducedMotion ? 0.12 : 0.22, ease: [0.22, 1, 0.36, 1] }}
						onClick={() => setExpanded(false)}
					/>
				)}
			</AnimatePresence>

			<AnimatePresence>
				{isOpen && (
					<motion.div
						ref={windowRef}
						layout={!prefersReducedMotion}
						layoutAnchor={{ x: 1, y: 1 }}
						layoutDependency={expanded}
						initial={prefersReducedMotion ? { opacity: 0, bottom: windowOffset } : { opacity: 0, scale: 0.5, y: 16, bottom: windowOffset }}
						animate={
							prefersReducedMotion
								? { opacity: 1, bottom: expanded ? 0 : windowOffset }
								: { opacity: 1, scale: 1, y: 0, bottom: expanded ? 0 : windowOffset }
						}
						exit={
							prefersReducedMotion
								? { opacity: 0, bottom: expanded ? 0 : windowOffset }
								: { opacity: 0, scale: 0.5, y: 16, bottom: expanded ? 0 : windowOffset }
						}
						transition={{
							...openSpring,
							layout: layoutSpring,
							bottom: layoutSpring,
							borderRadius: layoutSpring,
						}}
						style={{
							// borderRadius 放 style，layout 變形時才不會被 scale 扭歪
							borderRadius: expanded ? 0 : 12,
						}}
						className={cn(
							"ring-border/50 pointer-events-auto fixed flex origin-bottom-right flex-col overflow-hidden will-change-[transform,border-radius]",
							expanded
								? "bg-card inset-0 z-50 ring-0"
								: "bg-card/75 right-4 z-40 w-100 max-w-[calc(100vw-32px)] shadow-lg ring-1 backdrop-blur-xl",
						)}
						role="dialog"
						aria-modal={expanded}
						aria-label={ui[lang]["agent.assistant.title"]}
					>
						{/* 標題欄 */}
						<motion.div
							layout="position"
							layoutDependency={expanded}
							transition={{ layout: layoutSpring }}
							className="bg-muted text-foreground border-border shrink-0 border-b"
						>
							<div className={cn("flex items-center justify-between gap-2 p-2 pl-4", expanded && "mx-auto w-full max-w-3xl")}>
								<div className="flex items-center gap-2">
									<Bot className="text-primary size-5" />
									<h3 className="font-semibold">{ui[lang]["agent.assistant.title"]}</h3>
								</div>
								<div className="flex items-center gap-1">
									<Button
										variant="ghost"
										size="icon-sm"
										className="text-muted-foreground hover:text-foreground relative cursor-pointer overflow-hidden rounded-lg"
										onClick={() => setExpanded((value) => !value)}
										aria-label={expanded ? ui[lang]["agent.assistant.collapse"] : ui[lang]["agent.assistant.expand"]}
										aria-pressed={expanded}
									>
										<AnimatePresence mode="popLayout" initial={false}>
											<motion.span
												key={expanded ? "collapse" : "expand"}
												initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.6, filter: "blur(2px)" }}
												animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, scale: 1, filter: "blur(0px)" }}
												exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.6, filter: "blur(2px)" }}
												transition={{ duration: prefersReducedMotion ? 0.1 : 0.15, ease: "easeInOut" }}
												className="flex size-full items-center justify-center"
											>
												{expanded ? <Minimize2 /> : <Maximize2 />}
											</motion.span>
										</AnimatePresence>
									</Button>
									<Button
										variant="ghost"
										size="icon-sm"
										className="text-muted-foreground hover:text-foreground cursor-pointer rounded-lg"
										onClick={onClose}
										aria-label={ui[lang]["agent.assistant.close"]}
									>
										<X />
									</Button>
								</div>
							</div>
						</motion.div>

						{/* 對話內容 */}
						<MessageScrollerProvider autoScroll defaultScrollPosition="last-anchor" scrollPreviousItemPeek={48}>
							<MessageScroller className={cn("bg-card/50 min-h-0", expanded ? "flex-1" : "h-100")}>
								<MessageScrollerViewport aria-label={ui[lang]["agent.assistant.transcript"]}>
									<MessageScrollerContent aria-busy={busy} className={cn("gap-4 p-4", expanded && "mx-auto w-full max-w-3xl gap-6 py-6")}>
										<MessageScrollerItem messageId="disclaimer">
											<Marker variant="separator">
												<MarkerContent className="text-xs">{ui[lang]["agent.assistant.disclaimer"]}</MarkerContent>
											</Marker>
										</MessageScrollerItem>

										{messages.length === 0 ? (
											<MessageScrollerItem messageId="empty-state" className="flex shrink flex-col">
												<Empty className="border-0 p-2">
													<EmptyHeader>
														<EmptyMedia variant="icon">
															<Bot />
														</EmptyMedia>
														<EmptyTitle className="text-base">{ui[lang]["agent.assistant.title"]}</EmptyTitle>
														<EmptyDescription>{ui[lang]["agent.assistant.greeting"]}</EmptyDescription>
													</EmptyHeader>
													<EmptyContent>
														<QuickPromptList
															quickPrompts={quickPrompts}
															ariaLabelTemplate={ui[lang]["agent.assistant.quickPrompt"]}
															onSelect={submitPrompt}
															className="w-full items-start"
														/>
													</EmptyContent>
												</Empty>
											</MessageScrollerItem>
										) : (
											messages.map((message) => {
												const isUser = message.role === "user";
												const messageText = extractMessageText(message.parts);
												const reasoningText = extractReasoningText(message.parts);
												const toolParts = collectToolParts(message.parts);
												const showFooter = !isUser && messageText !== "" && !busy;

												return (
													<MessageScrollerItem key={message.id} messageId={message.id} scrollAnchor={isUser}>
														<Message align={isUser ? "end" : "start"}>
															<MessageContent>
																{toolParts.map((toolPart, index) => (
																	<ToolMarker
																		key={toolPart.toolCallId ?? `${toolPart.toolName}-${index}`}
																		lang={lang}
																		toolPart={toolPart}
																	/>
																))}

																{reasoningText !== "" && (
																	<ReasoningDisclosure label={ui[lang]["agent.assistant.reasoning"]} text={reasoningText} />
																)}

																{hasRenderableText(message.parts) && (
																	<Bubble
																		variant={isUser ? "default" : "muted"}
																		align={isUser ? "end" : "start"}
																		aria-label={
																			isUser ? ui[lang]["agent.assistant.userMessage"] : ui[lang]["agent.assistant.assistantMessage"]
																		}
																	>
																		<BubbleContent
																			className={cn(
																				"prose prose-sm prose-neutral max-w-none rounded-2xl",
																				// 在窄面板中收緊 typography 間距與標題尺寸
																				"prose-headings:mt-3 prose-headings:mb-1.5 prose-headings:text-[0.95em] prose-p:my-1.5 prose-ul:my-1.5 prose-ol:my-1.5 prose-li:my-0.5 prose-pre:my-2 [&>:first-child]:mt-0 [&>:last-child]:mb-0",
																				isUser ? "prose-invert" : "dark:prose-invert",
																			)}
																		>
																			{message.parts.map((part, index) =>
																				isTextUIPart(part) && part.text !== "" ? <Markdown key={index}>{part.text}</Markdown> : null,
																			)}
																		</BubbleContent>
																	</Bubble>
																)}

																{showFooter && (
																	<MessageFooter className="gap-0.5 px-0">
																		<Button
																			variant="ghost"
																			size="icon-xs"
																			className="text-muted-foreground hover:text-foreground cursor-pointer rounded-md"
																			onClick={() => void handleCopy(message.id, messageText)}
																			aria-label={
																				copiedMessageId === message.id
																					? ui[lang]["agent.assistant.copied"]
																					: ui[lang]["agent.assistant.copy"]
																			}
																		>
																			{copiedMessageId === message.id ? <Check /> : <Copy />}
																		</Button>
																		{canRetry && message.id === lastAssistantMessage?.id && (
																			<Button
																				variant="ghost"
																				size="icon-xs"
																				className="text-muted-foreground hover:text-foreground cursor-pointer rounded-md"
																				onClick={handleRetry}
																				aria-label={ui[lang]["agent.assistant.retry"]}
																			>
																				<RefreshCw />
																			</Button>
																		)}
																	</MessageFooter>
																)}
															</MessageContent>
														</Message>
													</MessageScrollerItem>
												);
											})
										)}

										{showThinking && (
											<MessageScrollerItem messageId="thinking">
												<Marker role="status">
													<MarkerIcon>
														<Spinner />
													</MarkerIcon>
													<MarkerContent className="shimmer">{ui[lang]["agent.assistant.thinking"]}</MarkerContent>
												</Marker>
											</MessageScrollerItem>
										)}

										{status === "error" && (
											<MessageScrollerItem messageId="error">
												<Marker role="status" className="text-destructive">
													<MarkerIcon>
														<TriangleAlert />
													</MarkerIcon>
													<MarkerContent>{ui[lang]["agent.assistant.error"]}</MarkerContent>
												</Marker>
												<Button
													variant="outline"
													size="sm"
													className="mt-2 cursor-pointer rounded-lg"
													onClick={handleRetry}
													aria-label={ui[lang]["agent.assistant.retry"]}
												>
													<RefreshCw />
													{ui[lang]["agent.assistant.retry"]}
												</Button>
											</MessageScrollerItem>
										)}

										{messages.length > 0 && status === "ready" && quickPrompts.length > 0 && (
											<MessageScrollerItem messageId="quick-prompts">
												<QuickPromptList
													quickPrompts={quickPrompts}
													ariaLabelTemplate={ui[lang]["agent.assistant.quickPrompt"]}
													onSelect={submitPrompt}
												/>
											</MessageScrollerItem>
										)}
									</MessageScrollerContent>
								</MessageScrollerViewport>
								<MessageScrollerButton className="rounded-full">
									<ArrowDown />
									<span className="sr-only">{ui[lang]["agent.assistant.scrollToLatest"]}</span>
								</MessageScrollerButton>
							</MessageScroller>
						</MessageScrollerProvider>

						{/* 輸入區域 */}
						<motion.form
							layout
							layoutAnchor={{ x: 0.5, y: 1 }}
							layoutDependency={expanded}
							transition={{ layout: layoutSpring }}
							aria-label={ui[lang]["agent.assistant.chatForm"]}
							onSubmit={handleSubmit}
							className={cn("shrink-0 p-2", expanded && "mx-auto w-full max-w-3xl pb-4")}
						>
							<div className="bg-muted/50 ring-border/50 focus-within:ring-primary/50 focus-within:bg-muted flex items-end gap-2 rounded-lg p-1 ring-1 transition-all">
								<Textarea
									ref={inputRef}
									value={input}
									onChange={(event) => setInput(event.target.value)}
									onKeyDown={handleKeyDown}
									placeholder={ui[lang]["agent.assistant.placeholder"]}
									aria-describedby="chat-bot-instructions"
									rows={1}
									className="text-foreground max-h-40 min-h-9 flex-1 rounded-md border-0 bg-transparent px-3 py-2 text-sm focus-visible:ring-0 md:text-sm"
								/>
								{busy ? (
									<Button
										type="button"
										variant="secondary"
										size="icon-lg"
										className="cursor-pointer rounded-lg"
										onClick={() => stop()}
										aria-label={ui[lang]["agent.assistant.stop"]}
									>
										<Square className="size-3.5 fill-current" />
									</Button>
								) : (
									<Button
										type="submit"
										size="icon-lg"
										className="cursor-pointer rounded-lg"
										disabled={input.trim() === ""}
										aria-label={ui[lang]["agent.assistant.send"]}
									>
										<ArrowUp />
									</Button>
								)}
							</div>
							<div id="chat-bot-instructions" className="sr-only">
								{ui[lang]["agent.assistant.instructions"]}
							</div>
						</motion.form>
					</motion.div>
				)}
			</AnimatePresence>
		</motion.div>
	);
}
