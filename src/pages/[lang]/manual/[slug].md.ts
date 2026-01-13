import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import { stripMarkdown } from "../../../lib/utils";

export async function getStaticPaths() {
	const manuals = await getCollection("manual");
	return manuals.map((manual) => {
		const slugWithLang = manual.id.replace(/\.(md|mdx)$/, "");
		const [lang, ...slugParts] = slugWithLang.split("/");
		const slug = slugParts.at(-1);
		return {
			params: { lang, slug },
			props: manual,
		};
	});
}

export const GET: APIRoute = async ({ props }) => {
	const post = props;
	const cleanBody = stripMarkdown(post.body);
	const content = `# ${post.data.title}\n\n${cleanBody}`;
	return new Response(content, {
		headers: { 
			"Content-Type": "text/plain; charset=utf-8",
			"X-Content-Type-Options": "nosniff"
		},
	});
};
