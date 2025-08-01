import type { ReactNode } from "react";
import { motion } from "framer-motion";

type AgentButtonProps = {
	icon: ReactNode;
	label: string;
	onClick?: () => void;
	className?: string;
	showLabel?: boolean; // 手機展開時顯示標籤（桌面仍維持 hover 顯示）
};

export default function AgentButton({ icon, label, onClick, className, showLabel = false }: AgentButtonProps) {
	return (
		<div className="group relative">
			<motion.button
				type="button"
				onClick={onClick}
				whileTap={{ scale: 0.95 }}
				whileHover={{ scale: 1.05 }}
				transition={{ type: "spring", stiffness: 400, damping: 30 }}
				className={`flex cursor-pointer items-center gap-1.5 rounded-full border-2 border-gray-200 bg-white p-3 text-gray-600 shadow-2xl shadow-black/5 backdrop-blur-xl hover:bg-gray-100 max-md:right-0 max-md:left-0 md:right-2 md:p-2 dark:border-white/20 dark:bg-black/80 dark:text-gray-300 dark:hover:bg-slate-950 ${className ?? ""}`}
			>
				{icon}
			</motion.button>

			{/* 桌面：hover 顯示的 label（不影響手機） */}
			<span className="pointer-events-none absolute top-1/2 right-full mr-2 -translate-y-1/2 rounded-full border border-gray-200 bg-white/95 px-2 py-1 text-xs whitespace-nowrap text-gray-700 opacity-0 shadow-lg ring-1 ring-black/5 transition-opacity duration-150 select-none group-hover:opacity-100 max-md:hidden dark:border-white/10 dark:bg-black/80 dark:text-gray-200">
				{label}
			</span>

			{/* 手機：展開時常駐顯示的 label（不影響桌面） */}
			{showLabel && (
				<motion.span
					initial={{ opacity: 0, x: 6 }}
					animate={{ opacity: 1, x: 0 }}
					transition={{ type: "spring", stiffness: 500, damping: 40 }}
					className="pointer-events-none absolute top-1/2 right-full mr-2 -translate-y-1/2 rounded-full border border-gray-200 bg-white/95 px-2 py-1 text-xs whitespace-nowrap text-gray-700 shadow-lg ring-1 ring-black/5 select-none md:hidden dark:border-white/10 dark:bg-black/80 dark:text-gray-200"
				>
					{label}
				</motion.span>
			)}
		</div>
	);
}
