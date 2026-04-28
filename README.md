# Garkbit

Automated image generation pipeline powered by local [Ollama](https://ollama.com) models. Garkbit runs iterative **analyse → re-prompt → generate** cycles: a vision model reads an image, a language model writes a refined prompt, and an image generator produces the next iteration — building on itself over multiple cycles.

Supports two modes: **art** (paintings, illustrations, digital art) and **photo** (photorealistic imagery), each with tailored analysis schemas and prompt engineering.

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
  },
  "LIGHT_CYCLES": 0, // Number of light cycles to run (0 = no light cycles)
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
}
```

## Usage

```bash
bun run index.ts <num_cycles> "[initial_prompt]" "[art|photo]"
```

| Argument         | Description                              |
| ---------------- | ---------------------------------------- |
| `num_cycles`     | Number of generation cycles to run (≥ 1) |
| `initial_prompt` | Optional seed prompt for cycle 0         |

**Example:**

```bash
bun run index.ts 5 "a fox in a misty forest at dawn" "photo"
```

This runs 5 cycles on the next available track, starting from the given prompt.

## How It Works

```
Cycle 0 (init):  seed prompt → prompt-zero agent → image generator → _0.png
Cycle 1..N:      _prev.png → image-reader → prompt-writer → image generator → _N.png
```

Each cycle writes to the track directory (`~/.tracks/<track_number>/`):

| File                | Contents                         |
| ------------------- | -------------------------------- |
| `_N.png`            | Generated image for cycle N      |
| `prompt_N.txt`      | Prompt used to generate cycle N  |
| `description_N.txt` | Structured analysis of cycle N-1 |

## Linting & Formatting

```bash
bun run lint        # biome lint
bun run format      # biome format --write
```
