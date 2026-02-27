import type { ParseKeys } from "i18next";
import type {
	ArrayDecodeIssues,
	ArrayDecodeResponse,
	CatchFunction,
	DecodeFunction,
	Decoder,
	Err,
	Issue,
	Issues,
	KatabamiConfig,
	MapDecodeFunction,
	MapDecodeIssues,
	MapDecodeResponse,
	MapFunction,
	MessageResources,
	ObjectDecodeIssues,
	ObjectDecodeResponse,
	ObjectDecoders,
	Ok,
	Primitive,
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

type DeepRequired<T> = {
	[K in keyof T]-?: NonNullable<T[K]> extends Record<string, unknown>
		? DeepRequired<NonNullable<T[K]>>
		: NonNullable<T[K]>;
};

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
	return valueDecoder as Decoder<T, never>;
}

/**
 * Implementation of the Decoder interface.
 */
class _Decoder<T, I extends Issues = Issues<TypeOf<T>>>
	implements Decoder<T, I>
{
	private readonly katabami: Katabami;

	constructor(katabami: Katabami | undefined, decodeFunc: DecodeFunction<T, I>);

	constructor(
		katabami: Katabami | undefined,
		decodeFunc: DecodeFunction<T, Issues>,
		cacheFunc?: CatchFunction<T, Issues, I>,
	);

	constructor(
		katabami: Katabami | undefined,
		private readonly decodeFunc: DecodeFunction<T, Issues>,
		private readonly cacheFunc?: CatchFunction<T, Issues, I>,
	) {
		this.katabami = katabami ?? getKatabami();
	}

	/**
	 * @template U
	 * @param {MapFunction<T, U>} mapFunc
	 * @returns {Decoder<U, I>}
	 */
	public andMap<U>(mapFunc: MapFunction<T, U>): Decoder<U, I> {
		return new _Decoder(this.katabami, (value) => {
			const result = this._decode(value);
			if (!result.ok) return result;

			return { ok: true, value: mapFunc(result.value) };
		});
	}

	/**
	 * Applies another decoder to the decoded value.
	 * @template U
	 * @template {Issues<TypeOf<U>>} J
	 * @param {Decoder<U, I | J>} decoder
	 * @returns {Decoder<U, I | J>}
	 */
	public andThen<U, J extends Issues = Issues<TypeOf<U>>>(
		decoder: Decoder<U, J>,
	): Decoder<U, I | J> {
		return new _Decoder(this.katabami, (value) => {
			const result = this._decode(value);
			if (!result.ok) return result as Result<U, I | J>;

			return decoder.decodeValue(result.value);
		});
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
		);
	}

	/**
	 * Decodes a string as T.
	 * @param {string} value The string to decode as T.
	 * @returns {Result<T, I>} The decoded value or an error with issues.
	 */
	public decodeString(
		value: string,
	): Result<T, I | Issues<"parseJson", Issue<"parseJson", never>>> {
		try {
			const _value = JSON.parse(value);
			return this._decode(_value);
		} catch {
			return {
				error: new DecodeError(
					"Failed to decode string",
					issue("parseJson", "issue.failedToDecode"),
				),
				ok: false,
			};
		}
	}

	/**
	 * Decodes an unknown value as T.
	 * @param {unknown} value
	 * @returns {Result<T>}
	 */
	public decodeValue(value: unknown): Result<T, I> {
		return this._decode(value);
	}

	/**
	 * Internal decode function.
	 * @param {unknown} value The value to decode.
	 * @returns {Result<T, I>} The decoded value or an error with issues.
	 * @private
	 */
	private _decode(value: unknown): Result<T, I> {
		// Decode the value.
		const result = this.decodeFunc.call(this.katabami, value);

		// If the result is ok or no cacheFunc is set, return the result as is.
		if (result.ok || !this.cacheFunc) return result as Result<T, I>;

		// If the result is not ok, call the cacheFunc with the issues and return the result.
		return this.cacheFunc(result.error.issues);
	}
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

		const results = value.reduce<
			| { entries: Array<[number, Issues]>; ok: false }
			| { entries: T[]; ok: true }
		>(
			(accumulator, item, i) => {
				const result = decoder.decodeValue(item);

				if (accumulator.ok) {
					if (result.ok) {
						accumulator.entries.push(result.value);
					} else {
						return { entries: [[i, result.error.issues]], ok: false };
					}
				} else {
					if (!result.ok) {
						accumulator.entries.push([i, result.error.issues]);
					}
				}

				return accumulator;
			},
			{ entries: [], ok: true },
		);

		if (results.ok) {
			return { ok: true, value: results.entries as ArrayDecodeResponse<U> };
		} else {
			return {
				error: new DecodeError(
					"Array expected",
					issue(
						"array",
						this.configStore.messages.issue.unexpectedValue,
						{
							expected: this.configStore.messages.type.array,
							received: typeOf(value),
						},
						Object.fromEntries(results.entries),
					) as ArrayDecodeIssues<
						U,
						Issue<"array", string, { expected: string; received: string }>
					>,
				),
				ok: false,
			};
		}
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

