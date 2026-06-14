import type { ParseKeys } from "i18next";
import type {
	ArrayDecodeIssues,
	ArrayDecodeResponse,
	Awaitable,
	CatchFunction,
	DecodeResult,
	Decoder,
	Err,
	FieldDecodeIssues,
	FieldDecodeResponse,
	IndexDecodeIssues,
	IndexDecodeResponse,
	Issue,
	Issues,
	KatabamiConfig,
	MapDecodeFunction,
	MapDecodeFunctionParams,
	MapDecodeIssues,
	MapDecodeResponse,
	MessageResources,
	ObjectDecodeIssues,
	ObjectDecodeResponse,
	ObjectDecoders,
	Ok,
	OptionalDecodeResponse,
	Primitive,
	Resolved,
	Result,
	TupleDecodeIssues,
	TupleDecodeResponse,
	TupleDecoders,
	TypeOf,
	UnionDecodeIssues,
	UnionDecodeResponse,
	UnionDecoders,
} from "../types/index.js";
import { isRecord } from "../utils/index.js";
import { defaultConfig } from "./config.js";
import { DecodeError } from "./error.js";
import { issue } from "./issue.js";

/**
 * The decode function for a decoder.
 */
type DecodeFunction<T, Is extends Issues = Issues<TypeOf<T>>> = (
	value: unknown,
) => Awaitable<Result<T, Is>>;

/**
 * The helper type to make all properties of an object required.
 */
type DeepRequired<T> = {
	[K in keyof T]-?: NonNullable<T[K]> extends Record<string, unknown>
		? DeepRequired<NonNullable<T[K]>>
		: NonNullable<T[K]>;
};

/**
 * The store for the configuration.
 */
class ConfigStore {
	public get messages(): DeepRequired<MessageResources> {
		return this.config.messages;
	}

	private config: DeepRequired<KatabamiConfig>;

	constructor(config?: KatabamiConfig) {
		this.config =
			config != null ? deepMerge(defaultConfig, config) : defaultConfig;
	}
}

/**
 * The instance of the Katabami class.
 */
let _katabami: Katabami | undefined;

/**
 * Gets the instance of the Katabami class.
 * @throws {Error} If the Katabami class is not initialized.
 * @returns {Katabami} The instance of the Katabami class.
 */
const getKatabami = (): Katabami => {
	if (_katabami == null) {
		_katabami = Katabami.init();
	}

	return _katabami;
};

/**
 * Merges two objects deeply.
 * @template T The type of the target object.
 * @template S The type of the source object.
 * @param {Base} base The first object.
 * @param {Additional} additional The second object.
 * @returns {Base & Additional} The merged object.
 */
const deepMerge = <
	Base extends Record<string, unknown>,
	Additional extends Record<string, unknown>,
>(
	base: Base,
	additional: Additional,
): Base => {
	return Object.keys(base).reduce<Record<string, unknown>>((acc, key) => {
		if (isRecord(base[key]) && isRecord(additional[key])) {
			acc[key] = deepMerge(base[key], additional[key]);
		} else {
			acc[key] = additional[key] ?? base[key];
		}

		return acc;
	}, {}) as Base;
};

class Katabami {
	public readonly configStore: ConfigStore;

	/**
	 * @constructor
	 * @param {KatabamiConfig} config - The configuration for Katabami.
	 */
	private constructor(config?: KatabamiConfig) {
		this.configStore = new ConfigStore(config);
	}

	/**
	 * Initializes the Katabami class.
	 * @returns {Katabami} The instance of the Katabami class.
	 */
	public static init(): Katabami {
		_katabami = new Katabami();

		return _katabami;
	}
}

/**
 * Creates a decoder that always succeeds with the given value.
 * @template T The type of the value.
 * @returns {Decoder<T, never>} A decoder that always returns the given value.
 */
export function value<T = unknown>(): Decoder<T, never> {
	return valueDecoder as unknown as Decoder<T, never>;
}

/**
 * Implementation of the Decoder interface.
 */
