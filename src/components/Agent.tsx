import { useEffect, useState } from "react";
import { AnimatePresence, motion, useMotionValue, useReducedMotion, type Variants } from "motion/react";
import { BotMessageSquare, Phone, BookAudio, Sparkles, ChevronDown } from "lucide-react";
import AgentButton from "./AgentButton";
import PhoneCallInterface from "./PhoneCallInterface";
import AIAssistantWindow from "./AIAssistantWindow";
import VoiceReaderWindow from "./VoiceReaderWindow";
import { ui } from "src/i18n/ui";

type SupportedLang = "en" | "zh-TW";

interface AgentProps {
	lang?: SupportedLang;
}

/**
 * 特性旗標：由下至上的動畫順序（可於 runtime 切換）
 * 來源：環境變數；預設啟用（由下至上）
 */
const USE_BOTTOM_UP =
	(typeof import.meta !== "undefined" && (import.meta as any).env?.PUBLIC_AGENT_BOTTOM_UP !== "false") ||
	(typeof process !== "undefined" && process.env?.NEXT_PUBLIC_AGENT_BOTTOM_UP !== "false");

/**
 * 動畫容器 variants（不使用 height，僅 transform/opacity；enter/exit 使用一致過渡）
 * 觸發條件：open 為 true 時 AnimatePresence mount，父容器 initial->animate；open=false 時 exit。
 * 一致性：enter/exit 採相同 ease 與時長，避免收起生硬感。
 */
const EASE = "linear"; // 與 context7 範例一致
const DUR_IN = 0.2;
const DUR_OUT = 0.2;

/**
 * 以函式生成 variants，避免在模組層呼叫 Hook 造成 SSR/Island hydration 問題
 */
const createPanelVariants = (reduced: boolean): Variants =>
	reduced
		? {
				hidden: { opacity: 0 },
				visible: { opacity: 1, transition: { duration: DUR_IN, ease: EASE } },
				exit: { opacity: 0, transition: { duration: DUR_OUT, ease: EASE } },
			}
		: {
				hidden: { opacity: 0, y: 8 },
				visible: { opacity: 1, y: 0, transition: { duration: DUR_IN, ease: EASE } },
				exit: { opacity: 0, y: 8, transition: { duration: DUR_OUT, ease: EASE } },
			};

const STAGGER_STEP = 0.08;
const STAGGER_BASE = 0.02;

/**
 * 子項目的進/出場動畫（enter/exit 對稱）
 * - 僅使用 transform/opacity，避免 reflow
 * - visible 接受 custom（倒序延遲），確保「最底層先出現，依序向上」
 */
const createItemVariants = (reduced: boolean): Variants =>
	reduced
		? {
				hidden: { opacity: 0 },
				visible: (custom: number) => ({
					opacity: 1,
					transition: { duration: DUR_IN, ease: EASE, delay: STAGGER_BASE + custom * STAGGER_STEP },
				}),
				exit: { opacity: 0, transition: { duration: DUR_OUT, ease: EASE } },
			}
		: {
				hidden: { opacity: 0, y: 6, scale: 0.98 },
				visible: (custom: number) => ({
					opacity: 1,
					y: 0,
					scale: 1,
					transition: { duration: DUR_IN, ease: EASE, delay: STAGGER_BASE + custom * STAGGER_STEP },
				}),
				exit: { opacity: 0, y: 6, scale: 0.98, transition: { duration: DUR_OUT, ease: EASE } },
			};

