import fs from "node:fs";
import path from "node:path";
import config from "./config.json";
import * as os from "node:os";
import { runPipeline } from "./src/pipeline/run.js";
import llms from "./src/llms.js";
import type { Config } from "./src/types.js";

// bun run looper.ts <num_tracks> <num_cycles> "[initial_prompt]"

const go = async () => {
	const trackDir = path.join(os.homedir(), config.TRACK_PATH);

	// Ensure images directory exists
	if (!fs.existsSync(trackDir)) {
		fs.mkdirSync(trackDir, { recursive: true });
	}

	// 1. Find the next available track number
	const trackNumbers = fs
		.readdirSync(trackDir)
		.map((f) => parseInt(f, 10))
		.filter((n) => !Number.isNaN(n));
	const highestTrack = trackNumbers.length > 0 ? Math.max(...trackNumbers) : 0;
	const startTrack = highestTrack + 1;

	// 2. Parse arguments
	const numTracksArg = process.argv[2];
	const numCyclesArg = process.argv[3];
	const initialPrompt = process.argv[4];

	const nt = numTracksArg ? parseInt(numTracksArg, 10) : 1;
	const nc = numCyclesArg ? parseInt(numCyclesArg, 10) : 1;

	if (Number.isNaN(nt)) {
		console.error("🔴 Invalid number of tracks provided.");
		process.exit(1);
	}

	if (Number.isNaN(nc)) {
		console.error("🔴 Invalid number of cycles provided.");
		process.exit(1);
	}

	// Initialize LLM models once (shared across all tracks)
	console.log("🔵 Initializing LLM models...");
	const { promptWriterModel, imageReaderModel } = await llms(config as Config);

	// Get image generation models from USE_GEN_MODELS
	const genModels = config.USE_GEN_MODELS.map(
		(m) =>
			config.MODELS.IMAGE_GENERATORS[
				m as keyof typeof config.MODELS.IMAGE_GENERATORS
			],
	);
	const genModel = genModels[0] ?? "";
	const genModelSecondary = genModels[1] ?? genModel;

	console.log(
		`🔵 Looping ${nt} tracks, ${nc} cycles each, starting from track ${startTrack}`,
	);

	// 3. Run each track sequentially
	for (let i = 0; i < nt; i++) {
		const currentTrack = startTrack + i;
		const trackPath = path.join(trackDir, currentTrack.toString());

		// Ensure track directory exists
		if (!fs.existsSync(trackPath)) {
			fs.mkdirSync(trackPath, { recursive: true });
		}

		console.log(`\n${"=".repeat(60)}`);
		console.log(`🔵 RUNNING TRACK ${currentTrack} (${i + 1}/${nt})`);
		console.log(`${"=".repeat(60)}\n`);

		try {
			await runPipeline({
				numCycles: nc,
				trackDir: trackPath,
				initialPrompt: initialPrompt || undefined,
				genModel,
				genModelSecondary,
				genModels,
				lightCycles: config.LIGHT_CYCLES,
				aiURL: config.AI_URL,
				promptWriterModelName: config.MODELS.PROMPT_WRITER,
				imageReaderModelName: config.MODELS.IMAGE_READER,
				promptWriterModel,
				imageReaderModel,
				width: config.GENERATE_DEFAULTS.WIDTH,
				height: config.GENERATE_DEFAULTS.HEIGHT,
				steps: config.GENERATE_DEFAULTS.STEPS,
				temperature: config.GENERATE_DEFAULTS.TEMPERATURE,
				creative: config.CREATIVE,
			});
		} catch (err) {
			console.error(`\n🔴 Track ${currentTrack} failed:`, err);
			process.exit(1);
		}
	}

	console.log(`\n🟢 Successfully completed ${nt} tracks!`);
};

go().catch((err) => {
	console.error(err);
	process.exit(1);
});
