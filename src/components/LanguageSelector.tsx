import React, { useEffect, useState } from "react";

type SupportedLang = "en" | "zh-TW";

const languages = {
	en: "English",
	"zh-TW": "中文",
};

interface LanguageSelectorProps {
	initialLang?: SupportedLang;
}

export default function LanguageSelector({ initialLang = "zh-TW" }: LanguageSelectorProps) {
	const [selectedLanguage, setSelectedLanguage] = useState<SupportedLang>(initialLang);
	useEffect(() => {
		const pathname = window.location.pathname;
		const langMatch = pathname.match(/^\/(en|zh-TW)/);
		if (langMatch) {
			setSelectedLanguage(langMatch[1] as SupportedLang);
		} else {
			setSelectedLanguage("zh-TW");
		}
	}, [initialLang]);

	const handleLanguageChange = (lang: SupportedLang) => {
		if (lang === selectedLanguage) return;
		const newPath = window.location.pathname.replace(/^(\/en|\/zh-TW)/, `/${lang}`);
		window.history.pushState({}, "", newPath);
		location.reload();
	};

	return (
		<div className="flex items-center gap-2 text-sm">
			{(Object.entries(languages) as [SupportedLang, string][]).map(([lang, label], index) => (
				<span key={lang} className="flex items-center gap-2">
					<button
						type="button"
						onClick={() => handleLanguageChange(lang)}
						className={`focus-visible:outline-primary/50 inline-flex min-h-11 items-center justify-center px-3 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 ${
							selectedLanguage === lang
								? "text-foreground font-semibold"
								: "text-gray-500 hover:text-gray-900 dark:text-white/60 dark:hover:text-white"
						}`}
						aria-current={selectedLanguage === lang ? "true" : undefined}
					>
						{label}
					</button>
					{index === 0 && <span className="text-gray-300 dark:text-white/30">/</span>}
				</span>
			))}
		</div>
	);
}
