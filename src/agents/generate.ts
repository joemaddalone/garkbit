import fs from "node:fs";
import unloadModel from "../lib/unload-model";

type GeneratorResponse = {
	image: string;
};

export default async (
	prompt: string,
	targetPath: string,
	model: string,
	width: number,
	height: number,
	steps: number,
	aiURL: string,
) => {
	unloadModel(model, { AI_URL: aiURL });

	try {
		const req = await fetch(`${aiURL}/api/generate`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				model,
				prompt,
				width,
				height,
				stream: false,
				steps,
				options: {
					temperature: 1,
				},
			}),
		});
		const response = (await req.json()) as GeneratorResponse;

		if (response.image) {
			console.log(`🔵 Image received from ${model}. Saving to ${targetPath}...`);
			const buffer = Buffer.from(response.image as string, "base64");
			fs.writeFileSync(targetPath, buffer);
		} else {
			console.error(`🔴 No image data received from ${model}.`);
			process.exit(1);
		}
	} catch (error) {
		console.error(`🔴 Generation failed from ${model}:`, error);
		process.exit(1);
	}
};
