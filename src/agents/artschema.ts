import { z } from "zod";

export default z.object({
	subject: z.string().describe("The main subject of the artwork"),
	description: z
		.string()
		.meta({ description: "A concise summary of the artwork in 50 words or less" }),
	tone: z
		.string()
		.meta({ description: "The tone of the piece (e.g., ethereal, somber, vibrant, whimsical)" }),
	medium: z
		.string()
		.meta({ description: "The art medium (e.g., watercolor, oil, digital, pencil, charcoal)"}),
	surface: z
		.string()
		.meta({ description: "The surface or substrate (e.g., aged paper, canvas, wood, smooth vellum)"}),
	artisticStyle: z
		.string()
		.meta({ description: "The specific artistic style (e.g., impressionism, sketch, surrealism, flat design)"}),
	brushworkOrDetail: z
		.string()
		.meta({ description: "The quality of strokes or level of detail (e.g., visible brushwork, fine lines, stippling)"}),
	composition: z.string().meta({ description: "The arrangement of elements in the piece"}),
	lighting: z
		.string()
		.meta({ description: "How light is used in the artwork (e.g., dramatic highlights, soft diffusion, flat lighting)"}),
	colorPalette: z.string().meta({ description: "The dominant color scheme and usage"}),
	notableTraits: z
		.string()
		.meta({ description: "Anything distinctively original or unique about the artwork's execution"}),
	overallFeeling: z
		.string()
		.meta({ description: "The emotional impact or atmosphere of the piece"}),
});