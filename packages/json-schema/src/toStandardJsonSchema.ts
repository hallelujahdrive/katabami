import type { Decoder, Issues, StandardSchemaV1 } from "katabami";
import { toJsonSchema } from "./toJsonSchema.js";
import type { StandardJSONSchemaV1 } from "./types/standardJsonSchema.js";

/**
 * An object that implements both Standard Schema and Standard JSON Schema.
 */
export type StandardJsonSchema<
	Input = unknown,
	Output = Input,
> = StandardJSONSchemaV1<Input, Output> & StandardSchemaV1<Input, Output>;

/**
 * Wraps a Katabami decoder as a {@link StandardJSONSchemaV1}-compliant object.
 *
 * The returned value also preserves the decoder's Standard Schema `validate`.
 *
 * @param {Decoder<T, Issues, boolean>} decoder - The decoder to wrap.
 * @returns {StandardJsonSchema<T>} The Standard JSON Schema object.
 */
export function toStandardJsonSchema<T>(
	decoder: Decoder<T, Issues, boolean>,
): StandardJsonSchema<T> {
	return {
		"~standard": {
			...decoder["~standard"],
			jsonSchema: {
				input(options) {
					return toJsonSchema(decoder, options);
				},
				output(options) {
					// DecoderSchema describes accepted input values; map/andThen keep that shape.
					return toJsonSchema(decoder, options);
				},
			},
		},
	};
}
