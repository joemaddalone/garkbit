import type { Node, NodeContext } from "norkostrat";
import { resizeImage, resizedImagePath } from "./shared/image-utils.js";

/**
 * ImageResizerNode — resizes a generated image using a vision LLM.
 *
 * Input topic:  "generate.done"
 * Output topic: "imageResizer.done"
 */
export function createImageResizerNode(): Node {
  return {
    name: "imageResizer",
    async process(_content: unknown, ctx: NodeContext) {
      const record = ctx.record as typeof ctx.record & {
        imagePath?: string;
      };
      const store = ctx.store;

      if (!record.imagePath) {
        throw new Error("ImageReaderNode: no imagePath in store");
      }

      // Resize image for vision model
      const resizedPath = resizedImagePath(record.imagePath);
      const resized = await resizeImage(record.imagePath, resizedPath);
      if (!resized) {
        console.warn(
          `[imageReader] ⚠  resize returned no width metadata, using original`,
        );
      }

      const finalPath = resized ? resizedPath : record.imagePath;

      store.update(ctx.jobId, {
        resizedPath: finalPath,
      });

      return {
        nextTopic: "imageResizer.done",
      } as const;
    },
  };
}
