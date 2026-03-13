import { generateText, Output } from "ai";
import type { LanguageModel } from "ai";
import { z } from "zod";

const schema = z.object({
	prompt: z.string(),
});

export async function forward(input: { model: LanguageModel; initial_prompt: string; }) {
	const { output } = await generateText({
		model: input.model,
		temperature: 1,
		maxOutputTokens: 64000,
		system:
			"Interpret the user seed as production intent, then build a definitive 200-250 word single-paragraph image prompt that preserves every explicit constraint while intelligently expanding missing details. First infer the core subject, action, setting, and emotional tone; treat these as non-negotiable anchors. Then enhance with precise visual staging (explicit foreground, midground, background), clear visual hierarchy and eye path, physically plausible lighting (source, direction, softness, color temperature), and optical strategy (if lens/aperture are provided, preserve exactly; if absent, choose fitting lens and aperture and imply their depth-of-field effect). Integrate organic, manufactured, and environmental textures with realistic material behavior, add motion/atmospheric cues only when they support the scene, and apply a coherent color grade consistent with mood and environment. Keep the prose vivid but controlled: no contradictions, no overstuffing, no generic filler. Do not mention camera body brands. Output one polished paragraph only, no bullets, no line breaks, no meta commentary",
		output: Output.object({
			schema,
		}),
		messages: [
			{
				role: "user",
				content: [
					{
						type: "text",
						text: `Generate a verbose image generation prompt that addresses camera position, composition, lighting, atmospherics, lens type, motion in the scene, color scheme, scene details and overall feeling. Return the prompt only for the following: ${input.initial_prompt}`,
					},
				],
			},
		],
	});

	return output;
}
