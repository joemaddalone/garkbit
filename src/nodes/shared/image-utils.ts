import fs from "node:fs";
import sharp from "sharp";
import { resolve } from "node:path";

const RESIZE_WIDTH = 512;

/**
 * Resize an image to RESIZE_WIDTH px wide (preserving aspect ratio) for vision-model input.
 */
export async function resizeImage(imagePath: string, outPath: string): Promise<boolean> {
  const metadata = await sharp(imagePath).metadata();
  const width = metadata.width;
  if (!width) return false;

  await sharp(imagePath).resize(RESIZE_WIDTH).toFile(outPath);
  return true;
}

/**
 * Read an image file and return it as a base64-encoded string.
 */
export function readImageAsBase64(imagePath: string): string {
  return fs.readFileSync(imagePath).toString("base64");
}

/**
 * Write a base64-encoded image to disk.
 */
export function writeBase64Image(base64: string, targetPath: string): void {
  const buffer = Buffer.from(base64, "base64");
  fs.writeFileSync(targetPath, buffer);
}

/**
 * Generate the output path for a resized image (appends ".out.png").
 */
export function resizedImagePath(originalPath: string): string {
  return resolve(`${originalPath}.out.png`);
}

/**
 * Delete a resized image file (cleanup).
 */
export function deleteResizedImage(resizedPath: string): void {
  if (fs.existsSync(resizedPath)) {
    fs.unlinkSync(resizedPath);
  }
}
