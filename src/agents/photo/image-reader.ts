import { generateText } from "ai";
import type { LanguageModel } from "ai";
import { z } from "zod";
import parseLlmJson from "../../lib/parse-llm-json";

const schema = z.object({
	subject: z.string().describe("The main subject of the image"),
	style: z.string().describe("The style of the image"),
	description: z
		.string()
		.describe("A concise summary of the image in 50 words or less"),
	tone: z
		.string()
		.describe(
			"The tone of the image (e.g., happy, sad, angry, relaxed, chaotic)",
		),
	notable: z
		.string()
		.describe(
			"Make a note of anything distinctively original about the image. (e.g. a detail that is unrealistic, overemphasized, or impossible).",
		),
	cameraPosition: z.string(),
	composition: z.string(),
	lighting: z.string(),
	atmospherics: z.string(),
	lensType: z.string(),
	motionInTheScene: z.string(),
	colorScheme: z.string(),
	sceneDetails: z.string(),
	overallFeeling: z.string(),
});

/**
 * Analyzes a photograph using a vision LLM and returns structured metadata.
 * @param input.model  The vision language model to use.
 * @param input.image  Base64-encoded image data.
 * @param input.context  Optional previous prompt for continuity.
 */
export async function forward(
	input = { model: undefined, image: "" } as { model: LanguageModel | undefined; image: string; context?: string; },
) {
	if (!input.model) {
		throw new Error("Image reader model not provided");
	}
	const { text } = await generateText({
		model: input.model,
		temperature: 0.2,
		maxOutputTokens: 128000,
		messages: [
			{
				role: "user",
				content: [
					{
						type: "text",
						text: `Analyze this image. Return a JSON object with these EXACT keys: subject, style, description, tone, notable, cameraPosition, composition, lighting, atmospherics, lensType, motionInTheScene, colorScheme, sceneDetails, overallFeeling. ${input.context ? `The previous prompt was ${input.context}` : ""}

Respond with ONLY the JSON object.`,
					},
					{
						type: "image",
						image: input.image,
					},
				],
			},
		],
	});

	return parseLlmJson(text, schema);
}
