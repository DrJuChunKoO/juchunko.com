export function getPageTitles({ title, postTitle, siteTitle }: { title?: string; postTitle?: string; siteTitle: string }) {
	const contentTitle = title || postTitle;

	return {
		documentTitle: title || (postTitle ? `${postTitle} | ${siteTitle}` : siteTitle),
		socialTitle: contentTitle || siteTitle,
	};
}
