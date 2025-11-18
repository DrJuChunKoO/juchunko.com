import { useEffect, useState } from "react";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";

import { Languages } from "lucide-react";

const languages = {
	en: "English",
	"zh-TW": "中文",
};
export default function LanguageSelector() {
	const [selectedLanguage, setSelectedLanguage] = useState("zh-TW");
	useEffect(() => {
		// selected language = url pathname
		const pathname = window.location.pathname;
		const langMatch = pathname.match(/^\/(en|zh-TW)/);
		if (langMatch) {
			setSelectedLanguage(langMatch[1]);
		} else {
			setSelectedLanguage("zh-TW"); // default language
		}
	}, []);
	// auto switch language after selecting a language
	const handleLanguageChange = (lang: string) => {
		const newPath = window.location.pathname.replace(/^(\/en|\/zh-TW)/, `/${lang}`);
		window.history.pushState({}, "", newPath);
		location.reload(); // reload to apply the new language
	};

	return (
		<div className="flex items-center gap-2">
			<Languages className="text-muted-foreground" />
			<NativeSelect
				className="w-40"
				value={selectedLanguage}
				onChange={(e) => handleLanguageChange(e.target.value)}
				aria-label="Select Language"
			>
				{Object.entries(languages).map(([lang, label]) => (
					<NativeSelectOption key={lang} value={lang}>
						{label}
					</NativeSelectOption>
				))}
			</NativeSelect>
		</div>
	);
}