const decodeMapFunc =
	<T, U extends Array<Decoder<unknown>> = Array<Decoder<unknown>>>(
		mapFunc: MapDecodeFunction<T, U>,
		...decoders: U
	): DecodeFunction<
		MapDecodeResponse<MapDecodeFunction<T, U>>,
		MapDecodeIssues<U>
	> =>
	(value) => {
		const result = decoders.reduce<
			{ entries: Array<unknown>; ok: true } | { error: Issues; ok: false }
		>(
			(accumulator, decoder) => {
				if (!accumulator.ok) return accumulator;

				const result = decoder.decodeValue(value);

				if (result.ok) {
					accumulator.entries.push(result.value);
				} else {
					return result;
				}

				return accumulator;
			},
			{ entries: [], ok: true },
		);

		if (result.ok) {
			return {
				ok: true,
				value: mapFunc(...(result.entries as TupleDecodeResponse<U>)),
			};
		} else {
			return result as Err<MapDecodeIssues<U>>;
		}
	};

/**
 * Creates a decoder that decodes an object.
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
		if (!isRecord(value)) {
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
		}

		const results = Object.entries(decoders).reduce<
			| { entries: Array<[string, Issues]>; ok: false }
			| { entries: Array<[string, unknown]>; ok: true }
		>(
			(accumulator, [key, decoder]: [string, Decoder<U[keyof U]>]) => {
				const result = decoder.decodeValue(value[key]);

				if (accumulator.ok) {
					if (result.ok) {
						accumulator.entries.push([key, result.value]);
					} else {
						return { entries: [[key, result.error.issues]], ok: false };
					}
				} else {
					if (!result.ok) {
						accumulator.entries.push([key, result.error.issues]);
					}
				}

				return accumulator;
			},
			{ entries: [], ok: true },
		);

		if (results.ok) {
			return {
				ok: true,
				value: Object.fromEntries(results.entries) as ObjectDecodeResponse<U>,
			};
		} else {
			const issues = Object.fromEntries(results.entries) as ObjectDecodeIssues<
				U,
				Issue<"object", string, { expected: string; received: string }>
			>;

			return {
				error: new DecodeError(
					"Object expected",
					issue(
						"object",
						this.configStore.messages.issue.unexpectedValue,
						{
							expected: this.configStore.messages.type.object,
							received: typeOf(value),
						},
						issues,
					) as ObjectDecodeIssues<
						U,
						Issue<"object", string, { expected: string; received: string }>
					>,
				),
				ok: false,
			};
		}
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
	| TupleDecodeIssues<U, never>
> =>
	function (this: Katabami, value) {
		if (!Array.isArray(value)) {
			return {
				error: new DecodeError(
					"Array expected",
					issue("tuple:type", this.configStore.messages.issue.unexpectedValue, {
						expected: this.configStore.messages.type.array,
						received: typeOf(value),
					}),
				),
				ok: false,
			};
		}

		if (decoders.length !== value.length) {
			return {
				error: new DecodeError(
					"Array expected",
					issue(
						"tuple:length",
						this.configStore.messages.issue.unexpectedValue,
						{
							expected: this.configStore.messages.type.array,
							received: typeOf(value),
						},
					),
				),
				ok: false,
			};
		}

		const results = decoders.reduce<
			| { entries: Array<[number, Issues]>; ok: false }
			| { entries: Array<unknown>; ok: true }
		>(
			(accumulator, decoder, i) => {
				const result = decoder.decodeValue(value[i]);

				if (accumulator.ok) {
					if (result.ok) {
						accumulator.entries.push(result.value);
					} else {
						return { entries: [[i, result.error.issues]], ok: false };
					}
				} else {
					if (!result.ok) {
						accumulator.entries.push([i, result.error.issues]);
					}
				}

				return accumulator;
			},
			{ entries: [], ok: true },
		);

		if (results.ok) {
			return { ok: true, value: results.entries as TupleDecodeResponse<U> };
		} else {
			return {
				error: new DecodeError(
					"Tuple expected",
					Object.fromEntries(results.entries) as TupleDecodeIssues<
						U,
						Issue<"tuple", never>
					>,
				),
				ok: false,
			};
		}
	};

const decodeUnionFunc = <
	T,
	U extends Array<Decoder<unknown>> | UnionDecoders<T>,
>(
	decoders: U,
): DecodeFunction<UnionDecodeResponse<U>, UnionDecodeIssues<U>> =>
	function (this: Katabami, value) {
		const results = (decoders as Array<Decoder<unknown>>).reduce<
			{ entries: Array<Issues>; ok: false } | { ok: true; value: unknown }
		>(
			(accumulator, decoder) => {
				if (accumulator.ok) return accumulator;

				const result = decoder.decodeValue(value);
				if (result.ok) return result;

				accumulator.entries.push(result.error.issues);
				return accumulator;
			},
			{ entries: [], ok: false },
		);

		if (results.ok) {
			return results as Ok<UnionDecodeResponse<U>>;
		} else {
			return {
				error: new DecodeError(
					"Union expected",
					results.entries as UnionDecodeIssues<U>,
				),
				ok: false,
			};
		}
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
	return new _Decoder(undefined, decodeArrayFunc(decoder));
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
 * A decoder for integers.
 *
 * @returns {Decoder<number, Issues<"integer", Issue<"integer", string, { expected: string; received: string }>>>} A decoder for integers.
 */
