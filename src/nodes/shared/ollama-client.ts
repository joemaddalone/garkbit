/**
 * Response from Ollama's /api/generate endpoint.
 */
export interface OllamaGenerateResponse {
  image?: string;
  error?: string;
}

/**
 * Parameters for an Ollama image generation request.
 */
export interface GenerateParams {
  model: string;
  prompt: string;
  width: number;
  height: number;
  steps: number;
  aiURL: string;
}

/**
 * Call Ollama's /api/generate endpoint and return the response.
 */
export async function generateImage(params: GenerateParams): Promise<OllamaGenerateResponse> {
  const { model, prompt, width, height, steps, aiURL } = params;

  const req = await fetch(`${aiURL}/api/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      prompt,
      width,
      height,
      stream: false,
      steps,
      options: {
        temperature: 0.5,
      },
    }),
  });

  return (await req.json()) as OllamaGenerateResponse;
}

/**
 * Calculate dimensions based on whether this is a light cycle.
 */
export function calcDimensions(
  lightCycle: boolean,
  defaultSize: number,
  defaultSteps: number,
): { width: number; height: number; steps: number } {
  const scale = lightCycle ? 0.5 : 1;
  return {
    width: Math.round(defaultSize * scale),
    height: Math.round(defaultSize * scale),
    steps: Math.round(defaultSteps * scale),
  };
}
