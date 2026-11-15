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
  unexpectedElement: string;
  suggestedEvolution: string;
  whatIsMissing: string;
};

export type PromptZero = {
  forward: (input: {
    model: LanguageModel;
    initial_prompt: string;
  }) => Promise<{ prompt: string }>;
};

/**
 * Creative configuration loaded from the CREATIVE block in config.json.
 * Controls temperature ramp, model rotation, aspect-ratio variety,
 * and random creative injection.
 */
export type CreativeConfig = {
  /** Temperature values per cycle, ascending (e.g. [0.6, 0.7, 0.8, 0.9, 1.0]). */
  TEMPERATURE_RAMP: number[];
  /** Whether to rotate through available gen models per cycle. */
  MODEL_ROTATION: boolean;
  /** Whether to vary aspect ratio per cycle. */
  ASPECT_RATIO_VARIETY: boolean;
  /** Probability [0..1] of randomly injecting a creative directive each cycle. */
  INJECTION_CHANCE: number;
  /** Inject a creative directive every N cycles (0 = disable interval-based injection). */
  INJECTION_INTERVAL: number;
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
    TEMPERATURE?: number;
  };
  CREATIVE?: CreativeConfig;
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

  // ── Creative pipeline data ──
  genModels: string[]; // all available gen models (for rotation)
  temperature: number; // generation temperature for current cycle
  creative?: CreativeConfig; // creative configuration block
  promptHistory: string[]; // rolling history of prompts for cycle memory

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
      TEMPERATURE?: number;
    };
    CREATIVE?: CreativeConfig;
    MODELS: {
      PROMPT_WRITER: string;
      IMAGE_READER: string;
    };
  };
  promptWriterModel: LanguageModel;
  imageReaderModel: LanguageModel;
}
