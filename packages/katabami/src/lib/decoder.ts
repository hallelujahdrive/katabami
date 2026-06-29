import type {
	ArrayDecodeIssues,
	ArrayDecodeResponse,
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
	ObjectDecodeIssues,
	ObjectDecodeResponse,
	ObjectDecoders,
	Ok,
	OptionalDecodeResponse,
	Primitive,
	RecordSchemaHasPromise,
	Resolved,
	Result,
	SchemaAsyncOf,
	SchemaResult,
	TupleDecodeIssues,
	TupleDecodeResponse,
	TupleDecoders,
	TupleSchemaHasPromise,
	TypeKeys,
	TypeOf,
	UnionDecodeIssues,
	UnionDecodeResponse,
	UnionDecoders,
} from "../types/index.js";
import { isRecord } from "../utils/index.js";
import { DecodeError } from "./error.js";
import { createIssues, getIssueMessage } from "./issue.js";

/**
 * The decode function for a decoder.
 */
type DecodeFunction<T, Is extends Issues = Issues<TypeOf<T>>> = (
	value: unknown,
) => Awaitable<Result<T, Is>>;

type SchemaDecoder = IDecoder<unknown, Issues, boolean>;

type SchemaDescriptor = () => Awaitable<DecoderSchema>;

const unknownSchema = { kind: "unknown" } as const satisfies DecoderSchema;
const neverSchema = { kind: "never" } as const satisfies DecoderSchema;
const stringSchema = { kind: "string" } as const satisfies DecoderSchema;
const booleanSchema = { kind: "boolean" } as const satisfies DecoderSchema;
const integerSchema = { kind: "integer" } as const satisfies DecoderSchema;
const numberSchema = { kind: "number" } as const satisfies DecoderSchema;

const constantSchema = <T extends Primitive>(value: T): DecoderSchema => ({
	kind: "constant",
	value,
});

const arraySchema = (element: DecoderSchema): DecoderSchema => ({
	element,
	kind: "array",
});

const objectSchema = (
	properties: Readonly<Record<string, DecoderSchema>>,
): DecoderSchema => ({
	kind: "object",
	properties,
});

const tupleSchema = (elements: readonly DecoderSchema[]): DecoderSchema => ({
	elements,
	kind: "tuple",
});

const unionSchema = (variants: readonly DecoderSchema[]): DecoderSchema => ({
	kind: "union",
	variants,
});

