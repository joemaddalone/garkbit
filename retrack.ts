import { runFromCLI } from "./src/pipeline/run.js";

const go = async () => {
  const numCyclesArg = process.argv[2];
  const trackNumArg = process.argv[3];

  if (!numCyclesArg || !trackNumArg) {
    console.log(
      "🔴 Usage: bun run retrack.ts <num_cycles> <track_number> [art|photo]",
    );
    process.exit(1);
  }

  const numCycles = parseInt(numCyclesArg, 10);
  const trackNum = parseInt(trackNumArg, 10);

  if (numCycles < 1) {
    console.log("🔴 Number of cycles must be at least 1.");
    process.exit(1);
  }

  if (trackNum < 1) {
    console.log("🔴 Track number must be at least 1.");
    process.exit(1);
  }

  console.log(`🔵 Retracking ${trackNum} with ${numCycles} cycles`);

  await runFromCLI(numCycles, trackNum, "");
};

go().catch((err) => {
  console.error(err);
  process.exit(1);
});
