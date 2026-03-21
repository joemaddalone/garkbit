import { generateText } from "ai";
import type { LanguageModel } from "ai";
import { z } from "zod";
import parseLlmJson from "../../lib/parse-llm-json";

const schema = z.object({
	subject: z.string().describe("The main subject of the image"),
	style: z.string().describe("The style of the image"),
	description: z
		.string()
		.describe("A concise summary of the image in 150 words or less"),
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
		temperature: 0.7,
		maxOutputTokens: 128000,
		messages: [
			{
				role: "user",
				content: [
					{
						type: "text",
						text: `Analyze this image. Return a JSON object with these EXACT keys:
						subject: what is the main subject of the image
						style: the style of the image
						description: a paragraph explaining what is the image, describe people in terms of gender, look, age, clothing, etc - describe the scene in terms of location, time of day, background elements, etc - describe objects in the scene in terms of size, shape, color, material, etc,
						tone: the tone of the image (e.g., happy, sad, angry, relaxed, chaotic)
						notable: make a note of anything distinctively original about the image. e.g. a detail that is unrealistic, overemphasized, or impossible,
						cameraPosition: the camera position of the image (e.g., close-up, mid-shot, wide shot)
						composition: the composition of the image (e.g., rule of thirds, leading lines, framing)
						lighting: the lighting of the image (e.g., natural, artificial, studio)
						atmospherics: the atmospherics of the image (e.g., mood, atmosphere, ambiance)
						lensType: the lens type of the image (e.g., wide-angle, telephoto, macro)
						motionInTheScene: the motion in the scene (e.g., still, moving, dynamic)
						colorScheme: the color scheme of the image (e.g., warm, cool, neutral)
						sceneDetails: the scene details of the image (e.g., people, objects, environment)
						overallFeeling: the overall feeling of the image (e.g., happy, sad, angry, relaxed, chaotic).

						${input.context ? `The previous prompt was ${input.context}` : ""}

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
