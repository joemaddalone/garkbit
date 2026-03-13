import { spawnSync } from "node:child_process";
import type { Config } from "../types";

/**
 * Unloads a model from the AI server.  No need to involve fetch here, just a curl.
 * @param model The model to unload.
 */
export default (model: string, config: Partial<Config>) => {
	const modelObject = JSON.stringify({ model: model, keep_alive: 0 });
	console.log(`🔵 Unloading model ${model}...`);
	spawnSync(
		"curl",
		[`${config.AI_URL}/api/generate`, "-d", modelObject],
		{
			cwd: __dirname,
			stdio: "ignore",
		},
	);
};
