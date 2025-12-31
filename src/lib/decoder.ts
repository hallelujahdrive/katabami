import type { i18n, TOptions } from "i18next";

import type {
	CatchFunction,
	DecodeFunction,
	Decoder,
	I18nOptions,
	IssueMessage,
	Issues,
	MapDecodeFunction,
	MapDecodeResponse,
	MapFunction,
	ObjectDecodeIssues,
	ObjectDecodeResponse,
	ObjectDecoders,
	Result,
	TupleDecodeResponse,
	TupleDecoders,
	TypeOf,
	UnionDecodeResponse,
	UnionDecoders,
} from "../types/index.js";

import { isIssueMessage } from "../utils/issue.js";
import { DecodeError } from "./error.js";
import { resourceLanguageTemplates } from "./i18n/index.js";

class _Decoder<T, I extends Issues = Issues<TypeOf<T>>>
	implements Decoder<T, I>
{
	public static defaultNS?: string;
	private readonly _i18n?: i18n;
	private readonly tOptions?: TOptions<{ katabamiNS?: string }>;

	constructor(
		i18nOptions: I18nOptions | undefined,
		decodeFunc: DecodeFunction<T, I>,
	);

	constructor(
		i18nOptions: I18nOptions | undefined,
		decodeFunc: DecodeFunction<T, Issues>,
		cacheFunc?: CatchFunction<T, Issues, I>,
	);

	constructor(
		i18nOptions: I18nOptions | undefined,
		private readonly decodeFunc: DecodeFunction<T, Issues>,
		private readonly cacheFunc?: CatchFunction<T, Issues, I>,
	) {
		this._i18n = i18nOptions?.i18n;
		this.tOptions = i18nOptions?.tOptions;
	}

	/**
	 * @template U
	 * @param {MapFunction<T, U>} mapFunc
	 * @returns {Decoder<U, I>}
	 */
	public andMap<U>(mapFunc: MapFunction<T, U>): Decoder<U, I> {
		return new _Decoder(
			{ i18n: this._i18n, tOptions: this.tOptions },
			(value) => {
				const result = this._decode(value);
				if (!result.ok) return result;

				return { ok: true, value: mapFunc(result.value) };
			},
		);
	}

	/**
	 * @template U
	 * @template {Issues<TypeOf<U>>} J
	 * @param {Decoder<U, I | J>} decoder
	 * @returns {Decoder<U, I | J>}
	 */
	public andThen<U, J extends Issues = Issues<TypeOf<U>>>(
		decoder: Decoder<U, J>,
	): Decoder<U, I | J> {
		return new _Decoder(
			{ i18n: this._i18n, tOptions: this.tOptions },
			(value) => {
				const result = this._decode(value);
				if (!result.ok) return result as Result<U, I | J>;

				return decoder.decodeValue(result.value);
			},
		);
	}

	public catch<K extends Issues>(
		catchFunc: CatchFunction<T, I, K>,
	): Decoder<T, K> {
		return new _Decoder(
			{ i18n: this._i18n, tOptions: this.tOptions },
			this.decodeFunc,
			catchFunc as CatchFunction<T, Issues, K>,
		);
	}

	public decodeString(value: string): Result<T, I> {
		return this._decode(JSON.parse(value));
	}

	/**
	 * @param {unknown} value
	 * @returns {Result<T>}
	 */
	public decodeValue(value: unknown): Result<T, I> {
		return this._decode(value);
	}

	public i18n(options: { i18n?: i18n; tOptions?: TOptions }): Decoder<T, I> {
		return new _Decoder(
			{
				i18n: options.i18n ?? this._i18n,
				tOptions: options.tOptions ?? this.tOptions,
			},
			this.decodeFunc,
			this.cacheFunc,
		);
	}

	/**
	 * Internal decode function.
	 *
	 * @param {unknown} value The value to decode.
	 * @returns {Result<T, I>} The decoded value or an error with issues.
	 * @private
	 */
	private _decode(value: unknown): Result<T, I> {
		// Decode the value.
		const result = this.decodeFunc(value, {
			i18n: this._i18n,
			tOptions: this.tOptions,
		});

		// If the result is ok or no cacheFunc is set, return the result as is.
		if (result.ok || !this.cacheFunc) return result as Result<T, I>;

		// If the result is not ok, call the cacheFunc with the issues and return the result.
		return this.cacheFunc(result.error.issues);
	}
}

