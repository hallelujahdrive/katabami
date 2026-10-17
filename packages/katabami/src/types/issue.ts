import type { IssueMessageKeys, TypeKeys } from "./format";
import type { Primitive } from "./primitive";

/**
 * The formatter function.
 */
export type Formatter = (issue: Issue) => string;

declare const flattenedIssuesBrand: unique symbol;
declare const labelSymbol: unique symbol;

export type _Issues<T, I> = T &
	([I] extends [never]
		? Record<never, never>
		: {
				readonly [labelSymbol]?: I;
			});

/**
 * Standard Schema issue list branded with the source {@link Issues} tree.
 * Produced by {@link flattenIssues}; {@link unflattenIssues} reads the brand
 * to restore typed paths without a decoder generic.
 */
export type FlattenedIssues<I extends Issues = Issues> = ReadonlyArray<{
	readonly message: string;
	readonly path?: ReadonlyArray<{ readonly key: PropertyKey } | PropertyKey>;
}> & {
	readonly [flattenedIssuesBrand]: I;
};

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
 * Combines two issue trees so every nested path stays readable.
 *
 * `andThen` and `decodeString` can fail for more than one reason. A plain
 * union hides optional fields that exist on only one member. Merging keeps
 * each field optional and unions the label where paths overlap.
 */
export type MergeIssues<A extends Issues, B extends Issues> = MergeIssuesOf<
	A | B
>;

/**
 * Open issues tree reconstructed by {@link unflattenIssues} without a source type.
 * Supports path access such as `issues.foo` / `issues[0]`.
 */
export type UnflattenedIssues = _Issues<
	{ readonly [key: string]: undefined | UnflattenedIssues },
	FormattedIssue
>;

/**
 * Restores typed issue paths from {@link FlattenedIssues}.
 * Plain Standard Schema issue arrays fall back to {@link UnflattenedIssues}.
 */
export type UnflattenedIssuesFromFlattened<T> =
	T extends FlattenedIssues<infer I>
		? [Issues] extends [I]
			? UnflattenedIssues
			: UnflattenedIssuesOf<I>
		: UnflattenedIssues;

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

type AsMergedIssues<V> = [V] extends [never]
	? never
	: HasDistinctKeys<V> extends true
		? MergeIssuesOf<V>
		: V;

/**
 * Common issue types
 */
type CommonIssueType =
	| "array"
	| "boolean"
	| "integer"
	| "literal"
	| "number"
	| "object"
	| "record"
	| "string"
	| "union";

/**
 * Custom issue types
 */
type CustomIssueType = never;

/**
 * Optional fields on different objects are mutually assignable, so a normal
 * union check treats `{ name?: _ } | { age?: _ }` as one type. Compare keys
 * instead, and merge only when a member has a path the others lack.
 */
type HasDistinctKeys<T> = [T] extends [never]
	? false
	: [T extends unknown ? keyof T : never] extends [keyof T]
		? false
		: true;

type MergeIssuesKeyOf<K> = K extends symbol
	? never
	: K extends `${number}` | number
		? K
		: K extends keyof unknown[]
			? never
			: K extends string
				? K
				: never;

type MergeIssuesKeys<T> = MergeIssuesKeyOf<
	T extends unknown ? Exclude<keyof T, typeof labelSymbol> : never
>;

type MergeIssuesNumericLiteralKeys<T> = Extract<
	MergeIssuesKeys<T>,
	`${number}`
>;

type MergeIssuesNumericShape<T> = [MergeIssuesNumericLiteralKeys<T>] extends [
	never,
]
	? number extends MergeIssuesKeys<T>
		? {
				readonly [key: number]:
					| AsMergedIssues<MergeIssuesValue<T, number>>
					| undefined;
			}
		: unknown
	: {
			readonly [K in MergeIssuesNumericLiteralKeys<T>]?: AsMergedIssues<
				MergeIssuesNumericValue<T, K>
			>;
		};

type MergeIssuesNumericValue<T, K extends `${number}`> = T extends unknown
	? K extends keyof T
		? Exclude<T[K], undefined>
		: number extends keyof T
			? Exclude<T[number], undefined>
			: never
	: never;

type MergeIssuesOf<T> = [T] extends [never]
	? never
	: _Issues<MergeIssuesShape<T>, IssueLabelOf<T>>;

type MergeIssuesShape<T> = [MergeIssuesKeys<T>] extends [never]
	? Record<never, never>
	: MergeIssuesStringShape<T> & MergeIssuesNumericShape<T>;

type MergeIssuesStringKeys<T> = Exclude<
	MergeIssuesKeys<T>,
	`${number}` | number
>;

type MergeIssuesStringPropKey<K> = K extends `${number}` | number | symbol
	? never
	: K extends keyof unknown[]
		? never
		: K extends string
			? K
			: never;

type MergeIssuesStringProps<T> = {
	[K in keyof T as MergeIssuesStringPropKey<K>]: Exclude<T[K], undefined>;
};

type MergeIssuesStringShape<T> =
	string extends MergeIssuesKeys<T>
		? {
				readonly [key: string]:
					| AsMergedIssues<MergeIssuesStringValues<T>>
					| undefined;
			}
		: [MergeIssuesStringKeys<T>] extends [never]
			? unknown
			: {
					readonly [K in MergeIssuesStringKeys<T>]?: AsMergedIssues<
						MergeIssuesValue<T, K>
					>;
				};

type MergeIssuesStringValues<T> = T extends unknown
	? MergeIssuesStringProps<T>[keyof MergeIssuesStringProps<T>]
	: never;

type MergeIssuesValue<T, K extends PropertyKey> = T extends unknown
	? K extends keyof T
		? Exclude<T[K], undefined>
		: never
	: never;

type UnflattenedIssuesShape<T> = T extends readonly (infer E)[]
	? { readonly [key: number]: undefined | UnflattenedIssuesOf<E> }
	: {
			readonly [K in keyof T as K extends symbol
				? never
				: K]?: UnflattenedIssuesOf<NonNullable<T[K]>>;
		};
