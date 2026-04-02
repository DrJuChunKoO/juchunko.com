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
	tags: string[];
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
	quickLinks: HomepageQuickLink[];
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
				title: "葛如鈞．寶博士",
				summary:
					"葛如鈞是第十一屆立法委員，長期聚焦 AI 治理、資安韌性與通訊基礎建設。先看簡介，再看三個代表性成果，就能很快掌握他在做什麼。",
				primaryCta: {
					label: "閱讀簡介",
					href: `/${lang}/manual/introduction`,
				},
				secondaryCta: {
					label: "看代表成果",
					href: "#achievements",
				},
				tags: ["AI 治理", "資安韌性", "通訊基礎建設"],
			},
			quickLinks: [
				{
					title: "認識葛如鈞",
					description: "先讀簡介，快速建立背景。",
					href: `/${lang}/manual/introduction`,
					icon: "bio",
				},
				{
					title: "代表成果",
					description: "先看三件最值得了解的成果。",
					href: "#achievements",
					icon: "results",
				},
				{
					title: "重點議題",
					description: "直接跳到法案與議題總覽。",
					href: "#issues",
					icon: "issues",
				},
				{
					title: "最新動態",
					description: "新聞、活動與轉載更新。",
					href: "#updates",
					icon: "updates",
				},
				{
					title: "聯繫寶博",
					description: "找到官方聯繫方式。",
					href: `/${lang}/fragment/contact`,
					icon: "contact",
				},
			],
			sectionTitles: {
				achievements: "代表成果",
				issues: "重點議題",
				updates: "最新動態與更新",
				reading: "延伸閱讀",
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
				"Ju-Chun Ko is a Legislative Yuan at-large legislator focused on AI governance, cybersecurity resilience, and communications infrastructure. Start with the bio and three representative achievements to understand his work quickly.",
			primaryCta: {
				label: "Read the bio",
				href: `/${lang}/manual/introduction`,
			},
			secondaryCta: {
				label: "See achievements",
				href: "#achievements",
			},
			tags: ["AI governance", "Cybersecurity", "Network resilience"],
		},
		quickLinks: [
			{
				title: "About Ju-Chun Ko",
				description: "Start with a concise biography and role summary.",
				href: `/${lang}/manual/introduction`,
				icon: "bio",
			},
			{
				title: "Representative results",
				description: "See the three achievements worth reading first.",
				href: "#achievements",
				icon: "results",
			},
			{
				title: "Key issues",
				description: "Jump to the full issue archive.",
				href: "#issues",
				icon: "issues",
			},
			{
				title: "Latest updates",
				description: "News, activity, blog, and transcript updates.",
				href: "#updates",
				icon: "updates",
			},
			{
				title: "Contact",
				description: "Find the official contact path.",
				href: `/${lang}/fragment/contact`,
				icon: "contact",
			},
		],
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