/**
 * Builds a message using the provided issue and i18n options.
 *
 * If the i18n instance is not provided, the issue is returned as is.
 *
 * @template I
 * @param {I18nOptions} options - The i18n instance and/or options.
 * @param {I} issue - The issue to build a message from.
 * @returns {I | string} - The built message.
 */
const buildMessage = <I extends IssueMessage>(
	options: I18nOptions,
	issue: I,
): I | string => {
	// If the i18n instance is not provided, return the issue as is.
	if (!options.i18n) return issue;

	const t = options.i18n.t;

	// Get the tOptions from the i18n options.
	const tOptions = options.tOptions ?? {};

	// Get the vars from the issue.
	const vars = Object.fromEntries(
		Object.entries(issue.vars ?? {}).map(([key, value]) => [
			key,
			t(value.toString(), { ...tOptions, ns: tOptions.katabamiNS }),
		]),
	);

	// Build the message using the i18n instance and the provided options.
	return t(issue.template, {
		...vars,
		...tOptions,
		ns: tOptions.katabamiNS,
	});
};

/**
 * Determines the type of a given value.
 *
 * @param {unknown} value - The value to check the type of.
 * @returns {string} - A string representing the type of the value.
 */
const typeOf = (value: unknown): string => {
	if (value === null) return resourceLanguageTemplates.type.null;

	if (typeof value === "object") {
		return Array.isArray(value)
			? resourceLanguageTemplates.type.array
			: resourceLanguageTemplates.type.object;
	}

	return resourceLanguageTemplates.type[typeof value];
};

/**
 * Quotes a value if it is a string.
 *
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

const decodeBooleanFunc: DecodeFunction<boolean> = (value, i18nOptions) => {
	if (typeof value === "boolean") return { ok: true, value };

	return {
		error: new DecodeError(
			"Expected boolean",
			buildMessage(i18nOptions, {
				template:
					resourceLanguageTemplates.issue
						.aExpectedIsExpectedButTheValueIsAReceived,
				type: "boolean",
				vars: {
					expected: resourceLanguageTemplates.type.boolean,
					received: typeOf(value),
				},
			}),
		),
		ok: false,
	};
};

const decodeConstantFunc =
	<T extends boolean | number | string>(
		expected: T,
	): DecodeFunction<T, Issues<"constant">> =>
	(value, i18nOptions) => {
		if (value === expected) return { ok: true, value: value as T };

		return {
			error: new DecodeError(
				"Expected constant",
				buildMessage(i18nOptions, {
					template:
						resourceLanguageTemplates.issue
							.aExpectedIsExpectedButTheValueIsAReceived,
					type: "constant",
					vars:
						typeof value === typeof expected
							? {
									expected: quoteValue(expected),
									received: quoteValue(value as boolean | number | string),
								}
							: { expected: quoteValue(expected), received: typeOf(value) },
				}),
			),
			ok: false,
		};
	};

const decodeFailedFunc = <T extends Issues = Issues>(
	message?: string,
	issues?: T,
): DecodeFunction<never, T> => {
	return (_value, i18nOptions) => {
		return {
			error: new DecodeError(
				message ?? "Failed to decode",
				isIssueMessage(issues)
					? buildMessage(i18nOptions, issues)
					: (issues ??
							(buildMessage(i18nOptions, {
								template: resourceLanguageTemplates.issue.failedToDecode,
								type: "failed",
							}) as T)),
			),
			ok: false,
		};
	};
};

const decodeIntegerFunc: DecodeFunction<number> = (value) => {
	if (typeof value === "number") return { ok: true, value };

	return {
		error: new DecodeError("Expected number", {
			template:
				resourceLanguageTemplates.issue
					.aExpectedIsExpectedButTheValueIsAReceived,
			type: "number",
			vars: {
				expected: resourceLanguageTemplates.type.number,
				received: typeOf(value),
			},
		}),
		ok: false,
	};
};

const decodeNumberFunc: DecodeFunction<number> = (value) => {
	if (typeof value === "number") return { ok: true, value };

	return {
		error: new DecodeError("Expected number", {
			template:
				resourceLanguageTemplates.issue
					.aExpectedIsExpectedButTheValueIsAReceived,
			type: "number",
			vars: {
				expected: resourceLanguageTemplates.type.number,
				received: typeOf(value),
			},
		}),
		ok: false,
	};
};

const decodeStringFunc: DecodeFunction<string> = (value) => {
	if (typeof value === "string") return { ok: true, value };

	return {
		error: new DecodeError("Expected string", {
			template:
				resourceLanguageTemplates.issue
					.aExpectedIsExpectedButTheValueIsAReceived,
			type: "string",
			vars: {
				expected: resourceLanguageTemplates.type.string,
				received: typeOf(value),
			},
		}),
		ok: false,
	};
};
const decodeSucceedFunc =
	<T>(value: T): DecodeFunction<T> =>
	() => {
		return { ok: true, value };
	};

const decodeValueFunc: DecodeFunction<unknown> = <T>(value: unknown) => {
	return { ok: true, value: value as T };
};

/**
 * A decoder for booleans.
 *
 * @returns {Decoder<boolean, Issues<TypeOf<boolean>>>}
 */