export default function Agent({ lang = "zh-TW" }: AgentProps = {}) {
	// useReducedMotion 可能回傳 boolean | null，在 Astro Island 初期需確保為 boolean
	const prefersReduced = Boolean(useReducedMotion());
	const panelVariants = createPanelVariants(prefersReduced);
	const itemVariants = createItemVariants(prefersReduced);

	const [open, setOpen] = useState(false);
	const [phoneCallOpen, setPhoneCallOpen] = useState(false);
	const [aiAssistantOpen, setAiAssistantOpen] = useState(false);
	const [voiceReaderOpen, setVoiceReaderOpen] = useState(false);
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

	// 處理按鈕點擊事件
	const handlePhoneCall = () => {
		setPhoneCallOpen(true);
		setOpen(false); // 關閉手機選單
	};

	const handleAIAssistant = () => {
		// 關閉語音朗讀窗口，只允許一個小窗口同時開啟
		setVoiceReaderOpen(false);
		setAiAssistantOpen(true);
		setOpen(false); // 關閉手機選單
	};

	const handleVoiceReader = () => {
		// 關閉 AI 助手窗口，只允許一個小窗口同時開啟
		setAiAssistantOpen(false);
		setVoiceReaderOpen(true);
		setOpen(false); // 關閉手機選單
	};

	// 檢查是否顯示語音朗讀按鈕
	const [showVoiceReader, setShowVoiceReader] = useState(true);
	useEffect(() => {
		const checkShowVoiceReader = () => {
			const filename = window.location.pathname;
			const cleanFilename = filename.replace(/^\/+|\/+$/g, "");
			const pathParts = cleanFilename.split("/");

			if (pathParts.length === 1) {
				// 首頁
				setShowVoiceReader(false);
				return;
			}
			if (pathParts.length === 2) {
				const [lang, page] = pathParts;
				if (page === "news") {
					// 新聞列表
					setShowVoiceReader(false);
					return;
				}
				if (page === "activities") {
					// 活動列表
					setShowVoiceReader(false);
					return;
				}
			}
			setShowVoiceReader(true);
		};

		checkShowVoiceReader();
		// 監聽路由變化（如果有的話，Astro 主要是 MPA，但也可能有 View Transitions）
		window.addEventListener("popstate", checkShowVoiceReader);
		return () => window.removeEventListener("popstate", checkShowVoiceReader);
	}, []);

	// 檢查是否有任何窗口打開
	const hasWindowOpen = phoneCallOpen || aiAssistantOpen || voiceReaderOpen;

	return (
		<motion.div style={{ bottom: y }} className="fixed right-4 bottom-4 z-20 m-auto flex w-max flex-col items-end justify-end gap-2">
			{/* 三顆功能按鈕：桌面永遠顯示；手機在 open=true 時以動畫顯示（並顯示標籤） */}
			{!hasWindowOpen && (
				<div className="hidden flex-col items-end justify-end gap-2 md:flex">
					<AgentButton icon={<Phone className="size-6 md:size-5" />} label={ui[lang]["agent.callAI"]} showLabel={open} onClick={handlePhoneCall} />
					{showVoiceReader && (
						<AgentButton icon={<BookAudio className="size-6 md:size-5" />} label={ui[lang]["agent.voiceReader"]} showLabel={open} onClick={handleVoiceReader} />
					)}
					<AgentButton
						icon={<BotMessageSquare className="size-6 md:size-5" />}
						label={ui[lang]["agent.chatWithAI"]}
						showLabel={open}
						onClick={handleAIAssistant}
					/>
				</div>
			)}

			{/* 手機展開時：以 custom delay 實現由下至上（最底層先出現），不改 DOM 順序以維持 A11y 焦點序 */}
			<AnimatePresence initial={false} mode="sync">
				{open && !hasWindowOpen && (
					<motion.div
						key="agent-panel-mobile"
						className="flex flex-col items-end justify-end gap-2 md:hidden"
						variants={panelVariants}
						initial="hidden"
						animate="visible"
						exit="exit"
						role="group"
						aria-label={ui[lang]["agent.quickActions"]}
						onAnimationStart={() => {
							// 標記效能，避免 layout thrash 僅使用 transform/opacity
							performance.mark?.("agent:panel:anim:start");
						}}
						onAnimationComplete={() => {
							performance.mark?.("agent:panel:anim:end");
							try {
								performance.measure?.("agent:panel:anim:total", "agent:panel:anim:start", "agent:panel:anim:end");
							} catch {}
						}}
						style={{ willChange: "transform, opacity" }}
					>
						{/*
						  視覺順序：上(0)、中(1)、下(2)
						  倒序進場（由下至上）：custom 應為 [2,1,0]（上延遲最大，下延遲最小）
						  排序來源：視圖層（custom 計算），非資料層
						  Feature flag：USE_BOTTOM_UP=false 時，改為 [0,1,2]（回退為由上至下）
						*/}
						<motion.div
							variants={itemVariants}
							custom={USE_BOTTOM_UP ? 2 : 0}
							initial="hidden"
							animate="visible"
							exit="exit"
							style={{ willChange: "transform, opacity" }}
						>
							<AgentButton icon={<Phone className="size-6" />} label={ui[lang]["agent.callAI"]} showLabel onClick={handlePhoneCall} />
						</motion.div>
						{showVoiceReader && (
							<motion.div
								variants={itemVariants}
								custom={USE_BOTTOM_UP ? 1 : 1}
								initial="hidden"
								animate="visible"
								exit="exit"
								style={{ willChange: "transform, opacity" }}
							>
								<AgentButton icon={<BookAudio className="size-6" />} label={ui[lang]["agent.voiceReader"]} showLabel onClick={handleVoiceReader} />
							</motion.div>
						)}
						<motion.div
							variants={itemVariants}
							custom={USE_BOTTOM_UP ? 0 : 2}
							initial="hidden"
							animate="visible"
							exit="exit"
							style={{ willChange: "transform, opacity" }}
						>
							<AgentButton icon={<BotMessageSquare className="size-6" />} label={ui[lang]["agent.chatWithAI"]} showLabel onClick={handleAIAssistant} />
						</motion.div>
					</motion.div>
				)}
			</AnimatePresence>

			{/* Mobile toggle button: 手機顯示，點擊後展開三顆按鈕與標籤 */}
			{!hasWindowOpen && (
				<motion.button
					type="button"
					onClick={() => setOpen((v) => !v)}
					className="flex cursor-pointer items-center gap-1.5 rounded-full border-2 border-gray-200 bg-white p-3 text-gray-600 shadow-2xl shadow-black/5 backdrop-blur-xl hover:bg-gray-100 md:hidden dark:border-white/20 dark:bg-black/80 dark:text-gray-300 dark:hover:bg-slate-950"
					aria-expanded={open}
					aria-label={open ? ui[lang]["agent.closeQuickActions"] : ui[lang]["agent.openQuickActions"]}
					whileTap={{ scale: 0.95 }}
					whileHover={{ scale: 1.05 }}
					transition={{ type: "spring", stiffness: 400, damping: 30 }}
				>
					{open ? <ChevronDown className="size-6" /> : <Sparkles className="size-6" />}
				</motion.button>
			)}

			{/* 全螢幕撥打電話介面 */}
			<PhoneCallInterface isOpen={phoneCallOpen} onClose={() => setPhoneCallOpen(false)} lang={lang} />

			{/* AI 助手小窗口 */}
			<AIAssistantWindow isOpen={aiAssistantOpen} onClose={() => setAiAssistantOpen(false)} lang={lang} />

			{/* 語音朗讀小窗口 */}
			<VoiceReaderWindow isOpen={voiceReaderOpen} onClose={() => setVoiceReaderOpen(false)} lang={lang} />
		</motion.div>
	);
}
