export const OPEN_AI_ASSISTANT_EVENT = "juchunko:open-ai-assistant";

export interface OpenAIAssistantEventDetail {
	opener: HTMLElement | null;
}

export function openAIAssistant(opener?: HTMLElement) {
	const focusedElement =
		document.activeElement instanceof HTMLElement && document.activeElement !== document.body ? document.activeElement : null;
	window.dispatchEvent(
		new CustomEvent<OpenAIAssistantEventDetail>(OPEN_AI_ASSISTANT_EVENT, { detail: { opener: opener ?? focusedElement } }),
	);
}
