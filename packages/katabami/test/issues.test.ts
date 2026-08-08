import { describe, expect, test } from "vitest";
import {
	createIssues,
	DecodeError,
	getIssueMessage,
	katabami,
} from "../src/index.js";

describe("issues", () => {
	describe("array decoder", () => {
		const decoder = katabami.array(katabami.string());

		test("unexpected type", () => {
			const result = decoder.decodeValue(1);

			expect(result).toStrictEqual({
				error: expect.any(DecodeError),
				ok: false,
			});

			expect(getIssueMessage(result.error?.issues)?.format()).toStrictEqual(
				'Expected "array", but received "number".',
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

	describe("boolean decoder", () => {
		const decoder = katabami.boolean();

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
		const decoder = katabami.constant("foo");

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
	});

	describe("failed decoder", () => {
		const decoder = katabami.failed();

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
		const decoder = katabami.field("foo", katabami.string());

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
			const decoder = katabami.field(
				"foo",
				katabami.optional(katabami.string()),
			);

			test("missing field", () => {
				const result = decoder.decodeValue({});

				expect(result).toStrictEqual({
					ok: true,
					value: undefined,
				});
			});
		});
	});

	describe("float decoder", () => {
		const decoder = katabami.float();

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
		const decoder = katabami.index(0, katabami.string());

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
		const decoder = katabami.int();

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
		const decoder = katabami.map(
			(foo, bar) => ({ bar, foo }),
			katabami.field("foo", katabami.string()),
			katabami.field("bar", katabami.string()),
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

	describe("object decoder", () => {
		const decoder = katabami.object({
			foo: katabami.string(),
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
		const decoder = katabami.record(katabami.string());

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

			expect(
				getIssueMessage(result.error?.issues?.foo)?.format(),
			).toStrictEqual("Expected string, but received number.");
		});
	});

	describe("string decoder", () => {
		const decoder = katabami.string();

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
		const decoder = katabami.tuple(katabami.string(), katabami.int());

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
		const decoder = katabami.union(katabami.string(), katabami.int());

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
			const decoder = katabami.union(
				katabami.constant("foo"),
				katabami.union(katabami.constant("bar"), katabami.constant("baz")),
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
			const decoder = katabami.string().andThen(() => katabami.constant("foo"));

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
			const decoder = katabami.string().catch(() => {
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
			const decoder = katabami.string().map((value) => value.toUpperCase());

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
});