class _Decoder<T, I extends Issues = Issues<TypeOf<T>>>
	implements Decoder<T, I>
{
	/**
	 * The instance of the Katabami class.
	 * @type {Katabami}
	 */
	private readonly katabami: Katabami;

	/**
	 * @constructor
	 * @param {Katabami | undefined} katabami - The instance of the Katabami class.
	 * @param {DecodeFunction<T, I>} decodeFunc - The decode function.
	 */
	constructor(katabami: Katabami | undefined, decodeFunc: DecodeFunction<T, I>);

	/**
	 * @constructor
	 * @param {Katabami | undefined} katabami - The instance of the Katabami class.
	 * @param {DecodeFunction<T, Issues>} decodeFunc - The decode function.
	 * @param {CatchFunction<T, Issues, I>} cacheFunc - The cache function.
	 */
	constructor(
		katabami: Katabami | undefined,
		decodeFunc: DecodeFunction<T, Issues>,
		cacheFunc?: CatchFunction<T, Issues, I>,
	);

	/**
	 * @constructor
	 * @param {Katabami | undefined} katabami - The instance of the Katabami class.
	 * @param {DecodeFunction<T, Issues>} decodeFunc - The decode function.
	 * @param {CatchFunction<T, Issues, I>} cacheFunc - The cache function.
	 */
	constructor(
		katabami: Katabami | undefined,
		private readonly decodeFunc: DecodeFunction<T, Issues>,
		private readonly cacheFunc?: CatchFunction<T, Issues, I>,
	) {
		this.katabami = katabami ?? getKatabami();
	}

	/**
	 * Applies another decoder to the decoded value.
	 * @template U
	 * @template {Issues<TypeOf<U>>} J
	 * @param {(value: Resolved<T>) => Awaitable<Decoder<Resolved<U>, J>>} nextFunc
	 * @returns {Decoder<U, I | J>}
	 */
	public andThen<U, J extends Issues = Issues<TypeOf<U>>>(
		nextFunc: (value: Resolved<T>) => Awaitable<Decoder<U, J>>,
	): Decoder<U, I | J> {
		return new _Decoder<U, I | J>(
			this.katabami,
			andThenFunc.call(
				this,
				nextFunc as unknown as (
					value: unknown,
				) => Awaitable<Decoder<unknown, Issues>>,
			) as DecodeFunction<U, I | J>,
		);
	}

	/**
	 * Catches and transforms issues during decoding.
	 * @template K
	 * @param {CatchFunction<T, I, K>} catchFunc
	 * @returns {Decoder<T, K>}
	 */
	public catch<K extends Issues>(
		catchFunc: CatchFunction<T, I, K>,
	): Decoder<T, K> {
		return new _Decoder(
			this.katabami,
			this.decodeFunc,
			catchFunc as CatchFunction<T, Issues, K>,
		) as unknown as Decoder<T, K>;
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
					issue("parseJson", "issue.failedToDecode"),
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

		if (res instanceof Promise) {
			return res.then((res) => {
				if (!res.ok) return res;
				if (res.value instanceof Promise) {
					return res.value.then((value) => ({ ok: true, value }));
				}
				return res as Result<Resolved<T>, I>;
			}) as DecodeResult<T, I>;
		}

		if (res.value instanceof Promise) {
			return res.value.then((value) => {
				return { ok: true, value };
			}) as DecodeResult<T, I>;
		}

		return res as DecodeResult<T, I>;
	}

	/**
	 * @template U
	 * @param {MapFunction<T, U>} _mapFunc
	 * @returns {Decoder<U, I>}
	 */
	public map<U>(_mapFunc: (value: Resolved<T>) => U): Decoder<U, I> {
		return new _Decoder<U, I>(
			this.katabami,
			mapFunc.call(
				this,
				_mapFunc as (value: unknown) => unknown,
			) as DecodeFunction<U, I>,
		);
	}

	/**
	 * Internal decode function.
	 * @param {unknown} value The value to decode.
	 * @returns {Awaitable<Result<T, I>>} The decoded value or an error with issues.
	 * @private
	 */
	private _decode(value: unknown): Awaitable<Result<T, I>> {
		const result = this.decodeFunc.call(this.katabami, value);

		if (result instanceof Promise) {
			return result.then((r) => {
				if (r.ok || !this.cacheFunc) return r as Result<T, I>;
				return this.cacheFunc(r.error.issues);
			});
		}

		if (result.ok || !this.cacheFunc) return result as Result<T, I>;
		return this.cacheFunc(result.error.issues);
	}
}

/**
 * Applies another decoder to the decoded value.
 * @template T
 * @template U
 * @template {Issues<TypeOf<T>>} I
 * @template {Issues<TypeOf<U>>} J
 * @param {(value: Resolved<T>) => Awaitable<Decoder<U, J>>} nextFunc
 * @returns {Decoder<U, I | J>}
 */
function andThenFunc<
	T,
	U,
	I extends Issues = Issues<TypeOf<T>>,
	J extends Issues = Issues<TypeOf<U>>,
>(
	this: _Decoder<T, I>,
	nextFunc: (value: Resolved<T>) => Awaitable<Decoder<U, J>>,
): (value: unknown) => Awaitable<Result<U, I | J>> {
	return (value) => {
		const res = this.decodeValue(value);

		if (res instanceof Promise) {
			return res.then((res) => {
				if (!res.ok) return res as Result<U, I | J>;

				return andThenHelper.call(this, nextFunc(res.value), res) as Awaitable<
					Result<U, I | J>
				>;
			});
		}

		if (!res.ok) return res as Result<U, I | J>;

		return andThenHelper.call(
			this,
			nextFunc(res.value as Resolved<T>),
			res as Ok<Resolved<T>>,
		) as Awaitable<Result<U, I | J>>;
	};
}

/**
 * Applies another decoder to the decoded value.
 * @template T
 * @template U
 * @template {Issues<TypeOf<T>>} I
 * @template {Issues<TypeOf<U>>} J
 * @param {Awaitable<Decoder<U, J>>} nextDecoder
 * @param {Result<T, I> & { ok: true }} res
 * @returns {Awaitable<Result<U, I | J>>}
 */
function andThenHelper<
	T,
	U,
	I extends Issues = Issues<TypeOf<T>>,
	J extends Issues = Issues<TypeOf<U>>,
>(
	this: _Decoder<T, I>,
	nextDecoder: Awaitable<Decoder<U, J>>,
	res: Ok<Resolved<T>>,
): Awaitable<Result<U, I | J>> {
	if (nextDecoder instanceof Promise) {
		return nextDecoder.then((nextDecoder) => {
			return nextDecoder.decodeValue(res.value) as Result<U, I | J>;
		});
	}
	return nextDecoder.decodeValue(res.value) as Result<U, I | J>;
}

function mapFunc<T, U, I extends Issues = Issues<TypeOf<T>>>(
	this: _Decoder<T, I>,
	_mapFunc: (value: Resolved<T>) => Awaitable<U>,
): (value: unknown) => Awaitable<Result<U, I>> {
	return (value: unknown) => {
		const res = this.decodeValue(value);
		if (res instanceof Promise) {
			return res.then(async (res) => {
				if (!res.ok) return res;

				const resolved = await res.value;
				return { ok: true, value: await _mapFunc(resolved) };
			});
		}

		if (!res.ok) return res;

		if (res.value instanceof Promise) {
			return res.value.then(async (value) => {
				return { ok: true, value: await _mapFunc(value) };
			});
		}

		const _value = _mapFunc(res.value as Resolved<T>);

		if (_value instanceof Promise) {
			return _value.then(async (value) => {
				return { ok: true, value };
			});
		}

		return { ok: true, value: _value };
	};
}

