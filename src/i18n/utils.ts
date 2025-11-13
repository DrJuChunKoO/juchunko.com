import { ui, defaultLang } from "./ui";

export function getLangFromUrl(url: URL) {
	const [, lang] = url.pathname.split("/");
	if (lang in ui) return lang as keyof typeof ui;
	return defaultLang;
}

export function useTranslations(lang: keyof typeof ui) {
	return function t(key: string) {
		// allow runtime keys (not all keys are typed in ui) and fall back safely
		const local = ui[lang] as Record<string, string | undefined>;
		const def = ui[defaultLang] as Record<string, string | undefined>;
		return local[key] ?? def[key] ?? key;
	};
}
