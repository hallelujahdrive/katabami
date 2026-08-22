import type {
	ArrayDecodeIssues,
	ArrayDecodeResponse,
	AtDecoder,
	Awaitable,
	CatchFunction,
	DecodeResult,
	DecoderSchema,
	Err,
	FieldDecodeIssues,
	FieldDecodeResponse,
	Decoder as IDecoder,
	IndexDecodeIssues,
	IndexDecodeResponse,
	Issue,
	Issues,
	MapDecodeFunction,
	MapDecodeFunctionParams,
	MapDecodeIssues,
	MapDecodeResponse,
	NullableDecodeResponse,
	ObjectDecodeIssues,
	ObjectDecodeResponse,
	ObjectDecoders,
	Ok,
	OneOrMoreDecodeResponse,
	OptionalDecodeResponse,
	Primitive,
	RecordDecodeIssues,
	RecordDecodeResponse,
	RecordSchemaHasPromise,
	Resolved,
	Result,
	SchemaAsyncOf,
	SchemaResult,
	StandardSchemaV1,
	TupleDecodeIssues,
	TupleDecodeResponse,
	TupleDecoders,
	TupleSchemaHasPromise,
	TypeKeys,
	TypeOf,
	UnionDecodeIssues,
	UnionDecodeResponse,
	UnionDecoders,
} from "../types";
import { isRecord } from "../utils";
import { createIssues, flattenIssues, getIssueMessage } from "./issue";

/**
 * The decode function for a decoder.
 */
type DecodeFunction<T, Is extends Issues = Issues<TypeOf<T>>> = (
	value: unknown,
) => Awaitable<Result<T, Is>>;

type SchemaDecoder = IDecoder<unknown, Issues, boolean>;

type SchemaDescriptor = () => Awaitable<DecoderSchema>;

const booleanSchema = { kind: "boolean" } as const satisfies DecoderSchema;
const integerSchema = { kind: "integer" } as const satisfies DecoderSchema;
const neverSchema = { kind: "never" } as const satisfies DecoderSchema;
const numberSchema = { kind: "number" } as const satisfies DecoderSchema;
const stringSchema = { kind: "string" } as const satisfies DecoderSchema;
const unknownSchema = { kind: "unknown" } as const satisfies DecoderSchema;

const arraySchema = (
	element: DecoderSchema,
	minItems?: number,
): DecoderSchema =>
	minItems === undefined
		? { element, kind: "array" }
		: { element, kind: "array", minItems };

const constantSchema = <T extends Primitive>(value: T): DecoderSchema => ({
	kind: "constant",
	value,
});

const fieldSchema = (key: string, schema: DecoderSchema): DecoderSchema => ({
	key,
	kind: "field",
	schema,
});

const indexSchema = (index: number, schema: DecoderSchema): DecoderSchema => ({
	index,
	kind: "index",
	schema,
});

const mapSchema = (decoders: readonly DecoderSchema[]): DecoderSchema => ({
	decoders,
	kind: "map",
});

const nullableSchema = (schema: DecoderSchema): DecoderSchema => ({
	kind: "nullable",
	schema,
});

const objectSchema = (
	properties: Readonly<Record<string, DecoderSchema>>,
): DecoderSchema => ({
	kind: "object",
	properties,
});

const optionalSchema = (schema: DecoderSchema): DecoderSchema => ({
	kind: "optional",
	schema,
});

const recordSchema = (
	key: DecoderSchema,
	value: DecoderSchema,
): DecoderSchema => ({
	key,
	kind: "record",
	value,
});

const tupleSchema = (elements: readonly DecoderSchema[]): DecoderSchema => ({
	elements,
	kind: "tuple",
});

const unionSchema = (variants: readonly DecoderSchema[]): DecoderSchema => ({
	kind: "union",
	variants,
});

const mapAwaitable = <T, U>(
	value: Awaitable<T>,
	mapper: (value: T) => U,
): Awaitable<U> => {
	if (value instanceof Promise) {
		return value.then(mapper);
	}

	return mapper(value);
};

const returnsPromise = (fn: (value: never) => unknown): boolean => {
	try {
		return fn(undefined as never) instanceof Promise;
	} catch {
		return false;
	}
};

const isDecoderAsync = (decoder: unknown): boolean =>
	decoder instanceof Decoder && decoder.isAsync;

const anyDecoderAsync = (decoders: readonly IDecoder<unknown>[]): boolean =>
	decoders.some(isDecoderAsync);

const recordDecoderAsync = (
	decoders: Record<string, IDecoder<unknown>>,
): boolean => Object.values(decoders).some(isDecoderAsync);

const toDecodeResult = <T, I extends Issues>(
	result: Awaitable<Result<T, I>>,
	isAsync: boolean,
): Awaitable<Result<T, I>> => {
	if (!isAsync || result instanceof Promise) return result;

	return Promise.resolve(result);
};

const flatMapAwaitable = <T, U>(
	value: Awaitable<T>,
	mapper: (value: T) => Awaitable<U>,
): Awaitable<U> => mapAwaitable(value, mapper) as Awaitable<U>;

const allAwaitable = <T>(values: readonly Awaitable<T>[]): Awaitable<T[]> => {
	if (values.some((value) => value instanceof Promise)) {
		return Promise.all(values);
	}

	return values as T[];
};

const resolveAwaitablePairs = <K, T>(
	pairs: readonly (readonly [K, Awaitable<T>])[],
): Awaitable<Array<[K, T]>> =>
	allAwaitable(
		pairs.map(([key, value]) =>
			mapAwaitable(value, (resolved) => [key, resolved] as [K, T]),
		),
	);

const arraySchemaDescriptor =
	(decoder: SchemaDecoder): SchemaDescriptor =>
	() =>
		mapAwaitable(decoder.getSchema(), (schema) => arraySchema(schema));

const fieldSchemaDescriptor =
	(key: string, decoder: SchemaDecoder): SchemaDescriptor =>
	() =>
		mapAwaitable(decoder.getSchema(), (schema) => fieldSchema(key, schema));

const indexSchemaDescriptor =
	(index: number, decoder: SchemaDecoder): SchemaDescriptor =>
	() =>
		mapAwaitable(decoder.getSchema(), (schema) => indexSchema(index, schema));

const lazySchemaDescriptor =
	(lazyFunc: () => Awaitable<SchemaDecoder>): SchemaDescriptor =>
	() =>
		flatMapAwaitable(lazyFunc(), (decoder) => decoder.getSchema());

const mapSchemaDescriptor =
	(decoders: readonly SchemaDecoder[]): SchemaDescriptor =>
	() =>
		mapAwaitable(
			allAwaitable(decoders.map((decoder) => decoder.getSchema())),
			(schemas) => mapSchema(schemas),
		);

const nullableSchemaDescriptor =
	(decoder: SchemaDecoder): SchemaDescriptor =>
	() =>
		mapAwaitable(decoder.getSchema(), (schema) => nullableSchema(schema));

const objectSchemaDescriptor =
	(decoders: Readonly<Record<string, SchemaDecoder>>): SchemaDescriptor =>
	() => {
		const entries = Object.entries(decoders).map(([key, decoder]) =>
			mapAwaitable(decoder.getSchema(), (schema) => [key, schema] as const),
		);

		return mapAwaitable(allAwaitable(entries), (resolved) =>
			objectSchema(Object.fromEntries(resolved)),
		);
	};

const oneOrMoreSchemaDescriptor =
	(decoder: SchemaDecoder): SchemaDescriptor =>
	() =>
		mapAwaitable(decoder.getSchema(), (schema) => arraySchema(schema, 1));

const optionalSchemaDescriptor =
	(decoder: SchemaDecoder): SchemaDescriptor =>
	() =>
		mapAwaitable(decoder.getSchema(), (schema) => optionalSchema(schema));

const recordSchemaDescriptor =
	(key: SchemaDecoder, value: SchemaDecoder): SchemaDescriptor =>
	() =>
		mapAwaitable(
			allAwaitable([key.getSchema(), value.getSchema()]),
			(schemas) => {
				const [keySchema, valueSchema] = schemas as [
					DecoderSchema,
					DecoderSchema,
				];

				return recordSchema(keySchema, valueSchema);
			},
		);

const staticSchemaDescriptor =
	(schema: DecoderSchema): SchemaDescriptor =>
	() =>
		schema;

const tupleSchemaDescriptor =
	(decoders: readonly SchemaDecoder[]): SchemaDescriptor =>
	() =>
		mapAwaitable(
			allAwaitable(decoders.map((decoder) => decoder.getSchema())),
			(schemas) => tupleSchema(schemas),
		);

const unionSchemaDescriptor =
	(decoders: readonly SchemaDecoder[]): SchemaDescriptor =>
	() =>
		mapAwaitable(
			allAwaitable(decoders.map((decoder) => decoder.getSchema())),
			(schemas) => unionSchema(schemas),
		);

