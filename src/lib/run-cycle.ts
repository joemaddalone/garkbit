import fs from "node:fs";
import path from "node:path";
import readImage from "./read-image";
import generate from "../agents/generate";
import type { LanguageModel } from "ai";
import type { ArtTeam, PhotoTeam } from "./team";
import type { ArtAnalysis, PhotoAnalysis, Config } from "../types";

/**
 * Runs a single analyze → re-prompt → generate cycle for the given team.
 * Works identically for both art and photo teams — the team's agents
 * carry the mode-specific behaviour.
 */
async function executeCycle<TAnalysis extends ArtAnalysis | PhotoAnalysis>(
	imageReader: {
		forward: (input: {
			model: LanguageModel;
			image: string;
			context?: string;
		}) => Promise<TAnalysis>;
	},
	promptWriter: {
		forward: (input: {
			model: LanguageModel;
			analysis: TAnalysis;
			cycle: number;
		}) => Promise<{ prompt: string; } | undefined>;
	},
	genModel: string,
	imageReaderModel: LanguageModel,
	promptWriterModel: LanguageModel,
	trackDir: string,
	cycle: number,
	config: Config,
	prevPrompt?: string,
) {
	const prevImagePath = `${trackDir}/_${cycle - 1}.png`;
	if (!fs.existsSync(prevImagePath)) {
		throw new Error(`Previous image not found: ${prevImagePath}`);
	}

	console.log(`📝 Analyzing image: _${cycle - 1}.png`);

	const analysis: TAnalysis = await readImage(
		imageReaderModel,
		imageReader,
		prevImagePath,
		prevPrompt,
	);
	fs.writeFileSync(
		`${trackDir}/description_${cycle}.txt`,
		JSON.stringify(analysis, null, 2),
	);

	console.log(`✍️  Generating new prompt...`);
	const promptResponse = await promptWriter.forward({
		model: promptWriterModel,
		analysis,
		cycle,
	});
	if (!promptResponse)
		throw new Error("Failed to generate prompt from prompt writer");
	const { prompt } = promptResponse;
	fs.writeFileSync(`${trackDir}/prompt_${cycle}.txt`, prompt);

	await generate({
		prompt,
		targetPath: `${trackDir}/_${cycle}.png`,
		model: genModel,
		width: config.GENERATE_DEFAULTS.WIDTH,
		height: config.GENERATE_DEFAULTS.HEIGHT,
		steps: config.GENERATE_DEFAULTS.STEPS,
		aiURL: config.AI_URL,
	});
}

/**
 * Executes a single analyze → re-prompt → generate cycle.
 *
 * @param team              The agent team (art or photo).
 * @param genModel          Name of the image-generation model to use.
 * @param imageReaderModel  Language model used for image analysis.
 * @param promptWriterModel Language model used for prompt writing.
 * @param trackDir          Absolute path to the track output directory.
 * @param cycle             Current cycle number (1-based).
 * @param config             Application configuration.
 * @param preserveContext   If true, feed the original prompt back as context.
 */
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

	let prevPrompt: string | undefined;
	if (preserveContext) {
		const prevPromptPath = path.join(trackDir, "prompt_0.txt");
		prevPrompt = fs.existsSync(prevPromptPath)
			? fs.readFileSync(prevPromptPath, "utf-8")
			: undefined;
	}

	if (team.mode === "art") {
		await executeCycle(
			team.imageReader,
			team.promptWriter,
			genModel,
			imageReaderModel,
			promptWriterModel,
			trackDir,
			cycle,
			config,
			prevPrompt,
		);
	} else {
		await executeCycle(
			team.imageReader,
			team.promptWriter,
			genModel,
			imageReaderModel,
			promptWriterModel,
			trackDir,
			cycle,
			config,
			prevPrompt,
		);
	}

	console.log(`✅ Cycle ${cycle} complete!`);
};
