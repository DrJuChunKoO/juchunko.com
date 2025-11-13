import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { getLangFromUrl } from "../i18n/utils";
import { useTranslations } from "../i18n/utils";
import { useSessionStorage } from "usehooks-ts";
import { X, ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";

interface LanguagePromptProps {
	currentUrl: string;
}

export default function LanguagePrompt({ currentUrl }: LanguagePromptProps) {
	const [browserLang, setBrowserLang] = useState<"en" | "zh-TW" | null>(null);
	const [showPrompt, setShowPrompt] = useState(false);
	const currentLang = getLangFromUrl(new URL(currentUrl));
	const shouldReduceMotion = useReducedMotion() ?? false;

	// Persist user's prompt decision for the current UI language in sessionStorage.
	// Values: 'dismissed' | 'switched' | null
	const storageKey = `languagePrompt.${currentLang}`;
	const [promptChoice, setPromptChoice] = useSessionStorage<"dismissed" | "switched" | null>(storageKey, null);

	useEffect(() => {
		const detected = navigator.language.startsWith("zh") ? "zh-TW" : "en";
		setBrowserLang(detected);

		// Only show prompt if browser language differs AND user hasn't already
		// dismissed/switched in this session for this UI language.
		if (detected !== currentLang && promptChoice == null) {
			setShowPrompt(true);
		}
	}, [currentLang, promptChoice]);

	const handleSwitch = () => {
		// record that the user switched so we don't prompt again this session
		setPromptChoice("switched");
		const newPath = currentUrl.replace(`/${currentLang}/`, `/${browserLang}/`);
		window.location.href = newPath;
	};

	const variants = {
		hidden: { opacity: 0, y: 20 },
		visible: { opacity: 1, y: 0 },
	};

	if (!browserLang) return null;

	// Use translation entries for language names so labels are localized from `src/i18n/ui.ts`.
	// Show the language name in the "other" locale: when UI is English, show Chinese labels;
	// when UI is Chinese, show English labels.
	const oppositeLang = currentLang === "en" ? ("zh-TW" as const) : ("en" as const);
	const tOpposite = useTranslations(oppositeLang);

	const message = tOpposite("languagePrompt.message");
	const title = tOpposite("languagePrompt.title");

	const switchLabel = tOpposite("languagePrompt.go");
	const dismissLabel = tOpposite("languagePrompt.dismiss");

	return (
		<AnimatePresence>
			{showPrompt && (
				<motion.div
					initial="hidden"
					animate="visible"
					exit="hidden"
					variants={shouldReduceMotion ? {} : variants}
					transition={{ duration: 0.3 }}
					className="text-primary fixed bottom-4 left-4 z-50 m-auto w-max divide-y overflow-hidden rounded-xl border shadow-lg backdrop-blur-lg max-sm:right-4"
				>
					<div className="bg-background/80 flex shrink-0 flex-col items-start gap-1 p-2 px-4 pr-10">
						<div className="font-medium">{title}</div>
						<p className="text-muted-foreground">{message}</p>
					</div>
					<div className="bg-primary-foreground/80 flex w-full justify-between gap-2 p-2">
						<Button
							variant="outline"
							onClick={() => {
								// remember dismissal in session storage and hide the prompt
								setPromptChoice("dismissed");
								setShowPrompt(false);
							}}
							size="sm"
							className="cursor-pointer"
						>
							<X />
							{dismissLabel}
						</Button>
						<Button className="group cursor-pointer" onClick={handleSwitch} size="sm">
							{switchLabel}
							<ArrowRight className="transition-transform group-hover:translate-x-0.5" />
						</Button>
					</div>
				</motion.div>
			)}
		</AnimatePresence>
	);
}
