import { generateText } from "ai";
import type { LanguageModel } from "ai";
import { z } from "zod";

const schema = z.object({
	subject: z.string().describe("The main subject of the artwork"),
	description: z
		.string()
		.describe("A concise summary of the artwork in 50 words or less"),
	tone: z
		.string()
		.describe(
			"The tone of the piece (e.g., ethereal, somber, vibrant, whimsical)",
		),
	medium: z
		.string()
		.describe(
			"The art medium (e.g., watercolor, oil, digital, pencil, charcoal)",
		),
	surface: z
		.string()
		.describe(
			"The surface or substrate (e.g., aged paper, canvas, wood, smooth vellum)",
		),
	artisticStyle: z
		.string()
		.describe(
			"The specific artistic style (e.g., impressionism, sketch, surrealism, flat design)",
		),
	brushworkOrDetail: z
		.string()
		.describe(
			"The quality of strokes or level of detail (e.g., visible brushwork, fine lines, stippling)",
		),
	composition: z.string().describe("The arrangement of elements in the piece"),
	lighting: z
		.string()
		.describe(
			"How light is used in the artwork (e.g., dramatic highlights, soft diffusion, flat lighting)",
		),
	colorPalette: z.string().describe("The dominant color scheme and usage"),
	notableTraits: z
		.string()
		.describe(
			"Anything distinctively original or unique about the artwork's execution",
		),
	overallFeeling: z
		.string()
		.describe("The emotional impact or atmosphere of the piece"),
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
						text: `Analyze this artwork. Return a JSON object with these EXACT keys: subject, description, tone, medium, surface, artisticStyle, brushworkOrDetail, composition, lighting, colorPalette, notableTraits, overallFeeling. ${input.context ? `The previous prompt was ${input.context}` : ""}

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