const optionalSchema = (schema: DecoderSchema): DecoderSchema => ({
	kind: "optional",
	schema,
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

const mapAwaitable = <T, U>(
	value: Awaitable<T>,
	mapper: (value: T) => U,
): Awaitable<U> => {
	if (value instanceof Promise) {
		return value.then(mapper);
	}

	return mapper(value);
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

const staticSchemaDescriptor =
	(schema: DecoderSchema): SchemaDescriptor =>
	() =>
		schema;

const arraySchemaDescriptor =
	(decoder: SchemaDecoder): SchemaDescriptor =>
	() =>
		mapAwaitable(decoder.getSchema(), (schema) => arraySchema(schema));

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

const mapSchemaDescriptor =
	(decoders: readonly SchemaDecoder[]): SchemaDescriptor =>
	() =>
		mapAwaitable(
			allAwaitable(decoders.map((decoder) => decoder.getSchema())),
			(schemas) => mapSchema(schemas),
		);

const optionalSchemaDescriptor =
	(decoder: SchemaDecoder): SchemaDescriptor =>
	() =>
		mapAwaitable(decoder.getSchema(), (schema) => optionalSchema(schema));

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
	) {}

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
			return {
				error: new DecodeError(
					"Failed to decode string",
					createIssues("parseJson", "issue.failedToDecode"),
				),
				ok: false,
			} as unknown as DecodeResult<
				T,
				I | Issues<"parseJson", Issue<"parseJson", never>>
			>;
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

		return mapAwaitable(res, (res) => {
			if (!res.ok) return res;

			return mapAwaitable(res.value, (value) => ({
				ok: true,
				value,
			})) as Result<Resolved<T>, I>;
		}) as DecodeResult<T, I>;
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
			return this.cacheFunc(r.error.issues);
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
 * A decoder that always fails with the given message and issues.
 * @returns {DecodeFunction<never, Issues<"failed", Issue<"failed", "issue.failedToDecode", never>>>} A decoder that always fails with the given message and issues.
 */
const failedDecoder = new Decoder<
	never,
	Issues<"failed", Issue<"failed", "issue.failedToDecode", never>>
>(
	() => {
		return {
			error: new DecodeError(
				"Failed to decode",
				createIssues("failed", "issue.failedToDecode"),
			),
			ok: false,
		};
	},
	undefined,
	staticSchemaDescriptor(neverSchema),
);

/**
 * A decoder for floats.
 */
const floatDecoder = new Decoder<
	number,
	Issues<
		"float",
		Issue<
			"float",
			"issue.unexpectedType",
			{ expected: "type.number"; received: string }
		>
	>
>(
	(value) => {
		if (typeof value === "number") return { ok: true, value };

		return {
			error: new DecodeError(
				"Float expected",
				createIssues("float", "issue.unexpectedType", {
					expected: "type.float",
					received: typeOf(value),
				}),
			),
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
			error: new DecodeError(
				"Expected string",
				createIssues("string", "issue.unexpectedType", {
					expected: "type.string",
					received: typeOf(value),
				}),
			),
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
 * @returns {DecodeFunction<Array<T>, ArrayDecodeIssues<U, Issue<"array", "issue.unexpectedValue", { expected: "type.array"; received: TypeKeys }>>>} A decoder that decodes an array.
 */
const decodeArrayFunc =
	<T, U extends IDecoder<T>>(
		decoder: U,
	): DecodeFunction<
		ArrayDecodeResponse<U>,
		ArrayDecodeIssues<
			U,
			Issue<
				"array",
				"issue.unexpectedValue",
				{ expected: "type.array"; received: TypeKeys }
			>
		>
	> =>
	(value) => {
		if (!Array.isArray(value))
			return {
				error: new DecodeError(
					"Array expected",
					createIssues("array", "issue.unexpectedValue", {
						expected: "type.array",
						received: typeOf(value),
					}) as ArrayDecodeIssues<
						U,
						Issue<
							"array",
							"issue.unexpectedValue",
							{ expected: "type.array"; received: TypeKeys }
						>
					>,
				),
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
 * @returns {Result<ArrayDecodeResponse<U>, ArrayDecodeIssues<U, Issue<"array", "issue.unexpectedValue", { expected: "type.array"; received: TypeKeys }>>>} The result of the array decoder.
 */
const decodeArrayHelper = <T, U extends IDecoder<T>>(
	results: Array<[number, Result<unknown, Issues>]>,
): Result<
	ArrayDecodeResponse<U>,
	ArrayDecodeIssues<
		U,
		Issue<"array", string, { expected: string; received: string }>
	>
> => {
	const issues = results.filter(([_, result]) => !result.ok);

	if (issues.length > 0) {
		return {
			error: new DecodeError(
				"Array expected",
				createIssues(
					"array",
					"issue.unexpectedValue",
					{
						expected: "type.array",
						received: typeOf(value),
					},
					Object.fromEntries(
						issues.map(([i, result]) => [i, result.error?.issues]),
					),
				) as ArrayDecodeIssues<
					U,
					Issue<"array", string, { expected: string; received: string }>
				>,
			),
			ok: false,
		};
	}

	return {
		ok: true,
		value: results.map(([_, result]) => result.value) as ArrayDecodeResponse<U>,
	};
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
			error: new DecodeError(
				"Constant expected",
				createIssues("constant", "issue.unexpectedValue", {
					expected,
					received: value as Primitive,
				}),
			),
			ok: false,
		};
	};

/**
 * Helper function to decode a field.
 * @template T - The type of the value.
 * @template {IDecoder<T>} U - The decoder to use.
 * @param {string} key - The key of the field.
 * @param {IDecoder<T>} decoder - The decoder to use.
 * @returns {DecodeFunction<T, FieldDecodeIssues<U, Issue<"field", "issue.missingField", { key: string }> | Issue<"field", "issue.unexpectedType", { expected: "type.object"; received: TypeKeys }>>>} A decoder that decodes a field.
 */
const decodeFieldFunc = <T, U extends IDecoder<T> = IDecoder<T>>(
	key: string,
	decoder: U,
): DecodeFunction<
	FieldDecodeResponse<U>,
	FieldDecodeIssues<
		U,
		| Issue<"field", "issue.missingField", { key: string }>
		| Issue<
				"field",
				"issue.unexpectedType",
				{ expected: "type.object"; received: TypeKeys }
		  >
	>
> => {
	return (value) => {
		if (!isRecord(value))
			return {
				error: new DecodeError(
					"Field expected",
					createIssues("field", "issue.unexpectedType", {
						expected: "type.object",
						received: typeOf(value),
					}) as FieldDecodeIssues<
						U,
						Issue<
							"field",
							"issue.unexpectedType",
							{ expected: "type.object"; received: TypeKeys }
						>
					>,
				),
				ok: false,
			};

		// if the issue is an unexpected type and the received type is undefined, return a missing field issue
		return decoder
			.catch((issue) => {
				const issueMessage = getIssueMessage(issue);

				if (
					issueMessage?.message === "issue.unexpectedType" &&
					issueMessage.vars?.received === "type.undefined"
				) {
					return {
						error: new DecodeError(
							"Field expected",
							createIssues("field", "issue.missingField", { key }),
						),
						ok: false,
					};
				}

				return {
					error: new DecodeError("Field expected", issue),
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
					>
				>
			>
		>;
	};
};

const decodeIndexFunc = <T, U extends IDecoder<T> = IDecoder<T>>(
	index: number,
	decoder: U,
): DecodeFunction<
	IndexDecodeResponse<U>,
	IndexDecodeIssues<
		U,
		| Issue<"index:outOfBounds", "issue.outOfBounds", { index: number }>
		| Issue<
				"index:type",
				"issue.unexpectedType",
				{ expected: "type.array"; received: TypeKeys }
		  >
	>
> => {
	return (value) => {
		if (!Array.isArray(value))
			return {
				error: new DecodeError(
					"Array expected",
					createIssues("index:type", "issue.unexpectedType", {
						expected: "type.array",
						received: typeOf(value),
					}) as IndexDecodeIssues<
						U,
						| Issue<"index:outOfBounds", "issue.outOfBounds", { index: number }>
						| Issue<
								"index:type",
								"issue.unexpectedType",
								{ expected: "type.array"; received: TypeKeys }
						  >
					>,
				),
				ok: false,
			};

		if (index < 0 || index >= value.length)
			return {
				error: new DecodeError(
					"Index out of bounds",
					createIssues("index:outOfBounds", "issue.outOfBounds", {
						index,
					}) as IndexDecodeIssues<
						U,
						| Issue<"index:outOfBounds", "issue.outOfBounds", { index: number }>
						| Issue<
								"index:type",
								"issue.unexpectedType",
								{ expected: "type.array"; received: TypeKeys }
						  >
					>,
				),
				ok: false,
			};

		return decoder.decodeValue(value[index]) as Awaitable<
			Result<
				IndexDecodeResponse<U>,
				IndexDecodeIssues<
					U,
					| Issue<"index:outOfBounds", "issue.outOfBounds", { index: number }>
					| Issue<
							"index:type",
							"issue.unexpectedType",
							{ expected: "type.array"; received: TypeKeys }
					  >
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
 * @returns {ObjectDecodeResponse<U> | { error: DecodeError<ObjectDecodeIssues<U, Issue<"object", "issue.invalidObject", undefined>>>; ok: false; }} The decoded value or an error.
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
			error: new DecodeError(
				"Object expected",
				createIssues(
					"object",
					"issue.invalidObject",
					undefined,
					Object.fromEntries(
						issues.map(([key, result]) => [key, result.error?.issues]),
					),
				) as ObjectDecodeIssues<
					U,
					Issue<"object", "issue.invalidObject", undefined>
				>,
			),
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
				error: new DecodeError(
					"Object expected",
					createIssues("object", "issue.unexpectedType", {
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
				),
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
			error: new DecodeError(
				"Tuple expected",
				createIssues(
					"tuple:elements",
					"issue.invalidArrayElements",
					undefined,
					Object.fromEntries(
						issues.map(([i, result]) => [i, result.error?.issues]) as Array<
							[number, Issues]
						>,
					),
				) as TupleDecodeIssues<
					U,
					Issue<"tuple:elements", "issue.invalidArrayElements", undefined>
				>,
			),
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
				error: new DecodeError(
					"Tuple expected",
					createIssues("tuple", "issue.unexpectedType", {
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
				),
				ok: false,
			};

		if (decoders.length !== value.length)
			return {
				error: new DecodeError(
					"Tuple expected",
					createIssues("tuple:length", "issue.invalidArrayLength", {
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
				),
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
	accumulator: { issues: Issues[]; ok: false },
	result: Result<unknown, Issues>,
): { issues: Issues[]; ok: false } | { ok: true; value: unknown } => {
	if (result.ok) return result;

	if (
		getIssueMessage(result.error.issues)?.type === "union" &&
		Array.isArray(result.error.issues)
	) {
		accumulator.issues.push(...result.error.issues);
	} else {
		accumulator.issues.push(result.error.issues);
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
		error: new DecodeError(
			"Union expected",
			createIssues(
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
		),
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
			Awaitable<{ issues: Issues[]; ok: false } | { ok: true; value: unknown }>
		>(
			(accumulator, decoder) =>
				flatMapAwaitable(accumulator, (accumulator) => {
					if (accumulator.ok) return accumulator;

					return mapAwaitable(decoder.decodeValue(value), (result) =>
						mergeUnionDecodeResult(accumulator, result),
					);
				}),
			{ issues: [], ok: false },
		);

		return mapAwaitable(results, (results) => {
			if (results.ok)
				return results as Result<
					UnionDecodeResponse<U>,
					UnionDecodeIssues<U, Issue<"union", "issue.invalidUnion", undefined>>
				>;

			return decodeUnionHelper<U>(results.issues);
		});
	};

/**
 * Creates a decoder that decodes an array.
 * @template T - The type of the array elements.
 * @param {IDecoder<T>} decoder - The decoder to use.
 * @returns {IDecoder<Array<T>>} A decoder that decodes an array.
 */
export function array<T, U extends IDecoder<T> = IDecoder<T>>(
	decoder: U,
): IDecoder<
	ArrayDecodeResponse<U>,
	ArrayDecodeIssues<
		U,
		Issue<"array", string, { expected: string; received: string }>
	>,
	SchemaAsyncOf<U>
> {
	return new Decoder<
		ArrayDecodeResponse<U>,
		ArrayDecodeIssues<
			U,
			Issue<"array", string, { expected: string; received: string }>
		>,
		SchemaAsyncOf<U>
	>(decodeArrayFunc(decoder), undefined, arraySchemaDescriptor(decoder));
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
 * @template {boolean | number | string} T The type of the value.
 * @param {T} expected The value to return.
 * @returns {IDecoder<T, Issues<"constant", Issue<"constant", "issue.unexpectedValue", { expected: T; received: Primitive }>>>} A decoder that always returns the given value.
 */
export function constant<T extends boolean | number | string>(
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
 * @returns {IDecoder<T, FieldDecodeIssues<U, Issue<"field", "issue.missingField", { key: string }> | Issue<"field", "issue.unexpectedType", { expected: "type.object"; received: TypeKeys }>>>} A decoder that decodes a field.
 */
export function field<T, U extends IDecoder<T> = IDecoder<T>>(
	key: string,
	decoder: U,
): IDecoder<
	FieldDecodeResponse<U>,
	FieldDecodeIssues<
		U,
		| Issue<"field", "issue.missingField", { key: string }>
		| Issue<
				"field",
				"issue.unexpectedType",
				{ expected: "type.object"; received: TypeKeys }
		  >
	>,
	SchemaAsyncOf<U>
> {
	return new Decoder<
		FieldDecodeResponse<U>,
		FieldDecodeIssues<
			U,
			| Issue<"field", "issue.missingField", { key: string }>
			| Issue<
					"field",
					"issue.unexpectedType",
					{ expected: "type.object"; received: TypeKeys }
			  >
		>,
		SchemaAsyncOf<U>
	>(
		decodeFieldFunc(key, decoder),
		undefined,
		fieldSchemaDescriptor(key, decoder),
	);
}

/**
 * A decoder for floats.
 *
 * @returns {IDecoder<number, Issues<"float", Issue<"float", "issue.unexpectedType", { expected: "type.number"; received: string }>>>} A decoder for floats.
 */
export function float(): IDecoder<
	number,
	Issues<
		"float",
		Issue<
			"float",
			"issue.unexpectedType",
			{ expected: "type.number"; received: string }
		>
	>
> {
	return floatDecoder;
}

/**
 * Creates a decoder that decodes an index.
 * @template T - The type of the value.
 * @template {IDecoder<T>} U - The decoder to use.
 * @param {number} index - The index to decode.
 * @param {IDecoder<T>} decoder - The decoder to use.
 * @returns {IDecoder<T, IndexDecodeIssues<U, Issue<"index:outOfBounds", string, { index: number }> | Issue<"index:type", string, { expected: string; received: string }>>>} A decoder that decodes an index.
 */
export function index<T, U extends IDecoder<T> = IDecoder<T>>(
	index: number,
	decoder: U,
): IDecoder<
	IndexDecodeResponse<U>,
	IndexDecodeIssues<
		U,
		| Issue<"index:outOfBounds", string, { index: number }>
		| Issue<"index:type", string, { expected: string; received: string }>
	>,
	SchemaAsyncOf<U>
> {
	return new Decoder<
		IndexDecodeResponse<U>,
		IndexDecodeIssues<
			U,
			| Issue<"index:outOfBounds", string, { index: number }>
			| Issue<"index:type", string, { expected: string; received: string }>
		>,
		SchemaAsyncOf<U>
	>(
		decodeIndexFunc(index, decoder),
		undefined,
		indexSchemaDescriptor(index, decoder),
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
	);
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
	>(decodeObjectFunc(decoders), undefined, objectSchemaDescriptor(decoders));
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
	);
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
	>(decodeTupleFunc(decoders), undefined, tupleSchemaDescriptor(decoders));
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
	>(decodeUnionFunc(decoders), undefined, unionSchemaDescriptor(decoders));
}

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
			error: new DecodeError(
				"Boolean expected",
				createIssues("boolean", "issue.unexpectedType", {
					expected: "type.boolean",
					received: typeOf(value),
				}),
			),
			ok: false,
		};
	},
	undefined,
	staticSchemaDescriptor(booleanSchema),
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
				error: new DecodeError(
					"Integer expected",
					createIssues("integer", "issue.unexpectedType", {
						expected: "type.number",
						received: typeOf(value),
					}),
				),
				ok: false,
			};
		}

		// If the value is not an integer, return an error.
		if (!Number.isInteger(value)) {
			return {
				error: new DecodeError(
					"Integer expected",
					createIssues("integer", "issue.unexpectedType", {
						expected: "type.integer",
						received: "type.float",
					}),
				),
				ok: false,
			};
		}

		// If the value is an integer, return the value.
		return { ok: true, value };
	},
	undefined,
	staticSchemaDescriptor(integerSchema),
);
