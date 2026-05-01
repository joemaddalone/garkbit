import type { LanguageModel } from "ai";
import { zugar, z } from "zugar";

const schema = z.object({
	prompt: z.string().meta({description: "A verbose image generation prompt."}),
});

// const artPrompt = "Generate a verbose image generation prompt for an artwork. Address the art medium, surface type (e.g., aged paper, canvas), artistic style, brushwork or line detail, composition, lighting, color palette, and overall artistic feeling. Return the prompt only for the following";
// const photoPrompt = "Generate a verbose image generation prompt that addresses camera position, composition, lighting, atmospherics, lens type, motion in the scene, color scheme, scene details and overall feeling. Return the prompt only for the following";

/**
 * Generates the initial (cycle-0) image prompt for an art track from a user seed.
 * @param input.model  The language model to use for prompt generation.
 * @param input.initial_prompt  The user's seed/idea string.
 */
export async function forward(
	input: { model: LanguageModel; mode: "art" | "photo"; initial_prompt: string; }) {
	const agent = zugar({
		description: "Generate a verbose image generation prompt for an image.",
		temperature: 0.7,
		maxTokens: 64000,
		schema,
		model: input.model,
		inputKind: "text",
	});

	return agent({ text: input.initial_prompt });
}
