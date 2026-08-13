import { describe, expect, test } from "vitest";
import type { Decoder } from "../src/index.js";
import * as katabami from "../src/index.js";

describe("getSchema", () => {
	test("primitives", () => {
		expect(katabami.string().getSchema()).toEqual({ kind: "string" });
		expect(katabami.boolean().getSchema()).toEqual({ kind: "boolean" });
		expect(katabami.int().getSchema()).toEqual({ kind: "integer" });
		expect(katabami.float().getSchema()).toEqual({ kind: "number" });
		expect(katabami.value().getSchema()).toEqual({ kind: "unknown" });
		expect(katabami.failed().getSchema()).toEqual({ kind: "never" });
	});

	test("constant", () => {
		expect(katabami.constant("foo").getSchema()).toEqual({
			kind: "constant",
			value: "foo",
		});
	});

	describe("array", () => {
		test("sync", () => {
			expect(katabami.array(katabami.int()).getSchema()).toEqual({
				element: { kind: "integer" },
				kind: "array",
			});
		});

		test("async", () => {
			const decoder = katabami.array(
				katabami.int().andThen((value) => {
					return new Promise<Decoder<typeof value, never>>((resolve) =>
						resolve(katabami.succeed(value)),
					);
				}),
			);

			expect(decoder.getSchema()).toEqual({
				element: { kind: "integer" },
				kind: "array",
			});
		});
	});

	describe("object", () => {
		test("sync", () => {
			expect(
				katabami
					.object({
						age: katabami.int(),
						name: katabami.string(),
					})
					.getSchema(),
			).toEqual({
				kind: "object",
				properties: {
					age: { kind: "integer" },
					name: { kind: "string" },
				},
			});
		});

		test("async", () => {
			const decoder = katabami.object({
				age: katabami.int().andThen((value) => {
					return new Promise<Decoder<typeof value, never>>((resolve) =>
						resolve(katabami.succeed(value)),
					);
				}),
				name: katabami.string(),
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
			expect(katabami.record(katabami.int()).getSchema()).toEqual({
				kind: "record",
				value: { kind: "integer" },
			});
		});

		test("async", () => {
			const decoder = katabami.record(
				katabami.int().andThen((value) => {
					return new Promise<Decoder<typeof value, never>>((resolve) =>
						resolve(katabami.succeed(value)),
					);
				}),
			);

			expect(decoder.getSchema()).toEqual({
				kind: "record",
				value: { kind: "integer" },
			});
		});
	});

	test("tuple", () => {
		expect(
			katabami.tuple(katabami.string(), katabami.int()).getSchema(),
		).toEqual({
			elements: [{ kind: "string" }, { kind: "integer" }],
			kind: "tuple",
		});
	});

	test("union", () => {
		expect(
			katabami.union(katabami.string(), katabami.int()).getSchema(),
		).toEqual({
			kind: "union",
			variants: [{ kind: "string" }, { kind: "integer" }],
		});
	});

	test("optional", () => {
		expect(katabami.optional(katabami.string()).getSchema()).toEqual({
			kind: "optional",
			schema: { kind: "string" },
		});
	});

	test("lazy", () => {
		const decoder = katabami.lazy(() =>
			katabami.object({ name: katabami.string() }),
		);

		expect(decoder.getSchema()).toEqual({
			kind: "object",
			properties: {
				name: { kind: "string" },
			},
		});
	});

	test("lazy async", async () => {
		const decoder = katabami.lazy(() =>
			Promise.resolve(katabami.object({ name: katabami.string() })),
		);

		await expect(decoder.getSchema()).resolves.toEqual({
			kind: "object",
			properties: {
				name: { kind: "string" },
			},
		});
	});

	test("field and index", () => {
		expect(katabami.field("name", katabami.string()).getSchema()).toEqual({
			key: "name",
			kind: "field",
			schema: { kind: "string" },
		});
		expect(katabami.index(0, katabami.int()).getSchema()).toEqual({
			index: 0,
			kind: "index",
			schema: { kind: "integer" },
		});
	});

	test("map", () => {
		const decoder = katabami.map(
			(name, age) => ({ age, name }),
			katabami.field("name", katabami.string()),
			katabami.field("age", katabami.int()),
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
		const decoder = katabami
			.string()
			.map((value) => value.length)
			.andThen((length) => katabami.succeed(length));

		expect(decoder.getSchema()).toEqual({ kind: "string" });
	});
});
