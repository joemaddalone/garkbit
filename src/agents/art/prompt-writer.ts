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