/**
 * Creates a decoder that always succeeds with the given value.
 * @template T The type of the value.
 * @returns {IDecoder<T, never>} A decoder that always returns the given value.
 */
export function value<T = unknown>(): IDecoder<T, never> {
	return valueDecoder as unknown as IDecoder<T, never>;
}

/**
 * Implementation of the Decoder interface.
 */
class Decoder<
	T,
	I extends Issues = Issues<TypeOf<T>>,
	S extends boolean = false,
> implements IDecoder<T, I, S>
{
	readonly isAsync: boolean;

	/**
	 * The Standard Schema properties.
	 * @returns {StandardSchemaV1.Props<T>} The Standard Schema properties.
	 */
	get "~standard"(): StandardSchemaV1.Props<T> {
		return {
			validate: (value, options) => {
				return flatMapAwaitable(this._decode(value), (res) => {
					if (!res.ok) {
						return {
							issues: flattenIssues(
								res.issues,
								options?.libraryOptions?.formatter,
							),
						};
					}

					return flatMapAwaitable(
						res.value as Awaitable<Resolved<T>>,
						(value) => ({ value }),
					);
				}) as Promise<StandardSchemaV1.Result<T>> | StandardSchemaV1.Result<T>;
			},
			vendor: "katabami",
			version: 1,
		};
	}

	/**
	 * @constructor
	 * @param {DecodeFunction<T, I>} decodeFunc - The decode function.
	 * @param {CatchFunction<T, Issues, I>} cacheFunc - The cache function.
	 * @param {SchemaDescriptor} schemaDescriptor - Resolves the accepted-value schema.
	 */
	constructor(
		private readonly decodeFunc: DecodeFunction<T, Issues>,
		private readonly cacheFunc: CatchFunction<T, Issues, I> | undefined,
		private readonly schemaDescriptor: SchemaDescriptor,
		isAsync = false,
	) {
		this.isAsync = isAsync;
	}

	/**
	 * Returns a decoder with the same decode behavior and a replaced schema.
	 */
	public static replaceSchema<U, J extends Issues>(
		decoder: Decoder<U, J, boolean>,
		schema: DecoderSchema,
	): Decoder<U, J, false> {
		return new Decoder<U, J, false>(
			decoder.decodeFunc,
			decoder.cacheFunc,
			staticSchemaDescriptor(schema),
			decoder.isAsync,
		);
	}

	/**
	 * Applies another decoder to the decoded value.
	 * @template U
	 * @template {Issues<TypeOf<U>>} J
	 * @param {(value: Resolved<T>) => Awaitable<IDecoder<Resolved<U>, J>>} nextFunc
	 * @returns {IDecoder<U, I | J>}
	 */
	public andThen<U, J extends Issues = Issues<TypeOf<U>>>(
		nextFunc: (value: Resolved<T>) => Awaitable<IDecoder<U, J>>,
	): IDecoder<U, I | J, S> {
		return new Decoder<U, I | J, S>(
			andThenFunc.call(
				this,
				nextFunc as unknown as (
					value: unknown,
				) => Awaitable<IDecoder<unknown, Issues>>,
			) as DecodeFunction<U, I | J>,
			undefined,
			this.schemaDescriptor,
			this.isAsync ||
				returnsPromise(nextFunc as unknown as (value: never) => unknown),
		);
	}

	/**
	 * Catches and transforms issues during decoding.
	 * @template K
	 * @param {CatchFunction<T, I, K>} catchFunc
	 * @returns {IDecoder<T, K>}
	 */
	public catch<K extends Issues>(
		catchFunc: CatchFunction<T, I, K>,
	): IDecoder<T, K, S> {
		return new Decoder(
			this.decodeFunc,
			catchFunc as CatchFunction<T, Issues, K>,
			this.schemaDescriptor,
			this.isAsync,
		) as unknown as IDecoder<T, K, S>;
	}

	/**
	 * Decodes a string as T.
	 * When T is Promise, returns Promise; otherwise returns Result.
	 * @param {string} value The string to decode as T.
	 * @returns {DecodeResult<T, I | Issues<"parseJson", Issue<"parseJson", never>>>} The decoded value or an error with issues.
	 */
	public decodeString(
		value: string,
	): DecodeResult<T, I | Issues<"parseJson", Issue<"parseJson", never>>> {
		try {
			const _value = JSON.parse(value);

			return this.decodeValue(_value);
		} catch {
			return toDecodeResult(
				{
					issues: createIssues("parseJson", "issue.failedToDecode"),
					ok: false,
				},
				this.isAsync,
			) as DecodeResult<T, I | Issues<"parseJson", Issue<"parseJson", never>>>;
		}
	}

	/**
	 * Decodes an unknown value as T.
	 * When T is Promise, returns Promise<Result<Resolved<T>, I>>; otherwise returns Result<T, I>.
	 * @param {unknown} value
	 * @returns {DecodeResult<T, I>} The decoded value or an error with issues.
	 */
	public decodeValue(value: unknown): DecodeResult<T, I> {
		const res = this._decode(value);

		return toDecodeResult(
			mapAwaitable(res, (res) => {
				if (!res.ok) return res;

				return mapAwaitable(res.value, (value) => ({
					ok: true,
					value,
				})) as Result<Resolved<T>, I>;
			}),
			this.isAsync,
		) as DecodeResult<T, I>;
	}

	/**
	 * Returns the minimal schema describing the values this decoder accepts.
	 */
	public getSchema(): SchemaResult<S> {
		return this.schemaDescriptor() as SchemaResult<S>;
	}

	/**
	 * @template U
	 * @param {MapFunction<T, U>} _mapFunc
	 * @returns {IDecoder<U, I>}
	 */
	public map<U>(_mapFunc: (value: Resolved<T>) => U): IDecoder<U, I, S> {
		return new Decoder<U, I, S>(
			mapFunc.call(
				this,
				_mapFunc as (value: unknown) => unknown,
			) as DecodeFunction<U, I>,
			undefined,
			this.schemaDescriptor,
			this.isAsync ||
				returnsPromise(_mapFunc as unknown as (value: never) => unknown),
		);
	}

	/**
	 * Internal decode function.
	 * @param {unknown} value The value to decode.
	 * @returns {Awaitable<Result<T, I>>} The decoded value or an error with issues.
	 * @private
	 */
	private _decode(value: unknown): Awaitable<Result<T, I>> {
		const result = this.decodeFunc(value);

		return mapAwaitable(result, (r) => {
			if (r.ok || !this.cacheFunc) return r as Result<T, I>;
			return this.cacheFunc(r.issues);
		});
	}
}

/**
 * Applies another decoder to the decoded value.
 * @template T
 * @template U
 * @template {Issues<TypeOf<T>>} I
 * @template {Issues<TypeOf<U>>} J
 * @param {(value: Resolved<T>) => Awaitable<IDecoder<U, J>>} nextFunc
 * @returns {IDecoder<U, I | J>}
 */
function andThenFunc<
	T,
	U,
	I extends Issues = Issues<TypeOf<T>>,
	J extends Issues = Issues<TypeOf<U>>,
>(
	this: Decoder<T, I, boolean>,
	nextFunc: (value: Resolved<T>) => Awaitable<IDecoder<U, J>>,
): (value: unknown) => Awaitable<Result<U, I | J>> {
	return (value) => {
		const res = this.decodeValue(value);

		return mapAwaitable(res as Awaitable<Result<Resolved<T>, I>>, (res) => {
			if (!res.ok) return res as Result<U, I | J>;

			return andThenHelper.call(
				this,
				nextFunc(res.value as Resolved<T>),
				res as Ok<Resolved<T>>,
			) as Awaitable<Result<U, I | J>>;
		}) as Awaitable<Result<U, I | J>>;
	};
}

/**
 * Applies another decoder to the decoded value.
 * @template T
 * @template U
 * @template {Issues<TypeOf<T>>} I
 * @template {Issues<TypeOf<U>>} J
 * @param {Awaitable<IDecoder<U, J>>} nextDecoder
 * @param {Result<T, I> & { ok: true }} res
 * @returns {Awaitable<Result<U, I | J>>}
 */
function andThenHelper<
	T,
	U,
	I extends Issues = Issues<TypeOf<T>>,
	J extends Issues = Issues<TypeOf<U>>,
>(
	this: Decoder<T, I, boolean>,
	nextDecoder: Awaitable<IDecoder<U, J>>,
	res: Ok<Resolved<T>>,
): Awaitable<Result<U, I | J>> {
	return mapAwaitable(nextDecoder, (nextDecoder) =>
		nextDecoder.decodeValue(res.value),
	) as Result<U, I | J>;
}

