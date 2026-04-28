import type { Node, NodeContext } from "norkostrat";
import type { NodeDeps } from "./types.js";
import { updateRecord } from "./shared/store-helpers.js";
import fs from "node:fs";

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
        mode: "art" | "photo";
      };
      const store = ctx.store;

      // Only run for cycle 0 with an initial prompt
      if (record.cycle !== 0 || !record.initialPrompt) {
        console.log(`[promptZero] ⏭  skipping (cycle=${record.cycle}, no initialPrompt)`);
        return { patch: {}, nextTopic: "generate.done" } as const;
      }

      // Write prompt to disk (same as existing behavior)
      fs.writeFileSync(`${record.trackDir}/prompt_initial.txt`, record.initialPrompt);

      // Import zugar agent dynamically to avoid circular deps
      const { forward } =
        record.mode === "art"
          ? await import("../agents/art/prompt-zero.js")
          : await import("../agents/photo/prompt-zero.js");

      const result = await forward({
        // biome-ignore lint/suspicious/noExplicitAny: zugar expects LanguageModel from 'ai' package
        model: deps.promptWriterModel as any,
        initial_prompt: record.initialPrompt,
      });

      const prompt = result.prompt;
      if (!prompt) {
        throw new Error("promptZero returned no prompt");
      }

      // Write prompt to disk (same as existing behavior)
      fs.writeFileSync(`${record.trackDir}/prompt_0.txt`, prompt);

      console.log(`[promptZero] ✍️  generated prompt for cycle 0`);

      updateRecord(store, ctx.jobId, {
        promptZeroPrompt: prompt,
      });

      return {
        patch: { promptZeroPrompt: prompt },
        nextTopic: "promptZero.done",
      } as const;
    },
  };
}
