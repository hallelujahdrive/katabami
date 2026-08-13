import * as katabami from "katabami";
import { describe, expect, it } from "vitest";
import {
	type StandardJSONSchemaV1,
	toJsonSchema,
	toStandardJsonSchema,
} from "../src/index.js";

describe("toJsonSchema", () => {
	it("converts primitives", () => {
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
		expect(toJsonSchema(katabami.float())).toEqual({
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

	it("converts constants by target", () => {
		expect(toJsonSchema(katabami.constant("foo"))).toEqual({
			$schema: "https://json-schema.org/draft/2020-12/schema",
			const: "foo",
		});
		expect(
			toJsonSchema(katabami.constant("foo"), { target: "openapi-3.0" }),
		).toEqual({
			enum: ["foo"],
		});
	});

	it("converts object, array, record, tuple, and union", () => {
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

		expect(toJsonSchema(katabami.record(katabami.int()))).toEqual({
			$schema: "https://json-schema.org/draft/2020-12/schema",
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
			toJsonSchema(katabami.union(katabami.string(), katabami.int())),
		).toEqual({
			$schema: "https://json-schema.org/draft/2020-12/schema",
			anyOf: [{ type: "string" }, { type: "integer" }],
		});
	});

	it("converts optional and openapi nullable", () => {
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

	it("converts map of fields to an object schema", () => {
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

	it("accepts DecoderSchema directly", () => {
		expect(toJsonSchema({ kind: "string" })).toEqual({
			$schema: "https://json-schema.org/draft/2020-12/schema",
			type: "string",
		});
	});

	it("throws for unsupported targets", () => {
		expect(() =>
			toJsonSchema(katabami.string(), { target: "draft-04" }),
		).toThrow("Unsupported target: draft-04");
	});

	it("throws for async schemas", () => {
		const decoder = katabami.lazy(() =>
			Promise.resolve(katabami.object({ name: katabami.string() })),
		);

		expect(() => toJsonSchema(decoder)).toThrow(/Async DecoderSchema/);
	});
});

describe("toStandardJsonSchema", () => {
	it("implements StandardJSONSchemaV1", () => {
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

	it("preserves Standard Schema validate", () => {
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
