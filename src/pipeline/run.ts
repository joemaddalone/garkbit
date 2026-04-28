import { createBus, createStore, PipelineRunner } from "norkostrat";
import type { Config } from "../types.js";
import type { LanguageModel } from "ai";
import { buildGarkbitPipeline } from "./garkbit.js";
import type { NodeDeps } from "../nodes/types.js";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

/**
 * Options for running a garkbit pipeline.
 */
export interface PipelineRunOptions {
  /** Art or photo mode */
  mode: "art" | "photo";
  /** Number of cycles to run */
  numCycles: number;
  /** Track directory (absolute path) */
  trackDir: string;
  /** Initial seed prompt (cycle 0) */
  initialPrompt?: string;
  /** Image generation model name */
  genModel: string;
  /** Second image generation model (for non-light cycles) */
  genModelSecondary?: string;
  /** Number of light cycles (0 = none) */
  lightCycles?: number;
  /** Whether to preserve context memory across cycles */
  preserveContextMemory?: boolean;
  /** Ollama API URL */
  aiURL: string;
  /** Prompt writer model name */
  promptWriterModelName: string;
  /** Image reader model name */
  imageReaderModelName: string;
  /** Language model for prompt writing */
  promptWriterModel: LanguageModel;
  /** Language model for image reading */
  imageReaderModel: LanguageModel;

	/** Image dimensions */
	width?: number;
	height?: number;
	/** Generation steps */
	steps?: number;
}

/**
 * Detect the last completed cycle from existing track files.
 * Returns the highest cycle number found, or -1 if none exist.
 */
function detectLastCycle(trackDir: string): number {
  if (!fs.existsSync(trackDir)) return -1;

  const files = fs.readdirSync(trackDir);
  const cycles = files
    .filter((f) => f.startsWith("_") && f.endsWith(".png") && !f.includes(".out."))
    .map((f) => {
      const match = f.match(/_(\d+)\.png/);
      return match?.[1] ? parseInt(match[1], 10) : -1;
    })
    .filter((c) => c >= 0);

  return cycles.length > 0 ? Math.max(...cycles) : -1;
}

/**
 * Build the NodeDeps from pipeline options.
 */
function buildNodeDeps(opts: PipelineRunOptions): NodeDeps {
  return {
    config: {
      AI_URL: opts.aiURL,
      API_KEY: "not-set-for-ollama",
      GENERATE_DEFAULTS: {
        WIDTH: opts.width ?? 1024,
        HEIGHT: opts.height ?? 1024,
        STEPS: opts.steps ?? 8,
      },
      MODELS: {
        PROMPT_WRITER: opts.promptWriterModelName,
        IMAGE_READER: opts.imageReaderModelName,
      },
    },
    promptWriterModel: opts.promptWriterModel,
    imageReaderModel: opts.imageReaderModel,
  };
}

/**
 * Run the garkbit pipeline for a single track.
 *
 * This is the main entry point — it:
 * 1. Detects where we left off (resume support)
 * 2. Creates the bus, store, and pipeline
 * 3. Starts the pipeline runner
 * 4. Submits the initial job
 * 5. Waits for completion (or timeout)
 */
export async function runPipeline(opts: PipelineRunOptions): Promise<void> {
  // ── Step 1: Detect resume point ──
  const lastCycle = detectLastCycle(opts.trackDir);
  const cyclesToRun = opts.numCycles - Math.max(lastCycle, 0);

  if (cyclesToRun <= 0) {
    console.log(`🟢 All ${opts.numCycles} cycles already complete for ${opts.trackDir}`);
    return;
  }

  const actualStartCycle = Math.max(lastCycle, 0);
  console.log(
    `🔵 Track: ${opts.trackDir} | Last cycle: ${lastCycle} | Running cycles ${actualStartCycle} to ${opts.numCycles - 1}`,
  );

  // ── Step 2: Build pipeline ──
  const deps = buildNodeDeps(opts);
  const pipeline = buildGarkbitPipeline(deps);

  // ── Step 3: Create infrastructure ──
  const bus = createBus();
  const store = createStore();
  const runner = new PipelineRunner(pipeline, bus, store);

  // ── Step 4: Start the pipeline ──
  await runner.start();

  // ── Step 5: Submit the job (with custom seed data for resume) ──
  const jobId = opts.trackDir.replace(/\//g, "-").replace(/^[.-]+/, "");
  const seedData = {
    mode: opts.mode,
    cycle: actualStartCycle,
    totalCycles: opts.numCycles,
    trackDir: opts.trackDir,
    genModel: opts.genModel,
    lightCycle: opts.lightCycles ?? 0,
    initialPrompt: opts.initialPrompt,
    completedSteps: [],
    status: "pending" as const,
  };

  // Listen for pipeline completion
  const lastStep = pipeline.steps[pipeline.steps.length - 1];
  if (!lastStep) throw new Error("Pipeline has no steps");
  const finalTopic = lastStep.outputTopic;
  bus.subscribe(finalTopic, async (envelope) => {
    const p = envelope.payload as { id?: string };
    if (p.id !== jobId) return;

    const record = store.get<{ status?: string }>(jobId);
    if (record?.status === "complete") {
      console.log(`\n${"=".repeat(60)}`);
      console.log(`🎉  PIPELINE COMPLETE — ${opts.trackDir}`);
      console.log(`${"=".repeat(60)}\n`);
      setTimeout(() => process.exit(0), 500);
    }
  });

  // submitJob handles seeding + publishing in one call
  await runner.submitJob(pipeline.startTopic, seedData);
  console.log(`[pipeline] 🚀  submitted (job ${jobId}, start cycle ${actualStartCycle})\n`);
}

/**
 * Run the garkbit pipeline from CLI-style arguments.
 * This is the thin wrapper that replaces the current index.ts.
 */
export async function runFromCLI(
  numCycles: number,
  trackNum: number,
  initialPrompt: string,
  mode: "art" | "photo",
  opts?: Partial<Pick<PipelineRunOptions, "preserveContextMemory">>,
): Promise<void> {
  // Load config
  const config = JSON.parse(
    fs.readFileSync(path.join(process.cwd(), "config.json"), "utf-8"),
  ) as Config;

  // Determine track directory
  const trackDir = path.join(os.homedir(), config.TRACK_PATH, trackNum.toString());

  // Ensure track directory exists
  if (!fs.existsSync(trackDir)) {
    fs.mkdirSync(trackDir, { recursive: true });
  }

  // Initialize LLM models
  const { promptWriterModel, imageReaderModel } = await import("../llms.js").then((m) =>
    m.default(config),
  );

  // Determine gen model
	const genModels = [
		config.MODELS.IMAGE_GENERATORS.f2k4b,
	];
  const genModel = genModels[0] ?? "";
  const genModelSecondary = genModels.length > 1 ? (genModels[1] ?? genModels[0]) : genModels[0];



  await runPipeline({
    mode,
    numCycles,
    trackDir,
    initialPrompt,
    genModel,
    genModelSecondary,
    lightCycles: config.LIGHT_CYCLES,
    preserveContextMemory: opts?.preserveContextMemory,
    aiURL: config.AI_URL,
    promptWriterModelName: config.MODELS.PROMPT_WRITER,
    imageReaderModelName: config.MODELS.IMAGE_READER,
    promptWriterModel,
    imageReaderModel,
		width: config.GENERATE_DEFAULTS.WIDTH,
		height: config.GENERATE_DEFAULTS.HEIGHT,
		steps: config.GENERATE_DEFAULTS.STEPS,
  });
}
