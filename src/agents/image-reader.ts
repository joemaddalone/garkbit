import type { LanguageModel } from "ai";
import { zugar } from "zugar";
import artSchema from "./artschema";
import photoSchema from "./photoschema";

/**
 * Analyzes an artwork image using a vision LLM and returns structured metadata.
 * @param input.model  The vision language model to use.
 * @param input.image  Base64-encoded image data.
 * @param input.context  Optional previous prompt for continuity.
 */
export async function forward(
	type: "art" | "photo",
	input = { model: undefined, image: "" } as { model: LanguageModel | undefined; image: string; context?: string; },
) {
	if (!input.model) {
		throw new Error("Image reader model not provided");
	}

	const schema = type === "photo" ? photoSchema : artSchema;
	const description = type === "photo" ? "Analyze this photo." : "Analyze this artwork.";


	const reader = zugar({
		description: description,
		schema,
		model: input.model,
		inputKind: "image",
	})

	return await reader({ image: input.image });

}
