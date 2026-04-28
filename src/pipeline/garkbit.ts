import type { Pipeline } from "norkostrat";
import type { NodeDeps } from "../nodes/types.js";
import {
  createPromptZeroNode,
  createGenerateNode,
  createImageReaderNode,
  createPromptWriterNode,
} from "../nodes/index.js";

/**
 * Builds the complete garkbit pipeline definition.
 *
 * The pipeline is a simple loop with three nodes:
 *
 *   promptZero → generate → (maybe) imageReader → promptWriter → generate → ...
 *
 * generate uses nextTopic to decide at runtime:
 *   - if more cycles remain: publish to "imageReader.done" (continue)
 *   - if last cycle: publish to "pipeline.complete" (finish)
 *
 * imageReader always triggers promptWriter.
 * promptWriter always triggers generate.
 *
 * generate subscribes to two topics (two steps):
 *   - promptZero.done (cycle 0)
 *   - promptWriter.done (cycles 1+)
 */
export function buildGarkbitPipeline(deps: NodeDeps): Pipeline {
  return {
    name: "garkbit",
    startTopic: "prompt.input",
    seedFn: (id: string, _topic: string) => ({
      jobId: id,
      mode: deps.config.MODELS.PROMPT_WRITER ? ("art" as const) : ("photo" as const),
      cycle: 0,
      totalCycles: 1,
      trackDir: "",
      genModel: "",
      lightCycle: 0,
      completedSteps: [],
      status: "pending" as const,
    }),
    steps: [
      // ── Cycle 0: generate the initial prompt ──
      {
        node: createPromptZeroNode(deps),
        inputTopic: "prompt.input",
        outputTopic: "promptZero.done",
      },
      // ── Generate: receives prompt from promptZero or promptWriter ──
      {
        node: createGenerateNode(deps),
        inputTopic: "promptZero.done",
        outputTopic: "generate.done",
      },
      {
        node: createGenerateNode(deps),
        inputTopic: "promptWriter.done",
        outputTopic: "generate.done",
      },
      // ── Analyze → re-prompt → generate loop ──
      {
        node: createImageReaderNode(deps),
        inputTopic: "generate.done",
        outputTopic: "imageReader.done",
      },
      {
        node: createPromptWriterNode(deps),
        inputTopic: "imageReader.done",
        outputTopic: "promptWriter.done",
      },
    ],
    config: {
      maxRetries: 3,
      retryBaseMs: 1000,
      pipelineTimeoutMs: 30 * 60 * 1000, // 30 minutes
    },
  };
}
