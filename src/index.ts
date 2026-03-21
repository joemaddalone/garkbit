import team from "./lib/team.js";
import path from "node:path";
import unloadModel from "./lib/unload-model.js";
import initCycle from "./lib/init-cycle.js";
import runCycle from "./lib/run-cycle.js";
import llms from "./llms.js";
import type { Config } from "./types.js";
import * as os from "node:os";

export default async (config: Config, genModels: string[], medium: "art" | "photo", preserveContextMemory?: boolean) => {

	if (!genModels || genModels.length === 0) {
		console.log(
			"🔴 Needs one or two generative models.",
		);
		process.exit(1);
	}

	const firstGenModel = genModels[0] as string;
	const nonFirstGenModel = genModels.length > 1 ? genModels[1] as string : genModels[0] as string;

	unloadModel(config.MODELS.IMAGE_READER, config);
	unloadModel(config.MODELS.PROMPT_WRITER, config);
	for (const model of Object.values(config.MODELS.IMAGE_GENERATORS)) {
		unloadModel(model, config);
	}

	if (!config.numCycles || !config.trackNum) {
		console.log(
			"🔴 Usage: bun run automate.ts <num_cycles> <track_number> [initial_prompt]",
		);
		process.exit(1);
	}

	const trackDir = path.join(os.homedir(), config.TRACK_PATH, config.trackNum.toString());

	const agents = team(medium);
	const { promptWriterModel, imageReaderModel } = await llms(config);

	const initCycleResult = await initCycle(
		trackDir,
		agents.promptZero,
		firstGenModel,
		promptWriterModel,
		config,
	);


	if (!initCycleResult || !initCycleResult.cyclesToRun) {
		console.log(`🟢 Automation finished!`);
		process.exit(0);
	}
	const start = initCycleResult.lastCycleDetected + 1;
	const end = initCycleResult.cyclesToRun - 1 + start;
	console.log(`🟢 Starting cycles ${start} to ${end}...`);

	for (let i = start; i <= end; i++) {
		const useLightCycle = config.LIGHT_CYCLES && config.LIGHT_CYCLES > i;
		const mod = useLightCycle ? firstGenModel : nonFirstGenModel

		await runCycle(agents, mod, imageReaderModel, promptWriterModel, trackDir, i, config, preserveContextMemory);
	}

	console.log(`🟢 Automation finished!`);
};
