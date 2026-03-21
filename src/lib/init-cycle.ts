import fs from "node:fs";
import { resolve } from "node:path";
import type { PromptZero_Art, PromptZero_Photo, Config } from "../types";
import type { LanguageModel } from "ai";
import generate from "../agents/generate";

/**
 * Handles the initial (cycle-0) setup: creates the track directory if needed,
 * generates the first image from a user seed, and determines how many cycles
 * still need to run.
 *
 * @returns The number of remaining cycles to execute, or `undefined` if all are done.
 */
export default async (
	trackDir: string,
	promptZero: PromptZero_Art | PromptZero_Photo,
	model: string,
	promptWriterModel: LanguageModel,
	config: Config,
): Promise<{ cyclesToRun: number; lastCycleDetected: number; } | undefined> => {

	if (!fs.existsSync(trackDir)) {
		console.log(`🔵 Creating directory: ${trackDir}`);
		fs.mkdirSync(trackDir, { recursive: true });
	}

	// Cycle 0: Handle initial prompt if provided and _0.png doesn't exist
	const image0 = resolve(trackDir, "_0.png");
	if (config.initialPrompt && !fs.existsSync(image0)) {
		console.log(`🟢 Starting Cycle 0 (Initial Prompt)...`);
		fs.writeFileSync(resolve(trackDir, "prompt_0.txt"), config.initialPrompt);
		const { prompt } = await promptZero.forward({ model: promptWriterModel, initial_prompt: config.initialPrompt });
		fs.writeFileSync(resolve(trackDir, "prompt_0z.txt"), prompt);

		const width = config.LIGHT_CYCLES ? config.GENERATE_DEFAULTS.WIDTH / 2 : config.GENERATE_DEFAULTS.WIDTH
		const height = config.LIGHT_CYCLES ? config.GENERATE_DEFAULTS.WIDTH / 2 : config.GENERATE_DEFAULTS.WIDTH
		const steps = config.LIGHT_CYCLES ? config.GENERATE_DEFAULTS.STEPS / 2 : config.GENERATE_DEFAULTS.STEPS

		await generate({
			prompt,
			targetPath: image0,
			model,
			width,
			height,
			steps,
			aiURL: config.AI_URL,
		});
		console.log(`🟢 Cycle 0 complete!`);
	} else if (!fs.existsSync(image0)) {
		console.error(
			`🔴 Cycle 0 image (_0.png) not found in ${trackDir} and no initial prompt provided.`,
		);
		process.exit(1);
	}

	// Detect where we left off
	const files = fs.readdirSync(trackDir);
	const cyclesDetected = files
		.filter(
			(f) => f.startsWith("_") && f.endsWith(".png") && !f.includes(".out."),
		)
		.map((f) => parseInt(f.match(/_(\d+)\.png/)?.[1] || "-1", 10))
		.filter((c) => c >= 0);


	const lastCycleDetected =
		cyclesDetected.length > 0 ? Math.max(...cyclesDetected) : 0;
	console.log(`🔵 Detected last completed cycle: ${lastCycleDetected}`);

	const cyclesToRun = config.numCycles - lastCycleDetected;
	if (cyclesToRun <= 0) {
		console.log(`🟢 All requested ${config.numCycles} cycles are already complete.`);
		return;
	}

	return { cyclesToRun, lastCycleDetected };
};