function mapFunc<T, U, I extends Issues = Issues<TypeOf<T>>>(
	this: Decoder<T, I, boolean>,
	_mapFunc: (value: Resolved<T>) => Awaitable<U>,
): (value: unknown) => Awaitable<Result<U, I>> {
	return (value: unknown) => {
		const res = this.decodeValue(value);

		return flatMapAwaitable(res as Awaitable<Result<Resolved<T>, I>>, (res) => {
			if (!res.ok) return res;

			return flatMapAwaitable(res.value as Awaitable<Resolved<T>>, (resolved) =>
				flatMapAwaitable(_mapFunc(resolved), (value) => ({
					ok: true,
					value,
				})),
			);
		});
	};
}

/**
 * Determines the type of a given value.
 *
 * @param {unknown} value - The value to check the type of.
 * @returns {TypeKeys} - A string representing the type of the value.
 */
const typeOf = (value: unknown): TypeKeys => {
	if (value === null) return "type.null";

	if (typeof value === "object") {
		return Array.isArray(value) ? "type.array" : "type.object";
	}

	return `type.${typeof value}`;
};

/**
 * A decoder for booleans.
 */
const booleanDecoder = new Decoder<
	boolean,
	Issues<
		"boolean",
		Issue<
			"boolean",
			"issue.unexpectedType",
			{ expected: "type.boolean"; received: string }
		>
	>
>(
	(value) => {
		if (typeof value === "boolean") return { ok: true, value };

		return {
			issues: createIssues("boolean", "issue.unexpectedType", {
				expected: "type.boolean",
				received: typeOf(value),
			}),
			ok: false,
		};
	},
	undefined,
	staticSchemaDescriptor(booleanSchema),
);

/**
 * A decoder that always fails with the given message and issues.
 * @returns {DecodeFunction<never, Issues<"failed", Issue<"failed", "issue.failedToDecode", never>>>} A decoder that always fails with the given message and issues.
 */
const failedDecoder = new Decoder<
	never,
	Issues<"failed", Issue<"failed", "issue.failedToDecode", never>>
>(
	() => {
		return {
			issues: createIssues("failed", "issue.failedToDecode"),
			ok: false,
		};
	},
	undefined,
	staticSchemaDescriptor(neverSchema),
);

/**
 * A decoder for integers.
 */
const integerDecoder = new Decoder<
	number,
	Issues<
		"integer",
		Issue<
			"integer",
			"issue.unexpectedType",
			{ expected: "type.integer" | "type.number"; received: string }
		>
	>
>(
	(value) => {
		// If the value is not a number, return an error.
		if (typeof value !== "number") {
			return {
				issues: createIssues("integer", "issue.unexpectedType", {
					expected: "type.number",
					received: typeOf(value),
				}),
				ok: false,
			};
		}

		// If the value is not an integer, return an error.
		if (!Number.isInteger(value)) {
			return {
				issues: createIssues("integer", "issue.unexpectedType", {
					expected: "type.integer",
					received: "type.float",
				}),
				ok: false,
			};
		}

		// If the value is an integer, return the value.
		return { ok: true, value };
	},
	undefined,
	staticSchemaDescriptor(integerSchema),
);

/**
 * A decoder for numbers.
 */
const numberDecoder = new Decoder<
	number,
	Issues<
		"number",
		Issue<
			"number",
			"issue.unexpectedType",
			{ expected: "type.number"; received: string }
		>
	>
>(
	(value) => {
		if (typeof value === "number") return { ok: true, value };

		return {
			issues: createIssues("number", "issue.unexpectedType", {
				expected: "type.number",
				received: typeOf(value),
			}),
			ok: false,
		};
	},
	undefined,
	staticSchemaDescriptor(numberSchema),
);

/**
 * A decoder for strings.
 */
const stringDecoder = new Decoder<
	string,
	Issues<
		"string",
		Issue<
			"string",
			"issue.unexpectedType",
			{ expected: "type.string"; received: string }
		>
	>
>(
	(value) => {
		if (typeof value === "string") return { ok: true, value };

		return {
			issues: createIssues("string", "issue.unexpectedType", {
				expected: "type.string",
				received: typeOf(value),
			}),
			ok: false,
		};
	},
	undefined,
	staticSchemaDescriptor(stringSchema),
);

/**
 * Creates a decoder that always succeeds with the given value.
 * @param {unknown} value - The value to return.
 * @returns {DecodeFunction<unknown>} A decoder that always returns the given value.
 */
const valueDecoder = new Decoder<unknown, never>(
	(value) => {
		return { ok: true, value };
	},
	undefined,
	staticSchemaDescriptor(unknownSchema),
);

/**
 * Creates a decoder that decodes an array.
 * @template T - The type of the array elements.
 * @template {IDecoder<T>} U - The decoder to use.
 * @param {U} decoder - The decoder to use.
 * @returns {DecodeFunction<Array<T>, ArrayDecodeIssues<U, Issue<"array", "issue.invalidArrayElements", undefined>>>} A decoder that decodes an array.
 */
const decodeArrayFunc =
	<T, U extends IDecoder<T>>(
		decoder: U,
	): DecodeFunction<
		ArrayDecodeResponse<U>,
		ArrayDecodeIssues<
			U,
			| Issue<"array", "issue.invalidArrayElements", undefined>
			| Issue<
					"array",
					"issue.unexpectedType",
					{ expected: "type.array"; received: TypeKeys }
			  >
		>
	> =>
	(value) => {
		if (!Array.isArray(value))
			return {
				issues: createIssues("array", "issue.unexpectedType", {
					expected: "type.array",
					received: typeOf(value),
				}) as ArrayDecodeIssues<
					U,
					Issue<
						"array",
						"issue.unexpectedType",
						{ expected: "type.array"; received: TypeKeys }
					>
				>,
				ok: false,
			};

		const results = value.map<[number, Awaitable<Result<unknown, Issues>>]>(
			(value, i) => [i, decoder.decodeValue(value)],
		);

		return mapAwaitable(resolveAwaitablePairs(results), (resolved) =>
			decodeArrayHelper(resolved),
		);
	};

/**
 * Creates a decoder that decodes an array.
 * @template T - The type of the array elements.
 * @template {IDecoder<T>} U - The decoder to use.
 * @param {Array<[number, Result<unknown, Issues>]>} results - The results of the decoders.
 * @returns {Result<ArrayDecodeResponse<U>, ArrayDecodeIssues<U, Issue<"array", "issue.invalidArrayElements", undefined>>>} The result of the array decoder.
 */
const decodeArrayHelper = <T, U extends IDecoder<T>>(
	results: Array<[number, Result<unknown, Issues>]>,
): Result<
	ArrayDecodeResponse<U>,
	ArrayDecodeIssues<U, Issue<"array", "issue.invalidArrayElements", undefined>>
> => {
	const issues = results.filter(([_, result]) => !result.ok);

	if (issues.length > 0) {
		return {
			issues: createIssues(
				"array",
				"issue.invalidArrayElements",
				undefined,
				Object.fromEntries(issues.map(([i, result]) => [i, result.issues])),
			) as ArrayDecodeIssues<
				U,
				Issue<"array", string, { expected: string; received: string }>
			>,
			ok: false,
		};
	}

	return {
		ok: true,
		value: results.map(([_, result]) => result.value) as ArrayDecodeResponse<U>,
	};
};

/**
 * Creates a decoder that decodes a non-empty array.
 * @template T - The type of the array elements.
 * @template {IDecoder<T>} U - The decoder to use.
 * @param {U} decoder - The decoder to use.
 * @returns {DecodeFunction<OneOrMoreDecodeResponse<U>, ArrayDecodeIssues<U, Issue<"array", "issue.invalidArrayElements", undefined> | Issue<"array", "issue.invalidArrayLength", { expected: 1; received: number }> | Issue<"array", "issue.unexpectedType", { expected: "type.array"; received: TypeKeys }>>>} A decoder that decodes a non-empty array.
 */
const decodeOneOrMoreFunc =
	<T, U extends IDecoder<T>>(
		decoder: U,
	): DecodeFunction<
		OneOrMoreDecodeResponse<U>,
		ArrayDecodeIssues<
			U,
			| Issue<"array", "issue.invalidArrayElements", undefined>
			| Issue<
					"array",
					"issue.invalidArrayLength",
					{ expected: 1; received: number }
			  >
			| Issue<
					"array",
					"issue.unexpectedType",
					{ expected: "type.array"; received: TypeKeys }
			  >
		>
	> =>
	(value) => {
		if (Array.isArray(value) && value.length === 0) {
			return {
				issues: createIssues("array", "issue.invalidArrayLength", {
					expected: 1,
					received: 0,
				}) as ArrayDecodeIssues<
					U,
					Issue<
						"array",
						"issue.invalidArrayLength",
						{ expected: 1; received: number }
					>
				>,
				ok: false,
			};
		}

		return decodeArrayFunc(decoder)(value) as Awaitable<
			Result<
				OneOrMoreDecodeResponse<U>,
				ArrayDecodeIssues<
					U,
					| Issue<"array", "issue.invalidArrayElements", undefined>
					| Issue<
							"array",
							"issue.invalidArrayLength",
							{ expected: 1; received: number }
					  >
					| Issue<
							"array",
							"issue.unexpectedType",
							{ expected: "type.array"; received: TypeKeys }
					  >
				>
			>
		>;
	};

