import { generateText, Output } from "ai";
import { z } from "zod";
import type { LanguageModel } from "ai";
import type { PhotoAnalysis } from "../../types";

const schema = z.object({
	prompt: z.string(),
});

export async function forward(input: {
	model: LanguageModel;
	analysis: PhotoAnalysis;
	cycle: number;
}) {
	const { analysis } = input;

	const { output } = await generateText({
		model: input.model,
		temperature: 0.7,
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
						text: `Generate a verbose image generation prompt that addresses camera position, composition, lighting, atmospherics, lens type, motion in the scene, color scheme, scene details and overall feeling. Return the prompt only for the following:
Subject: ${analysis.subject}
Description: ${analysis.description}
Tone: ${analysis.tone}
Notable Details: ${analysis.notable}
Camera Position: ${analysis.cameraPosition}
Composition: ${analysis.composition}
Lighting: ${analysis.lighting}
Atmospherics: ${analysis.atmospherics}
Lens Type: ${analysis.lensType}
Motion in the Scene: ${analysis.motionInTheScene}
Color Scheme: ${analysis.colorScheme}
Scene Details: ${analysis.sceneDetails}
OverallFeeling: ${analysis.overallFeeling}
`,
					},
				],
			},
		],
	});

	return output;
}
