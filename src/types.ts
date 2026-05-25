import type { LanguageModel } from "ai";

export type ImageAnalysis = {
  subject: string;
  style: string;
  description: string;
  tone: string;
  notable: string;
  cameraPosition: string;
  composition: string;
  lighting: string;
  atmospherics: string;
  lensType: string;
  motionInTheScene: string;
  colorScheme: string;
  sceneDetails: string;
  overallFeeling: string;
  medium: string;
  surface: string;
  artisticStyle: string;
  brushworkOrDetail: string;
  colorPalette: string;
};

export type PromptZero = {
  forward: (input: {
    model: LanguageModel;
    initial_prompt: string;
  }) => Promise<{ prompt: string }>;
};

/** Application-level configuration loaded from config.json. */
export type Config = {
  AI_URL: string;
  API_KEY: string;
  TRACK_PATH: string;
  LIGHT_CYCLES?: number;
  USE_GEN_MODELS: string[];
  GENERATE_DEFAULTS: {
    WIDTH: number;
    HEIGHT: number;
    STEPS: number;
  };
  MODELS: {
    PROMPT_WRITER: string;
    IMAGE_READER: string;
    IMAGE_GENERATORS: {
      zitbf16: string;
      zitfp8: string;
      f2k4b: string;
      f2k9b: string;
    };
  };
  numCycles: number;
  trackNum: number;
  initialPrompt?: string;
};

/**
 * The shape of a record in the norkostrat KV store for a garkbit pipeline job.
 * All fields are optional because nodes incrementally populate the store.
 */
export interface PipelineRecord {
  // ── Job metadata ──
  jobId: string;
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
  analysis?: ImageAnalysis;

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
