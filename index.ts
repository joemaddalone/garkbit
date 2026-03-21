import config from "./config.json";
import main from "./src/index.ts";

const go = async () => {

	const numCyclesArg = process.argv[2];
	const trackNumArg = process.argv[3];
	const initialPrompt = process.argv[4];
	const mode = process.argv[5] as "art" | "photo";

	if (!numCyclesArg || !trackNumArg) {
		console.log(
			"🔴 Usage: bun run automate.ts <num_cycles> <track_number> [initial_prompt] [mode]",
		);
		process.exit(1);
	}

	const numCycles = parseInt(numCyclesArg, 10);
	const trackNum = parseInt(trackNumArg, 10);

	if (numCycles < 1) {
		console.log("🔴 Number of cycles must be at least 1.");
		process.exit(1);
	}

	if (trackNum < 1) {
		console.log("🔴 Track number must be at least 1.");
		process.exit(1);
	}

	const mainConfig = {
		...config,
		numCycles,
		trackNum,
		initialPrompt: initialPrompt,
	};

	// You need to set at least one of these from the models in config.json and available in Ollama
	// The first model is used for the first cycle, the second model is used for the remaining cycles
	// If you only want to use one model, just set one model, or set both to the same model
	const genModels = [
		config.MODELS.IMAGE_GENERATORS.zitfp8,
		config.MODELS.IMAGE_GENERATORS.zitfp8,
	];


	main(mainConfig, genModels, mode || "art", true);
};

go().catch((err) => {
	console.error(err);
	process.exit(1);
});