import type { Variants } from "motion/react";

const ENTER_EASE = [0.22, 1, 0.36, 1] as const;
const EXIT_EASE = [0.4, 0, 1, 1] as const;

export function createMobileNavMenuVariants(reduced: boolean): Variants {
	if (reduced) {
		return {
			closed: {
				height: 0,
				opacity: 0,
				transition: { duration: 0 },
			},
			open: {
				height: "auto",
				opacity: 1,
				transition: { duration: 0 },
			},
		};
	}

	return {
		closed: {
			height: 0,
			opacity: 0,
			y: -8,
			scaleY: 0.96,
			transition: { duration: 0.16, ease: EXIT_EASE },
		},
		open: {
			height: "auto",
			opacity: 1,
			y: 0,
			scaleY: 1,
			transition: { duration: 0.22, ease: ENTER_EASE },
		},
	};
}
