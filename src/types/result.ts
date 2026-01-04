import type { DecodeErrorInterface, Issues } from "./decoder.js";

/**
 * Err type
 */
export type Err<I extends Issues = Issues> = {
	error: DecodeErrorInterface<I>;
	ok: false;
	value?: never;
};

/**
 * Ok type
 */
export type Ok<T> = { error?: never; ok: true; value: T };

/**
 * Result type
 */
export type Result<T, I extends Issues = Issues> = Err<I> | Ok<T>;
