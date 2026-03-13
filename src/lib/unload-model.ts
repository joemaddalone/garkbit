import { spawnSync } from "node:child_process";
import type { Config } from "../types";

/**
 * Unloads a model from the Ollama server by sending a keep_alive=0 request.
 * This frees GPU/CPU resources between generation steps.
 *
 * @param model  The model identifier to unload.
 * @param config  Must contain `AI_URL` pointing at the Ollama server.
 */
export default (model: string, config: Pick<Config, "AI_URL">) => {
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
