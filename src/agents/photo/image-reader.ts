import { generateText } from "ai";
import type { LanguageModel } from "ai";
import { z } from "zod";

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

// image input is a base64 encoded image
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

	try {
		const jsonMatch = text.match(/\{[\s\S]*\}/);
		const jsonString = jsonMatch ? jsonMatch[0] : text;
		const parsed = JSON.parse(jsonString);
		// if any of the values are arrays or objects, convert them to a single string
		for (const key in parsed) {
			if (Array.isArray(parsed[key])) {
				parsed[key] = parsed[key].join(", ");
			} else if (typeof parsed[key] === "object" && parsed[key] !== null) {
				parsed[key] = Object.entries(parsed[key])
					.map(([k, v]) => `${k}: ${v}`)
					.join(", ");
			}
		}
		return schema.parse(parsed);
	} catch (e) {
		console.error("Failed to parse image reader output:", text);
		console.error("Parse error:", e instanceof Error ? e.message : String(e));
		throw new Error("Image reader failed to produce valid JSON");
	}
}
