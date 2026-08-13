import { describe, expectTypeOf, test } from "vitest";
import * as katabami from "../src/index.js";
import {
	type FormattedIssue,
	flattenIssues,
	getIssueMessage,
	type IssuesFromDecoder,
	type UnflattenedIssuesFromDecoder,
	unflattenIssues,
} from "../src/index.js";

describe("unflattenIssues", () => {
	test("preserves nested object paths from decoder type", () => {
		const decoder = katabami.object({
			foo: katabami.object({
				bar: katabami.string(),
			}),
		});

		const result = decoder.decodeValue({ foo: { bar: 1 } });

		if (result.ok) return;

		const restored = unflattenIssues<typeof decoder>(
			flattenIssues(result.error.issues),
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
		const decoder = katabami.object({
			foo: katabami.object({
				bar: katabami.string(),
			}),
		});

		const result = decoder.decodeValue({ foo: { bar: 1 } });
		if (result.ok) return;

		const restored = unflattenIssues<typeof decoder>(
			flattenIssues(result.error.issues),
		);

		const issues:
			| IssuesFromDecoder<typeof decoder>
			| UnflattenedIssuesFromDecoder<typeof decoder> = restored;

		expectTypeOf(getIssueMessage(issues)?.type).toExtend<
			"formatted" | "object" | undefined
		>();
	});
});
