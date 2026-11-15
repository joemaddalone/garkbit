/**
 * Creative seeds — a pool of directives, aspect ratios, and helpers that inject
 * variety and creative pressure into the generate loop.
 */

import type { CreativeConfig } from "../../types.js";

export type { CreativeConfig };

/** A single creative directive that can be injected into a prompt. */
export interface CreativeDirective {
  /** Short label for logging. */
  label: string;
  /** The instruction text appended to the prompt-writer input. */
  instruction: string;
}

/**
 * Curated pool of creative directives.  One is chosen at random when the
 * injection interval fires, giving the loop a push in an unexpected direction.
 */
export const CREATIVE_DIRECTIVES: CreativeDirective[] = [
  {
    label: "biomorphic",
    instruction:
      "Introduce biomorphic forms — shapes that echo living tissue, growth, or organic flow.",
  },
  {
    label: "complement-shift",
    instruction:
      "Shift the entire palette to complementary colors, inverting the dominant hues.",
  },
  {
    label: "motion-blur",
    instruction:
      "Add a strong sense of motion through directional blur, streaking, or implied velocity.",
  },
  {
    label: "double-exposure",
    instruction:
      "Layer a second, ghosted image on top — a faint double-exposure suggesting a memory or echo.",
  },
  {
    label: "macro-shift",
    instruction:
      "Radically change the camera distance — move from wide-shot to extreme close-up, or vice-versa.",
  },
  {
    label: "material-swap",
    instruction:
      "Replace the primary medium with an entirely different one (e.g., oil → neon, photo → charcoal, digital → stained glass).",
  },
  {
    label: "scale-disruption",
    instruction:
      "Disrupt scale: something tiny becomes monumental, or something vast becomes miniature.",
  },
  {
    label: "negative-space",
    instruction:
      "Drastically increase negative space — let emptiness dominate the composition.",
  },
  {
    label: "inversion",
    instruction:
      "Invert the emotional tone — if the image feels serene, make it ominous; if chaotic, make it meditative.",
  },
  {
    label: "symmetry-break",
    instruction:
      "Break any symmetry deliberately — introduce an off-axis element that destabilizes the composition.",
  },
  {
    label: "texture-storm",
    instruction:
      "Overwhelm the surface with texture — cracks, erosion, patina, or dense particulate detail.",
  },
  {
    label: "light-source-shift",
    instruction:
      "Change the light source completely — move from frontal light to harsh backlight, underlighting, or a single narrow beam.",
  },
  {
    label: "time-displacement",
    instruction:
      "Displace the image in time — render it as if from a different era, or as if aged centuries.",
  },
  {
    label: "perspective-warp",
    instruction:
      "Warp the perspective — fisheye, anamorphic squeeze, or an impossible Escher-like angle.",
  },
  {
    label: "chromatic-aberration",
    instruction:
      "Introduce chromatic aberration and lens artifacts — fringing, bloom, light leaks.",
  },
  {
    label: "surreal-merge",
    instruction:
      "Merge two unrelated subjects into a single impossible hybrid — a seamless chimera.",
  },
  {
    label: "pattern-emergence",
    instruction:
      "Let geometric or organic patterns emerge from the existing forms — tessellation, fractals, or recursive motifs.",
  },
  {
    label: "dissolve",
    instruction:
      "Let the edges of the subject dissolve into particles, smoke, or abstraction.",
  },
  {
    label: "architectural",
    instruction:
      "Introduce strong architectural or geometric structure where there was none — arches, frames, grids, or Brutalist forms.",
  },
  {
    label: "cinematic-reframe",
    instruction:
      "Reframe the scene as a cinematic still — anamorphic widescreen, dramatic depth of field, film grain.",
  },
];

/**
 * Aspect ratios for variety.  Each entry produces width/height that
 * multiply to approximately the default pixel count, keeping generation
 * cost roughly constant.
 */
export interface AspectRatioOption {
  label: string;
  width: number;
  height: number;
}

