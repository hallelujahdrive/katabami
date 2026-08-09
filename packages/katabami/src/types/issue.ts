import type { IssueMessageKeys, TypeKeys } from "./format.js";
import type { Primitive } from "./primitive.js";

/**
 * The formatter function.
 */
export type Formatter = (issue: Issue) => string;

declare const labelSymbol: unique symbol;

export type _Issues<T, I> = T &
	([I] extends [never]
		? Record<never, never>
		: {
				readonly [labelSymbol]?: I;
			});

/**
 * Issue whose message is already formatted (e.g. after {@link unflattenIssues}).
 */
export type FormattedIssue = Issue<"formatted", string, undefined>;

/**
 * The issue type.
 */
export interface Issue<
	T extends IssueType = IssueType,
	Msg extends string = IssueMessageKeys | (string & {}),
	Vers extends Record<string, Primitive | TypeKeys> | undefined =
		| Record<string, Primitive>
		| undefined,
> {
	/**
	 * Formats the issue message.
	 * @param {Formatter} formatter - The formatter to use.
	 * @returns {string} The formatted issue message.
	 */
	format(formatter?: Formatter): string;
	/**
	 * The message of the issue.
	 */
	readonly message: Msg;
	/**
	 * The type of the issue.
	 */
	readonly type: T;

	/**
	 * Gets the variables of the issue.
	 * @returns {Vers} The variables of the issue.
	 */
	readonly vars: Vers;
}

/**
 * Extracts the issue label stored on an {@link Issues} value (via `_Issues`).
 * Distributes over unions.
 */
export type IssueLabelOf<T> = T extends infer U
	? U extends { readonly [labelSymbol]?: infer L }
		? Exclude<L, undefined>
		: U extends Issue
			? U
			: never
	: never;

/**
 * The issues type.
 */
export type Issues<
	T extends IssueType = IssueType,
	I extends Issue = Issue,
> = _Issues<
	T extends "union"
		? readonly IssuesObject[]
		: T extends "array" | "object" | "record"
			? IssuesObject
			: Record<never, never>,
	I
>;

export interface IssuesObject {
	readonly [key: string]: IssuesObject | readonly IssuesObject[] | undefined;
}

/**
 * Issue types
 */
export type IssueType = ({} & string) | CommonIssueType | CustomIssueType;

/**
 * Open issues tree reconstructed by {@link unflattenIssues} without a source type.
 * Supports path access such as `issues.foo` / `issues[0]`.
 */
export type UnflattenedIssues = _Issues<
	{ readonly [key: string]: undefined | UnflattenedIssues },
	FormattedIssue
>;

/**
 * Keeps the path structure of {@link Issues} while replacing every issue label
 * with {@link FormattedIssue} (message is always `string`).
 *
 * @example
 * ```ts
 * type Nested = ObjectDecodeIssues<
 *   { foo: Decoder<{ bar: string }> },
 *   Issue
 * >;
 * // UnflattenedIssuesOf<Nested> allows `issues.foo?.bar`
 * ```
 */
export type UnflattenedIssuesOf<T> = [T] extends [never]
	? never
	: _Issues<UnflattenedIssuesShape<T>, FormattedIssue>;

/**
 * Common issue types
 */
type CommonIssueType =
	| "array"
	| "boolean"
	| "constant"
	| "float"
	| "integer"
	| "object"
	| "record"
	| "string"
	| "union";

/**
 * Custom issue types
 */
type CustomIssueType = never;

type UnflattenedIssuesShape<T> = T extends readonly (infer E)[]
	? { readonly [key: number]: undefined | UnflattenedIssuesOf<E> }
	: {
			readonly [K in keyof T as K extends symbol
				? never
				: K]?: UnflattenedIssuesOf<NonNullable<T[K]>>;
		};
