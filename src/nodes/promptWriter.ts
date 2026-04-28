import type { Node, NodeContext } from "norkostrat";
import type { NodeDeps } from "./types.js";
import { getRecord, updateRecord } from "./shared/store-helpers.js";
import fs from "node:fs";

/**
 * PromptWriterNode — generates a refined prompt from the image analysis.
 *
 * Input topic:  "imageReader.done"
 * Output topic: "promptWriter.done"
 */
export function createPromptWriterNode(deps: NodeDeps): Node {
  return {
    name: "promptWriter",
    async process(_content: unknown, ctx: NodeContext) {
      const store = ctx.store;
      const record = getRecord(store, ctx.jobId);

      if (!record.analysis) {
        throw new Error("PromptWriterNode: no analysis in store");
      }

      // Import zugar agent dynamically
      const { forward } =
        record.mode === "art"
          ? await import("../agents/art/prompt-writer.js")
          : await import("../agents/photo/prompt-writer.js");

      const result = await forward({
        // biome-ignore lint/suspicious/noExplicitAny: zugar expects LanguageModel from 'ai' package
        model: deps.promptWriterModel as any,
        // biome-ignore lint/suspicious/noExplicitAny: ArtAnalysis/PhotoAnalysis shape mismatch
        analysis: record.analysis as any,
        cycle: record.cycle,
      });

      const newPrompt = result.prompt;
      if (!newPrompt) {
        throw new Error("PromptWriterNode returned no prompt");
      }

      // Write prompt to disk (same as existing behavior)
      fs.writeFileSync(`${record.trackDir}/prompt_${record.cycle}.txt`, newPrompt);

      console.log(`[promptWriter] ✍️  refined prompt for cycle ${record.cycle}`);

      updateRecord(store, ctx.jobId, {
        newPrompt,
      });

      return {
        patch: { newPrompt },
        publishTo: "promptWriter.done",
      };
    },
  };
}
