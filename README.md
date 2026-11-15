# Garkbit

Automated image generation pipeline powered by local [Ollama](https://ollama.com) models. Garkbit runs iterative **analyse → re-prompt → generate** cycles: a vision model reads an image, a language model writes a refined prompt, and an image generator produces the next iteration — building on itself over multiple cycles, with creative pressure applied along the way (temperature ramps, model rotation, aspect-ratio variety, and random creative directives).

## Prerequisites

- [Bun](https://bun.sh) runtime
- [Ollama](https://ollama.com) running locally (default: `http://localhost:11434`)
- Required models pulled into Ollama (see `config.json` for model names)

## Setup

```bash
bun install
```

## Configuration

Edit `config.json` to set your models and defaults:

```jsonc
{
  "AI_URL": "http://localhost:11434", // Ollama server URL
  "API_KEY": "not-set-for-ollama", // API key (unused for local Ollama)
  "TRACK_PATH": ".tracks", // Output directory (relative to $HOME)
  "GENERATE_DEFAULTS": {
    "WIDTH": 1024,
    "HEIGHT": 1024,
    "STEPS": 8,
    "TEMPERATURE": 0.5, // Fallback temperature when no ramp is set
  },
  "LIGHT_CYCLES": 0, // Number of light cycles (50% size and steps) to run first
  "CREATIVE": {
    "TEMPERATURE_RAMP": [0.6, 0.7, 0.8, 0.9, 1.0], // Temperature per cycle; later cycles use the last value
    "MODEL_ROTATION": true, // Rotate through USE_GEN_MODELS by cycle
    "ASPECT_RATIO_VARIETY": true, // Rotate canvas shapes by cycle (square, landscape, portrait, widescreen, tall)
    "INJECTION_CHANCE": 0.25, // Random chance of injecting a creative directive each cycle
    "INJECTION_INTERVAL": 3, // Guaranteed directive injection every N cycles
  },
  "MODELS": {
    "PROMPT_WRITER": "...", // LLM for prompt generation
    "IMAGE_READER": "...", // Vision model for image analysis
    "IMAGE_GENERATORS": {
      // Available image generation models, you dont NEED all of these
      "zitbf16": "...",
      "zitfp8": "...",
      "f2k4b": "...",
      "f2k9b": "...",
    },
  },
  "USE_GEN_MODELS": ["zitfp8"], // The models that will be used for the image generations
}
```

### Creative directives

Roughly every `INJECTION_INTERVAL` cycles (and randomly with `INJECTION_CHANCE`), a directive is injected into the prompt-writer's input to push the loop in an unexpected direction — palette shifts, scale disruption, material swaps, perspective warps, and more. The full pool lives in `src/nodes/shared/creative-seeds.ts`.

## Usage

### New track (`index.ts`)

```bash
bun run index.ts <num_cycles> "[initial_prompt]"
```

| Argument         | Description                              |
| ---------------- | ---------------------------------------- |
| `num_cycles`     | Number of generation cycles to run (≥ 1) |
| `initial_prompt` | Optional seed prompt for cycle 0         |

**Example:**

```bash
bun run index.ts 5 "a fox in a misty forest at dawn"
```

This runs 5 cycles on the next available track, starting from the given prompt.

### Retrack an existing track (`retrack.ts`)

```bash
bun run retrack.ts <num_cycles> <track_number>
```

Adds more cycles to an existing track. The pipeline detects the last completed cycle from the track directory and resumes from there — so re-running with the same numbers is a no-op, and partial tracks can be finished or extended.

### Batch multiple tracks (`looper.ts`)

```bash
bun run looper.ts <num_tracks> <num_cycles> "[initial_prompt]"
```

Runs `num_tracks` tracks sequentially, each with `num_cycles` cycles, starting from the next available track number. LLM models are initialized once and shared across all tracks.

## How It Works

```
Cycle 0 (init):  seed prompt → prompt-zero agent → image generator → _0.png
Cycle 1..N:      _prev.png → resize → image-reader → prompt-writer → image generator → _N.png
```

The pipeline is built on [norkostrat](https://www.npmjs.com/package/norkostrat) (bus/store/runner) with five nodes: `promptZero` → `generate` → `imageResizer` → `imageReader` → `promptWriter`. The `generate` node decides at runtime whether to continue the loop or publish to `pipeline.complete`.

Resuming: on startup, the pipeline scans the track directory for `_<n>.png` files and starts from the highest completed cycle.

Each cycle writes to the track directory (`~/.tracks/<track_number>/`):

| File                 | Contents                                    |
| -------------------- | ------------------------------------------- |
| `_N.png`             | Generated image for cycle N                 |
| `prompt_initial.txt` | Seed prompt provided on the CLI (if any)    |
| `prompt_0.txt`       | Prompt used to generate cycle 0             |
| `prompt_N.txt`       | Prompt used to generate cycle N             |

Image analysis stays in-memory (the pipeline store) and is not written to disk.

## Project Structure

```
index.ts              # New track entry point
retrack.ts            # Resume/extend an existing track
looper.ts             # Batch runner for multiple tracks
src/pipeline/         # Pipeline definition (norkostrat) and run helpers
src/nodes/            # promptZero, generate, imageResizer, imageReader, promptWriter
src/nodes/shared/     # Ollama client, image utils, creative seeds, analysis schema
```

## Linting & Formatting

```bash
bun run lint        # biome lint
bun run format      # biome format --write
```
