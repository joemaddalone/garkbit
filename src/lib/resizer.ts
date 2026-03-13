import sharp from "sharp";

export default async (imagePath: string, outPath: string) => {
	const metadata = await sharp(imagePath).metadata();
	const width = metadata.width;
	if (!width) return false;

	await sharp(imagePath).resize(512).toFile(outPath);

	return true;
};
