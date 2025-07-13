import type { IssueMessage, Issues } from "../types/index.js";

export const isIssueMessage = (value?: Issues): value is IssueMessage => {
	return (
		typeof value === "object" &&
		value !== null &&
		"template" in value &&
		"type" in value
	);
};
