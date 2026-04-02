export function applyDialogScrollLock(documentLike: Document) {
	const previousHtmlOverflow = documentLike.documentElement.style.overflow;
	const previousHtmlOverscrollBehavior = documentLike.documentElement.style.overscrollBehavior;
	const previousBodyOverflow = documentLike.body.style.overflow;
	const previousBodyTouchAction = documentLike.body.style.touchAction;

	documentLike.documentElement.style.overflow = "hidden";
	documentLike.documentElement.style.overscrollBehavior = "none";
	documentLike.body.style.overflow = "hidden";
	documentLike.body.style.touchAction = "none";

	return () => {
		documentLike.documentElement.style.overflow = previousHtmlOverflow;
		documentLike.documentElement.style.overscrollBehavior = previousHtmlOverscrollBehavior;
		documentLike.body.style.overflow = previousBodyOverflow;
		documentLike.body.style.touchAction = previousBodyTouchAction;
	};
}
