import type {
	Decoder as IDecoder,
	UnflattenedIssuesFromDecoder,
} from "../types/decoder";
import type { IssueMessageKeys, TypeKeys } from "../types/format";
import type {
	_Issues,
	FlattenedIssues,
	FormattedIssue,
	Formatter,
	Issue,
	Issues,
	IssueType,
	UnflattenedIssues,
	UnflattenedIssuesFromFlattened,
} from "../types/issue";
import type { Primitive } from "../types/primitive";
import type { StandardSchemaV1 } from "../types/standardSchema";
import { defaultFormatter } from "./format";

/**
 * A weak map to store the issue message string representations.
 */
const weakMap = new WeakMap<object, Issue>();

type IssueGroup = {
	children: NormalizedIssue[];
	message: string;
};

type NormalizedIssue = {
	message: string;
	path: readonly string[];
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
> implements Issue<T, Msg, Vars> {
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
	const Msg extends IssueMessageKeys | (string & {}) =
		| IssueMessageKeys
		| (string & {}),
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
	const Msg extends IssueMessageKeys | (string & {}) =
		| IssueMessageKeys
		| (string & {}),
	Vars extends Record<string, Primitive | TypeKeys> | undefined = undefined,
>(type: T, message: Msg, vars?: Vars): Issues<T, Issue<T, Msg, Vars>>;
export function createIssues<
	T extends IssueType,
	const Msg extends IssueMessageKeys | (string & {}) =
		| IssueMessageKeys
		| (string & {}),
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
 * The result is branded with the source issues type so
 * {@link unflattenIssues} can restore typed paths without a generic.
 * @template T - The source issues tree.
 * @param {T} issues - The issues to flatten.
 * @param {Formatter} [formatter] - The formatter to use.
 * @returns {FlattenedIssues<T>} The flattened issues.
 */
export function flattenIssues<T extends Issues>(
	issues: T,
	formatter?: Formatter,
): FlattenedIssues<T> {
	return flattenIssuesHelper(
		issues,
		undefined,
		formatter,
	) as FlattenedIssues<T>;
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
 * {@link flattenIssues} brands the array with the source issues type, so
 * `unflattenIssues(flattened)` restores typed paths. A decoder generic is
 * still accepted for untyped arrays:
 * `unflattenIssues<typeof decoder>(flattened)`.
 *
 * Messages are already formatter output, so
 * `getIssueMessage(issues)?.message` is always `string`.
 *
 * @template D - The decoder whose issue path structure should be preserved.
 * @template T - The flattened issues array (inferred from the argument).
 * @param {T} flattened - The flattened issues.
 * @returns The reconstructed issues tree.
 */
export function unflattenIssues<
	D extends IDecoder<unknown, Issues, boolean> = never,
	T extends ReadonlyArray<StandardSchemaV1.Issue> =
		ReadonlyArray<StandardSchemaV1.Issue>,
>(
	flattened: T,
): [D] extends [never]
	? UnflattenedIssuesFromFlattened<T>
	: UnflattenedIssuesFromDecoder<D> {
	const normalized = flattened.map((issue) => ({
		message: issue.message,
		path: normalizeIssuePath(issue.path),
	}));

	return buildIssuesAt(normalized, 0) as [D] extends [never]
		? UnflattenedIssuesFromFlattened<T>
		: UnflattenedIssuesFromDecoder<D>;
}

function assignIssueChildren(
	target: object,
	children: readonly NormalizedIssue[],
	depth: number,
): void {
	const byKey = new Map<string, NormalizedIssue[]>();

	for (const child of children) {
		const key = child.path[depth];
		if (key == null) continue;

		const bucket = byKey.get(key);
		if (bucket == null) {
			byKey.set(key, [child]);
			continue;
		}

		bucket.push(child);
	}

	const record = target as Record<string, UnflattenedIssues>;
	for (const [key, bucket] of byKey) {
		record[key] = buildIssuesAt(bucket, depth + 1);
	}
}

function buildIssueNode(
	message: string | undefined,
	children: readonly NormalizedIssue[],
	depth: number,
): UnflattenedIssues {
	const result: Record<string, UnflattenedIssues> = {};
	assignIssueChildren(result, children, depth);

	if (message != null) setFormattedMessage(result, message);

	return result as UnflattenedIssues;
}

/**
 * Union issues are arrays. `flattenIssues` writes the array message and every
 * member at the same path, in order, and writes each member's descendants
 * before the next member. Several messages at one path become an array again.
 * Deeper issues stay on the member that precedes them, so a union member can
 * keep nested object or array issues.
 */
function buildIssuesAt(
	issues: readonly NormalizedIssue[],
	depth: number,
): UnflattenedIssues {
	const groups: IssueGroup[] = [];
	const leading: NormalizedIssue[] = [];

	for (const issue of issues) {
		if (issue.path.length === depth) {
			groups.push({ children: [], message: issue.message });
			continue;
		}

		if (issue.path.length < depth) continue;

		const current = groups[groups.length - 1];
		if (current == null) {
			leading.push(issue);
			continue;
		}

		current.children.push(issue);
	}

	const head = groups[0];
	if (head != null && groups.length > 1) {
		const restored = groups
			.slice(1)
			.map((member) => buildIssueNode(member.message, member.children, depth));

		setFormattedMessage(restored, head.message);
		assignIssueChildren(restored, [...leading, ...head.children], depth);

		return restored as unknown as UnflattenedIssues;
	}

	return buildIssueNode(
		head?.message,
		head == null ? leading : [...leading, ...head.children],
		depth,
	);
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

function normalizeIssuePath(
	path: StandardSchemaV1.Issue["path"],
): readonly string[] {
	if (path == null) return [];

	return path.map((segment) => normalizePathSegment(segment));
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
