import { zugar, z } from "zugar";
import type { LanguageModel } from "ai";
import type { ArtAnalysis } from "../types";
import artSchema from "./artschema";
import photoSchema from "./photoschema";

const outputSchema = z.object({
	prompt: z.string(),
});
/**
 * Analyzes an image using a vision LLM and returns structured metadata.
 * @param input.model  The vision language model to use.
 * @param input.image  Base64-encoded image data.
 * @param input.context  Optional previous prompt for continuity.
 */
export async function forward(

	input: {
		model: LanguageModel;
		mode: "art" | "photo";
		analysis: ArtAnalysis;
		cycle: number;
	}) {
	if (!input.model) {
		throw new Error("Image reader model not provided");
	}

	const agent = zugar({
		description: "Generate a verbose image generation prompt for an image.",
		temperature: 0.7,
		maxTokens: 64000,
		inputSchema: input.mode === "photo" ? photoSchema : artSchema,
		schema: outputSchema,
		model: input.model,
		inputKind: "schema",
	});

	return await agent({ data: input.analysis });

}
