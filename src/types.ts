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

export type PromptZero = {
	forward: (type: "art" | "photo", input: { model: LanguageModel; initial_prompt: string; }) => Promise<{ prompt: string; }>;
};


/** Application-level configuration loaded from config.json. */
export type Config = {
	AI_URL: string;
	API_KEY: string;
	TRACK_PATH: string;
	LIGHT_CYCLES?: number;
	USE_GEN_MODELS: string[];
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

