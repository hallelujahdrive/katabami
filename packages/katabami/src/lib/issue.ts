import type { Issue, Issues, IssueType, Primitive } from "../types/index.js";

/**
 * A weak map to store the issue message string representations.
 */
const weakMap = new WeakMap<object, Issue>();

class _IssueMessage<
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
	toString(): string {
		return this.message;
	}
}

/**
 * Creates an issue.
 * @param {T} type - The type of the issue.
 * @param {Msg} message - The message of the issue.
 * @param {Vars} vars - The variables of the issue.
 * @param {Issues<T, Issue<T, Msg, Vars>>} issues - The issues to add the issue to.
 * @returns {Issues<T, Issue<T, Msg, Vars>>} The issues with the new issue.
 */
export function issue<
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
 * Creates an issue.
 * @param {T} type - The type of the issue.
 * @param {Msg} message - The message of the issue.
 * @param {Vars} [vars] - The variables of the issue.
 * @returns {never} Never.
 */
export function issue<
	T extends IssueType,
	Msg extends string = string,
	Vars extends Record<string, Primitive> = Record<never, never>,
>(type: T, message: Msg, vars?: Vars): never;
export function issue<
	T extends IssueType,
	Msg extends string = string,
	Vars extends Record<string, Primitive> | undefined = undefined,
>(
	type: T,
	message: Msg,
	vars?: Vars,
	issues?: Issues<T, Issue<T, Msg, Vars>>,
): Issues<T, Issue<T, Msg, Vars>> {
	const _issues = issues ?? ({} as Issues<T, Issue<T, Msg, Vars>>);

	const issueMessage = new _IssueMessage(type, message, vars);

	weakMap.set(_issues, issueMessage);

	return _issues;
}

/**
 * Gets the issue message for the issues.
 * @template T - The type of the issues.
 * @param {T | undefined} issues - The issues to get the issue message for.
 * @returns {T extends Issues<IssueType, infer I> ? I | undefined : undefined} The issue message for the issues.
 */
export function issueMessage<T extends Issues>(
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
