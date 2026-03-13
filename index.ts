import config from "./src/config.json";
import type { Config } from "./src/types.js";
import main from "./src/index.ts";


const go = async () => {

	const numCyclesArg = process.argv[2];
	const trackNumArg = process.argv[3];
	const initialPrompt = process.argv[4];

	const mainConfig = {
		...config,
		numCycles: numCyclesArg,
		trackNum: trackNumArg,
		initialPrompt: initialPrompt,
	};


	main(mainConfig as Config & { numCycles: string; trackNum: string; initialPrompt: string; });
};

go().catch((err) => {
	console.error(err);
	process.exit(1);
});