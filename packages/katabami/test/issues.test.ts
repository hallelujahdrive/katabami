import { describe, expect, test } from "vitest";
import {
	array,
	at,
	boolean,
	constant,
	createIssues,
	DecodeError,
	failed,
	field,
	flattenIssues,
	float,
	getIssueMessage,
	index,
	int,
	map,
	nullable,
	object,
	oneOrMore,
	optional,
	record,
	string,
	tuple,
	unflattenIssues,
	union,
} from "../src";

describe("issues", () => {
	describe("array decoder", () => {
		const decoder = array(string());

		test("unexpected type", () => {
			const result = decoder.decodeValue(1);

			expect(result).toStrictEqual({
				error: expect.any(DecodeError),
				ok: false,
			});

			expect(getIssueMessage(result.error?.issues)?.format()).toStrictEqual(
				"Expected array, but received number.",
			);
		});

		test("unexpected value", () => {
			const result = decoder.decodeValue([1]);

			expect(result).toStrictEqual({
				error: expect.any(DecodeError),
				ok: false,
			});

			expect(
				getIssueMessage(result.error?.issues?.[0])?.format(),
			).toStrictEqual("Expected string, but received number.");
		});
	});

	describe("oneOrMore decoder", () => {
		const decoder = oneOrMore(string());

		test("unexpected type", () => {
			const result = decoder.decodeValue(1);

			expect(result).toStrictEqual({
				error: expect.any(DecodeError),
				ok: false,
			});

			expect(getIssueMessage(result.error?.issues)?.format()).toStrictEqual(
				"Expected array, but received number.",
			);
		});

		test("empty array", () => {
			const result = decoder.decodeValue([]);

			expect(result).toStrictEqual({
				error: expect.any(DecodeError),
				ok: false,
			});

			expect(getIssueMessage(result.error?.issues)?.format()).toStrictEqual(
				"Expected array length 1, but received 0.",
			);
		});
	});

	describe("boolean decoder", () => {
		const decoder = boolean();

		test("unexpected type", () => {
			const result = decoder.decodeValue("foo");

			expect(result).toStrictEqual({
				error: expect.any(DecodeError),
				ok: false,
			});

			expect(getIssueMessage(result.error?.issues)?.format()).toStrictEqual(
				"Expected boolean, but received string.",
			);
		});
	});

	describe("constant decoder", () => {
		const decoder = constant("foo");

		test("unexpected type", () => {
			const result = decoder.decodeValue(1);

			expect(result).toStrictEqual({
				error: expect.any(DecodeError),
				ok: false,
			});

			expect(getIssueMessage(result.error?.issues)?.format()).toStrictEqual(
				'Expected "foo", but received 1.',
			);
		});

		test("null constant", () => {
			const result = constant(null).decodeValue("foo");

			expect(result).toStrictEqual({
				error: expect.any(DecodeError),
				ok: false,
			});

			expect(getIssueMessage(result.error?.issues)?.format()).toStrictEqual(
				'Expected null, but received "foo".',
			);
		});
	});

	describe("failed decoder", () => {
		const decoder = failed();

		test("default message", () => {
			const result = decoder.decodeValue("foo");

			expect(result).toStrictEqual({
				error: expect.any(DecodeError),
				ok: false,
			});

			expect(getIssueMessage(result.error?.issues)?.format()).toStrictEqual(
				"Failed to decode.",
			);
		});
	});

	describe("field decoder", () => {
		const decoder = field("foo", string());

		test("unexpected type", () => {
			const result = decoder.decodeValue(1);

			expect(result).toStrictEqual({
				error: expect.any(DecodeError),
				ok: false,
			});

			expect(getIssueMessage(result.error?.issues)?.format()).toStrictEqual(
				"Expected object, but received number.",
			);
		});

		test("missing field", () => {
			const result = decoder.decodeValue({});

			expect(result).toStrictEqual({
				error: expect.any(DecodeError),
				ok: false,
			});

			expect(getIssueMessage(result.error?.issues)?.format()).toStrictEqual(
				'Object property "foo" failed validation.',
			);
		});

		describe("optional field", () => {
			const decoder = field("foo", optional(string()));

			test("missing field", () => {
				const result = decoder.decodeValue({});

				expect(result).toStrictEqual({
					ok: true,
					value: undefined,
				});
			});
		});

		describe("nullable field", () => {
			const decoder = field("foo", nullable(string()));

			test("null field", () => {
				const result = decoder.decodeValue({ foo: null });

				expect(result).toStrictEqual({
					ok: true,
					value: null,
				});
			});

			test("missing field", () => {
				const result = decoder.decodeValue({});

				expect(result).toStrictEqual({
					error: expect.any(DecodeError),
					ok: false,
				});
			});
		});
	});

	describe("at decoder", () => {
		const decoder = at(["foo", "bar"], string());

		test("unexpected type", () => {
			const result = decoder.decodeValue(1);

			expect(result).toStrictEqual({
				error: expect.any(DecodeError),
				ok: false,
			});

			expect(getIssueMessage(result.error?.issues)?.format()).toStrictEqual(
				"Expected object, but received number.",
			);
		});

		test("missing nested field", () => {
			const result = decoder.decodeValue({ foo: {} });

			expect(result).toStrictEqual({
				error: expect.any(DecodeError),
				ok: false,
			});

			expect(getIssueMessage(result.error?.issues)?.format()).toStrictEqual(
				'Object property "foo" failed validation.',
			);
			expect(
				getIssueMessage(result.error?.issues?.foo)?.format(),
			).toStrictEqual('Object property "bar" failed validation.');
		});
	});

	describe("float decoder", () => {
		const decoder = float();

		test("unexpected type", () => {
			const result = decoder.decodeValue("foo");

			expect(result).toStrictEqual({
				error: expect.any(DecodeError),
				ok: false,
			});

			expect(getIssueMessage(result.error?.issues)?.format()).toStrictEqual(
				"Expected float, but received string.",
			);
		});
	});

	describe("index decoder", () => {
		const decoder = index(0, string());

		test("unexpected type", () => {
			const result = decoder.decodeValue(1);

			expect(result).toStrictEqual({
				error: expect.any(DecodeError),
				ok: false,
			});

			expect(getIssueMessage(result.error?.issues)?.format()).toStrictEqual(
				"Expected array, but received number.",
			);
		});

		test("out of bounds", () => {
			const result = decoder.decodeValue([]);

			expect(result).toStrictEqual({
				error: expect.any(DecodeError),
				ok: false,
			});

			expect(getIssueMessage(result.error?.issues)?.format()).toStrictEqual(
				'Array index "0" failed validation.',
			);

			expect(
				getIssueMessage(result.error?.issues?.[0])?.format(),
			).toStrictEqual("Expected string, but received undefined.");
		});

		test("unexpected value", () => {
			const result = decoder.decodeValue([1]);

			expect(result).toStrictEqual({
				error: expect.any(DecodeError),
				ok: false,
			});

			expect(getIssueMessage(result.error?.issues)?.format()).toStrictEqual(
				'Array index "0" failed validation.',
			);

			expect(
				getIssueMessage(result.error?.issues?.[0])?.format(),
			).toStrictEqual("Expected string, but received number.");
		});
	});

	describe("integer decoder", () => {
		const decoder = int();

		test("unexpected type", () => {
			const result = decoder.decodeValue("foo");

			expect(result).toStrictEqual({
				error: expect.any(DecodeError),
				ok: false,
			});

			expect(getIssueMessage(result.error?.issues)?.format()).toStrictEqual(
				"Expected number, but received string.",
			);
		});

		test("value is not an integer", () => {
			const result = decoder.decodeValue(1.5);

			expect(result).toStrictEqual({
				error: expect.any(DecodeError),
				ok: false,
			});

			expect(getIssueMessage(result.error?.issues)?.format()).toStrictEqual(
				"Expected integer, but received float.",
			);
		});
	});

	describe("map decoder", () => {
		const decoder = map(
			(foo, bar) => ({ bar, foo }),
			field("foo", string()),
			field("bar", string()),
		);

		test("unexpected type", () => {
			const result = decoder.decodeValue(1);

			expect(result).toStrictEqual({
				error: expect.any(DecodeError),
				ok: false,
			});

			expect(getIssueMessage(result.error?.issues)?.format()).toStrictEqual(
				"Expected object, but received number.",
			);
		});

		test("missing field", () => {
			const result = decoder.decodeValue({});

			expect(result).toStrictEqual({
				error: expect.any(DecodeError),
				ok: false,
			});

			expect(getIssueMessage(result.error?.issues)?.format()).toStrictEqual(
				'Object property "foo" failed validation.',
			);
		});
	});

	describe("at decoder", () => {
		const decoder = at(["foo", "bar"], string());

		test("unexpected type", () => {
			const result = decoder.decodeValue(1);

			expect(result).toStrictEqual({
				error: expect.any(DecodeError),
				ok: false,
			});

			expect(getIssueMessage(result.error?.issues)?.format()).toStrictEqual(
				"Expected object, but received number.",
			);
		});

		test("missing nested field", () => {
			const result = decoder.decodeValue({ foo: {} });

			expect(result).toStrictEqual({
				error: expect.any(DecodeError),
				ok: false,
			});

			expect(getIssueMessage(result.error?.issues)?.format()).toStrictEqual(
				'Object property "foo" failed validation.',
			);
			expect(
				getIssueMessage(result.error?.issues?.foo)?.format(),
			).toStrictEqual('Object property "bar" failed validation.');
		});
	});

	describe("object decoder", () => {
		const decoder = object({
			foo: string(),
		});

		test("unexpected type", () => {
			const result = decoder.decodeValue(1);

			expect(result).toStrictEqual({
				error: expect.any(DecodeError),
				ok: false,
			});

			expect(getIssueMessage(result.error?.issues)?.format()).toStrictEqual(
				"Expected object, but received number.",
			);
		});

		test("invalid object", () => {
			const result = decoder.decodeValue({ foo: 1 });

			expect(result).toStrictEqual({
				error: expect.any(DecodeError),
				ok: false,
			});

			expect(getIssueMessage(result.error?.issues)?.format()).toStrictEqual(
				"One or more object properties failed validation.",
			);

			expect(
				getIssueMessage(result.error?.issues?.foo)?.format(),
			).toStrictEqual("Expected string, but received number.");
		});
	});

	describe("record decoder", () => {
		const decoder = record(string(), string());

		test("unexpected type", () => {
			const result = decoder.decodeValue(1);

			expect(result).toStrictEqual({
				error: expect.any(DecodeError),
				ok: false,
			});

			expect(getIssueMessage(result.error?.issues)?.format()).toStrictEqual(
				"Expected object, but received number.",
			);
		});

		test("invalid record", () => {
			const result = decoder.decodeValue({ foo: 1 });

			expect(result).toStrictEqual({
				error: expect.any(DecodeError),
				ok: false,
			});

			expect(getIssueMessage(result.error?.issues)?.format()).toStrictEqual(
				"One or more record properties failed validation.",
			);

			expect(getIssueMessage(result.error?.issues.foo)?.format()).toStrictEqual(
				"Expected string, but received number.",
			);
		});

		test("invalid record key", () => {
			const keyed = record(union(constant("a"), constant("b")), int());
			const result = keyed.decodeValue({ c: 1 });

			expect(result).toStrictEqual({
				error: expect.any(DecodeError),
				ok: false,
			});

			expect(getIssueMessage(result.error?.issues)?.format()).toStrictEqual(
				'Record key "c" failed validation.',
			);
			expect(Object.keys(result.error?.issues ?? {})).toStrictEqual([]);
		});
	});

	describe("string decoder", () => {
		const decoder = string();

		test("unexpected type", () => {
			const result = decoder.decodeValue(1);

			expect(result).toStrictEqual({
				error: expect.any(DecodeError),
				ok: false,
			});

			expect(getIssueMessage(result.error?.issues)?.format()).toStrictEqual(
				"Expected string, but received number.",
			);
		});
	});

	describe("tuple decoder", () => {
		const decoder = tuple(string(), int());

		test("unexpected type", () => {
			const result = decoder.decodeValue(1);

			expect(result).toStrictEqual({
				error: expect.any(DecodeError),
				ok: false,
			});

			expect(getIssueMessage(result.error?.issues)?.format()).toStrictEqual(
				"Expected array, but received number.",
			);
		});

		test("invalid array length", () => {
			const result = decoder.decodeValue([1]);

			expect(result).toStrictEqual({
				error: expect.any(DecodeError),
				ok: false,
			});

			expect(getIssueMessage(result.error?.issues)?.format()).toStrictEqual(
				"Expected array length 2, but received 1.",
			);
		});

		test("unexpected element type", () => {
			const result = decoder.decodeValue([undefined, 1]);

			expect(result).toStrictEqual({
				error: expect.any(DecodeError),
				ok: false,
			});

			expect(getIssueMessage(result.error?.issues)?.format()).toStrictEqual(
				"One or more array elements failed validation.",
			);

			expect(
				getIssueMessage(result.error?.issues?.[0])?.format(),
			).toStrictEqual("Expected string, but received undefined.");

			expect(
				getIssueMessage(result.error?.issues?.[1])?.format(),
			).toStrictEqual(undefined);
		});
	});

	describe("union decoder", () => {
		const decoder = union(string(), int());

		test("unexpected type", () => {
			const result = decoder.decodeValue(true);

			expect(result).toStrictEqual({
				error: expect.any(DecodeError),
				ok: false,
			});

			expect(getIssueMessage(result.error?.issues)?.format()).toStrictEqual(
				"None of the union members matched.",
			);

			expect(getIssueMessage(result.error?.issues[0])?.format()).toStrictEqual(
				"Expected string, but received boolean.",
			);

			expect(getIssueMessage(result.error?.issues[1])?.format()).toStrictEqual(
				"Expected number, but received boolean.",
			);
		});

		describe("nested union", () => {
			const decoder = union(
				constant("foo"),
				union(constant("bar"), constant("baz")),
			);

			test("unexpected type", () => {
				const result = decoder.decodeValue(1);

				expect(result).toStrictEqual({
					error: expect.any(DecodeError),
					ok: false,
				});

				expect(getIssueMessage(result.error?.issues)?.format()).toStrictEqual(
					"None of the union members matched.",
				);

				expect(
					getIssueMessage(result.error?.issues[0])?.format(),
				).toStrictEqual('Expected "foo", but received 1.');

				expect(
					getIssueMessage(result.error?.issues[1])?.format(),
				).toStrictEqual('Expected "bar", but received 1.');

				expect(
					getIssueMessage(result.error?.issues[2])?.format(),
				).toStrictEqual('Expected "baz", but received 1.');
			});
		});
	});

	describe("Decoder methods", () => {
		test("andThen", () => {
			const decoder = string().andThen(() => constant("foo"));

			const result = decoder.decodeValue("bar");

			expect(result).toStrictEqual({
				error: expect.any(DecodeError),
				ok: false,
			});

			expect(getIssueMessage(result.error?.issues)?.format()).toStrictEqual(
				'Expected "foo", but received "bar".',
			);
		});

		test("catch", () => {
			const decoder = string().catch(() => {
				return {
					error: new DecodeError(
						"Custom error",
						createIssues("custom", "Custom issue"),
					),
					ok: false,
				};
			});

			const result = decoder.decodeValue(1);

			expect(result).toStrictEqual({
				error: expect.any(DecodeError),
				ok: false,
			});

			expect(getIssueMessage(result.error?.issues)?.format()).toStrictEqual(
				"Custom issue",
			);
		});

		test("map", () => {
			const decoder = string().map((value) => value.toUpperCase());

			const result = decoder.decodeValue(1);

			expect(result).toStrictEqual({
				error: expect.any(DecodeError),
				ok: false,
			});

			expect(getIssueMessage(result.error?.issues)?.format()).toStrictEqual(
				"Expected string, but received number.",
			);
		});
	});

	describe("unflattenIssues", () => {
		test("round-trips object issues", () => {
			const decoder = object({
				foo: string(),
			});
			const result = decoder.decodeValue({ foo: 1 });

			expect(result.ok).toBe(false);
			if (result.ok) return;

			const restored = unflattenIssues(flattenIssues(result.error.issues));

			expect(getIssueMessage(restored)?.format()).toStrictEqual(
				"One or more object properties failed validation.",
			);
			expect(getIssueMessage(restored.foo)?.format()).toStrictEqual(
				"Expected string, but received number.",
			);
			expect(getIssueMessage(restored.foo)?.message).toStrictEqual(
				"Expected string, but received number.",
			);
		});

		test("round-trips nested object issues", () => {
			const decoder = object({
				foo: object({
					bar: string(),
				}),
			});
			const result = decoder.decodeValue({ foo: { bar: 1 } });

			expect(result.ok).toBe(false);
			if (result.ok) return;

			const restored = unflattenIssues(flattenIssues(result.error.issues));

			expect(getIssueMessage(restored)?.format()).toStrictEqual(
				"One or more object properties failed validation.",
			);
			expect(getIssueMessage(restored.foo)?.format()).toStrictEqual(
				"One or more object properties failed validation.",
			);
			expect(getIssueMessage(restored.foo?.bar)?.format()).toStrictEqual(
				"Expected string, but received number.",
			);
			expect(getIssueMessage(restored.foo?.bar)?.message).toStrictEqual(
				"Expected string, but received number.",
			);
		});

		test("round-trips array issues", () => {
			const decoder = array(string());
			const result = decoder.decodeValue([1, true]);

			expect(result.ok).toBe(false);
			if (result.ok) return;

			const restored = unflattenIssues(flattenIssues(result.error.issues));

			expect(getIssueMessage(restored)?.format()).toStrictEqual(
				"One or more array elements failed validation.",
			);
			expect(getIssueMessage(restored[0])?.format()).toStrictEqual(
				"Expected string, but received number.",
			);
			expect(getIssueMessage(restored[1])?.format()).toStrictEqual(
				"Expected string, but received boolean.",
			);
		});

		test("round-trips union issues", () => {
			const decoder = union(string(), int());
			const result = decoder.decodeValue(true);

			expect(result.ok).toBe(false);
			if (result.ok) return;

			const restored = unflattenIssues(flattenIssues(result.error.issues));

			expect(getIssueMessage(restored)?.format()).toStrictEqual(
				"None of the union members matched.",
			);
			expect(getIssueMessage(restored[0])?.format()).toStrictEqual(
				"Expected string, but received boolean.",
			);
			expect(getIssueMessage(restored[1])?.format()).toStrictEqual(
				"Expected number, but received boolean.",
			);
		});

		test("round-trips primitive issues", () => {
			const decoder = string();
			const result = decoder.decodeValue(1);

			expect(result.ok).toBe(false);
			if (result.ok) return;

			const restored = unflattenIssues(flattenIssues(result.error.issues));

			expect(getIssueMessage(restored)?.format()).toStrictEqual(
				"Expected string, but received number.",
			);
			expect(getIssueMessage(restored)?.message).toStrictEqual(
				"Expected string, but received number.",
			);
		});

		test("accepts PathSegment objects", () => {
			const restored = unflattenIssues([
				{ message: "root failed", path: undefined },
				{ message: "nested failed", path: [{ key: "foo" }] },
			]);

			expect(getIssueMessage(restored)?.format()).toStrictEqual("root failed");
			expect(getIssueMessage(restored.foo)?.format()).toStrictEqual(
				"nested failed",
			);
		});
	});
});
