import team from "./lib/team.js";
import path from "node:path";
import unloadModel from "./lib/unload-model.js";
import initCycle from "./lib/init-cycle.js";
import runCycle from "./lib/run-cycle.js";
import llms from "./llms.js";
import type { Config } from "./types.js";
import * as os from "node:os";


export default async (config: Config & { numCycles: string; trackNum: string; initialPrompt: string; }) => {
	const numCyclesArg = config.numCycles;
	const trackNumArg = config.trackNum;
	const initialPrompt = config.initialPrompt;

	const firstGenModel = config.MODELS.IMAGE_GENERATORS.zitfp8;
	const nonFirstGenModel = config.MODELS.IMAGE_GENERATORS.zitfp8;
	const preserveContextMemory = false;


	unloadModel(config.MODELS.IMAGE_READER, config);
	unloadModel(config.MODELS.PROMPT_WRITER, config);
	for (const model of Object.values(config.MODELS.IMAGE_GENERATORS)) {
		unloadModel(model, config);
	}

	if (!numCyclesArg || !trackNumArg) {
		console.log(
			"Usage: bun run automate.ts <num_cycles> <track_number> [initial_prompt]",
		);
		process.exit(1);
	}

	const numCycles = parseInt(numCyclesArg, 10);
	const trackNum = parseInt(trackNumArg, 10);
	const trackDir = path.join(os.homedir(), config.TRACK_PATH, trackNum.toString());

	const agents = team("art");
	const { promptWriterModel, imageReaderModel } = await llms(config);

	const initCycleResult = await initCycle(
		numCycles,
		trackDir,
		agents.promptZero,
		firstGenModel,
		promptWriterModel,
		config,
		initialPrompt,
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
