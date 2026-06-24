import { describe, expect, test } from "vitest";
import { DecodeError, getIssueMessage, katabami } from "../src/index.js";

describe("issues", () => {
	describe("boolean decoder", () => {
		const decoder = katabami.boolean();

		test("unexpected type", () => {
			const result = decoder.decodeValue("foo");

			expect(result).toStrictEqual({
				error: expect.any(DecodeError),
				ok: false,
			});

			expect(getIssueMessage(result.error?.issues)?.format()).toStrictEqual(
				"The value is of type string, but boolean value is expected.",
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
				'The value is 1, but "foo" value is expected.',
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

	describe("float decoder", () => {
		const decoder = katabami.float();

		test("unexpected type", () => {
			const result = decoder.decodeValue("foo");

			expect(result).toStrictEqual({
				error: expect.any(DecodeError),
				ok: false,
			});

			expect(getIssueMessage(result.error?.issues)?.format()).toStrictEqual(
				"The value is of type string, but float value is expected.",
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
				"The value is of type number, but array value is expected.",
			);
		});

		test("out of bounds", () => {
			const result = decoder.decodeValue([]);

			expect(result).toStrictEqual({
				error: expect.any(DecodeError),
				ok: false,
			});

			expect(getIssueMessage(result.error?.issues)?.format()).toStrictEqual(
				"The index 0 is out of bounds.",
			);
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
				"The value is of type string, but number value is expected.",
			);
		});

		test("value is not an integer", () => {
			const result = decoder.decodeValue(1.5);

			expect(result).toStrictEqual({
				error: expect.any(DecodeError),
				ok: false,
			});

			expect(getIssueMessage(result.error?.issues)?.format()).toStrictEqual(
				"The value is of type float, but integer value is expected.",
			);
		});
	});

	describe("object decoder", () => {
		const decoder = katabami.object({
			foo: katabami.string(),
		});

		test("unexpected type", () => {
			const result = decoder.decodeValue(1);
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
				"The value is of type number, but string value is expected.",
			);
		});
	});

	describe("tuple decoder", () => {
		const decoder = katabami.tuple(katabami.string(), katabami.int());

		test("unexpected type", () => {
			const result = decoder.decodeValue(1);
		});
	});
});
