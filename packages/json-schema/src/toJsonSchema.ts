import type { Decoder, DecoderSchema, Issues } from "katabami";
import { convertSchema } from "./convert";
import {
	type JsonSchema,
	SUPPORTED_TARGETS,
	type SupportedTarget,
	type ToJsonSchemaOptions,
} from "./types/jsonSchema";
import type { StandardJSONSchemaV1 } from "./types/standardJsonSchema";

type AnyDecoder = Decoder<unknown, Issues, boolean>;

const isDecoderSchema = (value: unknown): value is DecoderSchema =>
	typeof value === "object" &&
	value !== null &&
	"kind" in value &&
	typeof (value as { kind: unknown }).kind === "string";

const isDecoder = (value: unknown): value is AnyDecoder =>
	typeof value === "object" &&
	value !== null &&
	"getSchema" in value &&
	typeof (value as { getSchema: unknown }).getSchema === "function";

const resolveSchema = (input: AnyDecoder | DecoderSchema): DecoderSchema => {
	if (isDecoderSchema(input) && !isDecoder(input)) {
		return input;
	}

	if (!isDecoder(input)) {
		throw new TypeError("Expected a Katabami Decoder or DecoderSchema");
	}

	const schema = input.getSchema();

	if (schema instanceof Promise) {
		throw new Error(
			"Async DecoderSchema is not supported by toJsonSchema; resolve getSchema() first",
		);
	}

	return schema;
};

const assertSupportedTarget = (
	target: StandardJSONSchemaV1.Target,
): SupportedTarget => {
	if ((SUPPORTED_TARGETS as readonly string[]).includes(target)) {
		return target as SupportedTarget;
	}

	throw new Error(`Unsupported target: ${target}`);
};

const withSchemaUri = (
	schema: JsonSchema,
	target: SupportedTarget,
): JsonSchema => {
	if (target === "draft-2020-12") {
		return {
			$schema: "https://json-schema.org/draft/2020-12/schema",
			...schema,
		};
	}

	if (target === "draft-07") {
		return {
			$schema: "http://json-schema.org/draft-07/schema#",
			...schema,
		};
	}

	return schema;
};

/**
 * Converts a Katabami decoder or {@link DecoderSchema} to JSON Schema.
 *
 * @param {AnyDecoder | DecoderSchema} input - A decoder or its accepted-value schema.
 * @param {StandardJSONSchemaV1.Options | ToJsonSchemaOptions} options - Conversion options. Defaults to `draft-2020-12`.
 * @returns {JsonSchema} The JSON Schema.
 */
export function toJsonSchema(
	input: AnyDecoder | DecoderSchema,
	options: StandardJSONSchemaV1.Options | ToJsonSchemaOptions = {},
): JsonSchema {
	const target = assertSupportedTarget(options.target ?? "draft-2020-12");
	const schema = resolveSchema(input);

	return withSchemaUri(convertSchema(schema, target), target);
}
