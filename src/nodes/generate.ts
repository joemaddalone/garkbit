import type { Node, NodeContext } from "norkostrat";
import type { NodeDeps } from "./types.js";
import { getRecord, updateRecord } from "./shared/store-helpers.js";
import {
  generateImage,
  calcDimensions,
  type OllamaGenerateResponse,
} from "./shared/ollama-client.js";
import { writeBase64Image } from "./shared/image-utils.js";

/**
 * GenerateNode — calls Ollama API to generate an image from a prompt.
 * Uses nextTopic to decide at runtime whether to continue or finish:
 *   - more cycles remain → "imageReader.done" (loop)
 *   - last cycle → "pipeline.complete" (finish)
 *
 * Accepts prompts from either promptZero (cycle 0) or promptWriter (cycles 1+).
 */
export function createGenerateNode(deps: NodeDeps): Node {
  return {
    name: "generate",
    async process(_content: unknown, ctx: NodeContext) {
      const store = ctx.store;
      const record = getRecord(store, ctx.jobId);

      // Determine which prompt to use
      const prompt =
        record.promptZeroPrompt ?? record.newPrompt ?? record.prompt;
      if (!prompt) {
        throw new Error("GenerateNode: no prompt available in store");
      }

      // Calculate dimensions
      const isLightCycle = record.lightCycle > record.cycle;
      const dims = calcDimensions(
        isLightCycle,
        deps.config.GENERATE_DEFAULTS.WIDTH,
        deps.config.GENERATE_DEFAULTS.STEPS,
      );

      // Generate image
      const response: OllamaGenerateResponse = await generateImage({
        model: record.genModel,
        prompt,
        width: dims.width,
        height: dims.height,
        steps: dims.steps,
        aiURL: deps.config.AI_URL,
      });

      if (!response.image) {
        throw new Error(
          `GenerateNode: no image data from Ollama (${response.error ?? "unknown error"})`,
        );
      }

      // Save image and prompt to disk
      const imagePath = `${record.trackDir}/_${record.cycle}.png`;
      writeBase64Image(response.image, imagePath);

      console.log(
        `[generate] 🔵 image saved to ${imagePath} (${dims.width}x${dims.height}, ${dims.steps} steps)`,
      );

      // Check if this is the last cycle
      const isLastCycle = record.cycle >= record.totalCycles - 1;
      const nextCycle = record.cycle + 1;

      if (isLastCycle) {
        console.log(
          `[generate] 🏁 last cycle (${record.cycle}/${record.totalCycles - 1})`,
        );
        updateRecord(store, ctx.jobId, { status: "complete" });
      } else {
        console.log(
          `[generate] 🔄 more cycles — continuing to imageReader (cycle ${nextCycle})`,
        );
      }

      return {
        patch: {
          prompt,
          imagePath,
          cycle: isLastCycle ? record.cycle : nextCycle,
          // Don't clear analysis — promptWriter needs it.
          // imageReader clears it when starting the next cycle.
        },
        nextTopic: isLastCycle ? "pipeline.complete" : "generate.done",
      };
    },
  };
}
