import type { Pipeline } from "norkostrat";
import type { NodeDeps } from "../types.js";
import {
  createPromptZeroNode,
  createGenerateNode,
  createImageResizerNode,
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
 * generate listens on two topics via inputTopics — no duplicate steps needed:
 *   - promptZero.done (cycle 0)
 *   - promptWriter.done (cycles 1+)
 */
export function buildGarkbitPipeline(deps: NodeDeps): Pipeline {
  return {
    name: "garkbit",
    startTopic: "prompt.input",
    seedFn: (id: string, _topic: string) => ({
      jobId: id,
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
      // (inputTopics on the node handles multi-topic subscription)
      {
        node: createGenerateNode(deps),
        inputTopic: "promptZero.done",
        outputTopic: "generate.done",
      },
      // ── Resize: receives image from generate ──
      {
        node: createImageResizerNode(),
        inputTopic: "generate.done",
        outputTopic: "imageResizer.done",
      },
      // ── Analyze → re-prompt → generate loop ──
      {
        node: createImageReaderNode(deps),
        inputTopic: "imageResizer.done",
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
