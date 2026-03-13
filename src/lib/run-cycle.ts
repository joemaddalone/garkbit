import fs from "node:fs";
import path from "node:path";
import readImage from "./read-image";
import generate from "../agents/generate";
import type { LanguageModel } from "ai";
import type { ArtTeam, PhotoTeam } from "./team";
import type { ArtAnalysis, PhotoAnalysis, Config } from "../types";

export default async (
	team: ArtTeam | PhotoTeam,
	genModel: string,
	imageReaderModel: LanguageModel,
	promptWriterModel: LanguageModel,
	trackDir: string,
	cycle: number,
	config: Config,
	preserveContext?: boolean,
) => {
	console.log(`\n🚀 Starting Cycle ${cycle}...`);
	//
	const prevImagePath = `${trackDir}/_${cycle - 1}.png`;
	if (!fs.existsSync(prevImagePath)) {
		throw new Error(`Previous image not found: ${prevImagePath}`);
	}

	console.log(`📝 Analyzing image: _${cycle - 1}.png`);
	let prevPrompt: string | undefined;
	if (preserveContext) {
		const prevPromptPath = path.join(trackDir, `prompt_0.txt`);
		prevPrompt = fs.existsSync(prevPromptPath)
			? fs.readFileSync(prevPromptPath, "utf-8")
			: undefined;
	}

	if (team.mode === "art") {
		const analysis: ArtAnalysis = await readImage(
			imageReaderModel,
			team.imageReader,
			prevImagePath,
			prevPrompt,
		);
		fs.writeFileSync(
			`${trackDir}/description_${cycle}.txt`,
			JSON.stringify(analysis, null, 2),
		);

		console.log(`✍️  Generating new prompt...`);
		const promptResponse = await team.promptWriter.forward({
			model: promptWriterModel,
			analysis,
			cycle,
		});
		if (!promptResponse)
			throw new Error("Failed to generate prompt from prompt writer");
		const { prompt } = promptResponse;
		fs.writeFileSync(`${trackDir}/prompt_${cycle}.txt`, prompt);

		await generate(prompt, `${trackDir}/_${cycle}.png`, genModel, config.GENERATE_DEFAULTS.WIDTH, config.GENERATE_DEFAULTS.HEIGHT, config.GENERATE_DEFAULTS.STEPS, config.AI_URL);
	} else {
		const analysis: PhotoAnalysis = await readImage(
			imageReaderModel,
			team.imageReader,
			prevImagePath,
			prevPrompt,
		);
		fs.writeFileSync(
			`${trackDir}/description_${cycle}.txt`,
			JSON.stringify(analysis, null, 2),
		);

		console.log(`✍️  Generating new prompt...`);
		const promptResponse = await team.promptWriter.forward({
			model: promptWriterModel,
			analysis,
			cycle,
		});
		if (!promptResponse)
			throw new Error("Failed to generate prompt from prompt writer");
		const { prompt } = promptResponse;
		fs.writeFileSync(`${trackDir}/prompt_${cycle}.txt`, prompt);

		await generate(prompt, `${trackDir}/_${cycle}.png`, genModel, config.GENERATE_DEFAULTS.WIDTH, config.GENERATE_DEFAULTS.HEIGHT, config.GENERATE_DEFAULTS.STEPS, config.AI_URL);
	}

	console.log(`✅ Cycle ${cycle} complete!`);
};
