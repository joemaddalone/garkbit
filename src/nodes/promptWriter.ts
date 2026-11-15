import type { Node, NodeContext } from "norkostrat";
import type { NodeDeps } from "../types.js";
import fs from "node:fs";
import type { ImageAnalysis } from "../types";
import { zugar, z } from "zugar";
import { maybeInjectCreative, type CreativeConfig } from "./shared/creative-seeds.js";

const outputSchema = z.object({
  prompt: z.string(),
});

/**
 * Format the analysis into a text block the prompt-writer can reason about.
 * Includes the creative-direction fields (suggestedEvolution, etc.).
 */
function formatAnalysis(analysis: ImageAnalysis): string {
  return [
    `Subject: ${analysis.subject}`,
    `Style: ${analysis.style}`,
    `Description: ${analysis.description}`,
    `Tone: ${analysis.tone}`,
    `Notable: ${analysis.notable}`,
    `Camera Position: ${analysis.cameraPosition}`,
    `Composition: ${analysis.composition}`,
    `Lighting: ${analysis.lighting}`,
    `Atmospherics: ${analysis.atmospherics}`,
    `Lens: ${analysis.lensType}`,
    `Motion: ${analysis.motionInTheScene}`,
    `Color Scheme: ${analysis.colorScheme}`,
    `Scene Details: ${analysis.sceneDetails}`,
    `Overall Feeling: ${analysis.overallFeeling}`,
    `Medium: ${analysis.medium}`,
    `Surface: ${analysis.surface}`,
    `Artistic Style: ${analysis.artisticStyle}`,
    `Brushwork/Detail: ${analysis.brushworkOrDetail}`,
    `Color Palette: ${analysis.colorPalette}`,
    `Unexpected Element: ${analysis.unexpectedElement}`,
    `Suggested Evolution: ${analysis.suggestedEvolution}`,
    `What Is Missing: ${analysis.whatIsMissing}`,
  ].join("\n");
}

/**
 * PromptWriterNode — generates an evolved prompt from the image analysis.
 *
 * Unlike the original, this node:
 *   1. Operates as a creative agent that EVOLVES the image, not just describes it.
 *   2. Has access to prompt history (cycle memory) to avoid repetition.
 *   3. Can receive random creative directives that push the image in new directions.
 *
 * Input topic:  "imageReader.done"
 * Output topic: "promptWriter.done"
 */
export function createPromptWriterNode(deps: NodeDeps): Node {
  return {
    name: "promptWriter",
    async process(_content: unknown, ctx: NodeContext) {
      const record = ctx.record as typeof ctx.record & {
        analysis: ImageAnalysis;
        trackDir: string;
        cycle: number;
        promptHistory: string[];
        creative?: CreativeConfig;
      };
      const store = ctx.store;

      if (!record.analysis) {
        throw new Error("PromptWriterNode: no analysis in store");
      }

      // ── Cycle memory: build the history block ──
      const history = record.promptHistory ?? [];
      const recentHistory = history.slice(-4); // keep last 4 prompts
      const historyBlock =
        recentHistory.length > 0
          ? recentHistory
              .map((p, i) => `--- Prompt ${i + 1} ---\n${p}`)
              .join("\n\n")
          : "(none — this is the first iteration)";

      // ── Creative injection: maybe pick a directive ──
      const creativeConfig = record.creative ?? deps.config.CREATIVE;
      const directive = maybeInjectCreative(record.cycle, creativeConfig);
      const directiveBlock = directive
        ? `\n\n🎲 CREATIVE DIRECTIVE: ${directive.instruction}`
        : "";

      // ── Compose the text input for the agent ──
      const textInput = [
        `You are iterating on an evolving image series (cycle ${record.cycle}).`,
        ``,
        `## Image Analysis`,
        formatAnalysis(record.analysis),
        ``,
        `## Previous Prompts (avoid repeating these)`,
        historyBlock,
        directiveBlock,
      ].join("\n");

      const result = await zugar({
        description:
          "You are a visionary image prompt engineer iterating on an evolving series of images. " +
          "You receive a detailed analysis of the current image, a history of previous prompts, " +
          "and possibly a creative directive. Your job is to write a prompt that EVOLVES the image — " +
          "amplify what's striking, explore the suggested evolution, address what's missing, and " +
          "take the image in a bold new direction. Do NOT simply reproduce or re-describe what you " +
          "see. Think like an art director who wants each iteration to be more surprising and " +
          "visually compelling than the last. Avoid clichés. Prefer specificity over vagueness. " +
          "If a creative directive is provided, incorporate it naturally into the prompt. " +
          "The prompt should be a single flowing paragraph, not a bullet list.",
        temperature: 0.8,
        maxTokens: 64000,
        schema: outputSchema,
        model: deps.promptWriterModel,
        inputKind: "text",
      })({ text: textInput });

      const newPrompt = result.prompt;
      if (!newPrompt) {
        throw new Error("PromptWriterNode returned no prompt");
      }

      // Write prompt to disk
      fs.writeFileSync(
        `${record.trackDir}/prompt_${record.cycle}.txt`,
        newPrompt,
      );

      // Log directive if injected
      if (directive) {
        console.log(
          `[promptWriter] 🎲  injected creative directive: ${directive.label}`,
        );
      }
      console.log(
        `[promptWriter] ✍️  evolved prompt for cycle ${record.cycle}`,
      );

      store.update(ctx.jobId, {
        newPrompt,
      });

      return {
        patch: { newPrompt },
        nextTopic: "promptWriter.done",
      } as const;
    },
  };
}