export function boolean(): Decoder<boolean, Issues<TypeOf<boolean>>> {
	return new _Decoder(undefined, decodeBooleanFunc);
}

/**
 * A decoder that always returns the same value.
 *
 * @template {boolean | number | string} T The type of the value.
 * @param {T} expected The value to return.
 * @returns {Decoder<T>} A decoder that always returns the given value.
 */
export function constant<T extends boolean | number | string>(
	expected: T,
): Decoder<T, Issues<"constant">> {
	return new _Decoder(undefined, decodeConstantFunc(expected));
}

export function map<
	T,
	U extends Array<Decoder<unknown>> = Array<Decoder<unknown>>,
>(
	mapFunc: MapDecodeFunction<T, U>,
	...decoders: U
): Decoder<MapDecodeResponse<MapDecodeFunction<T, U>>> {}

/**
 * Create a decoder that always fails with the given message and issues.
 *
 * @param {string} message The failure message.
 * @returns {Decoder<never, IssueMessage>} A decoder that always fails with the given message and issues.
 */
export function failed(message?: string): Decoder<never, IssueMessage>;

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
 * A decoder for integers.
 *
 * @returns {Decoder<number, Issues<TypeOf<number>>>} A decoder for integers.
 */
export function integer(): Decoder<number, Issues<TypeOf<number>>> {
	return new _Decoder(undefined, decodeIntegerFunc);
}

/**
 * A decoder for numbers.
 *
 * @returns {Decoder<number, Issues<TypeOf<number>>>} A decoder for numbers.
 */
export function number(): Decoder<number, Issues<TypeOf<number>>> {
	return new _Decoder(undefined, decodeNumberFunc);
}

/**
 * Create a decoder for an object.
 *
 * @template T The type of the object.
 * @template {ObjectDecoders<T>} U The type of the decoders.
 * @param {U} decoders The decoders for the object properties.
 * @returns {Decoder<ObjectDecodeResponse<U>, ObjectDecodeIssues<U>>} A decoder for the object.
 */
export function object<
	T extends Record<string, unknown>,
	U extends
		| ObjectDecoders<T>
		| Record<string, Decoder<unknown>> = ObjectDecoders<T>,
>(decoders: U): Decoder<ObjectDecodeResponse<U>, ObjectDecodeIssues<U>> {}

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
	return new _Decoder(undefined, (value, i18nOptions) => {
		if (value == null) return { ok: true, value: undefined as T | undefined };

		return decoder.i18n(i18nOptions).decodeValue(value);
	});
}

/**
 * A decoder for strings.
 *
 * @returns {Decoder<string, Issues<TypeOf<string>>>} A decoder for strings.
 */
export function string(): Decoder<string, Issues<TypeOf<string>>> {
	return new _Decoder(undefined, decodeStringFunc);
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
 * @returns {Decoder<TupleDecodeResponse<U>>} A decoder for the tuple.
 */
export function tuple<
	T extends unknown[],
	U extends Array<Decoder<unknown>> | TupleDecoders<T> = TupleDecoders<T>,
>(...decoders: U): Decoder<TupleDecodeResponse<U>> {}

/**
 * Create a decoder that accepts any of the given decoders.
 *
 * @template T The type of the value.
 * @template {UnionDecoders<T>} U The type of the decoders.
 * @param {U} decoders The decoders to use.
 * @returns {Decoder<UnionDecodeResponse<U>>} A decoder that accepts any of the given decoders.
 */
export function union<
	T,
	U extends Array<Decoder<unknown>> | UnionDecoders<T> = UnionDecoders<T>,
>(...decoders: U): Decoder<UnionDecodeResponse<U>> {}

export function value<T = unknown>(): Decoder<T> {
	return new _Decoder<T>(undefined, decodeValueFunc as DecodeFunction<T>);
}
