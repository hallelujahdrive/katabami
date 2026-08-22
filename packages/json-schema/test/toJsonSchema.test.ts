import * as katabami from "katabami";
import { replaceSchema } from "katabami/dev";
import { describe, expect, test } from "vitest";
import {
	type StandardJSONSchemaV1,
	toJsonSchema,
	toStandardJsonSchema,
} from "../src";

describe("toJsonSchema", () => {
	test("converts primitives", () => {
		expect(toJsonSchema(katabami.string())).toEqual({
			$schema: "https://json-schema.org/draft/2020-12/schema",
			type: "string",
		});
		expect(toJsonSchema(katabami.boolean(), { target: "draft-07" })).toEqual({
			$schema: "http://json-schema.org/draft-07/schema#",
			type: "boolean",
		});
		expect(toJsonSchema(katabami.int(), { target: "openapi-3.0" })).toEqual({
			type: "integer",
		});
		expect(toJsonSchema(katabami.number())).toEqual({
			$schema: "https://json-schema.org/draft/2020-12/schema",
			type: "number",
		});
		expect(toJsonSchema(katabami.value())).toEqual({
			$schema: "https://json-schema.org/draft/2020-12/schema",
		});
		expect(toJsonSchema(katabami.failed())).toEqual({
			$schema: "https://json-schema.org/draft/2020-12/schema",
			not: {},
		});
	});

	test("converts constants by target", () => {
		expect(toJsonSchema(katabami.constant("foo"))).toEqual({
			$schema: "https://json-schema.org/draft/2020-12/schema",
			const: "foo",
		});
		expect(
			toJsonSchema(katabami.constant("foo"), { target: "openapi-3.0" }),
		).toEqual({
			enum: ["foo"],
		});
		expect(toJsonSchema(katabami.constant(null))).toEqual({
			$schema: "https://json-schema.org/draft/2020-12/schema",
			const: null,
		});
		expect(
			toJsonSchema(katabami.constant(null), { target: "openapi-3.0" }),
		).toEqual({
			enum: [null],
		});
	});

	test("converts object, array, record, tuple, and union", () => {
		expect(
			toJsonSchema(
				katabami.object({
					age: katabami.int(),
					name: katabami.optional(katabami.string()),
				}),
			),
		).toEqual({
			$schema: "https://json-schema.org/draft/2020-12/schema",
			properties: {
				age: { type: "integer" },
				name: { type: ["string", "null"] },
			},
			required: ["age"],
			type: "object",
		});

		expect(toJsonSchema(katabami.array(katabami.string()))).toEqual({
			$schema: "https://json-schema.org/draft/2020-12/schema",
			items: { type: "string" },
			type: "array",
		});

		expect(toJsonSchema(katabami.oneOrMore(katabami.string()))).toEqual({
			$schema: "https://json-schema.org/draft/2020-12/schema",
			items: { type: "string" },
			minItems: 1,
			type: "array",
		});

		expect(
			toJsonSchema(katabami.record(katabami.string(), katabami.int())),
		).toEqual({
			$schema: "https://json-schema.org/draft/2020-12/schema",
			additionalProperties: { type: "integer" },
			propertyNames: { type: "string" },
			type: "object",
		});

		expect(
			toJsonSchema(katabami.record(katabami.string(), katabami.int()), {
				target: "openapi-3.0",
			}),
		).toEqual({
			additionalProperties: { type: "integer" },
			type: "object",
		});

		expect(
			toJsonSchema(katabami.tuple(katabami.string(), katabami.int())),
		).toEqual({
			$schema: "https://json-schema.org/draft/2020-12/schema",
			items: false,
			prefixItems: [{ type: "string" }, { type: "integer" }],
			type: "array",
		});

		expect(
			toJsonSchema(katabami.tuple(katabami.string(), katabami.int()), {
				target: "draft-07",
			}),
		).toEqual({
			$schema: "http://json-schema.org/draft-07/schema#",
			additionalItems: false,
			items: [{ type: "string" }, { type: "integer" }],
			maxItems: 2,
			minItems: 2,
			type: "array",
		});

		expect(
			toJsonSchema(katabami.tuple(katabami.string(), katabami.int()), {
				target: "openapi-3.0",
			}),
		).toEqual({
			items: {
				anyOf: [{ type: "string" }, { type: "integer" }],
			},
			maxItems: 2,
			minItems: 2,
			type: "array",
		});

		expect(
			toJsonSchema(katabami.union(katabami.string(), katabami.int())),
		).toEqual({
			$schema: "https://json-schema.org/draft/2020-12/schema",
			anyOf: [{ type: "string" }, { type: "integer" }],
		});
	});

	test("converts optional and openapi nullable", () => {
		expect(toJsonSchema(katabami.optional(katabami.string()))).toEqual({
			$schema: "https://json-schema.org/draft/2020-12/schema",
			type: ["string", "null"],
		});
		expect(
			toJsonSchema(katabami.optional(katabami.string()), {
				target: "openapi-3.0",
			}),
		).toEqual({
			nullable: true,
			type: "string",
		});
	});

	test("converts nullable as required null union", () => {
		expect(toJsonSchema(katabami.nullable(katabami.string()))).toEqual({
			$schema: "https://json-schema.org/draft/2020-12/schema",
			type: ["string", "null"],
		});
		expect(
			toJsonSchema(katabami.nullable(katabami.string()), {
				target: "openapi-3.0",
			}),
		).toEqual({
			nullable: true,
			type: "string",
		});
		expect(
			toJsonSchema(
				katabami.object({
					age: katabami.int(),
					name: katabami.nullable(katabami.string()),
				}),
			),
		).toEqual({
			$schema: "https://json-schema.org/draft/2020-12/schema",
			properties: {
				age: { type: "integer" },
				name: { type: ["string", "null"] },
			},
			required: ["age", "name"],
			type: "object",
		});
	});

	test("converts nested at fields", () => {
		expect(
			toJsonSchema(katabami.at(["person", "name"], katabami.string())),
		).toEqual({
			$schema: "https://json-schema.org/draft/2020-12/schema",
			properties: {
				person: {
					properties: {
						name: { type: "string" },
					},
					required: ["name"],
					type: "object",
				},
			},
			required: ["person"],
			type: "object",
		});
	});

	test("converts map of fields to an object schema", () => {
		const decoder = katabami.map(
			(name, age) => ({ age, name }),
			katabami.field("name", katabami.string()),
			katabami.field("age", katabami.int()),
		);

		expect(toJsonSchema(decoder)).toEqual({
			$schema: "https://json-schema.org/draft/2020-12/schema",
			properties: {
				age: { type: "integer" },
				name: { type: "string" },
			},
			required: ["name", "age"],
			type: "object",
		});
	});

	test("accepts DecoderSchema directly", () => {
		expect(toJsonSchema({ kind: "string" })).toEqual({
			$schema: "https://json-schema.org/draft/2020-12/schema",
			type: "string",
		});
	});

	test("converts string constraints", () => {
		expect(
			toJsonSchema({
				format: "date-time",
				kind: "string",
				maxLength: 32,
				minLength: 1,
				pattern: "^[a-z]+$",
			}),
		).toEqual({
			$schema: "https://json-schema.org/draft/2020-12/schema",
			format: "date-time",
			maxLength: 32,
			minLength: 1,
			pattern: "^[a-z]+$",
			type: "string",
		});
	});

	test("converts numeric constraints by target", () => {
		const schema = {
			exclusiveMinimum: 0,
			kind: "number",
			maximum: 10,
			minimum: 1,
			multipleOf: 0.5,
		} as const;

		expect(toJsonSchema(schema)).toEqual({
			$schema: "https://json-schema.org/draft/2020-12/schema",
			exclusiveMinimum: 0,
			maximum: 10,
			minimum: 1,
			multipleOf: 0.5,
			type: "number",
		});
		expect(toJsonSchema(schema, { target: "openapi-3.0" })).toEqual({
			exclusiveMinimum: true,
			maximum: 10,
			minimum: 0,
			multipleOf: 0.5,
			type: "number",
		});
	});

	test("converts array constraints", () => {
		expect(
			toJsonSchema({
				element: { kind: "string" },
				kind: "array",
				maxItems: 5,
				minItems: 1,
				uniqueItems: true,
			}),
		).toEqual({
			$schema: "https://json-schema.org/draft/2020-12/schema",
			items: { type: "string" },
			maxItems: 5,
			minItems: 1,
			type: "array",
			uniqueItems: true,
		});
	});

	test("converts replaceSchema constraints inside objects", () => {
		const date = replaceSchema(katabami.string(), {
			format: "date-time",
			kind: "string",
		});

		expect(
			toJsonSchema(
				katabami.object({
					at: date,
					count: katabami.int(),
				}),
			),
		).toEqual({
			$schema: "https://json-schema.org/draft/2020-12/schema",
			properties: {
				at: { format: "date-time", type: "string" },
				count: { type: "integer" },
			},
			required: ["at", "count"],
			type: "object",
		});
	});

	test("throws for unsupported targets", () => {
		expect(() =>
			toJsonSchema(katabami.string(), { target: "draft-04" }),
		).toThrow("Unsupported target: draft-04");
	});

	test("throws for async schemas", () => {
		const decoder = katabami.lazy(() =>
			Promise.resolve(katabami.object({ name: katabami.string() })),
		);

		expect(() => toJsonSchema(decoder)).toThrow(/Async DecoderSchema/);
	});
});

describe("toStandardJsonSchema", () => {
	test("implements StandardJSONSchemaV1", () => {
		const schema = toStandardJsonSchema(katabami.string());

		expect(schema).toSatisfy(
			(value: unknown): value is StandardJSONSchemaV1 =>
				typeof value === "object" &&
				value !== null &&
				"~standard" in value &&
				typeof (value as StandardJSONSchemaV1)["~standard"].jsonSchema
					?.input === "function",
		);

		expect(
			schema["~standard"].jsonSchema.input({ target: "draft-2020-12" }),
		).toEqual({
			$schema: "https://json-schema.org/draft/2020-12/schema",
			type: "string",
		});
		expect(
			schema["~standard"].jsonSchema.output({ target: "draft-07" }),
		).toEqual({
			$schema: "http://json-schema.org/draft-07/schema#",
			type: "string",
		});
	});

	test("preserves Standard Schema validate", () => {
		const schema = toStandardJsonSchema(katabami.string());
		const ok = schema["~standard"].validate("hello");
		const ng = schema["~standard"].validate(1);

		expect(ok).toEqual({ value: "hello" });
		expect(ng).toMatchObject({
			issues: expect.arrayContaining([
				expect.objectContaining({ message: expect.any(String) }),
			]),
		});
	});
});