/**
 * Determines the type of a given value.
 *
 * @param {unknown} value - The value to check the type of.
 * @returns {string} - A string representing the type of the value.
 */
const typeOf = (value: unknown): ParseKeys => {
	if (value === null) return "type.null";

	if (typeof value === "object") {
		return Array.isArray(value) ? "type.array" : "type.object";
	}

	return `type.${typeof value}`;
};

/**
 * Quotes a value if it is a string.
 * @param {boolean | number | string} value - The value to quote.
 * @returns {boolean | number | string} - The quoted value.
 */
const quoteValue = (
	value: boolean | number | string,
): boolean | number | string => {
	// If the value is a string, quote it.
	if (typeof value === "string") {
		return `"${value}"`;
	}

	// Otherwise, return the original value.
	return value;
};

/**
 * A decoder for floats.
 */
const floatDecoder = new _Decoder<
	number,
	Issues<
		"float",
		Issue<"float", string, { expected: string; received: string }>
	>
>(undefined, function (this: Katabami, value) {
	if (typeof value === "number") return { ok: true, value };

	return {
		error: new DecodeError(
			"Float expected",
			issue("float", this.configStore.messages.issue.unexpectedValue, {
				expected: this.configStore.messages.type.float,
				received: typeOf(value),
			}),
		),
		ok: false,
	};
});

/**
 * A decoder for strings.
 */
const stringDecoder = new _Decoder<
	string,
	Issues<
		"string",
		Issue<"string", string, { expected: string; received: string }>
	>
>(undefined, function (this: Katabami, value) {
	if (typeof value === "string") return { ok: true, value };

	return {
		error: new DecodeError(
			"Expected string",
			issue("string", this.configStore.messages.issue.unexpectedValue, {
				expected: this.configStore.messages.type.string,
				received: typeOf(value),
			}),
		),
		ok: false,
	};
});

/**
 * Creates a decoder that always succeeds with the given value.
 * @param {unknown} value - The value to return.
 * @returns {DecodeFunction<unknown>} A decoder that always returns the given value.
 */
const valueDecoder = new _Decoder<unknown, never>(
	undefined,
	function (this: Katabami, value) {
		return { ok: true, value };
	},
);

/**
 * Creates a decoder that decodes an array.
 * @template T - The type of the array elements.
 * @template {Decoder<T>} U - The decoder to use.
 * @param {U} decoder - The decoder to use.
 * @returns {DecodeFunction<Array<T>, ArrayDecodeIssues<U, Issue<"array", string, { expected: string; received: string }>>>} A decoder that decodes an array.
 */
const decodeArrayFunc = <T, U extends Decoder<T>>(
	decoder: U,
): DecodeFunction<
	ArrayDecodeResponse<U>,
	ArrayDecodeIssues<
		U,
		Issue<"array", string, { expected: string; received: string }>
	>
> =>
	function (this: Katabami, value) {
		if (!Array.isArray(value))
			return {
				error: new DecodeError(
					"Array expected",
					issue("array", this.configStore.messages.issue.unexpectedValue, {
						expected: this.configStore.messages.type.array,
						received: typeOf(value),
					}),
				),
				ok: false,
			};

		const results = value.map<[number, Awaitable<Result<unknown, Issues>>]>(
			(value, i) => [i, decoder.decodeValue(value)],
		);

		if (results.some(([_, result]) => result instanceof Promise)) {
			return Promise.all(
				results.map(async ([i, result]) => [i, await result]),
			).then((results) =>
				decodeArrayHelper(
					this,
					results as Array<[number, Result<unknown, Issues>]>,
				),
			);
		}

		return decodeArrayHelper(
			this,
			results as Array<[number, Result<unknown, Issues>]>,
		);
	};

/**
 * Creates a decoder that decodes an array.
 * @template T - The type of the array elements.
 * @template {Decoder<T>} U - The decoder to use.
 * @param {Katabami} katabami - The katabami instance.
 * @param {Array<[number, Result<unknown, Issues>]>} results - The results of the decoders.
 * @returns {Result<ArrayDecodeResponse<U>, ArrayDecodeIssues<U, Issue<"array", string, { expected: string; received: string }>>>} The result of the array decoder.
 */
