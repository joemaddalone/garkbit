import type { LanguageModel } from "ai";
import { zugar, z } from "zugar";

const schema = z.object({
	prompt: z
		.string()
		.meta({ description: "A verbose image generation prompt for a photo." }),
});

/**
 * Generates the initial (cycle-0) image prompt for a photo track from a user seed.
 * @param input.model  The language model to use for prompt generation.
 * @param input.initial_prompt  The user's seed/idea string.
 */
export async function forward(input: {
	model: LanguageModel;
	initial_prompt: string;
}) {
	const agent = zugar({
		description:
			"Generate a verbose image generation prompt that addresses camera position, composition, lighting, atmospherics, lens type, motion in the scene, color scheme, scene details and overall feeling. Return the prompt only for the following",
		temperature: 0.7,
		maxTokens: 64000,
		schema,
		model: input.model,
		inputKind: "text",
	});

	return agent({ text: input.initial_prompt });
}
