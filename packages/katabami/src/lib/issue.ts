import type { IssueMessageKeys, TypeKeys } from "../types/format.js";
import type { Formatter, Issue, Issues, IssueType } from "../types/issue.js";
import type { Primitive } from "../types/primitive.js";
import type { StandardSchemaV1 } from "../types/standardSchema.js";
import { defaultFormatter } from "./format.js";

/**
 * A weak map to store the issue message string representations.
 */
const weakMap = new WeakMap<object, Issue>();

class IssueMessage<
	T extends IssueType,
	Msg extends string = string,
	Vars extends Record<string, Primitive> | undefined =
		| Record<string, Primitive>
		| undefined,
> implements Issue<T, Msg, Vars>
{
	constructor(
		public readonly type: T,
		public readonly message: Msg,
		public readonly vars: Vars,
	) {}

	/**
	 * The string representation of the issue.
	 * @returns {string} The string representation of the issue.
	 */
	format(formatter: Formatter = defaultFormatter): string {
		return formatter(this);
	}
}

/**
 * Creates an issue.
 * @template T - The type of the issue.
 * @template Msg - The message of the issue.
 * @template Vars - The variables of the issue.
 * @param {T} type - The type of the issue.
 * @param {Msg} message - The message of the issue.
 * @param {Vars} vars - The variables of the issue.
 * @param {Issues<T, Issue<T, Msg, Vars>>} issues - The issues to add the issue to.
 * @returns {Issues<T, Issue<T, Msg, Vars>>} The issues with the new issue.
 */
export function createIssues<
	T extends IssueType,
	Msg extends string = string,
	Vars extends Record<string, Primitive> | undefined = undefined,
>(
	type: T,
	message: Msg,
	vars: undefined | Vars,
	issues: Issues<T, Issue<T, Msg, Vars>>,
): Issues<T, Issue<T, Msg, Vars>>;
/**
 * Creates issues.
 * @template T - The type of the issues.
 * @template Msg - The message of the issues.
 * @template Vars - The variables of the issues.
 * @param {T} type - The type of the issue.
 * @param {Msg} message - The message of the issue.
 * @param {Vars} [vars] - The variables of the issue.
 * @returns {Issues<T, Issue<T, Msg, Vars>>} The issues.
 */
export function createIssues<
	T extends IssueType,
	Msg extends string = IssueMessageKeys | (string & {}),
	Vars extends Record<string, Primitive | TypeKeys> | undefined = undefined,
>(type: T, message: Msg, vars?: Vars): Issues<T, Issue<T, Msg, Vars>>;
export function createIssues<
	T extends IssueType,
	Msg extends string = IssueMessageKeys | (string & {}),
	Vars extends Record<string, Primitive | TypeKeys> | undefined = undefined,
>(
	type: T,
	message: Msg,
	vars?: Vars,
	issues?: Issues<T, Issue<T, Msg, Vars>>,
): Issues<T, Issue<T, Msg, Vars>> {
	const _issues = issues ?? ({} as Issues<T, Issue<T, Msg, Vars>>);

	const issueMessage = new IssueMessage(type, message, vars);

	weakMap.set(_issues, issueMessage);

	return _issues;
}

/**
 * Flattens the issues into an array of Standard Schema issues.
 * @param {Issues} issues - The issues to flatten.
 * @param {Formatter} [formatter] - The formatter to use.
 * @returns {ReadonlyArray<StandardSchemaV1.Issue>} The flattened issues.
 */
export function flattenIssues(
	issues: Issues,
	formatter?: Formatter,
): ReadonlyArray<StandardSchemaV1.Issue> {
	return flattenIssuesHelper(issues, undefined, formatter);
}

/**
 * Gets the issue message for the issues.
 * @template T - The type of the issues.
 * @param {T | undefined} issues - The issues to get the issue message for.
 * @returns {T extends Issues<IssueType, infer I> ? I | undefined : undefined} The issue message for the issues.
 */
export function getIssueMessage<T extends Issues>(
	issues: T | undefined,
): T extends Issues<IssueType, infer I> ? I | undefined : undefined {
	if (issues == null)
		return undefined as T extends Issues<IssueType, infer I>
			? I | undefined
			: undefined;

	return weakMap.get(issues) as T extends Issues<IssueType, infer I>
		? I | undefined
		: undefined;
}

function flattenIssuesHelper(
	issues: Issues,
	path?: ReadonlyArray<number | string>,
	formatter?: Formatter,
): ReadonlyArray<StandardSchemaV1.Issue> {
	const flattenedIssues: StandardSchemaV1.Issue[] = [];

	const message = getIssueMessage(issues)?.format(formatter);
	if (message != null) {
		flattenedIssues.push({
			message,
			path: path ?? [],
		});
	}

	if (Array.isArray(issues)) {
		for (const issue of issues) {
			flattenedIssues.push(...flattenIssuesHelper(issue, path, formatter));
		}
	}

	for (const [key, value] of Object.entries(issues)) {
		if (value == null) continue;
		flattenedIssues.push(
			...flattenIssuesHelper(value, [...(path ?? []), key], formatter),
		);
	}

	return flattenedIssues;
}
