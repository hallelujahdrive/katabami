/**
 * The Standard Typed interface. This is a base type extended by other specs.
 */
export interface StandardTypedV1<Input = unknown, Output = Input> {
	/** The Standard properties. */
	readonly "~standard": StandardTypedV1.Props<Input, Output>;
}

export declare namespace StandardTypedV1 {
	/** Infers the input type of a Standard Typed. */
	export type InferInput<Schema extends StandardTypedV1> = NonNullable<
		Schema["~standard"]["types"]
	>["input"];

	/** Infers the output type of a Standard Typed. */
	export type InferOutput<Schema extends StandardTypedV1> = NonNullable<
		Schema["~standard"]["types"]
	>["output"];

	/** The Standard Typed properties interface. */
	export interface Props<Input = unknown, Output = Input> {
		/** Inferred types associated with the schema. */
		readonly types?: Types<Input, Output> | undefined;
		/** The vendor name of the schema library. */
		readonly vendor: string;
		/** The version number of the standard. */
		readonly version: 1;
	}

	/** The Standard Typed types interface. */
	export interface Types<Input = unknown, Output = Input> {
		/** The input type of the schema. */
		readonly input: Input;
		/** The output type of the schema. */
		readonly output: Output;
	}
}

/**
 * The Standard JSON Schema interface.
 */
export interface StandardJSONSchemaV1<Input = unknown, Output = Input> {
	/** The Standard JSON Schema properties. */
	readonly "~standard": StandardJSONSchemaV1.Props<Input, Output>;
}

export declare namespace StandardJSONSchemaV1 {
	/** The Standard JSON Schema converter interface. */
	export interface Converter {
		/** Converts the input type to JSON Schema. May throw if conversion is not supported. */
		readonly input: (
			options: StandardJSONSchemaV1.Options,
		) => Record<string, unknown>;
		/** Converts the output type to JSON Schema. May throw if conversion is not supported. */
		readonly output: (
			options: StandardJSONSchemaV1.Options,
		) => Record<string, unknown>;
	}

	/** Infers the input type of a Standard. */
	export type InferInput<Schema extends StandardTypedV1> =
		StandardTypedV1.InferInput<Schema>;

	/** Infers the output type of a Standard. */
	export type InferOutput<Schema extends StandardTypedV1> =
		StandardTypedV1.InferOutput<Schema>;

	/** The options for the input/output methods. */
	export interface Options {
		/** Explicit support for additional vendor-specific parameters, if needed. */
		readonly libraryOptions?: Record<string, unknown> | undefined;
		/** Specifies the target version of the generated JSON Schema. */
		readonly target: Target;
	}

	/** The Standard JSON Schema properties interface. */
	export interface Props<Input = unknown, Output = Input>
		extends StandardTypedV1.Props<Input, Output> {
		/** Methods for generating the input/output JSON Schema. */
		readonly jsonSchema: StandardJSONSchemaV1.Converter;
	}

	/**
	 * The target version of the generated JSON Schema.
	 *
	 * It is *strongly recommended* that implementers support `"draft-2020-12"` and
	 * `"draft-07"`. Libraries should throw if they don't support a specified target.
	 */
	export type Target =
		| "draft-07"
		| "draft-2020-12"
		| "openapi-3.0"
		// Accepts any string: allows future targets while preserving autocomplete
		| ({} & string);

	/** The Standard types interface. */
	export interface Types<Input = unknown, Output = Input>
		extends StandardTypedV1.Types<Input, Output> {}
}
