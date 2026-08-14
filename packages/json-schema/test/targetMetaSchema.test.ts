import {
	type SchemaObject,
	validate,
} from "@hyperjump/json-schema/draft-2020-12";
import "@hyperjump/json-schema/draft-07";
import { BASIC } from "@hyperjump/json-schema/experimental";
import "@hyperjump/json-schema/openapi-3-0";
import * as katabami from "katabami";
import { describe, expect, test } from "vitest";
import { toJsonSchema, toStandardJsonSchema } from "../src/index.js";
import {
	type JsonSchema,
	SUPPORTED_TARGETS,
	type SupportedTarget,
} from "../src/types/jsonSchema.js";

const META_SCHEMA_URI = {
	"draft-07": "http://json-schema.org/draft-07/schema#",
	"draft-2020-12": "https://json-schema.org/draft/2020-12/schema",
	"openapi-3.0": "https://spec.openapis.org/oas/3.0/dialect",
} as const satisfies Record<SupportedTarget, string>;

const fixtures: Record<string, Parameters<typeof toJsonSchema>[0]> = {
	array: katabami.array(katabami.string()),
	at: katabami.at(["person", "name"], katabami.string()),
	boolean: katabami.boolean(),
	constant: katabami.constant("foo"),
	constantNull: katabami.constant(null),
	decoderSchema: { kind: "string" },
	field: katabami.field("name", katabami.string()),
	fieldNullable: katabami.field("name", katabami.nullable(katabami.string())),
	fieldOptional: katabami.field("name", katabami.optional(katabami.string())),
	index: katabami.index(1, katabami.int()),
	integer: katabami.int(),
	mapAllOf: katabami.map(
		(name, age) => [name, age] as const,
		katabami.string(),
		katabami.int(),
	),
	mapFields: katabami.map(
		(name, age) => ({ age, name }),
		katabami.field("name", katabami.string()),
		katabami.field("age", katabami.int()),
	),
	nestedObject: katabami.object({
		items: katabami.array(katabami.string()),
		user: katabami.object({
			age: katabami.int(),
			name: katabami.optional(katabami.string()),
		}),
	}),
	never: katabami.failed(),
	nullable: katabami.nullable(katabami.string()),
	nullableUnion: katabami.nullable(
		katabami.union(katabami.string(), katabami.int()),
	),
	number: katabami.float(),
	object: katabami.object({
		age: katabami.int(),
		name: katabami.optional(katabami.string()),
	}),
	objectNullable: katabami.object({
		age: katabami.int(),
		name: katabami.nullable(katabami.string()),
	}),
	oneOrMore: katabami.oneOrMore(katabami.string()),
	optional: katabami.optional(katabami.string()),
	optionalUnion: katabami.optional(
		katabami.union(katabami.string(), katabami.int()),
	),
	record: katabami.record(katabami.int()),
	string: katabami.string(),
	tuple: katabami.tuple(katabami.string(), katabami.int()),
	tupleEmpty: { elements: [], kind: "tuple" },
	tupleSingle: katabami.tuple(katabami.string()),
	union: katabami.union(katabami.string(), katabami.int()),
	unknown: katabami.value(),
};

const validateTargetSchema = (target: SupportedTarget, schema: JsonSchema) =>
	validate(META_SCHEMA_URI[target], schema as SchemaObject, BASIC);

describe.each(SUPPORTED_TARGETS)("target %s meta-schema", (target) => {
	test.each(Object.entries(fixtures))("%s is valid", async (name, decoder) => {
		const schema = toJsonSchema(decoder, { target });
		const output = await validateTargetSchema(target, schema);

		expect(
			output.valid,
			`${name}: ${JSON.stringify(
				{
					errors: output.valid ? undefined : output.errors,
					schema,
				},
				null,
				2,
			)}`,
		).toBe(true);
	});

	test("toStandardJsonSchema input matches the target spec", async () => {
		const schema = toStandardJsonSchema(katabami.string());
		const json = schema["~standard"].jsonSchema.input({ target });
		const output = await validateTargetSchema(target, json);

		expect(output.valid, JSON.stringify(json, null, 2)).toBe(true);
	});
});

describe("meta-schema harness", () => {
	test("rejects OpenAPI Schema Objects that use const", async () => {
		const output = await validateTargetSchema("openapi-3.0", {
			const: "foo",
		});

		expect(output.valid).toBe(false);
	});

	test("rejects OpenAPI Schema Objects that use tuple-style items arrays", async () => {
		const output = await validateTargetSchema("openapi-3.0", {
			additionalItems: false,
			items: [{ type: "string" }, { type: "integer" }],
			type: "array",
		});

		expect(output.valid).toBe(false);
	});

	test("rejects draft-2020-12 schemas that use tuple-style items arrays", async () => {
		const output = await validateTargetSchema("draft-2020-12", {
			$schema: "https://json-schema.org/draft/2020-12/schema",
			items: [{ type: "string" }, { type: "integer" }],
			type: "array",
		});

		expect(output.valid).toBe(false);
	});
});
