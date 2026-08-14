import type { DecoderSchema } from "katabami";
import type { JsonSchema, SupportedTarget } from "./types/jsonSchema";

const isOptional = (
	schema: DecoderSchema,
): schema is Extract<DecoderSchema, { kind: "optional" }> =>
	schema.kind === "optional";

const convertNullable = (
	schema: DecoderSchema,
	target: SupportedTarget,
): JsonSchema => {
	const inner = convertSchema(schema, target);

	if (target === "openapi-3.0") {
		return { ...inner, nullable: true };
	}

	if (typeof inner.type === "string") {
		return { ...inner, type: [inner.type, "null"] };
	}

	return { anyOf: [inner, { type: "null" }] };
};

const convertConstant = (
	value: unknown,
	target: SupportedTarget,
): JsonSchema => {
	if (target === "openapi-3.0") {
		return { enum: [value] };
	}

	return { const: value };
};

const convertTuple = (
	elements: readonly DecoderSchema[],
	target: SupportedTarget,
): JsonSchema => {
	const converted = elements.map((element) => convertSchema(element, target));

	if (target === "draft-2020-12") {
		const result: JsonSchema = {
			items: false,
			type: "array",
		};

		if (converted.length > 0) {
			result.prefixItems = converted;
		}

		return result;
	}

	if (target === "openapi-3.0") {
		const result: JsonSchema = {
			maxItems: converted.length,
			minItems: converted.length,
			type: "array",
		};
		const [onlyItem] = converted;

		if (converted.length === 1 && onlyItem !== undefined) {
			result.items = onlyItem;
		} else if (converted.length > 1) {
			result.items = { anyOf: converted };
		}

		return result;
	}

	const result: JsonSchema = {
		additionalItems: false,
		maxItems: converted.length,
		minItems: converted.length,
		type: "array",
	};

	if (converted.length > 0) {
		result.items = converted;
	}

	return result;
};

const convertObject = (
	properties: Readonly<Record<string, DecoderSchema>>,
	target: SupportedTarget,
): JsonSchema => {
	const jsonProperties: Record<string, JsonSchema> = {};
	const required: string[] = [];

	for (const [key, schema] of Object.entries(properties)) {
		if (isOptional(schema)) {
			jsonProperties[key] = convertNullable(schema.schema, target);
			continue;
		}

		jsonProperties[key] = convertSchema(schema, target);
		required.push(key);
	}

	const result: JsonSchema = {
		properties: jsonProperties,
		type: "object",
	};

	if (required.length > 0) {
		result.required = required;
	}

	return result;
};

const convertMap = (
	decoders: readonly DecoderSchema[],
	target: SupportedTarget,
): JsonSchema => {
	if (decoders.length === 0) {
		return {};
	}

	const fields = decoders.filter(
		(decoder): decoder is Extract<DecoderSchema, { kind: "field" }> =>
			decoder.kind === "field",
	);

	if (fields.length === decoders.length) {
		const properties: Record<string, DecoderSchema> = {};

		for (const field of fields) {
			properties[field.key] = field.schema;
		}

		return convertObject(properties, target);
	}

	return {
		allOf: decoders.map((decoder) => convertSchema(decoder, target)),
	};
};

const convertField = (
	key: string,
	schema: DecoderSchema,
	target: SupportedTarget,
): JsonSchema => {
	if (isOptional(schema)) {
		return {
			properties: {
				[key]: convertNullable(schema.schema, target),
			},
			type: "object",
		};
	}

	return {
		properties: {
			[key]: convertSchema(schema, target),
		},
		required: [key],
		type: "object",
	};
};

const convertIndex = (
	index: number,
	schema: DecoderSchema,
	target: SupportedTarget,
): JsonSchema => {
	if (target === "openapi-3.0") {
		return {
			minItems: index + 1,
			type: "array",
		};
	}

	const item = convertSchema(schema, target);
	const items = Array.from({ length: index + 1 }, (_, i) =>
		i === index ? item : true,
	);

	if (target === "draft-2020-12") {
		return {
			minItems: index + 1,
			prefixItems: items,
			type: "array",
		};
	}

	return {
		items: items.map((entry) => (entry === true ? {} : entry)),
		minItems: index + 1,
		type: "array",
	};
};

/**
 * Converts a {@link DecoderSchema} to a JSON Schema fragment (without `$schema`).
 * @param {DecoderSchema} schema - The schema to convert.
 * @param {SupportedTarget} target - The target version of JSON Schema to convert to.
 * @returns {JsonSchema} The JSON Schema fragment.
 */
export const convertSchema = (
	schema: DecoderSchema,
	target: SupportedTarget,
): JsonSchema => {
	switch (schema.kind) {
		case "array": {
			const result: JsonSchema = {
				items: convertSchema(schema.element, target),
				type: "array",
			};

			if (schema.minItems !== undefined) {
				result.minItems = schema.minItems;
			}

			return result;
		}
		case "boolean":
			return { type: "boolean" };
		case "constant":
			return convertConstant(schema.value, target);
		case "field":
			return convertField(schema.key, schema.schema, target);
		case "index":
			return convertIndex(schema.index, schema.schema, target);
		case "integer":
			return { type: "integer" };
		case "map":
			return convertMap(schema.decoders, target);
		case "never":
			return { not: {} };
		case "nullable":
			return convertNullable(schema.schema, target);
		case "number":
			return { type: "number" };
		case "object":
			return convertObject(schema.properties, target);
		case "optional":
			return convertNullable(schema.schema, target);
		case "record":
			return {
				additionalProperties: convertSchema(schema.value, target),
				type: "object",
			};
		case "string":
			return { type: "string" };
		case "tuple":
			return convertTuple(schema.elements, target);
		case "union":
			return {
				anyOf: schema.variants.map((variant) => convertSchema(variant, target)),
			};
		case "unknown":
			return {};
	}
};
