import type { Resolved, UnionToTuple } from "./helpers.js";
import type { _Issues, Issue, Issues } from "./issue.js";
import type { DecoderSchema } from "./schema.js";
import type { StandardSchemaV1 } from "./standardSchema.js";

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
	T extends Decoder<infer A>
		? A extends Resolved<A>
			? A[]
			: Promise<Resolved<A>[]>
		: never;

/**
 * The catch function for a decoder.
 */
export type CatchFunction<T, I extends Issues, J extends Issues> = (
	issues: I,
) => Result<T, J>;

/**
 * The interface for the decode error.
 */
export interface DecodeErrorInterface<T extends Issues> extends Error {
	issues: T;
}

/**
 * Decoder interface.
 */
export interface Decoder<
	T,
	I extends Issues = Issues,
	S extends boolean = false,
> extends StandardSchemaV1<T> {
	/**
	 * Applies another decoder to the decoded value (sync nextFunc).
	 *
	 * @template U The type of the decoded value.
	 * @template {Issues<U>} J The type of the issues of the other decoder.
	 * @param {(value: T | Resolved<T>) => Decoder<U, J>} nextFunc The function to apply the next decoder to the decoded value.
	 * @returns {Decoder<U, J>} A new decoder that applies the other decoder to the decoded value.
	 */
	andThen<U, J extends Issues = Issues>(
		nextFunc: (value: Resolved<T>) => Decoder<U, J>,
	): Decoder<U, I | J, S>;

	/**
	 * Applies another decoder to the decoded value (async nextFunc).
	 *
	 * @template U The type of the decoded value.
	 * @template {Issues<U>} J The type of the issues of the other decoder.
	 * @param {(value: T | Resolved<T>) => Promise<Decoder<U, J>>} nextFunc The function to apply the next decoder to the decoded value.
	 * @returns {Decoder<Promise<U>, J>} A new decoder that applies the other decoder to the decoded value.
	 */
	andThen<U, J extends Issues = Issues>(
		nextFunc: (value: Resolved<T>) => Promise<Decoder<U, J>>,
	): Decoder<Promise<Resolved<U>>, I | J, S>;

	/**
	 * Catches and transforms issues during decoding.
	 *
	 * @template J - The type of the issues to transform.
	 * @param {CatchFunction<T, I, J>} catchFunc - The function to handle and transform issues.
	 * @returns {Decoder<T, J>} A new decoder with transformed issues.
	 */
	catch<J extends Issues>(catchFunc: CatchFunction<T, I, J>): Decoder<T, J, S>;

	/**
	 * Decode a string as T.
	 * When T is Promise, returns Promise; otherwise returns Result.
	 *
	 * @param {string} value The string to decode as T.
	 * @returns {T extends Promise<unknown> ? Promise<Result<Resolved<T>, I | Issues<"parseJson", Issue<"parseJson", never>>>> : Result<T, I | Issues<"parseJson", Issue<"parseJson", never>>>} The decoded value or an error with issues.
	 */
	decodeString(
		value: string,
	): DecodeResult<T, I | Issues<"parseJson", Issue<"parseJson", never>>>;

	/**
	 * Decode a value as T.
	 * When T is Promise, returns Promise<Result<Resolved<T>, I>>; otherwise returns Result<T, I>.
	 *
	 * @param {unknown} value The value to decode as T.
	 * @returns {DecodeResult<T, I>} The decoded value or an error with issues.
	 */
	decodeValue(value: unknown): DecodeResult<T, I>;

	/**
	 * Returns the minimal schema describing the values this decoder accepts.
	 * When schema resolution is async, returns Promise; otherwise returns DecoderSchema.
	 */
	getSchema(): SchemaResult<S>;

	/**
	 * Apply a mapping function to the decoded value.
	 *
	 * @template U The type of the mapped value.
	 * @param {(value: Resolved<T>) => U} mapFunc The mapping function.
	 * @returns {Decoder<U>} A new decoder that applies the mapping function to the decoded value.
	 */
	map<U>(mapFunc: (value: Resolved<T>) => U): Decoder<U, I, S>;

	/**
	 * Apply a mapping function to the decoded value.
	 *
	 * @template U The type of the mapped value.
	 * @param {(value: Resolved<T>) => Promise<U>} mapFunc The mapping function.
	 * @returns {Decoder<U>} A new decoder that applies the mapping function to the decoded value.
	 */
	map<U>(
		mapFunc: (value: Resolved<T>) => Promise<U>,
	): Decoder<Promise<U>, I, S>;
}

