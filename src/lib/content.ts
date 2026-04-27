import type { Lang } from "src/i18n/ui";

const routeLangByContentLang: Record<string, Lang> = {
	en: "en",
	"zh-tw": "zh-TW",
	"zh-TW": "zh-TW",
};

export function getRouteLangFromContentId(id: string): Lang | undefined {
	const [contentLang] = id.split("/");
	return contentLang ? routeLangByContentLang[contentLang] : undefined;
}

export function contentIdMatchesLang(id: string, lang: Lang) {
	return getRouteLangFromContentId(id) === lang;
}

export function getSlugFromContentId(id: string) {
	const idWithoutExtension = id.replace(/\.(md|mdx)$/, "");
	return idWithoutExtension.split("/").at(-1);
}
