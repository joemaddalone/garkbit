import fs from "node:fs";

type GenerateOptions = {
	prompt: string;
	targetPath: string;
	model: string;
	width: number;
	height: number;
	steps: number;
	aiURL: string;
};

/**
 * Generates an image via the Ollama API and writes the result to disk.
 *
 * @param options  All parameters needed for the generation request.
 */
export default async (options: GenerateOptions) => {
	const { prompt, targetPath, model, width, height, steps, aiURL } = options;
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
					temperature: 0.5,
				},
			}),
		});
		const response = (await req.json()) as { image: string; };

		if (response.image) {
			console.log(`🔵 Image received from ${model}. Saving to ${targetPath}...`);
			const buffer = Buffer.from(response.image, "base64");
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
