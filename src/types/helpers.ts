import type { Primitive } from "./primitive.js";

/**
 * Check if a type is a union.
 */
export type IsUnion<T, U = T> = T extends T
	? [U] extends [T]
		? false
		: true
	: never;

type PrimitiveTypeOf<T extends Primitive> = boolean extends T
	? "boolean"
	: number extends T
		? "number"
		: string extends T
			? "string"
			: "constant";

/**
 * Get the type of a type.
 */
export type TypeOf<T, U = T> = IsUnion<T> extends true
	? [U] extends [boolean]
		? "boolean"
		: "union"
	: T extends Primitive
		? PrimitiveTypeOf<T>
		: T extends bigint
			? "bigint"
			: T extends symbol
				? "symbol"
				: T extends undefined
					? "undefined"
					: T extends (...args: never) => unknown
						? "function"
						: T extends unknown[]
							? "array"
							: T extends null
								? "null"
								: T extends object
									? "object"
									: "unknown";

type UnionToIntersection<U> = (
	U extends unknown
		? (x: U) => void
		: never
) extends (x: infer I) => void
	? I
	: never;

type LastInUnion<U> =
	UnionToIntersection<U extends unknown ? (x: U) => void : never> extends (
		x: infer L,
	) => void
		? L
		: never;

/**
 * Convert a union to a tuple.
 */
export type UnionToTuple<U, T extends unknown[] = []> = [U] extends [never]
	? T
	: UnionToTuple<Exclude<U, LastInUnion<U>>, [LastInUnion<U>, ...T]>;
