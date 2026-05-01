import type { Node, NodeContext } from "norkostrat";
import type { NodeDeps } from "./types.js";
import { updateRecord } from "./shared/store-helpers.js";
import fs from "node:fs";
import artSchema from "../agents/artschema";
import photoSchema from "../agents/photoschema";
import type { ArtAnalysis, PhotoAnalysis } from "../types";
import { zugar, z } from "zugar";

const outputSchema = z.object({
	prompt: z.string(),
});

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
      const record = ctx.record as typeof ctx.record & (
        | { mode: "art"; analysis: ArtAnalysis; trackDir: string; cycle: number; }
        | { mode: "photo"; analysis: PhotoAnalysis; trackDir: string; cycle: number; }
      );
      const store = ctx.store;

      if (!record.analysis) {
        throw new Error("PromptWriterNode: no analysis in store");
      }

      const baseConfig = {
        description: "Generate a verbose image generation prompt for an image.",
        temperature: 0.7,
        maxTokens: 64000,
        schema: outputSchema,
        model: deps.promptWriterModel,
        inputKind: "schema" as const,
      };

      const result = record.mode === "photo"
        ? await zugar({ ...baseConfig, inputSchema: photoSchema })({ data: record.analysis })
        : await zugar({ ...baseConfig, inputSchema: artSchema })({ data: record.analysis });

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
        nextTopic: "promptWriter.done",
      } as const;
    },
  };
}
