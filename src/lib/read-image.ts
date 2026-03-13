import fs from "node:fs";
import { resolve } from "node:path";
import resizer from "./resizer";
import type { ArtAnalysis, PhotoAnalysis } from "../types";
import type { LanguageModel } from "ai";

/**
 * Reads an image from disk, resizes it for the vision model, and returns
 * a structured analysis produced by the given image-reader agent.
 */
export default async <T extends ArtAnalysis | PhotoAnalysis>(
	model: LanguageModel,
	imageReader: {
		forward: (input: { model: LanguageModel; image: string; context?: string; }) => Promise<T>;
	},
	imagePath: string,
	context?: string,
): Promise<T> => {
	const outPath = resolve(`${imagePath}.out.png`);
	await resizer(imagePath, outPath);
	const image = fs.readFileSync(outPath).toString("base64");
	const response = await imageReader.forward({ model, image, context });
	if (!response) throw new Error("Failed to get analysis from image reader");
	// delete the out image
	fs.unlinkSync(outPath);
	return response;
};
