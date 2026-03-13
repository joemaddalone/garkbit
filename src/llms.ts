import { createOpenAI } from "@ai-sdk/openai";
import type { Config } from "./types.js";


export default async (config: Config) => {


	const ollama = createOpenAI({
		baseURL: `${config.AI_URL}/v1`,
		apiKey: config.API_KEY,
	});

	return {
		promptWriterModel: ollama(config.MODELS.PROMPT_WRITER),
		imageReaderModel: ollama(config.MODELS.IMAGE_READER),
	};

};
