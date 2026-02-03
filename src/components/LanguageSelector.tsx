import { useEffect, useState } from "react";

const languages = {
	en: "English",
	"zh-TW": "中文",
};

export default function LanguageSelector() {
	const [selectedLanguage, setSelectedLanguage] = useState("zh-TW");
	useEffect(() => {
		const pathname = window.location.pathname;
		const langMatch = pathname.match(/^\/(en|zh-TW)/);
		if (langMatch) {
			setSelectedLanguage(langMatch[1]);
		} else {
			setSelectedLanguage("zh-TW");
		}
	}, []);

	const handleLanguageChange = (lang: string) => {
		if (lang === selectedLanguage) return;
		const newPath = window.location.pathname.replace(/^(\/en|\/zh-TW)/, `/${lang}`);
		window.history.pushState({}, "", newPath);
		location.reload();
	};

	return (
		<div className="flex items-center gap-2 text-sm">
			{Object.entries(languages).map(([lang, label], index) => (
				<span key={lang} className="flex items-center gap-2">
					<button
						type="button"
						onClick={() => handleLanguageChange(lang)}
						className={`transition-colors ${
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
