import type { Node, NodeContext } from "norkostrat";
import type { NodeDeps } from "./types.js";
import { getRecord, updateRecord } from "./shared/store-helpers.js";
import {
  resizeImage,
  readImageAsBase64,
  resizedImagePath,
  deleteResizedImage,
} from "./shared/image-utils.js";

/**
 * ImageReaderNode — analyzes a generated image using a vision LLM.
 *
 * Input topic:  "generate.done"
 * Output topic: "imageReader.done"
 */
export function createImageReaderNode(deps: NodeDeps): Node {
  return {
    name: "imageReader",
    async process(_content: unknown, ctx: NodeContext) {
      const store = ctx.store;
      const record = getRecord(store, ctx.jobId);

      if (!record.imagePath) {
        throw new Error("ImageReaderNode: no imagePath in store");
      }

      // Import zugar agent dynamically
      const { forward } =
        record.mode === "art"
          ? await import("../agents/art/image-reader.js")
          : await import("../agents/photo/image-reader.js");

      // Clear per-cycle data from previous iteration
      updateRecord(store, ctx.jobId, {
        promptZeroPrompt: undefined,
        prompt: undefined,
        imagePath: undefined,
        analysis: undefined,
        newPrompt: undefined,
      });

      // Resize image for vision model
      const resizedPath = resizedImagePath(record.imagePath);
      const resized = await resizeImage(record.imagePath, resizedPath);
      if (!resized) {
        console.warn(`[imageReader] ⚠  resize returned no width metadata, using original`);
      }

      const basePath = resized ? resizedPath : record.imagePath;
      const image = readImageAsBase64(basePath);

      // Analyze image
      const result = await forward({
        // biome-ignore lint/suspicious/noExplicitAny: zugar expects LanguageModel from 'ai' package
        model: deps.imageReaderModel as any,
        image,
        context: record.prompt, // pass previous prompt as context
      });

      // Cleanup resized image
      deleteResizedImage(resizedPath);

      console.log(`[imageReader] 📝  analysis complete for cycle ${record.cycle}`);

      return {
        patch: { analysis: result },
        publishTo: "imageReader.done",
      };
    },
  };
}
