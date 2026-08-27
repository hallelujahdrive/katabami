import { describe, expectTypeOf, test } from "vitest";
import { createIssues, getIssueMessage, type IssueMessageKeys } from "../src";

describe("createIssues", () => {
	test("infers built-in issue message keys", () => {
		const issues = createIssues("custom", "issue.unexpectedType");

		expectTypeOf(getIssueMessage(issues)?.message).toEqualTypeOf<
			"issue.unexpectedType" | undefined
		>();
	});

	test("accepts custom message strings", () => {
		const issues = createIssues("custom", "Custom issue");

		expectTypeOf(getIssueMessage(issues)?.message).toEqualTypeOf<
			"Custom issue" | undefined
		>();
	});

	test("IssueMessageKeys is the built-in issue.* union", () => {
		expectTypeOf<"issue.failedToDecode">().toExtend<IssueMessageKeys>();
		expectTypeOf<"issue.unexpectedType">().toExtend<IssueMessageKeys>();
		expectTypeOf<"type.string">().not.toExtend<IssueMessageKeys>();
	});
});
