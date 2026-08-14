import type {
	Decoder as IDecoder,
	UnflattenedIssuesFromDecoder,
} from "../types/decoder";
import type { IssueMessageKeys, TypeKeys } from "../types/format";
import type {
	_Issues,
	FormattedIssue,
	Formatter,
	Issue,
	Issues,
	IssueType,
	UnflattenedIssues,
} from "../types/issue";
import type { Primitive } from "../types/primitive";
import type { StandardSchemaV1 } from "../types/standardSchema";
import { defaultFormatter } from "./format";

/**
 * A weak map to store the issue message string representations.
 */
const weakMap = new WeakMap<object, Issue>();

type IssueTreeNode = {
	children: Map<string, IssueTreeNode>;
	messages: string[];
};

/**
 * An issue whose message is already formatted (e.g. after unflattenIssues).
 * `format()` returns the stored string as-is.
 */
class FormattedIssueMessage implements FormattedIssue {
	readonly type = "formatted";
	readonly vars = undefined;

	constructor(public readonly message: string) {}

	format(): string {
		return this.message;
	}
}

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
 * @param {T} type - The type of the issues.
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
 * @returns The issue metadata for the issues (FormattedIssue after unflattenIssues).
 */
export function getIssueMessage<T extends object>(
	issues: T | undefined,
): T extends _Issues<infer _, infer I> ? I | undefined : undefined {
	if (issues == null)
		return undefined as T extends _Issues<infer _, infer I>
			? I | undefined
			: undefined;

	return weakMap.get(issues) as T extends _Issues<infer _, infer I>
		? I | undefined
		: undefined;
}

/**
 * Rebuilds an Issues tree from flattened Standard Schema issues and restores
 * WeakMap entries so getIssueMessage can read the pre-formatted messages.
 *
 * Pass the decoder type to restore typed paths:
 * `unflattenIssues<typeof decoder>(flattened)`.
 *
 * Messages are already formatter output, so
 * `getIssueMessage(issues)?.message` is always `string`.
 *
 * @template D - The decoder whose issue path structure should be preserved.
 * @param {ReadonlyArray<StandardSchemaV1.Issue>} flattened - The flattened issues.
 * @returns {UnflattenedIssuesFromDecoder<D>} The reconstructed issues tree.
 */
export function unflattenIssues<
	D extends IDecoder<unknown, Issues, boolean> = never,
>(
	flattened: ReadonlyArray<StandardSchemaV1.Issue>,
): [D] extends [never] ? UnflattenedIssues : UnflattenedIssuesFromDecoder<D> {
	const root: IssueTreeNode = { children: new Map(), messages: [] };

	for (const issue of flattened) {
		let node = root;

		if (issue.path != null) {
			for (const segment of issue.path) {
				const key = normalizePathSegment(segment);
				let child = node.children.get(key);

				if (child == null) {
					child = { children: new Map(), messages: [] };
					node.children.set(key, child);
				}

				node = child;
			}
		}

		node.messages.push(issue.message);
	}

	return buildIssuesFromTree(root) as [D] extends [never]
		? UnflattenedIssues
		: UnflattenedIssuesFromDecoder<D>;
}

function buildIssuesFromTree(node: IssueTreeNode): UnflattenedIssues {
	const result: Record<string, UnflattenedIssues> = {};

	if (node.children.size === 0 && node.messages.length > 1) {
		const [rootMessage, ...rest] = node.messages as [string, ...string[]];

		for (const [index, message] of rest.entries()) {
			const child = {} as UnflattenedIssues;
			setFormattedMessage(child, message);
			result[String(index)] = child;
		}

		const issues = result as UnflattenedIssues;
		setFormattedMessage(issues, rootMessage);
		return issues;
	}

	for (const [key, child] of node.children) {
		result[key] = buildIssuesFromTree(child);
	}

	const issues = result as UnflattenedIssues;
	if (node.messages[0] != null) {
		setFormattedMessage(issues, node.messages[0]);
	}

	return issues;
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
			path,
		});
	}

	if (Array.isArray(issues)) {
		for (const issue of issues) {
			flattenedIssues.push(...flattenIssuesHelper(issue, path, formatter));
		}

		return flattenedIssues;
	}

	for (const [key, value] of Object.entries(issues)) {
		if (value == null) continue;
		flattenedIssues.push(
			...flattenIssuesHelper(value, [...(path ?? []), key], formatter),
		);
	}

	return flattenedIssues;
}

function normalizePathSegment(
	segment: PropertyKey | StandardSchemaV1.PathSegment,
): string {
	if (typeof segment === "object" && segment != null && "key" in segment) {
		return String(segment.key);
	}

	return String(segment);
}

function setFormattedMessage(issues: object, message: string): void {
	weakMap.set(issues, new FormattedIssueMessage(message));
}
