import { describe, expect, test } from "vitest";
import {
	array,
	at,
	boolean,
	constant,
	type Decoder,
	failed,
	field,
	index,
	int,
	lazy,
	map,
	nullable,
	number,
	object,
	oneOrMore,
	optional,
	record,
	string,
	succeed,
	tuple,
	union,
	value,
} from "../src";

describe("getSchema", () => {
	test("primitives", () => {
		expect(boolean().getSchema()).toEqual({ kind: "boolean" });
		expect(failed().getSchema()).toEqual({ kind: "never" });
		expect(int().getSchema()).toEqual({ kind: "integer" });
		expect(number().getSchema()).toEqual({ kind: "number" });
		expect(string().getSchema()).toEqual({ kind: "string" });
		expect(value().getSchema()).toEqual({ kind: "unknown" });
	});

	test("constant", () => {
		expect(constant("foo").getSchema()).toEqual({
			kind: "constant",
			value: "foo",
		});
		expect(constant(null).getSchema()).toEqual({
			kind: "constant",
			value: null,
		});
	});

	describe("array", () => {
		test("sync", () => {
			expect(array(int()).getSchema()).toEqual({
				element: { kind: "integer" },
				kind: "array",
			});
		});

		test("async", () => {
			const decoder = array(
				int().andThen((value) => {
					return new Promise<Decoder<typeof value, never>>((resolve) =>
						resolve(succeed(value)),
					);
				}),
			);

			expect(decoder.getSchema()).toEqual({
				element: { kind: "integer" },
				kind: "array",
			});
		});
	});

	describe("oneOrMore", () => {
		test("sync", () => {
			expect(oneOrMore(int()).getSchema()).toEqual({
				element: { kind: "integer" },
				kind: "array",
				minItems: 1,
			});
		});

		test("async", () => {
			const decoder = oneOrMore(
				int().andThen((value) => {
					return new Promise<Decoder<typeof value, never>>((resolve) =>
						resolve(succeed(value)),
					);
				}),
			);

			expect(decoder.getSchema()).toEqual({
				element: { kind: "integer" },
				kind: "array",
				minItems: 1,
			});
		});
	});

	describe("object", () => {
		test("sync", () => {
			expect(
				object({
					age: int(),
					name: string(),
				}).getSchema(),
			).toEqual({
				kind: "object",
				properties: {
					age: { kind: "integer" },
					name: { kind: "string" },
				},
			});
		});

		test("async", () => {
			const decoder = object({
				age: int().andThen((value) => {
					return new Promise<Decoder<typeof value, never>>((resolve) =>
						resolve(succeed(value)),
					);
				}),
				name: string(),
			});

			expect(decoder.getSchema()).toEqual({
				kind: "object",
				properties: {
					age: { kind: "integer" },
					name: { kind: "string" },
				},
			});
		});
	});

	describe("record", () => {
		test("sync", () => {
			expect(record(string(), int()).getSchema()).toEqual({
				key: { kind: "string" },
				kind: "record",
				value: { kind: "integer" },
			});
		});

		test("async", () => {
			const decoder = record(
				string(),
				int().andThen((value) => {
					return new Promise<Decoder<typeof value, never>>((resolve) =>
						resolve(succeed(value)),
					);
				}),
			);

			expect(decoder.getSchema()).toEqual({
				key: { kind: "string" },
				kind: "record",
				value: { kind: "integer" },
			});
		});
	});

	test("tuple", () => {
		expect(tuple(string(), int()).getSchema()).toEqual({
			elements: [{ kind: "string" }, { kind: "integer" }],
			kind: "tuple",
		});
	});

	test("union", () => {
		expect(union(string(), int()).getSchema()).toEqual({
			kind: "union",
			variants: [{ kind: "string" }, { kind: "integer" }],
		});
	});

	test("nullable", () => {
		expect(nullable(string()).getSchema()).toEqual({
			kind: "nullable",
			schema: { kind: "string" },
		});
	});

	test("optional", () => {
		expect(optional(string()).getSchema()).toEqual({
			kind: "optional",
			schema: { kind: "string" },
		});
	});

	test("lazy", () => {
		const decoder = lazy(() => object({ name: string() }));

		expect(decoder.getSchema()).toEqual({
			kind: "object",
			properties: {
				name: { kind: "string" },
			},
		});
	});

	test("lazy async", async () => {
		const decoder = lazy(() => Promise.resolve(object({ name: string() })));

		await expect(decoder.getSchema()).resolves.toEqual({
			kind: "object",
			properties: {
				name: { kind: "string" },
			},
		});
	});

	test("field and index", () => {
		expect(field("name", string()).getSchema()).toEqual({
			key: "name",
			kind: "field",
			schema: { kind: "string" },
		});
		expect(index(0, int()).getSchema()).toEqual({
			index: 0,
			kind: "index",
			schema: { kind: "integer" },
		});
	});

	test("at", () => {
		expect(at(["person", "name"], string()).getSchema()).toEqual({
			key: "person",
			kind: "field",
			schema: {
				key: "name",
				kind: "field",
				schema: { kind: "string" },
			},
		});
	});

	test("map", () => {
		const decoder = map(
			(name, age) => ({ age, name }),
			field("name", string()),
			field("age", int()),
		);

		expect(decoder.getSchema()).toEqual({
			decoders: [
				{
					key: "name",
					kind: "field",
					schema: { kind: "string" },
				},
				{
					key: "age",
					kind: "field",
					schema: { kind: "integer" },
				},
			],
			kind: "map",
		});
	});

	test("map and andThen preserve schema", () => {
		const decoder = string()
			.map((value) => value.length)
			.andThen((length) => succeed(length));

		expect(decoder.getSchema()).toEqual({ kind: "string" });
	});
});
