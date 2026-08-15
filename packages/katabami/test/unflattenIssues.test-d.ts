import { describe, expectTypeOf, test } from "vitest";
import {
	array,
	type FlattenedIssues,
	type FormattedIssue,
	flattenIssues,
	getIssueMessage,
	type IssuesFromDecoder,
	object,
	string,
	type UnflattenedIssues,
	type UnflattenedIssuesFromDecoder,
	unflattenIssues,
} from "../src";

describe("unflattenIssues", () => {
	test("restores nested object paths from flattened issues without a generic", () => {
		const decoder = object({
			foo: object({
				bar: string(),
			}),
		});

		const result = decoder.decodeValue({ foo: { bar: 1 } });

		if (result.ok) return;

		const flattened = flattenIssues(result.issues);
		expectTypeOf(flattened).toEqualTypeOf<
			FlattenedIssues<typeof result.issues>
		>();

		const restored = unflattenIssues(flattened);

		expectTypeOf(restored).toExtend<{
			readonly foo?: {
				readonly bar?: unknown;
			};
		}>();

		expectTypeOf(getIssueMessage(restored)).toEqualTypeOf<
			FormattedIssue | undefined
		>();
		expectTypeOf(getIssueMessage(restored.foo)).toEqualTypeOf<
			FormattedIssue | undefined
		>();
		expectTypeOf(getIssueMessage(restored.foo?.bar)).toEqualTypeOf<
			FormattedIssue | undefined
		>();
		expectTypeOf(getIssueMessage(restored.foo?.bar)?.format()).toEqualTypeOf<
			string | undefined
		>();
	});

	test("preserves nested object paths from decoder type", () => {
		const decoder = object({
			foo: object({
				bar: string(),
			}),
		});

		const result = decoder.decodeValue({ foo: { bar: 1 } });

		if (result.ok) return;

		const restored = unflattenIssues<typeof decoder>(
			flattenIssues(result.issues),
		);

		expectTypeOf(restored).toExtend<{
			readonly foo?: {
				readonly bar?: unknown;
			};
		}>();

		expectTypeOf(getIssueMessage(restored)).toEqualTypeOf<
			FormattedIssue | undefined
		>();
		expectTypeOf(getIssueMessage(restored.foo)).toEqualTypeOf<
			FormattedIssue | undefined
		>();
		expectTypeOf(getIssueMessage(restored.foo?.bar)).toEqualTypeOf<
			FormattedIssue | undefined
		>();
		expectTypeOf(getIssueMessage(restored.foo?.bar)?.format()).toEqualTypeOf<
			string | undefined
		>();

		type Paths = UnflattenedIssuesFromDecoder<typeof decoder>;
		expectTypeOf<Paths>().toExtend<{
			readonly foo?: {
				readonly bar?: unknown;
			};
		}>();
	});

	test("original issues type is preserved", () => {
		const decoder = object({
			foo: object({
				bar: string(),
			}),
		});

		const result = decoder.decodeValue({ foo: { bar: 1 } });
		if (result.ok) return;

		const restored = unflattenIssues(flattenIssues(result.issues));

		const issues:
			| IssuesFromDecoder<typeof decoder>
			| UnflattenedIssuesFromDecoder<typeof decoder> = restored;

		expectTypeOf(getIssueMessage(issues)?.type).toExtend<
			"formatted" | "object" | undefined
		>();
	});

	test("plain Standard Schema arrays stay open-typed", () => {
		const restored = unflattenIssues([
			{ message: "root failed", path: undefined },
			{ message: "nested failed", path: [{ key: "foo" }] },
		]);

		expectTypeOf(restored).toEqualTypeOf<UnflattenedIssues>();
		expectTypeOf(getIssueMessage(restored.foo)).toEqualTypeOf<
			FormattedIssue | undefined
		>();
	});

	test("restores array element paths without a generic", () => {
		const decoder = array(string());
		const result = decoder.decodeValue([1]);
		if (result.ok) return;

		const restored = unflattenIssues(flattenIssues(result.issues));

		expectTypeOf(getIssueMessage(restored[0])).toEqualTypeOf<
			FormattedIssue | undefined
		>();
	});
});
