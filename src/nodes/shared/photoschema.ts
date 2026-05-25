import { z } from "zod";

export default z.object({
	subject: z.string().meta(
		{ description: "The main subject of the image" },
	),
	style: z.string().meta(
		{ description: "The style of the image" },
	),
	description: z
		.string()
		.meta(
			{ description: "A concise summary of the image in 150 words or less" },
		),
	tone: z
		.string()
		.meta(
			{ description: "The tone of the image (e.g., happy, sad, angry, relaxed, chaotic)" },
		),
	notable: z
		.string()
		.meta(
			{ description: "Make a note of anything distinctively original about the image. (e.g. a detail that is unrealistic, overemphasized, or impossible)." },
		),
	cameraPosition: z.string().meta(
		{ description: "The camera position of the image (e.g., close-up, mid-shot, wide shot)" },
	),
	composition: z.string().meta(
		{ description: "The composition of the image (e.g., rule of thirds, leading lines, framing)" },
	),
	lighting: z.string().meta(
		{ description: "The lighting of the image (e.g., natural, artificial, studio)" },
	),
	atmospherics: z.string().meta(
		{ description: "The atmospherics of the image (e.g., mood, atmosphere, ambiance)" },
	),
	lensType: z.string().meta(
		{ description: "The lens type of the image (e.g., wide-angle, telephoto, macro)" },
	),
	motionInTheScene: z.string().meta(
		{ description: "The motion in the scene (e.g., still, moving, dynamic)" },
	),
	colorScheme: z.string().meta(
		{ description: "The color scheme of the image (e.g., warm, cool, neutral)" },
	),
	sceneDetails: z.string().meta(
		{ description: "The scene details of the image (e.g., people, objects, environment)" },
	),
	overallFeeling: z.string().meta(
		{ description: "The overall feeling of the image (e.g., happy, sad, angry, relaxed, chaotic)" },
	),
});