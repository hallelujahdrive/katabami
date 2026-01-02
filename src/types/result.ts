import type { DecodeErrorInterface, Issues } from "./decoder.js";

/**
 * Result type
 */
export type Result<T, I extends Issues = Issues> = Err<I> | Ok<T>;

/**
 * Ok type
 */
export type Ok<T> = { error?: never; ok: true; value: T };

/**
 * Err type
 */
export type Err<I extends Issues = Issues> = {
	error: DecodeErrorInterface<I>;
	ok: false;
	value?: never;
};