/**
 * Creates a decoder that always returns the same value.
 * @param {T} expected - The value to return.
 * @returns {DecodeFunction<T, Issues<"constant", Issue<"constant", string, { expected: T; received: Primitive }>>>} A decoder that always returns the given value.
 */
const decodeConstantFunc =
	<T extends Primitive>(
		expected: T,
	): DecodeFunction<
		T,
		Issues<
			"constant",
			Issue<
				"constant",
				"issue.unexpectedValue",
				{ expected: T; received: Primitive }
			>
		>
	> =>
	(value) => {
		if (value === expected) return { ok: true, value: value as T };

		return {
			issues: createIssues("constant", "issue.unexpectedValue", {
				expected,
				received: value as Primitive,
			}),
			ok: false,
		};
	};

/**
 * Helper function to decode a field.
 * @template T - The type of the value.
 * @template {IDecoder<T>} U - The decoder to use.
 * @template K - The type of the key.
 * @param {K} key - The key of the field.
 * @param {IDecoder<T>} decoder - The decoder to use.
 * @returns {DecodeFunction<T, FieldDecodeIssues<K, U, Issue<"field", "issue.invalidObjectField", { key: K }> | Issue<"field", "issue.unexpectedType", { expected: "type.object"; received: TypeKeys }>>>} A decoder that decodes a field.
 */
const decodeFieldFunc = <
	T,
	U extends IDecoder<T> = IDecoder<T>,
	K extends string = string,
>(
	key: K,
	decoder: U,
): DecodeFunction<
	FieldDecodeResponse<U>,
	FieldDecodeIssues<
		U,
		| Issue<"field", "issue.invalidObjectField", { key: K }>
		| Issue<
				"field",
				"issue.unexpectedType",
				{ expected: "type.object"; received: TypeKeys }
		  >,
		K
	>
> => {
	return (value) => {
		if (!isRecord(value))
			return {
				issues: createIssues("field", "issue.unexpectedType", {
					expected: "type.object",
					received: typeOf(value),
				}) as FieldDecodeIssues<
					U,
					Issue<
						"field",
						"issue.unexpectedType",
						{ expected: "type.object"; received: TypeKeys }
					>,
					K
				>,
				ok: false,
			};

		// if the issue is an unexpected type and the received type is undefined, return a missing field issue
		return decoder
			.catch((issue) => {
				return {
					issues: createIssues(
						"field",
						"issue.invalidObjectField",
						{ key },
						{ [key]: issue },
					),
					ok: false,
				};
			})
			.decodeValue(value[key]) as Awaitable<
			Result<
				FieldDecodeResponse<U>,
				FieldDecodeIssues<
					U,
					Issue<
						"field",
						"issue.unexpectedType",
						{ expected: "type.object"; received: TypeKeys }
					>,
					K
				>
			>
		>;
	};
};

const decodeIndexFunc = <
	T,
	U extends IDecoder<T> = IDecoder<T>,
	N extends number = number,
>(
	index: N,
	decoder: U,
): DecodeFunction<
	IndexDecodeResponse<U>,
	IndexDecodeIssues<
		U,
		| Issue<"index", "issue.invalidArrayIndex", { index: N }>
		| Issue<
				"index",
				"issue.unexpectedType",
				{ expected: "type.array"; received: TypeKeys }
		  >,
		N
	>
> => {
	return (value) => {
		if (!Array.isArray(value))
			return {
				issues: createIssues("index", "issue.unexpectedType", {
					expected: "type.array",
					received: typeOf(value),
				}) as IndexDecodeIssues<
					U,
					Issue<
						"index",
						"issue.unexpectedType",
						{ expected: "type.array"; received: TypeKeys }
					>,
					N
				>,
				ok: false,
			};

		return decoder
			.catch((issue) => {
				return {
					issues: createIssues(
						"index",
						"issue.invalidArrayIndex",
						{ index },
						{ [index]: issue },
					),
					ok: false,
				};
			})
			.decodeValue(value[index]) as Awaitable<
			Result<
				IndexDecodeResponse<U>,
				IndexDecodeIssues<
					U,
					Issue<"index", "issue.invalidArrayIndex", { index: N }>,
					N
				>
			>
		>;
	};
};

/**
 * Helper function to decode a lazy decoder.
 * @template T - The type of the value.
 * @template {Issues} I The type of the issues.
 * @param {() => Awaitable<IDecoder<T, I>>} lazyFunc - The lazy function to decode the value.
 * @returns {Awaitable<Result<T, I>>} The decoded value or an error with issues.
 */
const decodeLazyFunc = <T, I extends Issues = Issues>(
	lazyFunc: () => Awaitable<IDecoder<T, I>>,
): DecodeFunction<T, I> => {
	return (value) =>
		mapAwaitable(lazyFunc(), (decoder) =>
			decoder.decodeValue(value),
		) as Awaitable<Result<T, I>>;
};

/**
 * Helper function to decode a map.
 * @template T - The type of the map value.
 * @template {IDecoder<unknown>} U - The type of the decoders.
 * @param {MapDecodeFunction<T, U>} mapFunc - The function to map the decoded value.
 * @param {...IDecoder<unknown>} decoders - The decoders to decode the value.
 * @returns {DecodeFunction<MapDecodeResponse<MapDecodeFunction<T, U>>, MapDecodeIssues<U>>} A decoder that decodes a map.
 */
const decodeMapFunc =
	<T, U extends Array<IDecoder<unknown>> = Array<IDecoder<unknown>>>(
		mapFunc: MapDecodeFunction<T, U>,
		...decoders: U
	): DecodeFunction<
		MapDecodeResponse<MapDecodeFunction<T, U>>,
		MapDecodeIssues<U>
	> =>
	(value) => {
		const results = decoders.map((decoder) => decoder.decodeValue(value));

		return mapAwaitable(allAwaitable(results), (resolvedResults) => {
			const failed = resolvedResults.find((r) => !r.ok);
			if (failed) return failed as Err<MapDecodeIssues<U>>;

			const entries = resolvedResults.map(({ value }) => value);
			return {
				ok: true,
				value: mapFunc(...(entries as MapDecodeFunctionParams<U>)),
			} as Result<
				MapDecodeResponse<MapDecodeFunction<T, U>>,
				MapDecodeIssues<U>
			>;
		});
	};

/**
 * Helper function to decode an object.
 * @template T - The type of the object.
 * @template {ObjectDecoders<T>} U - The type of the decoders.
 * @param {Array<[string, Result<unknown, Issues>]>} results - The results of the decoders.
 * @returns {ObjectDecodeResponse<U> | { issues: ObjectDecodeIssues<U, Issue<"object", "issue.invalidObject", undefined>>; ok: false; }} The decoded value or an error.
 */
const decodeObjectHelper = <
	T extends Record<string, unknown>,
	U extends ObjectDecoders<T>,
>(
	results: Array<[string, Result<unknown, Issues>]>,
): Result<
	ObjectDecodeResponse<U>,
	ObjectDecodeIssues<U, Issue<"object", "issue.invalidObject", undefined>>
> => {
	const issues = results.filter(([_, result]) => !result.ok);

	if (issues.length > 0) {
		return {
			issues: createIssues(
				"object",
				"issue.invalidObject",
				undefined,
				Object.fromEntries(issues.map(([key, result]) => [key, result.issues])),
			) as ObjectDecodeIssues<
				U,
				Issue<"object", "issue.invalidObject", undefined>
			>,
			ok: false,
		};
	}

	return {
		ok: true,
		value: Object.fromEntries(
			results.reduce<Array<[string, unknown]>>((accumulator, [key, result]) => {
				// remove undefined values, keep null values
				if (typeof result.value === "undefined") return accumulator;

				accumulator.push([key, result.value]);

				return accumulator;
			}, []),
		) as ObjectDecodeResponse<U>,
	};
};

/**
 * Creates a decoder that decodes an object asynchronously.
 * @template T - The type of the object.
 * @template {ObjectDecoders<T>} U - The type of the decoders.
 * @param {U} decoders - The decoders for the object properties.
 * @returns {DecodeFunction<ObjectDecodeResponse<U>, ObjectDecodeIssues<U, Issue<"object", "issue.invalidObject", undefined> | Issue<"object", "issue.unexpectedType", { expected: "type.object"; received: TypeKeys }>>>} A decoder that decodes an object.
 */
