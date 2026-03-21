import type { LanguageModel } from "ai";

/** Structured analysis returned by the art image-reader agent. */
export type ArtAnalysis = {
	subject: string;
	description: string;
	tone: string;
	medium: string;
	surface: string;
	artisticStyle: string;
	brushworkOrDetail: string;
	composition: string;
	lighting: string;
	colorPalette: string;
	notableTraits: string;
	overallFeeling: string;
};

/** Structured analysis returned by the photo image-reader agent. */
export type PhotoAnalysis = {
	subject: string;
	style: string;
	description: string;
	tone: string;
	notable: string;
	cameraPosition: string;
	composition: string;
	lighting: string;
	atmospherics: string;
	lensType: string;
	motionInTheScene: string;
	colorScheme: string;
	sceneDetails: string;
	overallFeeling: string;
};

/** Contract for a prompt-zero agent (art variant). */
export type PromptZero_Art = {
	forward: (input: { model: LanguageModel; initial_prompt: string; }) => Promise<{ prompt: string; }>;
};

/** Contract for a prompt-zero agent (photo variant). */
export type PromptZero_Photo = {
	forward: (input: { model: LanguageModel; initial_prompt: string; }) => Promise<{ prompt: string; }>;
};

/** Application-level configuration loaded from config.json. */
export type Config = {
	AI_URL: string;
	API_KEY: string;
	TRACK_PATH: string;
	LIGHT_CYCLES?: number;
	GENERATE_DEFAULTS: {
		WIDTH: number;
		HEIGHT: number;
		STEPS: number;
	};
	MODELS: {
		PROMPT_WRITER: string;
		IMAGE_READER: string;
		IMAGE_GENERATORS: {
			zitbf16: string;
			zitfp8: string;
			f2k4b: string;
			f2k9b: string;
		};
	};
	numCycles: number;
	trackNum: number;
	initialPrompt?: string;
};

