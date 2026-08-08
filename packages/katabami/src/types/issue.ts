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
