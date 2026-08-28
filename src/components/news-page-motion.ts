export const dialogLayerClassNames = {
	overlay: "fixed inset-0 z-50 flex items-end justify-center bg-black/55 p-0 backdrop-blur-[2px] sm:items-center sm:p-4 sm:pt-14",
	panel:
		"relative grid max-h-[min(92dvh,100%)] w-full max-w-4xl grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden rounded-t-3xl border border-black/8 bg-white shadow-[0_24px_80px_-24px_rgba(0,0,0,0.45)] sm:max-h-[min(85dvh,calc(100dvh-5.5rem))] sm:rounded-3xl dark:border-white/10 dark:bg-[#191919]",
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

export const dialogBackdropVariantsReduced = {
	closed: {
		opacity: 0,
		transition: { duration: 0.1, ease: [0.4, 0, 1, 1] },
	},
	open: {
		opacity: 1,
		transition: { duration: 0.1, ease: [0.22, 1, 0.36, 1] },
	},
} as const;

export const dialogPanelVariantsReduced = {
	closed: {
		opacity: 0,
		transition: { duration: 0.1, ease: [0.4, 0, 1, 1] },
	},
	open: {
		opacity: 1,
		transition: { duration: 0.1, ease: [0.22, 1, 0.36, 1] },
	},
} as const;
