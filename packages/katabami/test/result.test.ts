import { describe, expect, test } from "vitest";
import {
	array,
	DecodeError,
	deserializeDecodeResult,
	getIssueMessage,
	int,
	object,
	serializeDecodeResult,
	string,
	union,
	unwrapDecodeResult,
} from "../src";

describe("serializeDecodeResult", () => {
	test("round-trips a successful result", () => {
		const decoder = object({
			foo: string(),
		});
		const result = decoder.decodeValue({ foo: "bar" });
		const restored = deserializeDecodeResult(serializeDecodeResult(result));

		expect(restored).toStrictEqual({
			ok: true,
			value: { foo: "bar" },
		});
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

		const restored = deserializeDecodeResult(serializeDecodeResult(result));

		expect(restored.ok).toBe(false);
		if (restored.ok) return;

		expect(getIssueMessage(restored.issues)?.format()).toStrictEqual(
			"One or more object properties failed validation.",
		);
		expect(getIssueMessage(restored.issues.foo)?.format()).toStrictEqual(
			"One or more object properties failed validation.",
		);
		expect(getIssueMessage(restored.issues.foo?.bar)?.format()).toStrictEqual(
			"Expected string, but received number.",
		);
		expect(getIssueMessage(restored.issues.foo?.bar)?.message).toStrictEqual(
			"Expected string, but received number.",
		);
	});

	test("round-trips array issues", () => {
		const decoder = array(string());
		const result = decoder.decodeValue([1, true]);

		expect(result.ok).toBe(false);
		if (result.ok) return;

		const restored = deserializeDecodeResult(serializeDecodeResult(result));

		expect(restored.ok).toBe(false);
		if (restored.ok) return;

		expect(getIssueMessage(restored.issues)?.format()).toStrictEqual(
			"One or more array elements failed validation.",
		);
		expect(getIssueMessage(restored.issues[0])?.format()).toStrictEqual(
			"Expected string, but received number.",
		);
		expect(getIssueMessage(restored.issues[1])?.format()).toStrictEqual(
			"Expected string, but received boolean.",
		);
	});

	test("round-trips union issues", () => {
		const decoder = union(string(), int());
		const result = decoder.decodeValue(true);

		expect(result.ok).toBe(false);
		if (result.ok) return;

		const restored = deserializeDecodeResult(serializeDecodeResult(result));

		expect(restored.ok).toBe(false);
		if (restored.ok) return;

		expect(getIssueMessage(restored.issues)?.format()).toStrictEqual(
			"None of the union members matched.",
		);
		expect(getIssueMessage(restored.issues[0])?.format()).toStrictEqual(
			"Expected string, but received boolean.",
		);
		expect(getIssueMessage(restored.issues[1])?.format()).toStrictEqual(
			"Expected number, but received boolean.",
		);
	});

	test("round-trips through JSON.parse", () => {
		const decoder = object({
			foo: object({
				bar: string(),
			}),
		});
		const result = decoder.decodeValue({ foo: { bar: 1 } });

		expect(result.ok).toBe(false);
		if (result.ok) return;

		const parsed = JSON.parse(
			JSON.stringify(serializeDecodeResult(result)),
		) as {
			issues: { message: string; path?: ReadonlyArray<string> }[];
			ok: false;
		};
		const restored = deserializeDecodeResult<typeof decoder>(parsed);

		expect(restored.ok).toBe(false);
		if (restored.ok) return;

		expect(getIssueMessage(restored.issues.foo?.bar)?.format()).toStrictEqual(
			"Expected string, but received number.",
		);
	});
});

describe("unwrapDecodeResult", () => {
	test("returns the value when decoding succeeds", () => {
		const decoder = object({
			foo: string(),
		});

		expect(
			unwrapDecodeResult(decoder.decodeValue({ foo: "bar" })),
		).toStrictEqual({ foo: "bar" });
	});

	test("throws DecodeError when decoding fails", () => {
		const decoder = object({
			foo: object({
				bar: string(),
			}),
		});
		const result = decoder.decodeValue({ foo: { bar: 1 } });

		expect(result.ok).toBe(false);
		if (result.ok) return;

		expect(() => unwrapDecodeResult(result)).toThrow(DecodeError);

		try {
			unwrapDecodeResult(result);
		} catch (error) {
			expect(error).toBeInstanceOf(DecodeError);
			if (!(error instanceof DecodeError)) return;

			expect(error.issues).toBe(result.issues);
			expect(error.message).toStrictEqual("Failed to decode");
			expect(getIssueMessage(result.issues)?.format()).toStrictEqual(
				"One or more object properties failed validation.",
			);
			expect(getIssueMessage(result.issues.foo?.bar)?.format()).toStrictEqual(
				"Expected string, but received number.",
			);
		}
	});

	test("uses a custom string message", () => {
		const result = string().decodeValue(1);

		expect(result.ok).toBe(false);
		if (result.ok) return;

		try {
			unwrapDecodeResult(result, "Custom decode error");
		} catch (error) {
			expect(error).toBeInstanceOf(DecodeError);
			if (!(error instanceof DecodeError)) return;

			expect(error.message).toStrictEqual("Custom decode error");
			expect(error.issues).toBe(result.issues);
		}
	});

	test("formats the issue message with a formatter", () => {
		const result = string().decodeValue(1);

		expect(result.ok).toBe(false);
		if (result.ok) return;

		try {
			unwrapDecodeResult(result, () => "Formatted decode error");
		} catch (error) {
			expect(error).toBeInstanceOf(DecodeError);
			if (!(error instanceof DecodeError)) return;

			expect(error.message).toStrictEqual("Formatted decode error");
			expect(error.issues).toBe(result.issues);
		}
	});
});
