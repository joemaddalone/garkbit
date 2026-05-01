import type { Node, NodeContext } from "norkostrat";
import type { NodeDeps } from "./types.js";
import { updateRecord } from "./shared/store-helpers.js";
import {
  resizeImage,
  readImageAsBase64,
  resizedImagePath,
  deleteResizedImage,
} from "./shared/image-utils.js";
import { zugar } from "zugar";
import artSchema from "../agents/artschema";
import photoSchema from "../agents/photoschema";


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
      const record = ctx.record as typeof ctx.record & {
        imagePath?: string;
        cycle: number;
        mode: "art" | "photo";
        prompt?: string;
      };
      const store = ctx.store;

      if (!record.imagePath) {
        throw new Error("ImageReaderNode: no imagePath in store");
      }

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
      const result = await zugar({
        description: "Analyze this image.",
        schema: record.mode === "photo" ? photoSchema : artSchema,
        model: deps.imageReaderModel,
        inputKind: "image",
      })({ image });

      // Cleanup resized image
      deleteResizedImage(resizedPath);

      console.log(`[imageReader] 📝  analysis complete for cycle ${record.cycle}`);

      return {
        patch: { analysis: result },
        nextTopic: "imageReader.done",
      } as const;
    },
  };
}