const decodeObjectFunc =
	<T extends Record<string, unknown>, U extends ObjectDecoders<T>>(
		decoders: U,
	): DecodeFunction<
		ObjectDecodeResponse<U>,
		ObjectDecodeIssues<
			U,
			| Issue<"object", "issue.invalidObject", undefined>
			| Issue<
					"object",
					"issue.unexpectedType",
					{ expected: "type.object"; received: TypeKeys }
			  >
		>
	> =>
	(value) => {
		if (!isRecord(value))
			return {
				issues: createIssues("object", "issue.unexpectedType", {
					expected: "type.object",
					received: typeOf(value),
				}) as ObjectDecodeIssues<
					U,
					Issue<
						"object",
						"issue.unexpectedType",
						{ expected: "type.object"; received: TypeKeys }
					>
				>,
				ok: false,
			};

		const results = Object.entries(decoders).map<
			[string, Awaitable<Result<unknown, Issues>>]
		>(([key, decoder]: [string, IDecoder<U[keyof U]>]) => {
			return [key, decoder.decodeValue(value[key])];
		});

		return mapAwaitable(resolveAwaitablePairs(results), (resolved) =>
			decodeObjectHelper(resolved),
		);
	};

/**
 * Helper function to decode a record.
 * @template {IDecoder<Awaitable<PropertyKey>>} K - The decoder to use for keys.
 * @template {IDecoder<unknown>} V - The decoder to use for values.
 * @param {Array<[string, Result<unknown, Issues>, Result<unknown, Issues>]>} results - The key and value decode results.
 * @returns {Result<RecordDecodeResponse<K, V>, RecordDecodeIssues<K, V, Issue<"record", "issue.invalidRecord", undefined> | Issue<"record", "issue.invalidRecordKey", { key: string }>>>} The result of the record decoder.
 */
const decodeRecordHelper = <
	K extends IDecoder<Awaitable<PropertyKey>>,
	V extends IDecoder<unknown>,
>(
	results: Array<[string, Result<unknown, Issues>, Result<unknown, Issues>]>,
): Result<
	RecordDecodeResponse<K, V>,
	RecordDecodeIssues<
		K,
		V,
		| Issue<"record", "issue.invalidRecord", undefined>
		| Issue<"record", "issue.invalidRecordKey", { key: string }>
	>
> => {
	const issues = results.reduce<Array<[string, Issues]>>(
		(accumulator, [originalKey, keyResult, valueResult]) => {
			// Invalid keys are not valid issue paths (`RecordDecodeIssues` is
			// indexed by decoded keys), so skip nesting under them.
			if (!keyResult.ok) return accumulator;

			if (!valueResult.ok) accumulator.push([originalKey, valueResult.issues]);

			return accumulator;
		},
		[],
	);

	const invalidKey = results.find(([, keyResult]) => !keyResult.ok)?.[0];

	if (invalidKey !== undefined && issues.length === 0) {
		return {
			issues: createIssues("record", "issue.invalidRecordKey", {
				key: invalidKey,
			}) as RecordDecodeIssues<
				K,
				V,
				Issue<"record", "issue.invalidRecordKey", { key: string }>
			>,
			ok: false,
		};
	}

	if (issues.length > 0) {
		return {
			issues: createIssues(
				"record",
				"issue.invalidRecord",
				undefined,
				Object.fromEntries(issues),
			) as RecordDecodeIssues<
				K,
				V,
				Issue<"record", "issue.invalidRecord", undefined>
			>,
			ok: false,
		};
	}

	return {
		ok: true,
		value: Object.fromEntries(
			results.reduce<Array<[PropertyKey, unknown]>>(
				(accumulator, [_originalKey, keyResult, valueResult]) => {
					// remove undefined keys and values, keep null values
					if (typeof keyResult.value === "undefined") return accumulator;
					if (typeof valueResult.value === "undefined") return accumulator;

					accumulator.push([keyResult.value as PropertyKey, valueResult.value]);

					return accumulator;
				},
				[],
			),
		) as RecordDecodeResponse<K, V>,
	};
};

/**
 * Creates a decoder that decodes a record.
 * @template {IDecoder<Awaitable<PropertyKey>>} K - The decoder to use for keys.
 * @template {IDecoder<unknown>} V - The decoder to use for values.
 * @param {K} keyDecoder - The decoder to use for keys.
 * @param {V} valueDecoder - The decoder to use for values.
 * @returns {DecodeFunction<RecordDecodeResponse<K, V>, RecordDecodeIssues<K, V, Issue<"record", "issue.invalidRecord", undefined> | Issue<"record", "issue.invalidRecordKey", { key: string }> | Issue<"record", "issue.unexpectedType", { expected: "type.object"; received: TypeKeys }>>>} A decoder that decodes a record.
 */
const decodeRecordFunc =
	<K extends IDecoder<Awaitable<PropertyKey>>, V extends IDecoder<unknown>>(
		keyDecoder: K,
		valueDecoder: V,
	): DecodeFunction<
		RecordDecodeResponse<K, V>,
		RecordDecodeIssues<
			K,
			V,
			| Issue<"record", "issue.invalidRecord", undefined>
			| Issue<"record", "issue.invalidRecordKey", { key: string }>
			| Issue<
					"record",
					"issue.unexpectedType",
					{ expected: "type.object"; received: TypeKeys }
			  >
		>
	> =>
	(value) => {
		if (!isRecord(value))
			return {
				issues: createIssues("record", "issue.unexpectedType", {
					expected: "type.object",
					received: typeOf(value),
				}) as RecordDecodeIssues<
					K,
					V,
					Issue<
						"record",
						"issue.unexpectedType",
						{ expected: "type.object"; received: TypeKeys }
					>
				>,
				ok: false,
			};

		const results = Object.entries(value).map((entry) => {
			const [originalKey, originalValue] = entry;

			return mapAwaitable(
				allAwaitable([
					keyDecoder.decodeValue(originalKey),
					valueDecoder.decodeValue(originalValue),
				]),
				([keyResult, valueResult]) =>
					[originalKey, keyResult, valueResult] as [
						string,
						Result<unknown, Issues>,
						Result<unknown, Issues>,
					],
			);
		});

		return mapAwaitable(allAwaitable(results), (resolved) =>
			decodeRecordHelper<K, V>(resolved),
		);
	};

/**
 * Creates a decoder that always succeeds with the given value.
 * @param {T} value - The value to return.
 * @returns {DecodeFunction<T>} A decoder that always returns the given value.
 */
const decodeSucceedFunc =
	<T>(value: T): DecodeFunction<T> =>
	() => {
		return { ok: true, value };
	};

/**
 * Helper function to decode a tuple.
 * @template T - The type of the tuple.
 * @template U - The type of the decoders.
 * @param {Array<[number, Result<unknown, Issues>]>} results - The results of the decoders.
 * @returns {Result<TupleDecodeResponse<U>, TupleDecodeIssues<U, Issue<"tuple:elements", "issue.invalidArrayElements", undefined>>>} The decoded value or an error.
 */
const decodeTupleHelper = <
	T extends unknown[],
	U extends Array<IDecoder<unknown>> | TupleDecoders<T>,
>(
	results: Array<[number, Result<unknown, Issues>]>,
): Result<
	TupleDecodeResponse<U>,
	TupleDecodeIssues<
		U,
		Issue<"tuple:elements", "issue.invalidArrayElements", undefined>
	>
> => {
	const issues = results.filter(([_, result]) => !result.ok);

	if (issues.length > 0) {
		return {
			issues: createIssues(
				"tuple:elements",
				"issue.invalidArrayElements",
				undefined,
				Object.fromEntries(
					issues.map(([i, result]) => [i, result.issues]) as Array<
						[number, Issues]
					>,
				),
			) as TupleDecodeIssues<
				U,
				Issue<"tuple:elements", "issue.invalidArrayElements", undefined>
			>,
			ok: false,
		};
	}

	return {
		ok: true,
		value: results.map(([_, result]) => result.value) as TupleDecodeResponse<U>,
	};
};

/**
 * Creates a decoder that decodes a tuple.
 * @template T - The type of the tuple.
 * @template U - The type of the decoders.
 * @param {U} decoders - The decoders for the tuple elements.
 * @returns {DecodeFunction<TupleDecodeResponse<U>, Issues<"tuple", Issue<"tuple:length", "issue.invalidArrayLength", { expected: number; received: number }> | Issue<"tuple:type", "issue.unexpectedType", { expected: "type.array"; received: TypeKeys }>> | TupleDecodeIssues<U, Issue<"tuple", string>>>} A decoder that decodes a tuple.
 */
