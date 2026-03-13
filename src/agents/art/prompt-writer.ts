import { generateText, Output } from "ai";
import { z } from "zod";
import type { LanguageModel } from "ai";
import type { ArtAnalysis } from "../../types";

const schema = z.object({
	prompt: z.string(),
});

export async function forward(input: {
	model: LanguageModel;
	analysis: ArtAnalysis;
	cycle: number;
}) {
	const { analysis } = input;

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
						text: `Generate a verbose image generation prompt for an artwork. Address the art medium, surface type, artistic style, brushwork or line detail, composition, lighting, color palette, and overall artistic feeling. Return the prompt only for the following:
Subject: ${analysis.subject}
Description: ${analysis.description}
Tone: ${analysis.tone}
Medium: ${analysis.medium}
Surface: ${analysis.surface}
Artistic Style: ${analysis.artisticStyle}
Brushwork/Detail: ${analysis.brushworkOrDetail}
Composition: ${analysis.composition}
Lighting: ${analysis.lighting}
Color Palette: ${analysis.colorPalette}
Notable Traits: ${analysis.notableTraits}
Overall Feeling: ${analysis.overallFeeling}
`,
					},
				],
			},
		],
	});

	return output;
}
