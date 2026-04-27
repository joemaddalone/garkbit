import { zugar, z } from "zugar";
import type { LanguageModel } from "ai";
import type { PhotoAnalysis } from "../../types";
import schema from "./photoschema";

const outputSchema = z.object({
	prompt: z.string(),
});
/**
 * Generates the image prompt for a photo track from a previous photo's analysis.
 * @param input.model  The vision language model to use.
 * @param input.image  Base64-encoded image data.
 * @param input.context  Optional previous prompt for continuity.
 */
export async function forward(input: {
	model: LanguageModel;
	analysis: PhotoAnalysis;
	cycle: number;
}) {
	if (!input.model) {
		throw new Error("Image reader model not provided");
	}

	const agent = zugar({
		description: "Generate a verbose image generation prompt for a photo.",
		temperature: 0.7,
		maxTokens: 64000,
		inputSchema: schema,
		schema: outputSchema,
		model: input.model,
		inputKind: "schema",
	});

	return await agent({ data: input.analysis });
}
