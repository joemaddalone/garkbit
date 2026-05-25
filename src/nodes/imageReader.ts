import type { Node, NodeContext } from "norkostrat";
import type { NodeDeps } from "../types.js";
import { readImageAsBase64, deleteResizedImage } from "./shared/image-utils.js";
import { zugar } from "zugar";
import imageSchema from "./shared/imageschema.js";

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
        resizedPath: string;
        cycle: number;
        prompt?: string;
      };
      const store = ctx.store;

      if (!record.resizedPath) {
        throw new Error("ImageReaderNode: no resizedPath in store");
      }

      // Clear per-cycle data from previous iteration
      store.update(ctx.jobId, {
        promptZeroPrompt: undefined,
        prompt: undefined,
        imagePath: undefined,
        resizedPath: undefined,
        analysis: undefined,
        newPrompt: undefined,
      });

      const image = readImageAsBase64(record.resizedPath);

      // Analyze image
      const result = await zugar({
        description: "Analyze this image.",
        schema: imageSchema,
        model: deps.imageReaderModel,
        inputKind: "image",
      })({ image });

      // Cleanup resized image
      deleteResizedImage(record.resizedPath);

      console.log(
        `[imageReader] 📝  analysis complete for cycle ${record.cycle}`,
      );

      return {
        patch: { analysis: result },
        nextTopic: "imageReader.done",
      } as const;
    },
  };
}
