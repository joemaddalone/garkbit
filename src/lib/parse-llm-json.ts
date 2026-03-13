import type { ZodSchema } from "zod";

/**
 * Extracts a JSON object from raw LLM text, normalises nested values
 * (arrays / objects → flat strings), and validates against the given Zod schema.
 *
 * @param text  Raw text returned by the language model.
 * @param schema  Zod schema that describes the expected shape.
 * @returns  The validated, typed object.
 */
export default function parseLlmJson<T>(text: string, schema: ZodSchema<T>): T {
	const jsonMatch = text.match(/\{[\s\S]*\}/);
	const jsonString = jsonMatch ? jsonMatch[0] : text;
	const parsed = JSON.parse(jsonString);

	// Flatten any nested arrays or objects into plain strings
	for (const key in parsed) {
		if (Array.isArray(parsed[key])) {
			parsed[key] = parsed[key].join(", ");
		} else if (typeof parsed[key] === "object" && parsed[key] !== null) {
			parsed[key] = Object.entries(parsed[key])
				.map(([k, v]) => `${k}: ${v}`)
				.join(", ");
		}
	}

	return schema.parse(parsed);
}
