import type { Primitive } from "./primitive";

/**
 * A decoder that accepts arrays.
 */
export type ArrayDecoderSchema = {
	readonly element: DecoderSchema;
	readonly kind: "array";
	readonly minItems?: number;
};

/**
 * A decoder that accepts booleans.
 */
export type BooleanDecoderSchema = {
	readonly kind: "boolean";
};

/**
 * A decoder that accepts a single literal value.
 */
export type ConstantDecoderSchema = {
	readonly kind: "constant";
	readonly value: Primitive;
};

/**
 * Minimal schema describing the values a decoder accepts.
 * Intended for plugins (e.g. JSON Schema generation).
 */
export type DecoderSchema =
	| ArrayDecoderSchema
	| BooleanDecoderSchema
	| ConstantDecoderSchema
	| FieldDecoderSchema
	| IndexDecoderSchema
	| IntegerDecoderSchema
	| MapDecoderSchema
	| NeverDecoderSchema
	| NullableDecoderSchema
	| NumberDecoderSchema
	| ObjectDecoderSchema
	| OptionalDecoderSchema
	| RecordDecoderSchema
	| StringDecoderSchema
	| TupleDecoderSchema
	| UnionDecoderSchema
	| UnknownDecoderSchema;

/**
 * A decoder that extracts a field from an object.
 */
export type FieldDecoderSchema = {
	readonly key: string;
	readonly kind: "field";
	readonly schema: DecoderSchema;
};

/**
 * A decoder that extracts an index from an array.
 */
export type IndexDecoderSchema = {
	readonly index: number;
	readonly kind: "index";
	readonly schema: DecoderSchema;
};

/**
 * A decoder that accepts integers.
 */
export type IntegerDecoderSchema = {
	readonly kind: "integer";
};

/**
 * A decoder composed from multiple decoders via map.
 */
export type MapDecoderSchema = {
	readonly decoders: readonly DecoderSchema[];
	readonly kind: "map";
};

/**
 * A decoder that accepts no value.
 */
export type NeverDecoderSchema = {
	readonly kind: "never";
};

/**
 * A decoder that accepts the inner schema or null.
 */
export type NullableDecoderSchema = {
	readonly kind: "nullable";
	readonly schema: DecoderSchema;
};

/**
 * A decoder that accepts numbers.
 */
export type NumberDecoderSchema = {
	readonly kind: "number";
};

/**
 * A decoder that accepts objects with the given property decoders.
 */
export type ObjectDecoderSchema = {
	readonly kind: "object";
	readonly properties: Readonly<Record<string, DecoderSchema>>;
};

/**
 * A decoder that accepts the inner schema or null/undefined.
 */
export type OptionalDecoderSchema = {
	readonly kind: "optional";
	readonly schema: DecoderSchema;
};

/**
 * A decoder that accepts records with keys and values of the given schemas.
 */
export type RecordDecoderSchema = {
	readonly key: DecoderSchema;
	readonly kind: "record";
	readonly value: DecoderSchema;
};

/**
 * A decoder that accepts strings.
 */
export type StringDecoderSchema = {
	readonly kind: "string";
};

/**
 * A decoder that accepts fixed-length arrays.
 */
export type TupleDecoderSchema = {
	readonly elements: readonly DecoderSchema[];
	readonly kind: "tuple";
};

/**
 * A decoder that accepts any of the given variants.
 */
export type UnionDecoderSchema = {
	readonly kind: "union";
	readonly variants: readonly DecoderSchema[];
};

/**
 * A decoder that accepts any value.
 */
export type UnknownDecoderSchema = {
	readonly kind: "unknown";
};