const decodeTupleFunc =
	<T extends unknown[], U extends Array<IDecoder<unknown>> | TupleDecoders<T>>(
		decoders: U,
	): DecodeFunction<
		TupleDecodeResponse<U>,
		TupleDecodeIssues<
			U,
			| Issue<"tuple:elements", "issue.invalidArrayElements", undefined>
			| Issue<
					"tuple:length",
					"issue.invalidArrayLength",
					{ expected: number; received: number }
			  >
			| Issue<
					"tuple:type",
					"issue.unexpectedType",
					{ expected: "type.array"; received: TypeKeys }
			  >
		>
	> =>
	(value) => {
		if (!Array.isArray(value))
			return {
				issues: createIssues("tuple", "issue.unexpectedType", {
					expected: "type.array",
					received: typeOf(value),
				}) as TupleDecodeIssues<
					U,
					Issue<
						"tuple:type",
						"issue.unexpectedType",
						{ expected: "type.array"; received: TypeKeys }
					>
				>,
				ok: false,
			};

		if (decoders.length !== value.length)
			return {
				issues: createIssues("tuple:length", "issue.invalidArrayLength", {
					expected: decoders.length,
					received: value.length,
				}) as TupleDecodeIssues<
					U,
					Issue<
						"tuple:length",
						"issue.invalidArrayLength",
						{ expected: number; received: number }
					>
				>,
				ok: false,
			};

		const results = decoders.map<[number, Awaitable<Result<unknown, Issues>>]>(
			(decoder: IDecoder<unknown>, i: number) => [
				i,
				decoder.decodeValue(value[i]),
			],
		);

		return mapAwaitable(resolveAwaitablePairs(results), (resolved) =>
			decodeTupleHelper(resolved),
		);
	};

const mergeUnionDecodeResult = (
	accumulator: { failed: Issues[]; ok: false },
	result: Result<unknown, Issues>,
): { failed: Issues[]; ok: false } | { ok: true; value: unknown } => {
	if (result.ok) return result;

	if (
		getIssueMessage(result.issues)?.type === "union" &&
		Array.isArray(result.issues)
	) {
		accumulator.failed.push(...result.issues);
	} else {
		accumulator.failed.push(result.issues);
	}

	return accumulator;
};

/**
 * Helper function to decode a union failure.
 * @template T - The type of the union.
 * @template U - The type of the decoders.
 * @param {Issues[]} issues - The issues from each decoder.
 * @returns {Result<UnionDecodeResponse<U>, UnionDecodeIssues<U, Issue<"union", "issue.invalidUnion", undefined>>>} The error result.
 */
const decodeUnionHelper = <U extends Array<IDecoder<unknown>>>(
	issues: Issues[],
): Result<
	UnionDecodeResponse<U>,
	UnionDecodeIssues<U, Issue<"union", "issue.invalidUnion", undefined>>
> => {
	return {
		issues: createIssues(
			"union",
			"issue.invalidUnion",
			undefined,
			issues as Issues<
				"union",
				Issue<"union", "issue.invalidUnion", undefined>
			>,
		) as unknown as UnionDecodeIssues<
			U,
			Issue<"union", "issue.invalidUnion", undefined>
		>,
		ok: false,
	};
};

/**
 * Creates a decoder that decodes a union.
 * @template T - The type of the union.
 * @template U - The type of the decoders.
 * @param {U} decoders - The decoders for the union.
 * @returns {DecodeFunction<UnionDecodeResponse<U>, UnionDecodeIssues<U>>} A decoder that decodes a union.
 * @returns
 */
const decodeUnionFunc =
	<U extends Array<IDecoder<unknown>>>(
		decoders: U,
	): DecodeFunction<
		UnionDecodeResponse<U>,
		UnionDecodeIssues<U, Issue<"union", "issue.invalidUnion", undefined>>
	> =>
	(value) => {
		const results = (decoders as Array<IDecoder<unknown>>).reduce<
			Awaitable<{ failed: Issues[]; ok: false } | { ok: true; value: unknown }>
		>(
			(accumulator, decoder) =>
				flatMapAwaitable(accumulator, (accumulator) => {
					if (accumulator.ok) return accumulator;

					return mapAwaitable(decoder.decodeValue(value), (result) =>
						mergeUnionDecodeResult(accumulator, result),
					);
				}),
			{ failed: [], ok: false },
		);

		return mapAwaitable(results, (results) => {
			if (results.ok)
				return results as Result<
					UnionDecodeResponse<U>,
					UnionDecodeIssues<U, Issue<"union", "issue.invalidUnion", undefined>>
				>;

			return decodeUnionHelper<U>(results.failed);
		});
	};

/**
 * Creates a decoder that decodes an array.
 * @template T - The type of the array elements.
 * @param {IDecoder<T>} decoder - The decoder to use.
 * @returns {IDecoder<Array<T>, ArrayDecodeIssues<U, Issue<"array", "issue.invalidArrayElements", undefined> | Issue<"array", "issue.unexpectedValue", { expected: "type.array"; received: TypeKeys }>>>} A decoder that decodes an array.
 */
export function array<T, U extends IDecoder<T> = IDecoder<T>>(
	decoder: U,
): IDecoder<
	ArrayDecodeResponse<U>,
	ArrayDecodeIssues<
		U,
		| Issue<"array", "issue.invalidArrayElements", undefined>
		| Issue<
				"array",
				"issue.unexpectedValue",
				{ expected: "type.array"; received: TypeKeys }
		  >
	>,
	SchemaAsyncOf<U>
> {
	return new Decoder<
		ArrayDecodeResponse<U>,
		ArrayDecodeIssues<
			U,
			| Issue<"array", "issue.invalidArrayElements", undefined>
			| Issue<
					"array",
					"issue.unexpectedValue",
					{ expected: "type.array"; received: TypeKeys }
			  >
		>,
		SchemaAsyncOf<U>
	>(
		decodeArrayFunc(decoder),
		undefined,
		arraySchemaDescriptor(decoder),
		isDecoderAsync(decoder),
	);
}

/**
 * Create a decoder that decodes a nested field.
 *
 * `at(["person", "name"], string())` is equivalent to
 * `field("person", field("name", string()))`.
 *
 * @template T - The type of the value.
 * @template {IDecoder<T>} U - The decoder to use.
 * @template {readonly string[]} K - The nested field names.
 * @param {K} keys - The nested field names.
 * @param {IDecoder<T>} decoder - The decoder to use.
 * @returns {AtDecoder<U, K>} A decoder that decodes a nested field.
 */
export function at<
	T,
	U extends IDecoder<T> = IDecoder<T>,
	const K extends readonly string[] = readonly string[],
>(keys: K, decoder: U): AtDecoder<U, K> {
	return keys.reduceRight(
		(acc: IDecoder<unknown, Issues, boolean>, key) => field(key, acc),
		decoder,
	) as AtDecoder<U, K>;
}

/**
 * A decoder for booleans.
 * @returns {IDecoder<boolean, Issues<"boolean", Issue<"boolean", "issue.unexpectedType", { expected: "type.boolean"; received: string }>>>}
 */
export function boolean(): IDecoder<
	boolean,
	Issues<
		"boolean",
		Issue<
			"boolean",
			"issue.unexpectedType",
			{ expected: "type.boolean"; received: string }
		>
	>
> {
	return booleanDecoder;
}

/**
 * A decoder that always returns the same value.
 *
 * @template {Primitive} T The type of the value.
 * @param {T} expected The value to return.
 * @returns {IDecoder<T, Issues<"constant", Issue<"constant", "issue.unexpectedValue", { expected: T; received: Primitive }>>>} A decoder that always returns the given value.
 */
export function constant<T extends Primitive>(
	expected: T,
): IDecoder<
	T,
	Issues<
		"constant",
		Issue<
			"constant",
			"issue.unexpectedValue",
			{ expected: T; received: Primitive }
		>
	>
> {
	return new Decoder(
		decodeConstantFunc(expected),
		undefined,
		staticSchemaDescriptor(constantSchema(expected)),
	);
}

/**
 * Create a decoder that always fails with the given message and issues.
 * @returns {IDecoder<never, Issues<"failed", Issue<"failed", "issue.failedToDecode", never>>>} A decoder that always fails with the given message and issues.
 */
export function failed(): IDecoder<
	never,
	Issues<"failed", Issue<"failed", "issue.failedToDecode", never>>
> {
	return failedDecoder;
}

/**
 * Create a decoder that decodes a field.
 * @template T - The type of the value.
 * @template {IDecoder<T>} U - The decoder to use.
 * @param {string} key - The name of the field.
 * @param {IDecoder<T>} decoder - The decoder to use.
 * @returns {IDecoder<T, FieldDecodeIssues<U, Issue<"field", "issue.invalidObjectField", { key: string }> | Issue<"field", "issue.unexpectedType", { expected: "type.object"; received: TypeKeys }>>>} A decoder that decodes a field.
 */
export function field<
	T,
	U extends IDecoder<T> = IDecoder<T>,
	K extends string = string,
>(
	key: K,
	decoder: U,
): IDecoder<
	FieldDecodeResponse<U>,
	FieldDecodeIssues<
		U,
		| Issue<"field", "issue.invalidObjectField", { key: K }>
		| Issue<
				"field",
				"issue.unexpectedType",
				{ expected: "type.object"; received: TypeKeys }
		  >,
		K
	>,
	SchemaAsyncOf<U>
