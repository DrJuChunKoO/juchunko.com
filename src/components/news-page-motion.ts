export const dialogLayerClassNames = {
	overlay: "fixed inset-0 z-50 flex items-start justify-center bg-black/55 p-4 pt-14",
	panel:
		"relative max-h-[85vh] w-full max-w-3xl overflow-hidden rounded-2xl border border-black/5 shadow-2xl shadow-black/15 dark:border-white/10 bg-background",
} as const;

export const dialogBackdropVariants = {
	closed: {
		opacity: 0,
		transition: { duration: 0.15, ease: [0.4, 0, 1, 1] },
	},
	open: {
		opacity: 1,
		transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] },
	},
} as const;

export const dialogPanelVariants = {
	closed: {
		opacity: 0,
		scale: 0.95,
		transition: { duration: 0.15, ease: [0.4, 0, 1, 1] },
	},
	open: {
		opacity: 1,
		scale: 1,
		transition: {
			type: "spring",
			stiffness: 380,
			damping: 30,
			mass: 0.8,
		},
	},
} as const;
