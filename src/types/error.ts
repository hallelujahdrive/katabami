import type { TFunction, TOptions } from "i18next";
import type { Primitive } from "./primitive.js";

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
	| "string"
	| "union";

/**
 * Custom issue types
 */
type CustomIssueType = never;

/**
 * Issue types
 */
export type IssueType = ({} & string) | CommonIssueType | CustomIssueType;

export interface IssueMessage<
	T extends IssueType = IssueType,
	V extends Primitive[] | Record<string, Primitive> = Record<string, Primitive>,
> {
	/**
	 * Gets the variables of the issue.
	 * @returns {V} The variables of the issue.
	 */
	getVars(): V;
	/**
	 * The string representation of the issue.
	 * @param {TFunction} t - The i18n function.
	 * @param {TOptions} tOptions - The i18n options.
	 * @returns {string} The string representation of the issue.
	 */
	toString(t?: TFunction, tOptions?: TOptions): string;

	/**
	 * The type of the issue.
	 */
	readonly type: T;
}
interface IssuesObject {
	readonly [key: string]:
		| IssueMessage
		| IssuesObject
		| readonly IssuesObject[]
		| string
		| undefined;
}

export type Issues<T extends IssueType = IssueType> = T extends
	| "boolean"
	| "constant"
	| "integer"
	| "number"
	| "string"
	? IssueMessage<T>
	: T extends "null" | "undefined"
		? IssueMessage
		: T extends "union"
			? readonly IssuesObject[]
			: T extends "array" | "object"
				? IssuesObject
				: IssuesObject[string];

export interface DecodeErrorInterface<T extends Issues> extends Error {
	issues: T;
}