export function integer(): Decoder<
	number,
	Issues<
		"integer",
		Issue<"integer", string, { expected: string; received: string }>
	>
> {
	return integerDecoder;
}

export function map<
	T,
	U extends Array<Decoder<unknown>> = Array<Decoder<unknown>>,
>(
	mapFunc: MapDecodeFunction<T, U>,
	...decoders: U
): Decoder<MapDecodeResponse<MapDecodeFunction<T, U>>, MapDecodeIssues<U>> {
	return new _Decoder(undefined, decodeMapFunc(mapFunc, ...decoders));
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
	return new _Decoder(undefined, decodeObjectFunc<T, U>(decoders));
}

/**
 * Create a decoder that makes a decoder optional.
 *
 * @template T The type of the value.
 * @template {Issues<TypeOf<T>>} I The type of the issues.
 * @param {Decoder<T, I>} decoder The decoder to make optional.
 * @returns {Decoder<T | undefined, I>} A decoder that accepts either the original value or undefined.
 */
export function optional<T, I extends Issues = Issues>(
	decoder: Decoder<T, I>,
): Decoder<T | undefined, I> {
	return new _Decoder(undefined, (value) => {
		if (value == null) return { ok: true, value: undefined as T | undefined };

		return decoder.decodeValue(value);
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
	return new _Decoder(undefined, decodeTupleFunc<T, U>(decoders));
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
	return new _Decoder(undefined, decodeUnionFunc<T, U>(decoders));
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
