import * as art_promptWriter from "../agents/art/prompt-writer.js";
import * as art_imageReader from "../agents/art/image-reader.js";
import * as art_prompt_zero from "../agents/art/prompt_zero.js";
import * as photo_promptWriter from "../agents/photo/prompt-writer.js";
import * as photo_imageReader from "../agents/photo/image-reader.js";
import * as photo_prompt_zero from "../agents/photo/prompt_zero.js";

export type ArtTeam = {
	mode: "art";
	promptWriter: typeof art_promptWriter;
	imageReader: typeof art_imageReader;
	promptZero: typeof art_prompt_zero;
};

export type PhotoTeam = {
	mode: "photo";
	promptWriter: typeof photo_promptWriter;
	imageReader: typeof photo_imageReader;
	promptZero: typeof photo_prompt_zero;
};

function team(mode: "art"): ArtTeam;
function team(mode: "photo"): PhotoTeam;
function team(mode: "art" | "photo"): ArtTeam | PhotoTeam {
	if (mode === "art") {
		return {
			mode: "art",
			promptWriter: art_promptWriter,
			imageReader: art_imageReader,
			promptZero: art_prompt_zero,
		};
	}
	return {
		mode: "photo",
		promptWriter: photo_promptWriter,
		imageReader: photo_imageReader,
		promptZero: photo_prompt_zero,
	};
}

export default team;