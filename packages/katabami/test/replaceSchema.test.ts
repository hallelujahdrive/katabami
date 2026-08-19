import { describe, expect, test } from "vitest";
import {
	array,
	type Decoder,
	failed,
	int,
	lazy,
	object,
	string,
	succeed,
} from "../src";
import { replaceSchema } from "../src/dev";

describe("replaceSchema", () => {
	test("replaces getSchema without changing decode", () => {
		const decoder = replaceSchema(string(), {
			format: "date-time",
			kind: "string",
		});

		expect(decoder.getSchema()).toEqual({
			format: "date-time",
			kind: "string",
		});
		expect(decoder.decodeValue("2020-01-01T00:00:00Z")).toEqual({
			ok: true,
			value: "2020-01-01T00:00:00Z",
		});
		expect(decoder.decodeValue(1).ok).toBe(false);
	});

	test("map, andThen, and catch keep the replaced schema", () => {
		const decoder = replaceSchema(string(), {
			format: "date-time",
			kind: "string",
		})
			.map((value) => new Date(value))
			.andThen((value) =>
				Number.isNaN(value.getTime()) ? failed() : succeed(value),
			)
			.catch((issues) => ({ issues, ok: false }));

		expect(decoder.getSchema()).toEqual({
			format: "date-time",
			kind: "string",
		});
	});

	test("nested object getSchema includes replaced child schema", () => {
		const date = replaceSchema(string(), {
			format: "date-time",
			kind: "string",
		});
		const decoder = object({
			at: date,
			count: int(),
		});

		expect(decoder.getSchema()).toEqual({
			kind: "object",
			properties: {
				at: { format: "date-time", kind: "string" },
				count: { kind: "integer" },
			},
		});
	});

	test("preserves async decode", async () => {
		const decoder = replaceSchema(
			string().andThen((value) => {
				return new Promise<Decoder<string, never>>((resolve) =>
					resolve(succeed(value)),
				);
			}),
			{ kind: "string", minLength: 1 },
		);

		await expect(decoder.decodeValue("ab")).resolves.toEqual({
			ok: true,
			value: "ab",
		});
		expect(decoder.getSchema()).toEqual({
			kind: "string",
			minLength: 1,
		});
	});

	test("makes schema resolution sync when replacing an async schema", () => {
		const decoder = replaceSchema(
			lazy(() => Promise.resolve(array(string()))),
			{
				element: { kind: "string" },
				kind: "array",
				minItems: 1,
			},
		);

		expect(decoder.getSchema()).toEqual({
			element: { kind: "string" },
			kind: "array",
			minItems: 1,
		});
	});

	test("throws for non-decoders", () => {
		expect(() =>
			replaceSchema({ getSchema: () => ({ kind: "string" }) } as never, {
				kind: "string",
			}),
		).toThrow("Expected a Katabami Decoder");
	});
});
