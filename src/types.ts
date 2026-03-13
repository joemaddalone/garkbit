import type { LanguageModel } from "ai";

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

export type ImageReader_Art = {
	forward: (input: { model: LanguageModel; image: string; context?: string; }) => Promise<ArtAnalysis>;
};

export type PromptWriter_Art = {
	forward: (input: { model: LanguageModel; analysis: ArtAnalysis; cycle: number; }) => Promise<{ prompt: string; }>;
};

export type PromptZero_Art = {
	forward: (input: { model: LanguageModel; initial_prompt: string; }) => Promise<{ prompt: string; }>;
};

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

export type ImageReader_Photo = {
	forward: (input: { model: LanguageModel; image: string; context?: string; }) => Promise<PhotoAnalysis>;
};

export type PromptWriter_Photo = {
	forward: (input: { model: LanguageModel; analysis: PhotoAnalysis; cycle: number; }) => Promise<{ prompt: string; }>;
};

export type PromptZero_Photo = {
	forward: (input: { model: LanguageModel; initial_prompt: string; }) => Promise<{ prompt: string; }>;
};

export type Config = {
	AI_URL: string;
	API_KEY: string;
	TRACK_PATH: string;
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
};
