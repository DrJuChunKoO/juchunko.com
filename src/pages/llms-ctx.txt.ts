import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import { ui, defaultLang } from "../i18n/ui";

export const GET: APIRoute = async () => {
	const lang = defaultLang;
	const t = ui[lang];

	const acts = await getCollection("act");
	const manuals = await getCollection("manual");
	const fragments = await getCollection("fragment");

	const filteredActs = acts
		.filter((post) => post.id.startsWith(lang + "/"))
		.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
	const filteredManuals = manuals
		.filter((post) => post.id.startsWith(lang + "/"))
		.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
	const filteredFragments = fragments
		.filter((post) => post.id.startsWith(lang + "/"))
		.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());

	let content = "# " + t["site.title"] + " - Full Context\n\n";
	content += "> " + t["home.description"] + "\n\n";

	const allPosts = [
		{ title: t["cat.acts"], posts: filteredActs },
		{ title: t["cat.manuals"], posts: filteredManuals },
		{ title: "其他資訊", posts: filteredFragments },
	];

	for (const section of allPosts) {
		content += "## " + section.title + "\n\n";
		for (const post of section.posts) {
			content += "### " + post.data.title + "\n\n";
			content += post.body + "\n\n";
			content += "---\n\n";
		}
	}

	return new Response(content, {
		headers: {
			"Content-Type": "text/plain; charset=utf-8",
		},
	});
};
