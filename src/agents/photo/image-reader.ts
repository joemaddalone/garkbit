import type { LanguageModel } from "ai";
import schema from "./photoschema";
import { zugar } from "zugar";

/**
 * Analyzes a photograph using a vision LLM and returns structured metadata.
 * @param input.model  The vision language model to use.
 * @param input.image  Base64-encoded image data.
 * @param input.context  Optional previous prompt for continuity.
 */
export async function forward(
	input = { model: undefined, image: "" } as { model: LanguageModel | undefined; image: string; context?: string; },
) {
	if (!input.model) {
		throw new Error("Image reader model not provided");
	}

	const reader = zugar({
		description: "Analyze this photo.",
		schema: schema,
		model: input.model,
		inputKind: "image",
	});

	return await reader({ image: input.image });
}
