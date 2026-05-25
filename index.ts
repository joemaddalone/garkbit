import config from "./config.json";
import { runFromCLI } from "./src/pipeline/run.js";
import fs from "node:fs";
import path from "node:path";
import * as os from "node:os";

const go = async () => {
  const numCyclesArg = process.argv[2];
  const initialPrompt = process.argv[3];

  if (!numCyclesArg) {
    console.log("🔴 Usage: bun run index.ts <num_cycles> [initial_prompt]");
    process.exit(1);
  }

  const numCycles = parseInt(numCyclesArg, 10);

  if (numCycles < 1) {
    console.log("🔴 Number of cycles must be at least 1.");
    process.exit(1);
  }

  // Find the next available track number
  const trackPath = path.join(os.homedir(), config.TRACK_PATH);
  const existingTracks = fs
    .readdirSync(trackPath)
    .map((f) => Number(f))
    .filter((f) => !Number.isNaN(f));
  existingTracks.sort((a, b) => a - b);
  const trackNum = (existingTracks.pop() || 0) + 1;

  console.log(`🔵 Starting new track ${trackNum} with ${numCycles} cycles`);

  await runFromCLI(numCycles, trackNum, initialPrompt ?? "");
};

go().catch((err) => {
  console.error(err);
  process.exit(1);
});
