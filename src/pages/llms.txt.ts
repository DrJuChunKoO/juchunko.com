import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import { ui, defaultLang } from "../i18n/ui";

export const GET: APIRoute = async () => {
	const siteUrl = "https://juchunko.com";
	const lang = defaultLang;
	const t = ui[lang];

	const acts = await getCollection("act");
	const manuals = await getCollection("manual");
	const fragments = await getCollection("fragment");

	const filteredActs = acts.filter((post) => post.id.startsWith(lang + "/")).sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
	const filteredManuals = manuals
		.filter((post) => post.id.startsWith(lang + "/"))
		.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
	const filteredFragments = fragments
		.filter((post) => post.id.startsWith(lang + "/"))
		.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());

	const getSlug = (id: string) =>
		id
			.replace(/\.(md|mdx)$/, "")
			.split("/")
			.pop();

	let content = `# ${t["site.title"]}\n\n`;
	content += `> ${t["home.description"]}\n\n`;

	content += `## ${t["cat.acts"]}\n\n`;
	for (const post of filteredActs) {
		const slug = getSlug(post.id);
		content += `- [${post.data.title}](${siteUrl}/${lang}/act/${slug}.md): ${post.data.description || ""}\n`;
	}

	content += `\n## ${t["cat.manuals"]}\n\n`;
	for (const post of filteredManuals) {
		const slug = getSlug(post.id);
		content += `- [${post.data.title}](${siteUrl}/${lang}/manual/${slug}.md): ${post.data.description || ""}\n`;
	}

	content += `\n## 其他資訊\n\n`;
	for (const post of filteredFragments) {
		const slug = getSlug(post.id);
		content += `- [${post.data.title}](${siteUrl}/${lang}/fragment/${slug}.md): ${post.data.description || ""}\n`;
	}

	content += `\n## Optional\n\n`;
	content += `- [Full Context](${siteUrl}/llms-ctx.txt): 包含所有文章內容的完整上下文文件。\n`;

	return new Response(content, {
		headers: {
			"Content-Type": "text/plain; charset=utf-8",
		},
	});
};