/**
 * The result type of a decode function.
 */
export type DecodeResult<T, I extends Issues> = [T] extends [never]
	? Result<never, I>
	: T extends Promise<unknown>
		? Promise<Result<Resolved<T>, I>>
		: Result<T, I>;

/**
 * Err type
 */
export type Err<I extends Issues = Issues> = {
	error: DecodeErrorInterface<I>;
	ok: false;
	value?: never;
};

/**
 * The issues type of a field decoder.
 */
export type FieldDecodeIssues<
	T extends Decoder<unknown>,
	I extends Issue,
	K extends string,
> = _Issues<
	{ readonly [key in K]?: T extends Decoder<unknown, infer A> ? A : never },
	I
>;

/**
 * The response type of a field decoder.
 */
export type FieldDecodeResponse<T extends Decoder<unknown>> =
	T extends Decoder<infer A> ? A : never;

/**
 * The issues type of an index decoder.
 */
export type IndexDecodeIssues<
	T extends Decoder<unknown>,
	I extends Issue,
	N extends number = number,
> = _Issues<
	{ readonly [K in N]?: T extends Decoder<unknown, infer A> ? A : never },
	I
>;

/**
 * The issues type of an index decoder.
 */
export type IndexDecodeResponse<T extends Decoder<unknown>> =
	T extends Decoder<infer A> ? A : never;

/**
 * The inferred type of a decoder.
 */
export type Infer<T extends Decoder<unknown, Issues, boolean>> =
	T extends Decoder<infer A, Issues, boolean> ? A : "";

/**
 * The type of a map decode function.
 */
export type MapDecodeFunction<T, U extends Array<Decoder<unknown>>> = (
	...args: MapDecodeFunctionParams<U>
) => T;

/**
 * The parameters type of a map decode function.
 */
export type MapDecodeFunctionParams<T extends Array<Decoder<unknown>>> =
	T extends [Decoder<infer A>, ...infer B]
		? B extends Array<Decoder<unknown>>
			? [Resolved<A>, ...MapDecodeFunctionParams<B>]
			: [Resolved<A>]
		: [];

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
> =
	T extends MapDecodeFunction<unknown, infer B>
		? TupleHasPromise<B> extends true
			? Promise<ReturnType<T>>
			: ReturnType<T>
		: never;

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
export type ObjectDecodeResponse<T extends Record<string, Decoder<unknown>>> =
	RecordHasPromise<T> extends true
		? Promise<{
				[key in keyof T]: T[key] extends Decoder<infer A> ? Resolved<A> : never;
			}>
		: {
				[key in keyof T]: T[key] extends Decoder<infer A> ? A : never;
			};

/**
 * The decoders type of an object.
 */
export type ObjectDecoders<T extends Record<string, unknown>> = {
	[key in keyof T]-?: T[key] extends infer A ? Decoder<A> : never;
};

/**
 * Ok type
 */
export type Ok<T> = { error?: never; ok: true; value: T };

/**
 * The response type of an optional decoder.
 */
export type OptionalDecodeResponse<T> =
	T extends Promise<unknown> ? Promise<Resolved<T> | undefined> : T | undefined;

export type RecordSchemaHasPromise<T extends Record<string, unknown>> =
	T extends {
		[key in keyof T]: T[key] extends Decoder<unknown, infer I, infer _>
			? Decoder<unknown, I, false>
			: never;
	}
		? false
		: true;

/**
 * Result type
 */
export type Result<T, I extends Issues = Issues> = Err<I> | Ok<T>;

/**
 * Whether a decoder resolves its schema asynchronously.
 */
export type SchemaAsyncOf<D extends Decoder<unknown, Issues, boolean>> =
	D extends Decoder<unknown, Issues, infer S> ? S : false;

/**
 * The result type of a getSchema function.
 */
export type SchemaResult<S extends boolean = false> = S extends true
	? Promise<DecoderSchema>
	: DecoderSchema;

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
export type TupleDecodeResponse<T extends Array<Decoder<unknown>>> =
	TupleHasPromise<T> extends true
		? Promise<TupleDecodeResponseResolvedHelper<T>>
		: TupleDecodeResponseHelper<T>;

/**
 * The type of a tuple decoder.
 */
export type TupleDecoders<T extends unknown[]> = T extends [infer A, ...infer B]
	? B extends unknown[]
		? [Decoder<A>, ...TupleDecoders<B>]
		: [Decoder<A>]
	: [];

