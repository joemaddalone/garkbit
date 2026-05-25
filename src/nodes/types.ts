import type { ArtAnalysis, PhotoAnalysis } from "../types.js";
import type { LanguageModel } from "ai";

/**
 * The shape of a record in the norkostrat KV store for a garkbit pipeline job.
 * All fields are optional because nodes incrementally populate the store.
 */
export interface PipelineRecord {
  // ── Job metadata ──
  jobId: string;
  mode: "art" | "photo";
  cycle: number;
  totalCycles: number;
  trackDir: string;
  genModel: string;
  lightCycle: number; // number of light cycles (0 = no light cycles)

  // ── Cycle 0: seed prompt ──
  initialPrompt?: string;

  // ── Prompt zero output ──
  promptZeroPrompt?: string;

  // ── Generated image ──
  prompt?: string;
  imagePath?: string;
  resizedPath?: string;
  prevImagePath?: string;

  // ── Image reader output ──
  analysis?: ArtAnalysis | PhotoAnalysis;

  // ── Prompt writer output ──
  newPrompt?: string;

  // ── Completion tracking ──
  completedSteps: string[];
  status: "pending" | "running" | "complete" | "failed";
}

/**
 * Dependencies injected into every node factory.
 */
export interface NodeDeps {
  config: {
    AI_URL: string;
    API_KEY: string;
    GENERATE_DEFAULTS: {
      WIDTH: number;
      HEIGHT: number;
      STEPS: number;
    };
    MODELS: {
      PROMPT_WRITER: string;
      IMAGE_READER: string;
    };
  };
  promptWriterModel: LanguageModel;
  imageReaderModel: LanguageModel;
}
