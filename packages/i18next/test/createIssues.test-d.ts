import { createIssues, getIssueMessage, type IssueMessageKeys } from "katabami";
import { describe, expectTypeOf, test } from "vitest";
import "../src";

describe("createIssues", () => {
	test("IssueMessageKeys includes i18next resource keys", () => {
		expectTypeOf<IssueMessageKeys>().not.toEqualTypeOf<string>();
		expectTypeOf<"issue.unexpectedType">().toExtend<IssueMessageKeys>();
		expectTypeOf<"type.string">().toExtend<IssueMessageKeys>();
		expectTypeOf<"custom:issue.unexpectedType">().toExtend<IssueMessageKeys>();
	});

	test("accepts i18next resource keys", () => {
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
});