export type TupleSchemaHasPromise<T extends Array<Decoder<unknown>>> =
	T extends {
		[key in keyof T]: T[key] extends Decoder<unknown, infer I, infer _>
			? Decoder<unknown, I, false>
			: never;
	}
		? false
		: true;

/**
 * The issues type of a union decoder.
 */
export type UnionDecodeIssues<T, I extends Issue> = _Issues<
	UnionDecodeIssuesHelper<T>,
	I
>;

/**
 * The response type of a union decoder.
 */
export type UnionDecodeResponse<T> =
	UnionHasPromise<T> extends true
		? Promise<UnionDecodeResponseResolvedHelper<T>>
		: UnionDecodeResponseHelper<T>;
/**
 * The type of a union decoder in canonical order.
 */
export type UnionDecoders<T> = _UnionDecoders<UnionToTuple<T>>;

/**
 * Maps a tuple of value types to a tuple of decoders.
 */
type _UnionDecoders<T extends unknown[]> = T extends [infer A, ...infer B]
	? B extends unknown[]
		? [Decoder<A>, ..._UnionDecoders<B>]
		: [Decoder<A>]
	: [];

/**
 * The helper type to check if a record has a promise.
 */
type RecordHasPromise<T extends Record<string, unknown>> = T extends {
	[key in keyof T]: T[key] extends Decoder<infer A, infer B>
		? Decoder<Resolved<A>, B>
		: never;
}
	? false
	: true;

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

/**
 * The response type of a tuple decoder.
 */
type TupleDecodeResponseHelper<T extends Array<Decoder<unknown>>> = T extends [
	Decoder<infer A>,
	...infer B,
]
	? B extends Array<Decoder<unknown>>
		? [A, ...TupleDecodeResponseHelper<B>]
		: [A]
	: [];

/**
 * The response type of a tuple decoder.
 */
type TupleDecodeResponseResolvedHelper<T extends Array<Decoder<unknown>>> =
	T extends [Decoder<infer A>, ...infer B]
		? B extends Array<Decoder<unknown>>
			? [Resolved<A>, ...TupleDecodeResponseResolvedHelper<B>]
			: [Resolved<A>]
		: [];

/**
 * The helper type to check if a tuple has a promise.
 */
type TupleHasPromise<T extends Array<Decoder<unknown>>> = T extends [
	Decoder<infer A>,
	...infer B,
]
	? A extends Promise<unknown>
		? true
		: B extends Array<Decoder<unknown>>
			? TupleHasPromise<B>
			: false
	: false;

/**
 * The helper type to flatten nested union issues.
 */
type UnionDecodeIssueExpanded<T extends Issues> =
	T extends UnionDecodeIssues<infer D, Issue<"union", infer _>>
		? UnionDecodeIssuesFlattenTuple<UnionDecodeIssuesHelper<D>>
		: [T];

/**
 * The helper type to flatten a tuple of issues.
 */
type UnionDecodeIssuesFlattenTuple<T extends readonly unknown[]> =
	T extends readonly [infer A, ...infer B]
		? A extends Issues
			? [
					...UnionDecodeIssueExpanded<A>,
					...UnionDecodeIssuesFlattenTuple<
						B extends readonly unknown[] ? B : readonly []
					>,
				]
			: UnionDecodeIssuesFlattenTuple<
					B extends readonly unknown[] ? B : readonly []
				>
		: [];

/**
 * The helper type for the issues type of a union decoder.
 */
type UnionDecodeIssuesHelper<T> = T extends [
	Decoder<unknown, infer A>,
	...infer B,
]
	? B extends Array<Decoder<unknown>>
		? [...UnionDecodeIssueExpanded<A>, ...UnionDecodeIssuesHelper<B>]
		: UnionDecodeIssueExpanded<A>
	: [];

/**
 * The response type of a union decoder.
 */
type UnionDecodeResponseHelper<T> = T extends [Decoder<infer A>, ...infer B]
	? B extends Array<Decoder<unknown>>
		? A | UnionDecodeResponseHelper<B>
		: A
	: never;

/**
 * The helper type to check if a union has a promise.
 */
type UnionDecodeResponseResolvedHelper<T> = T extends [
	Decoder<infer A>,
	...infer B,
]
	? B extends Array<Decoder<unknown>>
		? Resolved<A> | UnionDecodeResponseResolvedHelper<B>
		: Resolved<A>
	: never;

/**
 * The helper type to check if a union has a promise.
 */
type UnionHasPromise<T> = T extends [Decoder<infer A>, ...infer B]
	? A extends Promise<unknown>
		? true
		: UnionHasPromise<B>
	: false;
