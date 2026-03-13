import config from "./config.json";
import main from "./src/index.ts";

const go = async () => {

	const numCyclesArg = process.argv[2];
	const trackNumArg = process.argv[3];
	const initialPrompt = process.argv[4];

	if (!numCyclesArg || !trackNumArg) {
		console.log(
			"Usage: bun run automate.ts <num_cycles> <track_number> [initial_prompt]",
		);
		process.exit(1);
	}

	const numCycles = parseInt(numCyclesArg, 10);
	const trackNum = parseInt(trackNumArg, 10);

	if (numCycles < 1) {
		console.log("Number of cycles must be at least 1.");
		process.exit(1);
	}

	if (trackNum < 1) {
		console.log("Track number must be at least 1.");
		process.exit(1);
	}

	const mainConfig = {
		...config,
		numCycles,
		trackNum,
		initialPrompt: initialPrompt,
	};

	const genModels = [
		config.MODELS.IMAGE_GENERATORS.zitfp8,
		config.MODELS.IMAGE_GENERATORS.zitfp8,
	];


	main(mainConfig, genModels);
};

go().catch((err) => {
	console.error(err);
	process.exit(1);
});