const decodeArrayHelper = <T, U extends Decoder<T>>(
	katabami: Katabami,
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
				issue(
					"array",
					katabami.configStore.messages.issue.unexpectedValue,
					{
						expected: katabami.configStore.messages.type.array,
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
const decodeConstantFunc = <T extends Primitive>(
	expected: T,
): DecodeFunction<
	T,
	Issues<
		"constant",
		Issue<"constant", string, { expected: T; received: Primitive }>
	>
> =>
	function (this: Katabami, value) {
		if (value === expected) return { ok: true, value: value as T };

		return {
			error: new DecodeError(
				"Constant expected",
				issue("constant", this.configStore.messages.issue.unexpectedValue, {
					expected,
					received: quoteValue(value as Primitive),
				}),
			),
			ok: false,
		};
	};

/**
 * Creates a decoder that always fails with the given message and issues.
 * @param {string} message - The message to display when the decoder fails.
 * @param {T} issues - The issues to display when the decoder fails.
 * @returns {DecodeFunction<never, Issue | T>} A decoder that always fails with the given message and issues.
 */
const decodeFailedFunc = <
	T extends Issues = Issues<"failed", Issue<"failed", string, never>>,
>(
	message?: string,
	issues?: T,
): DecodeFunction<never, T> => {
	return function (this: Katabami) {
		return {
			error: new DecodeError(
				message ?? "Failed to decode",
				issue(
					"failed",
					this.configStore.messages.issue.failedToDecode,
					undefined,
					issues as T,
				) as T,
			),
			ok: false,
		};
	};
};

/**
 * Helper function to decode a field.
 * @template T - The type of the value.
 * @template {Decoder<T>} U - The decoder to use.
 * @param {string} key - The key of the field.
 * @param {Decoder<T>} decoder - The decoder to use.
 * @returns {DecodeFunction<T, FieldDecodeIssues<U, Issue<"field", string, { key: string }>>>} A decoder that decodes a field.
 */
const decodeFieldFunc = <T, U extends Decoder<T> = Decoder<T>>(
	key: string,
	decoder: U,
): DecodeFunction<
	FieldDecodeResponse<U>,
	FieldDecodeIssues<U, Issue<"field", string, { key: string }>>
> => {
	return function (this: Katabami, value) {
		if (!isRecord(value) || !(key in value))
			return {
				error: new DecodeError(
					"Field expected",
					issue("field", this.configStore.messages.issue.unexpectedValue, {
						expected: key,
					}) as FieldDecodeIssues<U, Issue<"field", string, { key: string }>>,
				),
				ok: false,
			};

		return decoder.decodeValue(value[key]) as Awaitable<
			Result<
				FieldDecodeResponse<U>,
				FieldDecodeIssues<U, Issue<"field", string, { key: string }>>
			>
		>;
	};
};

const decodeIndexFunc = <T, U extends Decoder<T> = Decoder<T>>(
	index: number,
	decoder: U,
): DecodeFunction<
	IndexDecodeResponse<U>,
	IndexDecodeIssues<
		U,
		| Issue<"index:outOfBounds", string, { index: number }>
		| Issue<"index:type", string, { expected: string; received: string }>
	>
> => {
	return function (this: Katabami, value) {
		if (!Array.isArray(value))
			return {
				error: new DecodeError(
					"Array expected",
					issue("index:type", this.configStore.messages.issue.unexpectedValue, {
						expected: "array",
						received: typeOf(value),
					}),
				),
				ok: false,
			};

		if (index < 0 || index >= value.length)
			return {
				error: new DecodeError(
					"Index out of bounds",
					issue(
						"index:outOfBounds",
						this.configStore.messages.issue.unexpectedValue,
						{ index },
					),
				),
				ok: false,
			};

		return decoder.decodeValue(value[index]) as Awaitable<
			Result<
				IndexDecodeResponse<U>,
				IndexDecodeIssues<
					U,
					| Issue<"index:outOfBounds", string, { index: number }>
					| Issue<"index:type", string, { expected: string; received: string }>
				>
			>
		>;
	};
};

/**
 * Helper function to decode a lazy decoder.
 * @template T - The type of the value.
 * @template {Issues} I The type of the issues.
 * @param {() => Awaitable<Decoder<T, I>>} lazyFunc - The lazy function to decode the value.
 * @returns {Awaitable<Result<T, I>>} The decoded value or an error with issues.
 */
const decodeLazyFunc = <T, I extends Issues = Issues>(
	lazyFunc: () => Awaitable<Decoder<T, I>>,
): DecodeFunction<T, I> => {
	return function (this: Katabami, value) {
		const decoder = lazyFunc();
		if (decoder instanceof Promise) {
			return decoder.then((decoder) => {
				if (decoder instanceof Promise) {
					return decoder.then((decoder) => decoder.decodeValue(value));
				}
				return decoder.decodeValue(value);
			});
		}
		return decoder.decodeValue(value) as Awaitable<Result<T, I>>;
	};
};

/**
 * Helper function to decode a map.
 * @template T - The type of the map value.
 * @template {Decoder<unknown>} U - The type of the decoders.
 * @param {MapDecodeFunction<T, U>} mapFunc - The function to map the decoded value.
 * @param {...Decoder<unknown>} decoders - The decoders to decode the value.
 * @returns {DecodeFunction<MapDecodeResponse<MapDecodeFunction<T, U>>, MapDecodeIssues<U>>} A decoder that decodes a map.
 */
const decodeMapFunc = <
	T,
	U extends Array<Decoder<unknown>> = Array<Decoder<unknown>>,
>(
	mapFunc: MapDecodeFunction<T, U>,
	...decoders: U
): DecodeFunction<
	MapDecodeResponse<MapDecodeFunction<T, U>>,
	MapDecodeIssues<U>
> =>
	function (this: Katabami, value) {
		const results = decoders.map((decoder) => decoder.decodeValue(value));

		if (results.some((result) => result instanceof Promise)) {
			return Promise.all(results).then(
				(
					resolvedResults: Array<Result<unknown, Issues>>,
				): Result<
					MapDecodeResponse<MapDecodeFunction<T, U>>,
					MapDecodeIssues<U>
				> => {
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
				},
			);
		}

		for (const result of results as Array<Result<unknown, Issues>>) {
			if (!result.ok) return result as Err<MapDecodeIssues<U>>;
		}

		const entries = (results as Array<Ok<unknown>>).map(({ value }) => value);

		return {
			ok: true,
			value: mapFunc(...(entries as MapDecodeFunctionParams<U>)),
		} as Result<MapDecodeResponse<MapDecodeFunction<T, U>>, MapDecodeIssues<U>>;
	};

/**
 * Helper function to decode an object.
 * @template T - The type of the object.
 * @template {ObjectDecoders<T>} U - The type of the decoders.
 * @param {Katabami} katabami - The katabami instance.
 * @param {T} value - The value to decode.
 * @param {Array<[string, Result<unknown, Issues>]>} results - The results of the decoders.
 * @returns {ObjectDecodeResponse<U> | { error: DecodeError<ObjectDecodeIssues<U, Issue<"object", string, { expected: string; received: string }>>>; ok: false; }} The decoded value or an error.
 */
const decodeObjectHelper = <
	T extends Record<string, unknown>,
	U extends ObjectDecoders<T>,
>(
	katabami: Katabami,
	value: T,
	results: Array<[string, Result<unknown, Issues>]>,
): Result<
	ObjectDecodeResponse<U>,
	ObjectDecodeIssues<
		U,
		Issue<"object", string, { expected: string; received: string }>
	>
> => {
	const issues = results.filter(([_, result]) => !result.ok);

	if (issues.length > 0) {
		return {
			error: new DecodeError(
				"Object expected",
				issue(
					"object",
					katabami.configStore.messages.issue.unexpectedValue,
					{
						expected: katabami.configStore.messages.type.object,
						received: typeOf(value),
					},
					Object.fromEntries(
						issues.map(([key, result]) => [key, result.error?.issues]),
					),
				) as ObjectDecodeIssues<
					U,
					Issue<"object", string, { expected: string; received: string }>
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
 * @returns {DecodeFunction<ObjectDecodeResponse<U>, Issue<"object", string, { expected: string; received: string }> | ObjectDecodeIssues<U>>} A decoder that decodes an object.
 */
const decodeObjectFunc = <
	T extends Record<string, unknown>,
	U extends ObjectDecoders<T>,
>(
	decoders: U,
): DecodeFunction<
	ObjectDecodeResponse<U>,
	ObjectDecodeIssues<
		U,
		Issue<"object", string, { expected: string; received: string }>
	>
> =>
	function (this: Katabami, value) {
		if (!isRecord(value))
			return {
				error: new DecodeError(
					"Object expected",
					issue("object", this.configStore.messages.issue.unexpectedValue, {
						expected: this.configStore.messages.type.object,
						received: typeOf(value),
					}) as ObjectDecodeIssues<
						U,
						Issue<"object", string, { expected: string; received: string }>
					>,
				),
				ok: false,
			};

		const results = Object.entries(decoders).map<
			[string, Awaitable<Result<unknown, Issues>>]
		>(([key, decoder]: [string, Decoder<U[keyof U]>]) => {
			return [key, decoder.decodeValue(value[key])];
		});

		if (results.some(([_, result]) => result instanceof Promise)) {
			return Promise.all(
				results.map(async ([i, result]) => [i, await result]),
			).then((results) =>
				decodeObjectHelper(
					this,
					value,
					results as Array<[string, Result<unknown, Issues>]>,
				),
			);
		}

		return decodeObjectHelper(
			this,
			value,
			results as Array<[string, Result<unknown, Issues>]>,
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
 * @param {Katabami} katabami - The katabami instance.
 * @param {Array<[number, Result<unknown, Issues>]>} results - The results of the decoders.
 * @returns {Result<TupleDecodeResponse<U>, TupleDecodeIssues<U, Issue<"tuple", string>>>} The decoded value or an error.
 */
const decodeTupleHelper = <
	T extends unknown[],
	U extends Array<Decoder<unknown>> | TupleDecoders<T>,
>(
	katabami: Katabami,
	results: Array<[number, Result<unknown, Issues>]>,
): Result<
	TupleDecodeResponse<U>,
	TupleDecodeIssues<U, Issue<"tuple", string>>
> => {
	const issues = results.filter(([_, result]) => !result.ok);

	if (issues.length > 0) {
		return {
			error: new DecodeError(
				"Tuple expected",
				issue(
					"tuple",
					katabami.configStore.messages.issue.unexpectedValue,
					undefined,
					Object.fromEntries(
						issues.map(([i, result]) => [i, result.error?.issues]),
					),
				) as TupleDecodeIssues<U, Issue<"tuple", string>>,
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
 * @returns {DecodeFunction<TupleDecodeResponse<U>, Issues<"tuple", Issue<"tuple:length", string, { expected: string; received: string }> | Issue<"tuple:type", string, { expected: string; received: string }>> | TupleDecodeIssues<U, Issue<"tuple", string>>>} A decoder that decodes a tuple.
 */
const decodeTupleFunc = <
	T extends unknown[],
	U extends Array<Decoder<unknown>> | TupleDecoders<T>,
>(
	decoders: U,
): DecodeFunction<
	TupleDecodeResponse<U>,
	| Issues<
			"tuple",
			Issue<"tuple:length", string, { expected: string; received: string }>
	  >
	| Issues<
			"tuple",
			Issue<"tuple:type", string, { expected: string; received: string }>
	  >
	| TupleDecodeIssues<U, Issue<"tuple", string>>
> =>
	function (this: Katabami, value) {
		if (!Array.isArray(value))
			return {
				error: new DecodeError(
					"Tuple expected",
					issue("tuple", this.configStore.messages.issue.unexpectedValue, {
						expected: this.configStore.messages.type.array,
						received: typeOf(value),
					}) as TupleDecodeIssues<
						U,
						Issue<"tuple:type", string, { expected: string; received: string }>
					>,
				),
				ok: false,
			};

		if (decoders.length !== value.length)
			return {
				error: new DecodeError(
					"Tuple expected",
					issue(
						"tuple:length",
						this.configStore.messages.issue.unexpectedValue,
						{
							expected: this.configStore.messages.type.array,
							received: typeOf(value),
						},
					) as TupleDecodeIssues<
						U,
						Issue<
							"tuple:length",
							string,
							{ expected: string; received: string }
						>
					>,
				),
				ok: false,
			};

		const results = decoders.map<[number, Awaitable<Result<unknown, Issues>>]>(
			(decoder: Decoder<unknown>, i: number) => [
				i,
				decoder.decodeValue(value[i]),
			],
		);

		if (results.some(([_, result]) => result instanceof Promise)) {
			return Promise.all(
				results.map(async ([i, result]) => [i, await result]),
			).then((results) => {
				return decodeTupleHelper(
					this,
					results as Array<[number, Result<unknown, Issues>]>,
				);
			});
		}

		return decodeTupleHelper(
			this,
			results as Array<[number, Result<unknown, Issues>]>,
		);
	};

/**
 * Creates a decoder that decodes a union.
 * @template T - The type of the union.
 * @template U - The type of the decoders.
 * @param {U} decoders - The decoders for the union.
 * @returns {DecodeFunction<UnionDecodeResponse<U>, UnionDecodeIssues<U>>} A decoder that decodes a union.
 * @returns
 */
const decodeUnionFunc = <
	T,
	U extends Array<Decoder<unknown>> | UnionDecoders<T>,
>(
	decoders: U,
): DecodeFunction<UnionDecodeResponse<U>, UnionDecodeIssues<U>> =>
	function (this: Katabami, value) {
		const results = (decoders as Array<Decoder<unknown>>).reduce<
			Awaitable<{ issues: Issues[]; ok: false } | { ok: true; value: unknown }>
		>(
			(accumulator, decoder) => {
				if (accumulator instanceof Promise) {
					return accumulator.then((accumulator) => {
						if (accumulator.ok) return accumulator;

						const result = decoder.decodeValue(value);

						if (result instanceof Promise) {
							return result.then((result) => {
								if (result.ok) return result;

								accumulator.issues.push(result.error.issues);

								return accumulator;
							});
						}

						if (result.ok) return result;

						accumulator.issues.push(result.error.issues);
						return accumulator;
					});
				}

				if (accumulator.ok) return accumulator;

				const result = decoder.decodeValue(value);

				if (result instanceof Promise) {
					return result.then((result) => {
						if (result.ok) return result;

						accumulator.issues.push(result.error.issues);
						return accumulator;
					});
				}

				if (result.ok) return result;

				accumulator.issues.push(result.error.issues);
				return accumulator;
			},
			{ issues: [], ok: false },
		);

		if (results instanceof Promise) {
			return results.then((results) => {
				if (results.ok)
					return results as Result<
						UnionDecodeResponse<U>,
						UnionDecodeIssues<U>
					>;

				return {
					error: new DecodeError(
						"Union expected",
						results.issues as UnionDecodeIssues<U>,
					),
					ok: false,
				};
			});
		}

		if (results.ok)
			return results as Result<UnionDecodeResponse<U>, UnionDecodeIssues<U>>;

		return {
			error: new DecodeError(
				"Union expected",
				results.issues as UnionDecodeIssues<U>,
			),
			ok: false,
		};
	};

/**
 * Creates a decoder that decodes an array.
 * @template T - The type of the array elements.
 * @param {Decoder<T>} decoder - The decoder to use.
 * @returns {Decoder<Array<T>>} A decoder that decodes an array.
 */
export function array<T, U extends Decoder<T> = Decoder<T>>(
	decoder: U,
): Decoder<
	ArrayDecodeResponse<U>,
	ArrayDecodeIssues<
		U,
		Issue<"array", string, { expected: string; received: string }>
	>
> {
	return new _Decoder<
		ArrayDecodeResponse<U>,
		ArrayDecodeIssues<
			U,
			Issue<"array", string, { expected: string; received: string }>
		>
	>(undefined, decodeArrayFunc(decoder));
}

/**
 * A decoder for booleans.
 * @returns {Decoder<boolean, Issues<"boolean", Issue<"boolean", string, { expected: "type.boolean"; received: string }>>>}
 */
export function boolean(): Decoder<
	boolean,
	Issues<
		"boolean",
		Issue<"boolean", string, { expected: string; received: string }>
	>
> {
	return booleanDecoder;
}

/**
 * A decoder that always returns the same value.
 *
 * @template {boolean | number | string} T The type of the value.
 * @param {T} expected The value to return.
 * @returns {Decoder<T, Issues<"constant", Issue<"constant", string, { expected: T; received: Primitive }>>>} A decoder that always returns the given value.
 */
export function constant<T extends boolean | number | string>(
	expected: T,
): Decoder<
	T,
	Issues<
		"constant",
		Issue<"constant", string, { expected: T; received: Primitive }>
	>
> {
	return new _Decoder(undefined, decodeConstantFunc(expected));
}
/**
 * Create a decoder that always fails with the given message and issues.
 *
 * @param {string} message The failure message.
 * @returns {Decoder<never, Issue>} A decoder that always fails with the given message and issues.
 */
export function failed(
	message?: string,
): Decoder<
	never,
	Issues<"failed", Issue<"failed", string, { message: string }>>
>;
/**
 * Create a decoder that always fails with the given message and issues.
 *
 * @template {Issues} T The type of the issues.
 * @param {string} message The failure message.
 * @param {T} [issues] Optional issues related to the failure.
 * @returns {Decoder<never, T>} A decoder that always fails with the given message and issues.
 */
export function failed<T extends Issues>(
	message?: string,
	issues?: T,
): Decoder<never, T>;
/**
 * Create a decoder that always fails with the given message and issues.
 *
 * @template {Issues} T The type of the issues.
 * @param {string} message The failure message.
 * @param {T} [issues] Optional issues related to the failure.
 * @returns {Decoder<never, T>} A decoder that always fails with the given message and issues.
 */
export function failed<T extends Issues>(
	message?: string,
	issues?: T,
): Decoder<never, T> {
	return new _Decoder<never, T>(undefined, decodeFailedFunc(message, issues));
}

/**
 * Create a decoder that decodes a field.
 * @template T - The type of the value.
 * @template {Decoder<T>} U - The decoder to use.
 * @param {string} key - The name of the field.
 * @param {Decoder<T>} decoder - The decoder to use.
 * @returns {Decoder<T, FieldDecodeIssues<U, Issue<"field", string, { key: string }>>>} A decoder that decodes a field.
 */
export function field<T, U extends Decoder<T> = Decoder<T>>(
	key: string,
	decoder: U,
): Decoder<
	FieldDecodeResponse<U>,
	FieldDecodeIssues<U, Issue<"field", string, { key: string }>>
> {
	return new _Decoder<
		FieldDecodeResponse<U>,
		FieldDecodeIssues<U, Issue<"field", string, { key: string }>>
	>(undefined, decodeFieldFunc(key, decoder));
}

/**
 * A decoder for floats.
 *
 * @returns {Decoder<number, Issues<"float", Issue<"float", string, { expected: string; received: string }>>>} A decoder for floats.
 */
export function float(): Decoder<
	number,
	Issues<
		"float",
		Issue<"float", string, { expected: string; received: string }>
	>
> {
	return floatDecoder;
}

/**
 * Creates a decoder that decodes an index.
 * @template T - The type of the value.
 * @template {Decoder<T>} U - The decoder to use.
 * @param {number} index - The index to decode.
 * @param {Decoder<T>} decoder - The decoder to use.
 * @returns {Decoder<T, IndexDecodeIssues<U, Issue<"index:outOfBounds", string, { index: number }> | Issue<"index:type", string, { expected: string; received: string }>>>} A decoder that decodes an index.
 */
export function index<T, U extends Decoder<T> = Decoder<T>>(
	index: number,
	decoder: U,
): Decoder<
	T,
	IndexDecodeIssues<
		U,
		| Issue<"index:outOfBounds", string, { index: number }>
		| Issue<"index:type", string, { expected: string; received: string }>
	>
> {
	return new _Decoder<
		T,
		IndexDecodeIssues<
			U,
			| Issue<"index:outOfBounds", string, { index: number }>
			| Issue<"index:type", string, { expected: string; received: string }>
		>
	>(undefined, decodeIndexFunc(index, decoder));
}

/**
 * A decoder for integers.
 *
 * @returns {Decoder<number, Issues<"integer", Issue<"integer", string, { expected: string; received: string }>>>} A decoder for integers.
 */
export function int(): Decoder<
	number,
	Issues<
		"integer",
		Issue<"integer", string, { expected: string; received: string }>
	>
> {
	return integerDecoder;
}

/**
 * Create a decoder that lazily decodes the value.
 * @template T - The type of the value.
 * @template {Issues} I The type of the issues.
 * @param {() => Decoder<T, I>} lazyFunc The function to lazily decode the value.
 * @returns {Decoder<T, I>} A decoder that lazily decodes the value.
 */
export function lazy<T, I extends Issues = Issues>(
	lazyFunc: () => Decoder<T, I>,
): Decoder<T, I>;
/**
 * Create a decoder that lazily decodes the value.
 * @template T - The type of the value.
 * @template {Issues} I The type of the issues.
 * @param {() => Promise<Decoder<T, I>>} lazyFunc The function to lazily decode the value.
 * @returns {Decoder<Promise<T>, I>} A decoder that lazily decodes the value.
 */
export function lazy<T, I extends Issues = Issues>(
	lazyFunc: () => Promise<Decoder<T, I>>,
): Decoder<Promise<T>, I>;
/**
 * Create a decoder that lazily decodes the value.
 * @template T - The type of the value.
 * @template {Issues} I The type of the issues.
 * @param {() => Awaitable<Decoder<T, I>>} lazyFunc The function to lazily decode the value.
 * @returns {Decoder<T, I>} A decoder that lazily decodes the value.
 */
export function lazy<T, I extends Issues = Issues>(
	lazyFunc: () => Awaitable<Decoder<T, I>>,
): Decoder<T, I> {
	return new _Decoder<T, I>(undefined, decodeLazyFunc(lazyFunc));
}

export function map<
	T,
	U extends Array<Decoder<unknown>> = Array<Decoder<unknown>>,
>(
	mapFunc: MapDecodeFunction<T, U>,
	...decoders: U
): Decoder<MapDecodeResponse<MapDecodeFunction<T, U>>, MapDecodeIssues<U>> {
	return new _Decoder<
		MapDecodeResponse<MapDecodeFunction<T, U>>,
		MapDecodeIssues<U>
	>(undefined, decodeMapFunc(mapFunc, ...decoders));
}

/**
 * Create a decoder for an object.
 *
 * @template T The type of the object.
 * @template {ObjectDecoders<T>} U The type of the decoders.
 * @param {U} decoders The decoders for the object properties.
 * @returns {Decoder<ObjectDecodeResponse<U>, ObjectDecodeIssues<U, Issue<"object", string, { expected: string; received: string }>>>} A decoder for the object.
 */
export function object<
	T extends Record<string, unknown>,
	U extends ObjectDecoders<T> = ObjectDecoders<T>,
>(
	decoders: U,
): Decoder<
	ObjectDecodeResponse<U>,
	ObjectDecodeIssues<
		U,
		Issue<"object", string, { expected: string; received: string }>
	>
> {
	return new _Decoder<
		ObjectDecodeResponse<U>,
		ObjectDecodeIssues<
			U,
			Issue<"object", string, { expected: string; received: string }>
		>
	>(undefined, decodeObjectFunc(decoders));
}

/**
 * Create a decoder that makes a decoder optional.
 *
 * @template T The type of the value.
 * @template {Issues<TypeOf<T>>} I The type of the issues.
 * @param {Decoder<T, I>} decoder The decoder to make optional.
 * @returns {Decoder<OptionalDecodeResponse<T>, I>} A decoder that accepts either the original value or undefined.
 */
export function optional<T, I extends Issues = Issues>(
	decoder: Decoder<T, I>,
): Decoder<OptionalDecodeResponse<T>, I> {
	return new _Decoder(undefined, (value) => {
		if (value == null)
			return { ok: true, value: undefined } as Result<
				OptionalDecodeResponse<T>,
				I
			>;

		return decoder.decodeValue(value) as Awaitable<
			Result<OptionalDecodeResponse<T>, I>
		>;
	});
}

/**
 * A decoder for strings.
 *
 * @returns {Decoder<string, Issues<"string", Issue<"string", string, { expected: string; received: string }>>>} A decoder for strings.
 */
export function string(): Decoder<
	string,
	Issues<
		"string",
		Issue<"string", string, { expected: string; received: string }>
	>
> {
	return stringDecoder;
}

/**
 * Create a decoder that always succeeds with the given value.
 *
 * @template T The type of the value.
 * @param {T} value The value to always return.
 * @returns {Decoder<T>} A decoder that always returns the given value.
 */
export function succeed<T>(value: T): Decoder<T, never> {
	return new _Decoder<T, never>(undefined, decodeSucceedFunc(value));
}

/**
 * Create a decoder for a tuple.
 *
 * @template T The type of the tuple.
 * @template {Array<Decoder<unknown>> | TupleDecoders<T>} U The type of the decoders.
 * @param {...U} decoders The decoders for each tuple element.
 * @returns {Decoder<TupleDecodeResponse<U>, Issues<"tuple", Issue<"tuple:length", string, { expected: string; received: string }> | Issue<"tuple:type", string, { expected: string; received: string }>> | TupleDecodeIssues<U>>} A decoder for the tuple.
 */
export function tuple<
	T extends unknown[],
	U extends Array<Decoder<unknown>> | TupleDecoders<T> = TupleDecoders<T>,
>(
	...decoders: U
): Decoder<
	TupleDecodeResponse<U>,
	| Issues<
			"tuple",
			Issue<"tuple:length", string, { expected: string; received: string }>
	  >
	| Issues<
			"tuple",
			Issue<"tuple:type", string, { expected: string; received: string }>
	  >
	| TupleDecodeIssues<U, Issue<"tuple", string, undefined>>
> {
	return new _Decoder<
		TupleDecodeResponse<U>,
		| Issues<
				"tuple",
				Issue<"tuple:length", string, { expected: string; received: string }>
		  >
		| Issues<
				"tuple",
				Issue<"tuple:type", string, { expected: string; received: string }>
		  >
		| TupleDecodeIssues<U, Issue<"tuple", string, undefined>>
	>(undefined, decodeTupleFunc(decoders));
}
/**
 * Create a decoder that accepts any of the given decoders.
 *
 * @template T The type of the value.
 * @template {Array<Decoder<unknown>> | UnionDecoders<T>} U The type of the decoders.
 * @param {U} decoders The decoders to use.
 * @returns {Decoder<UnionDecodeResponse<U>>} A decoder that accepts any of the given decoders.
 */
export function union<
	T,
	U extends Array<Decoder<unknown>> | UnionDecoders<T> = UnionDecoders<T>,
>(...decoders: U): Decoder<UnionDecodeResponse<U>, UnionDecodeIssues<U>> {
	return new _Decoder<UnionDecodeResponse<U>, UnionDecodeIssues<U>>(
		undefined,
		decodeUnionFunc<T, U>(decoders),
	);
}

/**
 * A decoder for booleans.
 */
const booleanDecoder = new _Decoder<
	boolean,
	Issues<
		"boolean",
		Issue<"boolean", string, { expected: string; received: string }>
	>
>(undefined, function (this: Katabami, value) {
	if (typeof value === "boolean") return { ok: true, value };

	return {
		error: new DecodeError(
			"Boolean expected",
			issue("boolean", this.configStore.messages.issue.unexpectedValue, {
				expected: this.configStore.messages.type.boolean,
				received: typeOf(value),
			}),
		),
		ok: false,
	};
});

/**
 * A decoder for integers.
 */
const integerDecoder = new _Decoder<
	number,
	Issues<
		"integer",
		Issue<"integer", string, { expected: string; received: string }>
	>
>(undefined, function (this: Katabami, value) {
	// If the value is not a number, return an error.
	if (typeof value !== "number") {
		return {
			error: new DecodeError(
				"Integer expected",
				issue("integer", this.configStore.messages.issue.unexpectedValue, {
					expected: this.configStore.messages.type.number,
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
				issue("integer", this.configStore.messages.issue.unexpectedValue, {
					expected: this.configStore.messages.type.integer,
					received: this.configStore.messages.type.float,
				}),
			),
			ok: false,
		};
	}

	// If the value is an integer, return the value.
	return { ok: true, value };
});
