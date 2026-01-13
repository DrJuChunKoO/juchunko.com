import type { APIRoute } from "astro";
import { getCollection } from "astro:content";

export async function getStaticPaths() {
	const fragments = await getCollection("fragment");
	return fragments.map((fragment) => {
		const slugWithLang = fragment.id.replace(/\.(md|mdx)$/, "");
		const [lang, ...slugParts] = slugWithLang.split("/");
		const slug = slugParts.at(-1);
		return {
			params: { lang, slug },
			props: fragment,
		};
	});
}

export const GET: APIRoute = async ({ props }) => {
	const post = props;
	const content = `# ${post.data.title}\n\n${post.body}`;
	return new Response(content, {
		headers: { "Content-Type": "text/plain; charset=utf-8" },
	});
};
