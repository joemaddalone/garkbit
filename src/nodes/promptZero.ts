import type { Node, NodeContext } from "norkostrat";
import type { NodeDeps } from "../types.js";
import fs from "node:fs";
import { z, zugar } from "zugar";

const schema = z.object({
  prompt: z
    .string()
    .meta({ description: "A verbose image generation prompt." }),
});

/**
 * PromptZeroNode — generates the initial (cycle 0) image prompt from a user seed.
 * Only runs when cycle === 0 and an initialPrompt is provided.
 *
 * Input topic:  "prompt.input"
 * Output topic: "promptZero.done" (or "generate.done" to skip)
 */
export function createPromptZeroNode(deps: NodeDeps): Node {
  return {
    name: "promptZero",
    async process(_content: unknown, ctx: NodeContext) {
      const record = ctx.record as typeof ctx.record & {
        cycle: number;
        initialPrompt?: string;
        trackDir: string;
      };
      const store = ctx.store;

      // Only run for cycle 0 with an initial prompt
      if (record.cycle !== 0 || !record.initialPrompt) {
        console.log(
          `[promptZero] ⏭  skipping (cycle=${record.cycle}, no initialPrompt)`,
        );
        return { patch: {}, nextTopic: "generate.done" } as const;
      }

      // Write prompt to disk (same as existing behavior)
      fs.writeFileSync(
        `${record.trackDir}/prompt_initial.txt`,
        record.initialPrompt,
      );

      // Import zugar agent dynamically to avoid circular deps
      const agent = zugar({
        description:
          "You are a visionary image prompt engineer. Transform the user's seed idea into a rich, " +
          "evocative, and highly detailed image-generation prompt. Think like an art director: " +
          "specify medium, style, lighting, composition, atmosphere, color, texture, and mood. " +
          "Be bold and imaginative — aim for something visually striking that a talented artist " +
          "would want to paint. Avoid clichés. Prefer specificity over vagueness. " +
          "The prompt should be a single flowing paragraph, not a bullet list.",
        temperature: 0.8,
        maxTokens: 64000,
        schema,
        model: deps.promptWriterModel,
        inputKind: "text",
      });

      const { prompt } = await agent({ text: record.initialPrompt });

      if (!prompt) {
        throw new Error("promptZero returned no prompt");
      }

      // Write prompt to disk (same as existing behavior)
      fs.writeFileSync(`${record.trackDir}/prompt_0.txt`, prompt);

      console.log(`[promptZero] ✍️  generated prompt for cycle 0`);

      store.update(ctx.jobId, {
        promptZeroPrompt: prompt,
      });

      return {
        patch: { promptZeroPrompt: prompt },
        nextTopic: "promptZero.done",
      } as const;
    },
  };
}
