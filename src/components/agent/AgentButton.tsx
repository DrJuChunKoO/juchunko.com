import type { ButtonHTMLAttributes, ReactNode } from "react";
import { motion, type HTMLMotionProps, useReducedMotion } from "motion/react";

/**
 * 可存取性與彈性更佳的 AgentButton
 * - 支援原生 button 屬性（type, disabled, aria-* 等）
 * - 以 data-attrs 控制狀態樣式，簡化條件 class
 * - 提供 size 與 variant 可擴充
 * - 桌面 hover 顯示 label，行動裝置可由 showLabel 常駐顯示
 */
type Size = "sm" | "md";
type Variant = "default" | "ghost";

type NativeButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children" | "className">;
type MotionButtonProps = Omit<HTMLMotionProps<"button">, "children" | "className">;
type AgentButtonBaseProps = NativeButtonProps & MotionButtonProps;

type AgentButtonProps = AgentButtonBaseProps & {
	icon: ReactNode;
	label: string;
	showLabel?: boolean; // 手機展開時顯示標籤（桌面仍維持 hover 顯示）
	size?: Size;
	variant?: Variant;
	className?: string;
};

const sizeClasses: Record<Size, string> = {
	sm: "md:p-2 p-3",
	md: "md:p-3 p-4",
};

const variantClasses: Record<Variant, string> = {
	default:
		"border-2 border-border/50 bg-card text-card-foreground hover:bg-accent hover:text-accent-foreground hover:border-accent-foreground/20",
	ghost: "border border-transparent bg-background/60 text-foreground hover:bg-accent/80 hover:text-accent-foreground",
};

export default function AgentButton({
	icon,
	label,
	showLabel = false,
	size = "sm",
	variant = "default",
	className,
	...buttonProps
}: AgentButtonProps) {
	const prefersReduced = Boolean(useReducedMotion());
	const composed =
		`flex cursor-pointer items-center gap-1.5 rounded-full shadow-lg shadow-black/5 backdrop-blur-xl transition-colors focus-visible:ring-2 focus-visible:ring-ring ` +
		`${sizeClasses[size]} ${variantClasses[variant]} ` +
		`max-md:right-0 max-md:left-0 md:right-2 ` +
		(className ? ` ${className}` : "");

	// 共用 label 樣式（桌面與手機）
	const labelBase =
		"pointer-events-none absolute top-1/2 right-full mr-2 -translate-y-1/2 rounded-full text-sm font-medium tracking-tight whitespace-nowrap shadow-lg select-none motion-reduce:transition-none";
	const labelPadding = "px-3 py-1.5";
	const labelTone = "bg-popover text-popover-foreground ring-1 ring-border/50 backdrop-blur-md";

	return (
		<div className="group relative">
			<motion.button
				whileTap={prefersReduced ? undefined : { scale: 0.95 }}
				whileHover={prefersReduced ? undefined : { scale: 1.05 }}
				transition={{ type: "spring", stiffness: 400, damping: 30 }}
				className={composed}
				aria-label={(buttonProps as any)["aria-label"] ?? label}
				{...buttonProps}
			>
				{icon}
			</motion.button>

			{/* 桌面：hover 顯示的 label（不影響手機） */}
			<span
				className={`${labelBase} ${labelPadding} ${labelTone} translate-x-2 opacity-0 transition-[transform,opacity] duration-200 group-focus-within:translate-x-0 group-focus-within:opacity-100 group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:opacity-100 motion-reduce:translate-x-0 max-md:hidden`}
			>
				{label}
			</span>

			{/* 手機：展開時常駐顯示的 label（不影響桌面） */}
			{showLabel && (
				<motion.span
					initial={prefersReduced ? { opacity: 0 } : { opacity: 0, x: 6 }}
					animate={prefersReduced ? { opacity: 1 } : { opacity: 1, x: 0 }}
					transition={prefersReduced ? { duration: 0 } : { type: "spring", stiffness: 500, damping: 40 }}
					className={`${labelBase} ${labelPadding} ${labelTone} md:hidden`}
				>
					{label}
				</motion.span>
			)}
		</div>
	);
}
