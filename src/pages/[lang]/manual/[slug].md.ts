import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import { getRouteLangFromContentId, getSlugFromContentId } from "../../../lib/content";
import { stripMarkdown } from "../../../lib/utils";

export async function getStaticPaths() {
	const manuals = await getCollection("manual");
	return manuals
		.map((manual) => {
			const lang = getRouteLangFromContentId(manual.id);
			const slug = getSlugFromContentId(manual.id);
			if (!lang || !slug) return;
			return {
				params: { lang, slug },
				props: manual,
			};
		})
		.filter(Boolean);
}

export const GET: APIRoute = async ({ props }) => {
	const post = props;
	const cleanBody = stripMarkdown(post.body);
	const content = `# ${post.data.title}\n\n${cleanBody}`;
	return new Response(content, {
		headers: {
			"Content-Type": "text/markdown; charset=utf-8",
			"X-Content-Type-Options": "nosniff",
		},
	});
};