> {
	return new Decoder<
		FieldDecodeResponse<U>,
		FieldDecodeIssues<
			U,
			| Issue<"field", "issue.invalidObjectField", { key: K }>
			| Issue<
					"field",
					"issue.unexpectedType",
					{ expected: "type.object"; received: TypeKeys }
			  >,
			K
		>,
		SchemaAsyncOf<U>
	>(
		decodeFieldFunc(key, decoder),
		undefined,
		fieldSchemaDescriptor(key, decoder),
		isDecoderAsync(decoder),
	);
}

/**
 * Creates a decoder that decodes an index.
 * @template T - The type of the value.
 * @template {IDecoder<T>} U - The decoder to use.
 * @param {number} index - The index to decode.
 * @param {IDecoder<T>} decoder - The decoder to use.
 * @returns {IDecoder<T, IndexDecodeIssues<U, Issue<"index", "issue.invalidArrayIndex", { index: N }> | Issue<"index", "issue.unexpectedType", { expected: "type.array"; received: TypeKeys }>, N>>} A decoder that decodes an index.
 */
export function index<
	T,
	U extends IDecoder<T> = IDecoder<T>,
	N extends number = number,
>(
	index: N,
	decoder: U,
): IDecoder<
	IndexDecodeResponse<U>,
	IndexDecodeIssues<
		U,
		| Issue<"index", "issue.invalidArrayIndex", { index: N }>
		| Issue<
				"index",
				"issue.unexpectedType",
				{ expected: "type.array"; received: TypeKeys }
		  >,
		N
	>,
	SchemaAsyncOf<U>
> {
	return new Decoder<
		IndexDecodeResponse<U>,
		IndexDecodeIssues<
			U,
			| Issue<"index", "issue.invalidArrayIndex", { index: N }>
			| Issue<
					"index",
					"issue.unexpectedType",
					{ expected: "type.array"; received: TypeKeys }
			  >,
			N
		>,
		SchemaAsyncOf<U>
	>(
		decodeIndexFunc(index, decoder),
		undefined,
		indexSchemaDescriptor(index, decoder),
		isDecoderAsync(decoder),
	);
}

/**
 * A decoder for integers.
 *
 * @returns {IDecoder<number, Issues<"integer", Issue<"integer", "issue.unexpectedType", { expected: "type.number"; received: string }>>>} A decoder for integers.
 */
export function int(): IDecoder<
	number,
	Issues<
		"integer",
		Issue<
			"integer",
			"issue.unexpectedType",
			{ expected: "type.integer" | "type.number"; received: string }
		>
	>
> {
	return integerDecoder;
}

/**
 * Create a decoder that lazily decodes the value.
 * @template T - The type of the value.
 * @template {Issues} I The type of the issues.
 * @param {() => IDecoder<T, I>} lazyFunc The function to lazily decode the value.
 * @returns {IDecoder<T, I>} A decoder that lazily decodes the value.
 */
export function lazy<T, I extends Issues = Issues>(
	lazyFunc: () => IDecoder<T, I>,
): IDecoder<T, I, SchemaAsyncOf<IDecoder<T, I>>>;
/**
 * Create a decoder that lazily decodes the value.
 * @template T - The type of the value.
 * @template {Issues} I The type of the issues.
 * @param {() => Promise<IDecoder<T, I>>} lazyFunc The function to lazily decode the value.
 * @returns {IDecoder<Promise<T>, I>} A decoder that lazily decodes the value.
 */
export function lazy<T, I extends Issues = Issues>(
	lazyFunc: () => Promise<IDecoder<T, I>>,
): IDecoder<Promise<T>, I, true>;
/**
 * Create a decoder that lazily decodes the value.
 * @template T - The type of the value.
 * @template {Issues} I The type of the issues.
 * @param {() => Awaitable<IDecoder<T, I>>} lazyFunc The function to lazily decode the value.
 * @returns {IDecoder<T, I>} A decoder that lazily decodes the value.
 */
export function lazy<T, I extends Issues = Issues>(
	lazyFunc: () => Awaitable<IDecoder<T, I>>,
): IDecoder<T, I, SchemaAsyncOf<IDecoder<T, I>> | true> {
	return new Decoder<T, I>(
		decodeLazyFunc(lazyFunc),
		undefined,
		lazySchemaDescriptor(lazyFunc),
		returnsPromise(lazyFunc as (value: never) => unknown),
	) as IDecoder<T, I, SchemaAsyncOf<IDecoder<T, I>> | true>;
}

export function map<
	T,
	U extends Array<IDecoder<unknown>> = Array<IDecoder<unknown>>,
>(
	mapFunc: MapDecodeFunction<T, U>,
	...decoders: U
): IDecoder<
	MapDecodeResponse<MapDecodeFunction<T, U>>,
	MapDecodeIssues<U>,
	TupleSchemaHasPromise<U> extends true ? true : false
> {
	return new Decoder<
		MapDecodeResponse<MapDecodeFunction<T, U>>,
		MapDecodeIssues<U>,
		TupleSchemaHasPromise<U> extends true ? true : false
	>(
		decodeMapFunc(mapFunc, ...decoders),
		undefined,
		mapSchemaDescriptor(decoders),
		anyDecoderAsync(decoders) ||
			returnsPromise(mapFunc as unknown as (value: never) => unknown),
	);
}

/**
 * Create a decoder that makes a decoder nullable.
 *
 * @template T The type of the value.
 * @template {Issues<TypeOf<T>>} I The type of the issues.
 * @param {IDecoder<T, I>} decoder The decoder to make nullable.
 * @returns {IDecoder<NullableDecodeResponse<T>, I>} A decoder that accepts either the original value or null.
 */
export function nullable<
	T,
	I extends Issues = Issues,
	S extends boolean = false,
>(decoder: IDecoder<T, I, S>): IDecoder<NullableDecodeResponse<T>, I, S> {
	return new Decoder<NullableDecodeResponse<T>, I, S>(
		(value) => {
			if (value === null)
				return { ok: true, value: null } as Result<
					NullableDecodeResponse<T>,
					I
				>;

			return decoder.decodeValue(value) as Awaitable<
				Result<NullableDecodeResponse<T>, I>
			>;
		},
		undefined,
		nullableSchemaDescriptor(decoder),
		isDecoderAsync(decoder),
	);
}

/**
 * A decoder for numbers.
 *
 * @returns {IDecoder<number, Issues<"number", Issue<"number", "issue.unexpectedType", { expected: "type.number"; received: string }>>>} A decoder for numbers.
 */
export function number(): IDecoder<
	number,
	Issues<
		"number",
		Issue<
			"number",
			"issue.unexpectedType",
			{ expected: "type.number"; received: string }
		>
	>
> {
	return numberDecoder;
}

/**
 * Create a decoder for an object.
 *
 * @template T The type of the object.
 * @template {ObjectDecoders<T>} U The type of the decoders.
 * @param {U} decoders The decoders for the object properties.
 * @returns {IDecoder<ObjectDecodeResponse<U>, ObjectDecodeIssues<U, Issue<"object", "issue.invalidObject", undefined> | Issue<"object", "issue.unexpectedType", { expected: "type.object"; received: TypeKeys }>>>} A decoder for the object.
 */
export function object<
	T extends Record<string, unknown>,
	U extends ObjectDecoders<T> = ObjectDecoders<T>,
>(
	decoders: U,
): IDecoder<
	ObjectDecodeResponse<U>,
	ObjectDecodeIssues<
		U,
		| Issue<"object", "issue.invalidObject", undefined>
		| Issue<
				"object",
				"issue.unexpectedType",
				{ expected: "type.object"; received: TypeKeys }
		  >
	>,
	RecordSchemaHasPromise<U> extends true ? true : false
> {
	return new Decoder<
		ObjectDecodeResponse<U>,
		ObjectDecodeIssues<
			U,
			| Issue<"object", "issue.invalidObject", undefined>
			| Issue<
					"object",
					"issue.unexpectedType",
					{ expected: "type.object"; received: TypeKeys }
			  >
		>,
		RecordSchemaHasPromise<U> extends true ? true : false
	>(
		decodeObjectFunc(decoders),
		undefined,
		objectSchemaDescriptor(decoders),
		recordDecoderAsync(decoders),
	);
}

/**
 * Create a decoder that decodes a non-empty array.
 *
 * @template T The type of the array elements.
 * @template {IDecoder<T>} U The decoder to use.
 * @param {IDecoder<T>} decoder The decoder to use for elements.
 * @returns {IDecoder<OneOrMoreDecodeResponse<U>, ArrayDecodeIssues<U, Issue<"array", "issue.invalidArrayElements", undefined> | Issue<"array", "issue.invalidArrayLength", { expected: 1; received: number }> | Issue<"array", "issue.unexpectedType", { expected: "type.array"; received: TypeKeys }>>>} A decoder that decodes a non-empty array.
 */
