import fs from "node:fs";
import { resolve } from "node:path";
import type { PromptZero_Art, PromptZero_Photo, Config } from "../types";
import type { LanguageModel } from "ai";
import generate from "../agents/generate";

export default async (
	numCycles: number,
	trackDir: string,
	promptZero: PromptZero_Art | PromptZero_Photo,
	model: string,
	promptWriterModel: LanguageModel,
	config: Config,
	initialPrompt?: string,
): Promise<number | undefined> => {

	if (!fs.existsSync(trackDir)) {
		console.log(`📂 Creating directory: ${trackDir}`);
		fs.mkdirSync(trackDir, { recursive: true });
	}

	// Cycle 0: Handle initial prompt if provided and _0.png doesn't exist
	const image0 = resolve(trackDir, "_0.png");
	if (initialPrompt && !fs.existsSync(image0)) {
		console.log(`\n🚀 Starting Cycle 0 (Initial Prompt)...`);
		fs.writeFileSync(resolve(trackDir, `prompt_0.txt`), initialPrompt);
		const { prompt } = await promptZero.forward({ model: promptWriterModel, initial_prompt: initialPrompt });
		fs.writeFileSync(resolve(trackDir, `prompt_0z.txt`), prompt);

		await generate(prompt, image0, model, config.GENERATE_DEFAULTS.WIDTH, config.GENERATE_DEFAULTS.HEIGHT, config.GENERATE_DEFAULTS.STEPS, config.AI_URL);
		console.log(`✅ Cycle 0 complete!`);
	} else if (!fs.existsSync(image0)) {
		console.error(
			`❌ Cycle 0 image (_0.png) not found in ${trackDir} and no initial prompt provided.`,
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
	console.log(`🔍 Detected last completed cycle: ${lastCycleDetected}`);

	const cyclesToRun = numCycles - lastCycleDetected;
	if (cyclesToRun <= 0) {
		console.log(`✨ All requested ${numCycles} cycles are already complete.`);
		return;
	}

	return cyclesToRun;

	// for (let i = 1; i <= cyclesToRun; i++) {
	// 	await runCycle(trackDir, lastCycleDetected + i);
	// }

	// console.log(`\n✨ Automation finished!`);
};
