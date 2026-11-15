import type { Node, NodeContext } from "norkostrat";
import type { NodeDeps } from "../types.js";
import {
  generateImage,
  type OllamaGenerateResponse,
} from "./shared/ollama-client.js";
import { writeBase64Image } from "./shared/image-utils.js";
import {
  pickModel,
  pickTemperature,
  pickAspectRatio,
  type CreativeConfig,
} from "./shared/creative-seeds.js";

/**
 * GenerateNode — calls Ollama API to generate an image from a prompt.
 * Uses nextTopic to decide at runtime whether to continue or finish:
 *   - more cycles remain → "imageReader.done" (loop)
 *   - last cycle → "pipeline.complete" (finish)
 *
 * Accepts prompts from either promptZero (cycle 0) or promptWriter (cycles 1+).
 *
 * Creative enhancements:
 *   - Model rotation: cycles through available gen models
 *   - Temperature ramp: increases temperature per cycle for more divergence
 *   - Aspect-ratio variety: rotates through different canvas shapes
 *   - Prompt history: accumulates prompts for cycle memory
 */
export function createGenerateNode(deps: NodeDeps): Node {
  return {
    name: "generate",
    inputTopics: ["promptZero.done", "promptWriter.done"],
    async process(_content: unknown, ctx: NodeContext) {
      const record = ctx.record as typeof ctx.record & {
        trackDir: string;
        cycle: number;
        totalCycles: number;
        lightCycle: number;
        genModel: string;
        genModels?: string[];
        temperature?: number;
        creative?: CreativeConfig;
        promptHistory?: string[];
        promptZeroPrompt?: string;
        newPrompt?: string;
        prompt?: string;
      };
      const store = ctx.store;

      // Determine which prompt to use
      const prompt =
        record.promptZeroPrompt ?? record.newPrompt ?? record.prompt;
      if (!prompt) {
        throw new Error("GenerateNode: no prompt available in store");
      }

      // ── Model rotation: pick model by cycle ──
      const creativeConfig = record.creative ?? deps.config.CREATIVE;
      const availableModels = record.genModels ?? [];
      const rotate = creativeConfig?.MODEL_ROTATION ?? false;
      const model = availableModels.length > 0
        ? pickModel(record.cycle, availableModels, rotate)
        : record.genModel;

      // ── Temperature ramp: pick temperature by cycle ──
      const ramp = creativeConfig?.TEMPERATURE_RAMP ?? [];
      const temperature =
        ramp.length > 0
          ? pickTemperature(record.cycle, ramp)
          : (deps.config.GENERATE_DEFAULTS.TEMPERATURE ?? 0.7);

      // ── Aspect-ratio variety: pick dimensions by cycle ──
      const aspectVariety = creativeConfig?.ASPECT_RATIO_VARIETY ?? false;
      const aspect = pickAspectRatio(record.cycle, aspectVariety);

      // Calculate dimensions — light cycles scale everything down 50%
      const isLightCycle = record.lightCycle > record.cycle;
      const scale = isLightCycle ? 0.5 : 1;
      const width = Math.round(aspect.width * scale);
      const height = Math.round(aspect.height * scale);
      const steps = Math.round(deps.config.GENERATE_DEFAULTS.STEPS * scale);

      // Generate image
      const response: OllamaGenerateResponse = await generateImage({
        model,
        prompt,
        width,
        height,
        steps,
        aiURL: deps.config.AI_URL,
        temperature,
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
        `[generate] 🔵 image saved to ${imagePath} (${width}x${height}, ${steps} steps, temp ${temperature}, model ${model})`,
      );

      // ── Prompt history: accumulate for cycle memory ──
      const updatedHistory = [...(record.promptHistory ?? []), prompt];

      // Check if this is the last cycle
      const isLastCycle = record.cycle >= record.totalCycles - 1;
      const nextCycle = record.cycle + 1;

      if (isLastCycle) {
        console.log(
          `[generate] 🏁 last cycle (${record.cycle}/${record.totalCycles - 1})`,
        );
        store.update(ctx.jobId, { status: "complete" });
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
          genModel: model,
          temperature,
          promptHistory: updatedHistory,
        },
        nextTopic: isLastCycle ? "pipeline.complete" : "generate.done",
      } as const;
    },
  };
}
