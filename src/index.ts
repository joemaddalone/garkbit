import team from "./lib/team.js";
import path from "node:path";
import unloadModel from "./lib/unload-model.js";
import initCycle from "./lib/init-cycle.js";
import runCycle from "./lib/run-cycle.js";
import llms from "./llms.js";
import type { Config } from "./types.js";
import * as os from "node:os";


export default async (config: Config, genModels: string[], preserveContextMemory?: boolean) => {

	if (!genModels || genModels.length === 0) {
		console.log(
			"Needs one or two generative models.",
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
			"Usage: bun run automate.ts <num_cycles> <track_number> [initial_prompt]",
		);
		process.exit(1);
	}

	const trackDir = path.join(os.homedir(), config.TRACK_PATH, config.trackNum.toString());

	const agents = team("art");
	const { promptWriterModel, imageReaderModel } = await llms(config);

	const initCycleResult = await initCycle(
		trackDir,
		agents.promptZero,
		firstGenModel,
		promptWriterModel,
		config,
	);

	if (!initCycleResult) {
		console.log(`\n✨ Automation finished!`);
		process.exit(0);
	}

	for (let i = 1; i <= initCycleResult; i++) {
		await runCycle(agents, nonFirstGenModel, imageReaderModel, promptWriterModel, trackDir, i, config, preserveContextMemory);
	}

	console.log(`\n✨ Automation finished!`);
};
