import type { TypeOf, UnionToTuple } from "./helpers.js";
import type { Primitive } from "./primitive.js";
import type { Result } from "./result.js";

/**
 * The issues type of an array decoder.
 */
export type ArrayDecodeIssues<
	T extends Decoder<unknown>,
	I extends Issue = Issue,
> =
	T extends Decoder<unknown, infer A>
		? _Issues<{ readonly [key: number]: A } | undefined, I>
		: never;

/**
 * The response type of an array decoder.
 */
export type ArrayDecodeResponse<T extends Decoder<unknown>> =
	T extends Decoder<infer A> ? A[] : never;

/**
 * The catch function for a decoder.
 */
export type CatchFunction<T, I extends Issues, J extends Issues> = (
	issues: I,
) => Result<T, J>;

/**
 * The decode function for a decoder.
 */
export type DecodeFunction<T, Is extends Issues = Issues<TypeOf<T>>> = (
	value: unknown,
) => Result<T, Is>;

/**
 * Decoder interface.
 */
export interface Decoder<T, I extends Issues = Issues> {
	/**
	 * Apply a mapping function to the decoded value.
	 *
	 * @template U The type of the mapped value.
	 * @param {MapFunction<T, U>} mapFunc The mapping function.
	 * @returns {Decoder<U>} A new decoder that applies the mapping function to the decoded value.
	 */
	andMap<U>(mapFunc: MapFunction<T, U>): Decoder<U, I>;

	/**
	 * Applies another decoder to the decoded value.
	 *
	 * @template U The type of the decoded value.
	 * @template {Issues<U>} J The type of the issues of the other decoder.
	 * @param {Decoder<U, J>} decoder The other decoder.
	 * @returns {Decoder<U, J>} A new decoder that applies the other decoder to the decoded value.
	 */
	andThen<U, J extends Issues>(decoder: Decoder<U, J>): Decoder<U, I | J>;

	/**
	 * Catches and transforms issues during decoding.
	 *
	 * @template J - The type of the issues to transform.
	 * @param {CatchFunction<T, I, J>} catchFunc - The function to handle and transform issues.
	 * @returns {Decoder<T, J>} A new decoder with transformed issues.
	 */
	catch<J extends Issues>(catchFunc: CatchFunction<T, I, J>): Decoder<T, J>;

	/**
	 * Decode a string as T.
	 *
	 * @param {string} value The string to decode as T.
	 * @returns {Result<T, I | Issues<"parseJson", Issue<"parseJson", never>>>} The decoded value or an error with issues.
	 */
	decodeString(
		value: string,
	): Result<T, I | Issues<"parseJson", Issue<"parseJson", never>>>;

	/**
	 * Decode a value as T.
	 *
	 * @param {unknown} value The value to decode as T.
	 * @returns {Result<T, I>} The decoded value or an error with issues.
	 */
	decodeValue(value: unknown): Result<T, I>;
}

/**
 * The inferred type of a decoder.
 */
export type Infer<T extends Decoder<unknown>> =
	T extends Decoder<infer A> ? A : "";

export type MapDecodeFunction<T, U extends Array<Decoder<unknown>>> = (
	...args: TupleDecodeResponse<U>
) => T;

/**
 * The issues type of a map decoder.
 */
export type MapDecodeIssues<T extends Array<Decoder<unknown>>> = T extends [
	Decoder<unknown, infer A>,
	...infer B,
]
	? B extends Array<Decoder<unknown>>
		? A | MapDecodeIssues<B>
		: A
	: never;

/**
 * The response type of a map decoder.
 */
export type MapDecodeResponse<
	T extends MapDecodeFunction<unknown, Array<Decoder<unknown>>>,
> = ReturnType<T>;

/**
 * The map function for a decoder.
 */
export type MapFunction<T, U> = (value: T) => U;

/**
 * The issues type of an object decoder.
 */
export type ObjectDecodeIssues<
	T extends Record<string, Decoder<unknown>>,
	I extends Issue,
> = _Issues<
	{
		readonly [key in keyof T]?: T[key] extends Decoder<unknown, infer A>
			? A
			: never;
	},
	I
>;

/**
 * The response type of an object decoder.
 */
export type ObjectDecodeResponse<T extends Record<string, Decoder<unknown>>> = {
	[key in keyof T]: T[key] extends Decoder<infer A> ? A : never;
};

/**
 * The decoders type of an object.
 */
export type ObjectDecoders<T extends Record<string, unknown>> = {
	[key in keyof T]-?: T[key] extends infer A ? Decoder<A> : never;
};

/**
 * The issues type of a tuple decoder.
 */
export type TupleDecodeIssues<
	T extends Array<Decoder<unknown>>,
	I extends Issue,
> = _Issues<TupleDecodeIssueHelper<T, []>, I>;

/**
 * The response type of a tuple decoder.
 */
export type TupleDecodeResponse<T extends Array<Decoder<unknown>>> = T extends [
	Decoder<infer A>,
	...infer B,
]
	? B extends Array<Decoder<unknown>>
		? [A, ...TupleDecodeResponse<B>]
		: [A]
	: [];

/**
 * The type of a tuple decoder.
 */
export type TupleDecoders<T extends unknown[]> = T extends [infer A, ...infer B]
	? B extends unknown[]
		? [Decoder<A>, ...TupleDecoders<B>]
		: [Decoder<A>]
	: [];

/**
 * The issues type of a union decoder.
 */
export type UnionDecodeIssues<T> = T extends [
	Decoder<unknown, infer A>,
	...infer B,
]
	? B extends Array<Decoder<unknown>>
		? A | UnionDecodeIssues<B>
		: A
	: never;

/**
 * The response type of a union decoder.
 */
export type UnionDecodeResponse<T> = T extends [Decoder<infer A>, ...infer B]
	? B extends Array<Decoder<unknown>>
		? A | UnionDecodeResponse<B>
		: A
	: never;

/**
 * The type of a union decoder.
 */
export type UnionDecoders<T> = UnionToTuple<
	T extends infer A ? Decoder<A> : never
>;

/**
 * The helper type for the issues type of a tuple decoder.
 */
type TupleDecodeIssueHelper<
	T extends Array<Decoder<unknown>>,
	Counter extends unknown[],
> = T extends [Decoder<unknown, infer A>, ...infer B]
	? B extends Array<Decoder<unknown>>
		? { readonly [key in Counter["length"]]?: A } & TupleDecodeIssueHelper<
				B,
				[unknown, ...Counter]
			>
		: { readonly [key in Counter["length"]]?: A }
	: Record<never, never>;

declare const labelSymbol: unique symbol;

/**
 * The interface for the decode error.
 */
export interface DecodeErrorInterface<T extends Issues> extends Error {
	issues: T;
}

/**
 * The issue type.
 */
export interface Issue<
	T extends IssueType = IssueType,
	Msg extends string = string,
	Vers extends Record<string, Primitive> | undefined =
		| Record<string, Primitive>
		| undefined,
> {
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
		: T extends "array" | "object"
			? IssuesObject
			: Record<never, never>,
	I
>;

/**
 * Issue types
 */
export type IssueType = ({} & string) | CommonIssueType | CustomIssueType;

type _Issues<T, I extends Issue> = T &
	([I] extends [never]
		? Record<never, never>
		: {
				readonly [labelSymbol]?: I;
			});

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

interface IssuesObject {
	readonly [key: string]: IssuesObject | readonly IssuesObject[] | undefined;
}
