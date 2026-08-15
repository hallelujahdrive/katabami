import { describe, expectTypeOf, test } from "vitest";
import {
	deserializeDecodeResult,
	type FlattenedIssues,
	type FormattedIssue,
	type Formatter,
	getIssueMessage,
	object,
	serializeDecodeResult,
	string,
	type UnflattenedIssues,
	type UnflattenedIssuesFromDecoder,
	unwrapDecodeResult,
} from "../src";

describe("serializeDecodeResult", () => {
	test("flattens failed issues and restores typed paths without a generic", () => {
		const decoder = object({
			foo: object({
				bar: string(),
			}),
		});

		const result = decoder.decodeValue({ foo: { bar: 1 } });

		if (result.ok) return;

		const serialized = serializeDecodeResult(result);

		expectTypeOf(serialized.issues).toEqualTypeOf<
			FlattenedIssues<typeof result.issues>
		>();

		const restored = deserializeDecodeResult(serialized);

		expectTypeOf(restored.ok).toEqualTypeOf<false>();
		expectTypeOf(getIssueMessage(restored.issues)).toEqualTypeOf<
			FormattedIssue | undefined
		>();
		expectTypeOf(getIssueMessage(restored.issues.foo?.bar)).toEqualTypeOf<
			FormattedIssue | undefined
		>();
	});

	test("preserves a successful value type", () => {
		const decoder = object({
			foo: string(),
		});
		const result = decoder.decodeValue({ foo: "bar" });
		if (!result.ok) return;

		const serialized = serializeDecodeResult(result);
		const restored = deserializeDecodeResult(serialized);

		if (!restored.ok) return;

		expectTypeOf(serialized.value).toEqualTypeOf<{ foo: string }>();
		expectTypeOf(restored.value).toEqualTypeOf<{ foo: string }>();
	});

	test("JSON-parsed issues stay open-typed unless a decoder generic is passed", () => {
		const decoder = object({
			foo: object({
				bar: string(),
			}),
		});
		const result = decoder.decodeValue({ foo: { bar: 1 } });

		if (result.ok) return;

		const parsed = JSON.parse(
			JSON.stringify(serializeDecodeResult(result)),
		) as {
			issues: { message: string; path?: ReadonlyArray<string> }[];
			ok: false;
		};

		const restored = deserializeDecodeResult(parsed);

		if (restored.ok) return;

		expectTypeOf(restored.issues).toEqualTypeOf<UnflattenedIssues>();

		const typed = deserializeDecodeResult<typeof decoder>(parsed);

		if (typed.ok) return;

		expectTypeOf(typed.issues).toEqualTypeOf<
			UnflattenedIssuesFromDecoder<typeof decoder>
		>();
		expectTypeOf(getIssueMessage(typed.issues.foo?.bar)).toEqualTypeOf<
			FormattedIssue | undefined
		>();
	});
});

describe("unwrapDecodeResult", () => {
	test("returns the decoded value type", () => {
		const decoder = object({
			foo: string(),
		});
		const result = decoder.decodeValue({ foo: "bar" });

		expectTypeOf(unwrapDecodeResult(result)).toEqualTypeOf<{ foo: string }>();

		if (!result.ok) return;

		expectTypeOf(unwrapDecodeResult(result)).toEqualTypeOf<{ foo: string }>();
		expectTypeOf(unwrapDecodeResult(result, "Failed")).toEqualTypeOf<{
			foo: string;
		}>();
		expectTypeOf<Parameters<typeof unwrapDecodeResult>[1]>().toEqualTypeOf<
			Formatter | string | undefined
		>();
	});
});