/** Common aspect ratios, normalized to ~1M px. */
export const ASPECT_RATIOS: AspectRatioOption[] = [
  { label: "square", width: 1024, height: 1024 },
  { label: "landscape", width: 1344, height: 768 },
  { label: "portrait", width: 768, height: 1344 },
  { label: "widescreen", width: 1536, height: 640 },
  { label: "tall", width: 640, height: 1536 },
];

/**
 * Default creative configuration.  Mirrors the CREATIVE block in config.json
 * so nodes that don't receive the full config still have sensible defaults.
 */
export const DEFAULT_CREATIVE: CreativeConfig = {
  TEMPERATURE_RAMP: [0.6, 0.7, 0.8, 0.9, 1.0],
  MODEL_ROTATION: true,
  ASPECT_RATIO_VARIETY: true,
  INJECTION_CHANCE: 0.25,
  INJECTION_INTERVAL: 3,
};

/* ───────────────── helpers ───────────────── */

/**
 * Pick a random creative directive from the pool.
 */
export function getRandomDirective(): CreativeDirective {
  const idx = Math.floor(Math.random() * CREATIVE_DIRECTIVES.length);
  return CREATIVE_DIRECTIVES[idx] ?? CREATIVE_DIRECTIVES[0];
}

/**
 * Decide whether to inject a creative directive this cycle.
 *
 * Fires on every INJECTION_INTERVAL-th cycle (0-indexed: 2, 5, 8, …) OR
 * randomly with INJECTION_CHANCE probability, whichever triggers first.
 *
 * @param cycle       Current cycle number (0-indexed).
 * @param config      Creative config (falls back to DEFAULT_CREATIVE).
 * @returns           A directive to inject, or null if not this cycle.
 */
export function maybeInjectCreative(
  cycle: number,
  config?: Partial<CreativeConfig>,
): CreativeDirective | null {
  const cfg = { ...DEFAULT_CREATIVE, ...config };

  // Interval-based injection — guaranteed pulse every N cycles
  if (cfg.INJECTION_INTERVAL > 0) {
    if (cycle > 0 && cycle % cfg.INJECTION_INTERVAL === 0) {
      return getRandomDirective();
    }
  }

  // Probability-based injection — random creative bursts
  if (Math.random() < cfg.INJECTION_CHANCE) {
    return getRandomDirective();
  }

  return null;
}

/**
 * Pick an aspect ratio for the given cycle.
 *
 * If variety is disabled, returns square.  Otherwise rotates through the
 * list deterministically by cycle, so the same track always gets the same
 * sequence.
 *
 * @param cycle     Current cycle number.
 * @param variety   Whether aspect-ratio variety is enabled.
 */
export function pickAspectRatio(
  cycle: number,
  variety: boolean,
): AspectRatioOption {
  if (!variety) return ASPECT_RATIOS[0] ?? { label: "square", width: 1024, height: 1024 };
  const idx = cycle % ASPECT_RATIOS.length;
  return ASPECT_RATIOS[idx] ?? ASPECT_RATIOS[0]!;
}

/**
 * Pick a temperature from the ramp for the given cycle.
 *
 * Cycles beyond the ramp length use the last (highest) value.
 *
 * @param cycle  Current cycle number.
 * @param ramp   Temperature ramp array (ascending).
 */
export function pickTemperature(cycle: number, ramp: number[]): number {
  if (ramp.length === 0) return 0.7;
  const idx = Math.min(cycle, ramp.length - 1);
  return ramp[idx] ?? 0.7;
}

/**
 * Pick a model from the list, rotating by cycle.
 *
 * @param cycle    Current cycle number.
 * @param models   Available model identifiers.
 * @param rotate   Whether to rotate (if false, always uses models[0]).
 */
export function pickModel(
  cycle: number,
  models: string[],
  rotate: boolean,
): string {
  if (models.length === 0) return "";
  if (!rotate || models.length === 1) return models[0] ?? "";
  const idx = cycle % models.length;
  return models[idx] ?? models[0] ?? "";
}
