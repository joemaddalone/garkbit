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
	input = { model: undefined, image: "", mode: "art" } as {
		model: LanguageModel | undefined;
		image: string;
		mode: "art" | "photo";
		context?: string;
	},
) {
	if (!input.model) {
		throw new Error("Image reader model not provided");
	}

	const schema = input.mode === "photo" ? photoSchema : artSchema;
	const description =
		input.mode === "photo" ? "Analyze this photo." : "Analyze this artwork.";

	const reader = zugar({
		description: description,
		schema,
		model: input.model,
		inputKind: "image",
	});

	return await reader({ image: input.image });
}
