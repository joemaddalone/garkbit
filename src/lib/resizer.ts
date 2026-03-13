import sharp from "sharp";

/**
 * Resizes an image to 512 px wide (preserving aspect ratio) for vision-model input.
 * @returns `true` if the resize succeeded, `false` if the image had no width metadata.
 */
export default async (imagePath: string, outPath: string) => {
	const metadata = await sharp(imagePath).metadata();
	const width = metadata.width;
	if (!width) return false;

	await sharp(imagePath).resize(512).toFile(outPath);

	return true;
};
