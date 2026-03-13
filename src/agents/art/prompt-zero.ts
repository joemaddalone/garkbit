import { generateText, Output } from "ai";
import type { LanguageModel } from "ai";
import { z } from "zod";
import { PROMPT_ENGINEER_SYSTEM } from "../prompts";

const schema = z.object({
	prompt: z.string(),
});

/**
 * Generates the initial (cycle-0) image prompt for an art track from a user seed.
 * @param input.model  The language model to use for prompt generation.
 * @param input.initial_prompt  The user's seed/idea string.
 */
export async function forward(input: { model: LanguageModel; initial_prompt: string; }) {
	const { output } = await generateText({
		model: input.model,
		temperature: 1,
		maxOutputTokens: 64000,
		system: PROMPT_ENGINEER_SYSTEM,
		output: Output.object({
			schema,
		}),
		messages: [
			{
				role: "user",
				content: [
					{
						type: "text",
						text: `Generate a verbose image generation prompt for an artwork. Address the art medium, surface type (e.g., aged paper, canvas), artistic style, brushwork or line detail, composition, lighting, color palette, and overall artistic feeling. Return the prompt only for the following: ${input.initial_prompt}`,
					},
				],
			},
		],
	});

	return output;
}
