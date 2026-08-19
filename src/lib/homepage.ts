export type SupportedLang = "en" | "zh-TW";

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

export interface HomepageCopy {
	seo: {
		title: string;
	};
	hero: HomepageHeroCopy;
	sectionTitles: {
		achievements: string;
		issues: string;
		mediaAttention: string;
		updates: string;
		reading: string;
		manuals: string;
		fragments: string;
	};
}

export const featuredHomepageActSlugs = [
	"virtual-asset-service-act",
	"ai-basic-act",
	"nuclear-reactor-facility-control-act",
	"multi-satellite-regulatory-adaptation",
] as const;

const featuredAchievementSummaries: Record<SupportedLang, Record<string, string>> = {
	"zh-TW": {
		"virtual-asset-service-act": "讓虛擬資產從洗錢防制登記走向專法監理，兼顧投資人保護、產業創新、穩定幣與跨境監理。",
		"ai-basic-act": "為台灣建立 AI 發展與風險治理的共同規則，讓創新、監管與公共利益能在同一套法律框架下推進。",
		"nuclear-reactor-facility-control-act": "讓穩定低碳電力延役重新回到法治與安全審查軌道，避免能源選項在制度上被提前鎖死。",
		"multi-satellite-regulatory-adaptation": "把通訊韌性從單一海纜提升為多軌備援架構，降低重大災害或衝突時台灣整體斷網的風險。",
	},
	en: {
		"virtual-asset-service-act":
			"It moves virtual asset regulation from AML registration to a dedicated act, balancing investor protection, innovation, stablecoins, and cross-border supervision.",
		"ai-basic-act":
			"It sets a shared legal baseline for AI development and risk governance, so innovation, accountability, and public trust can move forward together.",
		"nuclear-reactor-facility-control-act":
			"It reopens a legal path for extending stable low-carbon power, turning an energy dead end into a decision that can be reviewed on safety and evidence.",
		"multi-satellite-regulatory-adaptation":
			"It upgrades communications resilience from a single-cable dependency to a layered backup network, reducing the risk of Taiwan going dark during disruption.",
	},
};

function getContentSlug(id: string) {
	return id.replace(/^.+?\//, "").replace(/\.(md|mdx)$/, "");
}

export function selectFeaturedEntries<T extends { id: string }>(entries: readonly T[], order = featuredHomepageActSlugs) {
	const entriesBySlug = new Map(entries.map((entry) => [getContentSlug(entry.id), entry] as const));
	return order.map((slug) => entriesBySlug.get(slug)).filter((entry): entry is T => Boolean(entry));
}

export function getFeaturedAchievementSummary(id: string, lang: SupportedLang) {
	return featuredAchievementSummaries[lang][getContentSlug(id)];
}

export function isRecentlyUpdated(updatedDate: Date | undefined, now = new Date(), days = 30) {
	if (!updatedDate) return false;
	const age = now.valueOf() - updatedDate.valueOf();
	return age >= 0 && age <= days * 24 * 60 * 60 * 1000;
}

export function getHomepageCopy(lang: SupportedLang): HomepageCopy {
	if (lang === "zh-TW") {
		return {
			seo: {
				title: "科技立委葛如鈞．寶博士｜官方網站",
			},
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
				mediaAttention: "近期媒體關注",
				updates: "最新動態與更新",
				reading: "進一步閱讀",
				manuals: "寶博士使用說明",
				fragments: "補充資料",
			},
		};
	}

	return {
		seo: {
			title: "Ju Chun Ko | Taiwan Technology Legislator — Official Website",
		},
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
			mediaAttention: "Recent media attention",
			updates: "Latest updates",
			reading: "Extended reading",
			manuals: "Manuals",
			fragments: "Supplemental reading",
		},
	};
}
