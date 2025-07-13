import type { i18n, TOptions } from "i18next";
import type { IssueMessage, Issues } from "./error.js";
import type { TypeOf, UnionToTuple } from "./helpers.js";
import type { Result } from "./result.js";

/**
 * The inferred type of a decoder.
 */
export type Infer<T extends Decoder<unknown>> = T extends Decoder<infer A>
	? A
	: "";

/**
 * The decode function for a decoder.
 */
export type DecodeFunction<T, I extends Issues = Issues<TypeOf<T>>> = (
	value: unknown,
	i18nOptions: I18nOptions,
) => Result<T, I>;

/**
 * The map function for a decoder.
 */
export type MapFunction<T, U> = (value: T) => U;

/**
 * The catch function for a decoder.
 */
export type CatchFunction<T, I extends Issues, J extends Issues> = (
	issues: I,
) => Result<T, J>;

export type MapDecodeFunction<T, U extends Array<Decoder<unknown>>> = (
	...args: TupleDecodeResponse<U>
) => T;

/**
 * The response type of a map decoder.
 */
export type MapDecodeResponse<
	T extends MapDecodeFunction<unknown, Array<Decoder<unknown>>>,
> = ReturnType<T>;

export type ObjectDecoders<T extends Record<string, unknown>> = {
	[key in keyof T]-?: T[key] extends infer A ? Decoder<A> : never;
};

/**
 * The response type of an object decoder.
 */
export type ObjectDecodeResponse<T extends Record<string, Decoder<unknown>>> = {
	[key in keyof T]: T[key] extends Decoder<infer A> ? A : never;
};

/**
 * The issues type of an object decoder.
 */
export type ObjectDecodeIssues<T extends Record<string, Decoder<unknown>>> = {
	readonly [key in keyof T]?: T[key] extends Decoder<unknown, infer A>
		? A
		: never;
};

/**
 * The type of a tuple decoder.
 */
export type TupleDecoders<T extends unknown[]> = T extends [infer A, ...infer B]
	? B extends unknown[]
		? [Decoder<A>, ...TupleDecoders<B>]
		: [Decoder<A>]
	: [];

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
 * The type of a union decoder.
 */
export type UnionDecoders<T> = UnionToTuple<
	T extends infer A ? Decoder<A> : never
>;

/**
 * The response type of a union decoder.
 */
export type UnionDecodeResponse<T extends Array<Decoder<unknown>>> = T extends [
	Decoder<infer A>,
	...infer B,
]
	? B extends Array<Decoder<unknown>>
		? A | UnionDecodeResponse<B>
		: A
	: never;

export type I18nOptions = {
	i18n?: i18n;
	tOptions?: TOptions<{ katabamiNS?: string }>;
};

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
	 * @returns {Result<T, I>} The decoded value or an error with issues.
	 */
	decodeString(value: string): Result<T, I>;

	/**
	 * Decode a value as T.
	 *
	 * @param {unknown} value The value to decode as T.
	 * @returns {Result<T, I>} The decoded value or an error with issues.
	 */
	decodeValue(value: unknown): Result<T, I>;

	/**
	 * Provides a custom i18n instance and/or options to the decoder.
	 *
	 * @param {I18nOptions} options The i18n instance and/or options.
	 * @returns {Decoder<T, I>} A new decoder with the provided i18n instance and/or options.
	 */
	i18n(options: I18nOptions): Decoder<T, I>;
}
