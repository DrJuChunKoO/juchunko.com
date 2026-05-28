export const OPEN_AI_ASSISTANT_EVENT = "juchunko:open-ai-assistant";

export function openAIAssistant() {
	window.dispatchEvent(new CustomEvent(OPEN_AI_ASSISTANT_EVENT));
}
