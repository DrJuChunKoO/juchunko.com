export type SupportedLang = "en" | "zh-TW";

export type HomepageIconKey = "bio" | "results" | "issues" | "updates" | "contact" | "ai" | "nuclear" | "satellite";

export interface HomepageHeroCopy {
	eyebrow: string;
	title: string;
	summary: string;
	primaryCta: {
		label: string;
		href: string;
	};
	secondaryCta: {
		label: string;
		href: string;
	};
}

export interface HomepageQuickLink {
	title: string;
	description: string;
	href: string;
	icon: HomepageIconKey;
}

export interface HomepageAchievementMeta {
	icon: HomepageIconKey;
	label: string;
}

export interface HomepageCopy {
	hero: HomepageHeroCopy;
	sectionTitles: {
		achievements: string;
		issues: string;
		updates: string;
		reading: string;
		manuals: string;
		fragments: string;
	};
}

export const featuredHomepageActSlugs = [
	"ai-basic-act",
	"nuclear-reactor-facility-control-act",
	"multi-satellite-regulatory-adaptation",
] as const;

const featuredAchievementMeta: Record<SupportedLang, Record<string, HomepageAchievementMeta>> = {
	"zh-TW": {
		"ai-basic-act": { icon: "ai", label: "AI 治理" },
		"nuclear-reactor-facility-control-act": { icon: "nuclear", label: "能源韌性" },
		"multi-satellite-regulatory-adaptation": { icon: "satellite", label: "通訊韌性" },
	},
	en: {
		"ai-basic-act": { icon: "ai", label: "AI governance" },
		"nuclear-reactor-facility-control-act": { icon: "nuclear", label: "Energy resilience" },
		"multi-satellite-regulatory-adaptation": { icon: "satellite", label: "Network resilience" },
	},
};

function getContentSlug(id: string) {
	return id.replace(/^.+?\//, "").replace(/\.(md|mdx)$/, "");
}

export function selectFeaturedEntries<T extends { id: string }>(entries: readonly T[], order = featuredHomepageActSlugs) {
	const entriesBySlug = new Map(entries.map((entry) => [getContentSlug(entry.id), entry] as const));
	return order.map((slug) => entriesBySlug.get(slug)).filter((entry): entry is T => Boolean(entry));
}

export function getFeaturedAchievementMeta(slug: string, lang: SupportedLang): HomepageAchievementMeta {
	return (
		featuredAchievementMeta[lang][slug] ?? {
			icon: "results",
			label: slug,
		}
	);
}

export function getHomepageCopy(lang: SupportedLang): HomepageCopy {
	if (lang === "zh-TW") {
		return {
			hero: {
				eyebrow: "立法委員 / 科技政策 / AI・資安・通訊韌性",
				title: "科技立委葛如鈞．寶博士",
				summary: "葛如鈞是中華民國第十一屆全國不分區立法委員，長期聚焦 AI 治理、資安韌性與通訊基礎建設。",
				primaryCta: {
					label: "閱讀簡介",
					href: `/${lang}/manual/introduction`,
				},
				secondaryCta: {
					label: "聯繫葛如鈞",
					href: `/${lang}/fragment/contact`,
				},
			},
			sectionTitles: {
				achievements: "代表成果",
				issues: "重點議題",
				updates: "最新動態與更新",
				reading: "進一步閱讀",
				manuals: "寶博士使用說明",
				fragments: "補充資料",
			},
		};
	}

	return {
		hero: {
			eyebrow: "Legislator / Tech policy / AI, cybersecurity, and network resilience",
			title: "Ju Chun Ko",
			summary:
				"Ju-Chun Ko is a member of the 11th Legislative Yuan at-large seat in the Republic of China (Taiwan), focused on AI governance, cybersecurity resilience, and communications infrastructure.",
			primaryCta: {
				label: "Read the bio",
				href: `/${lang}/manual/introduction`,
			},
			secondaryCta: {
				label: "Contact",
				href: `/${lang}/fragment/contact`,
			},
		},
		sectionTitles: {
			achievements: "Representative achievements",
			issues: "Key issues",
			updates: "Latest updates",
			reading: "Extended reading",
			manuals: "Manuals",
			fragments: "Supplemental reading",
		},
	};
}