export function oneOrMore<T, U extends IDecoder<T> = IDecoder<T>>(
	decoder: U,
): IDecoder<
	OneOrMoreDecodeResponse<U>,
	ArrayDecodeIssues<
		U,
		| Issue<"array", "issue.invalidArrayElements", undefined>
		| Issue<
				"array",
				"issue.invalidArrayLength",
				{ expected: 1; received: number }
		  >
		| Issue<
				"array",
				"issue.unexpectedType",
				{ expected: "type.array"; received: TypeKeys }
		  >
	>,
	SchemaAsyncOf<U>
> {
	return new Decoder<
		OneOrMoreDecodeResponse<U>,
		ArrayDecodeIssues<
			U,
			| Issue<"array", "issue.invalidArrayElements", undefined>
			| Issue<
					"array",
					"issue.invalidArrayLength",
					{ expected: 1; received: number }
			  >
			| Issue<
					"array",
					"issue.unexpectedType",
					{ expected: "type.array"; received: TypeKeys }
			  >
		>,
		SchemaAsyncOf<U>
	>(
		decodeOneOrMoreFunc(decoder),
		undefined,
		oneOrMoreSchemaDescriptor(decoder),
		isDecoderAsync(decoder),
	);
}

/**
 * Create a decoder that makes a decoder optional.
 *
 * @template T The type of the value.
 * @template {Issues<TypeOf<T>>} I The type of the issues.
 * @param {IDecoder<T, I>} decoder The decoder to make optional.
 * @returns {IDecoder<OptionalDecodeResponse<T>, I>} A decoder that accepts either the original value or undefined.
 */
export function optional<
	T,
	I extends Issues = Issues,
	S extends boolean = false,
>(decoder: IDecoder<T, I, S>): IDecoder<OptionalDecodeResponse<T>, I, S> {
	return new Decoder<OptionalDecodeResponse<T>, I, S>(
		(value) => {
			if (value == null)
				return { ok: true, value: undefined } as Result<
					OptionalDecodeResponse<T>,
					I
				>;

			return decoder.decodeValue(value) as Awaitable<
				Result<OptionalDecodeResponse<T>, I>
			>;
		},
		undefined,
		optionalSchemaDescriptor(decoder),
		isDecoderAsync(decoder),
	);
}

/**
 * Creates a decoder that decodes a record.
 *
 * @template {IDecoder<Awaitable<PropertyKey>>} K The decoder to use for keys.
 * @template {IDecoder<unknown>} V The decoder to use for values.
 * @param {K} key The decoder to use for keys.
 * @param {V} value The decoder to use for values.
 * @returns {IDecoder<RecordDecodeResponse<K, V>, RecordDecodeIssues<K, V, Issue<"record", "issue.invalidRecord", undefined> | Issue<"record", "issue.invalidRecordKey", { key: string }> | Issue<"record", "issue.unexpectedType", { expected: "type.object"; received: TypeKeys }>>>} A decoder that decodes a record.
 */
export function record<
	K extends IDecoder<Awaitable<PropertyKey>>,
	V extends IDecoder<unknown>,
>(
	key: K,
	value: V,
): IDecoder<
	RecordDecodeResponse<K, V>,
	RecordDecodeIssues<
		K,
		V,
		| Issue<"record", "issue.invalidRecord", undefined>
		| Issue<"record", "issue.invalidRecordKey", { key: string }>
		| Issue<
				"record",
				"issue.unexpectedType",
				{ expected: "type.object"; received: TypeKeys }
		  >
	>,
	[SchemaAsyncOf<K>, SchemaAsyncOf<V>] extends [false, false] ? false : true
> {
	return new Decoder<
		RecordDecodeResponse<K, V>,
		RecordDecodeIssues<
			K,
			V,
			| Issue<"record", "issue.invalidRecord", undefined>
			| Issue<"record", "issue.invalidRecordKey", { key: string }>
			| Issue<
					"record",
					"issue.unexpectedType",
					{ expected: "type.object"; received: TypeKeys }
			  >
		>,
		[SchemaAsyncOf<K>, SchemaAsyncOf<V>] extends [false, false] ? false : true
	>(
		decodeRecordFunc(key, value),
		undefined,
		recordSchemaDescriptor(key, value),
		isDecoderAsync(key) || isDecoderAsync(value),
	);
}

/**
 * Replaces the accepted-value schema of a decoder.
 *
 * Intended for plugin authors. Import from `katabami/dev`. Decode behavior is
 * unchanged; `map` / `andThen` / `catch` keep the replaced schema.
 *
 * @template T The type of the decoded value.
 * @template {Issues} I The type of the issues.
 * @param {IDecoder<T, I, boolean>} decoder The decoder whose schema to replace.
 * @param {DecoderSchema} schema The accepted-value schema to use.
 * @returns {IDecoder<T, I, false>} A decoder with the same decode behavior and the given schema.
 */
export function replaceSchema<T, I extends Issues>(
	decoder: IDecoder<T, I, boolean>,
	schema: DecoderSchema,
): IDecoder<T, I, false> {
	if (!(decoder instanceof Decoder)) {
		throw new TypeError("Expected a Katabami Decoder");
	}

	return Decoder.replaceSchema(decoder as Decoder<T, I, boolean>, schema);
}

/**
 * A decoder for strings.
 *
 * @returns {IDecoder<string, Issues<"string", Issue<"string", "issue.unexpectedType", { expected: "type.string"; received: string }>>>} A decoder for strings.
 */
export function string(): IDecoder<
	string,
	Issues<
		"string",
		Issue<
			"string",
			"issue.unexpectedType",
			{ expected: "type.string"; received: string }
		>
	>
> {
	return stringDecoder;
}

/**
 * Create a decoder that always succeeds with the given value.
 *
 * @template T The type of the value.
 * @param {T} value The value to always return.
 * @returns {IDecoder<T>} A decoder that always returns the given value.
 */
export function succeed<T>(value: T): IDecoder<T, never> {
	return new Decoder<T, never>(
		decodeSucceedFunc(value),
		undefined,
		staticSchemaDescriptor(unknownSchema),
	);
}

/**
 * Create a decoder for a tuple.
 *
 * @template T The type of the tuple.
 * @template {Array<IDecoder<unknown>> | TupleDecoders<T>} U The type of the decoders.
 * @param {...U} decoders The decoders for each tuple element.
 * @returns {IDecoder<TupleDecodeResponse<U>, Issues<"tuple", Issue<"tuple:length", "issue.invalidArrayLength", { expected: number; received: number }> | Issue<"tuple:type", "issue.unexpectedType", { expected: "type.array"; received: TypeKeys }>> | TupleDecodeIssues<U>>} A decoder for the tuple.
 */
export function tuple<
	T extends unknown[],
	U extends Array<IDecoder<unknown>> | TupleDecoders<T> = TupleDecoders<T>,
>(
	...decoders: U
): IDecoder<
	TupleDecodeResponse<U>,
	TupleDecodeIssues<
		U,
		| Issue<"tuple:elements", "issue.invalidArrayElements", undefined>
		| Issue<
				"tuple:length",
				"issue.invalidArrayLength",
				{ expected: number; received: number }
		  >
		| Issue<
				"tuple:type",
				"issue.unexpectedType",
				{ expected: "type.array"; received: TypeKeys }
		  >
	>,
	TupleSchemaHasPromise<U> extends true ? true : false
> {
	return new Decoder<
		TupleDecodeResponse<U>,
		TupleDecodeIssues<
			U,
			| Issue<"tuple:elements", "issue.invalidArrayElements", undefined>
			| Issue<
					"tuple:length",
					"issue.invalidArrayLength",
					{ expected: number; received: number }
			  >
			| Issue<
					"tuple:type",
					"issue.unexpectedType",
					{ expected: "type.array"; received: TypeKeys }
			  >
		>,
		TupleSchemaHasPromise<U> extends true ? true : false
	>(
		decodeTupleFunc(decoders),
		undefined,
		tupleSchemaDescriptor(decoders),
		anyDecoderAsync(decoders),
	);
}
/**
 * Create a decoder that accepts any of the given decoders.
 *
 * @template T The type of the value.
 * @template U The type of the decoders.
 * @param {U} decoders The decoders to use.
 * @returns {IDecoder<UnionDecodeResponse<U>>} A decoder that accepts any of the given decoders.
 */
export function union<
	T,
	U extends Array<IDecoder<unknown>> | UnionDecoders<T> = UnionDecoders<T>,
>(
	...decoders: U
): IDecoder<
	UnionDecodeResponse<U>,
	UnionDecodeIssues<U, Issue<"union", "issue.invalidUnion", undefined>>,
	TupleSchemaHasPromise<U> extends true ? true : false
> {
	return new Decoder<
		UnionDecodeResponse<U>,
		UnionDecodeIssues<U, Issue<"union", "issue.invalidUnion", undefined>>,
		TupleSchemaHasPromise<U> extends true ? true : false
	>(
		decodeUnionFunc(decoders),
		undefined,
		unionSchemaDescriptor(decoders),
		anyDecoderAsync(decoders),
	);
}
