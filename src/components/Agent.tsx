import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useMotionValue } from "framer-motion";
import LucideBotMessageSquare from "~icons/lucide/bot-message-square";
import LucidePhone from "~icons/lucide/phone";
import LucideBookAudio from "~icons/lucide/book-audio";
import LucideSparkles from "~icons/lucide/sparkles";
import LucideChevronDown from "~icons/lucide/chevron-down";
import AgentButton from "./AgentButton";

const panelVariants = {
	hidden: { opacity: 0, y: 8 },
	visible: { opacity: 1, y: 0 },
};

export default function Agent() {
	const [open, setOpen] = useState(false);
	// 以 y 控制與底部距離，避免覆蓋 footer
	const y = useMotionValue(0);

	useEffect(() => {
		function handleScroll() {
			const footer = document.getElementById("footer")!;
			const rect = footer.getBoundingClientRect();
			const windowHeight = window.innerHeight;
			const top = rect.y - windowHeight;
			const isBottom = top < 0;

			y.set(isBottom ? -top : 0);
		}
		window.addEventListener("scroll", handleScroll);
		return () => window.removeEventListener("scroll", handleScroll);
	}, []);

	return (
		<motion.div style={{ bottom: y }} className="fixed right-0 bottom-0 z-20 m-auto flex w-full flex-col items-end justify-end gap-2 p-4">
			{/* 三顆功能按鈕：桌面永遠顯示；手機在 open=true 時以動畫顯示（並顯示標籤） */}
			<div className="hidden flex-col items-end justify-end gap-2 md:flex">
				<AgentButton icon={<LucidePhone className="size-6 md:size-5" />} label="打給 AI 寶博" showLabel={open} />
				<AgentButton icon={<LucideBookAudio className="size-6 md:size-5" />} label="語音朗讀" showLabel={open} />
				<AgentButton icon={<LucideBotMessageSquare className="size-6 md:size-5" />} label="和 AI 聊聊" showLabel={open} />
			</div>
			<AnimatePresence initial={false}>
				{open && (
					<motion.div
						key="agent-panel-mobile"
						className="flex flex-col items-end justify-end gap-2 md:hidden"
						variants={panelVariants}
						initial="hidden"
						animate="visible"
						exit="hidden"
						transition={{ type: "spring", stiffness: 300, damping: 26 }}
					>
						<AgentButton icon={<LucidePhone className="size-6" />} label="打給 AI 寶博" showLabel />
						<AgentButton icon={<LucideBookAudio className="size-6" />} label="語音朗讀" showLabel />
						<AgentButton icon={<LucideBotMessageSquare className="size-6" />} label="和 AI 聊聊" showLabel />
					</motion.div>
				)}
			</AnimatePresence>

			{/* Mobile toggle button: 手機顯示，點擊後展開三顆按鈕與標籤 */}
			<motion.button
				type="button"
				onClick={() => setOpen((v) => !v)}
				className="flex cursor-pointer items-center gap-1.5 rounded-full border-2 border-gray-200 bg-white p-3 text-gray-600 shadow-2xl shadow-black/5 backdrop-blur-xl hover:bg-gray-100 md:hidden dark:border-white/20 dark:bg-black/80 dark:text-gray-300 dark:hover:bg-slate-950"
				aria-expanded={open}
				aria-label={open ? "收合快捷操作" : "開啟快捷操作"}
				whileTap={{ scale: 0.95 }}
				whileHover={{ scale: 1.05 }}
				transition={{ type: "spring", stiffness: 400, damping: 30 }}
			>
				{open ? <LucideChevronDown className="size-6" /> : <LucideSparkles className="size-6" />}
			</motion.button>
		</motion.div>
	);
}
