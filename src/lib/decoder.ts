import type { ParseKeys, TFunction, TOptions } from "i18next";
import type {
	CatchFunction,
	DecodeFunction,
	Decoder,
	IssueMessage,
	Issues,
	IssueType,
	MapDecodeFunction,
	MapDecodeResponse,
	MapFunction,
	ObjectDecodeIssues,
	ObjectDecodeResponse,
	ObjectDecoders,
	Primitive,
	Result,
	TupleDecodeResponse,
	TupleDecoders,
	TypeOf,
	UnionDecodeResponse,
	UnionDecoders,
} from "../types/index.js";
import { isRecord } from "../utils/index.js";
import { DecodeError } from "./error.js";

/**
 * A weak map to store the issue message string representations.
 */
const weakMap = new WeakMap<object, IssueMessage>();

/**
 * Implementation of the Decoder interface.
 */
class _Decoder<T, I extends Issues = Issues<TypeOf<T>>>
	implements Decoder<T, I>
{
	constructor(decodeFunc: DecodeFunction<T, I>);

	constructor(
		decodeFunc: DecodeFunction<T, Issues>,
		cacheFunc?: CatchFunction<T, Issues, I>,
	);

	constructor(
		private readonly decodeFunc: DecodeFunction<T, Issues>,
		private readonly cacheFunc?: CatchFunction<T, Issues, I>,
	) {}

	/**
	 * @template U
	 * @param {MapFunction<T, U>} mapFunc
	 * @returns {Decoder<U, I>}
	 */
	public andMap<U>(mapFunc: MapFunction<T, U>): Decoder<U, I> {
		return new _Decoder((value) => {
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
		return new _Decoder((value) => {
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
			this.decodeFunc,
			catchFunc as CatchFunction<T, Issues, K>,
		);
	}

	/**
	 * Decodes a string as T.
	 * @param {string} value The string to decode as T.
	 * @returns {Result<T, I>} The decoded value or an error with issues.
	 */
	public decodeString(value: string): Result<T, I> {
		return this._decode(JSON.parse(value));
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
		const result = this.decodeFunc(value);

		// If the result is ok or no cacheFunc is set, return the result as is.
		if (result.ok || !this.cacheFunc) return result as Result<T, I>;

		// If the result is not ok, call the cacheFunc with the issues and return the result.
		return this.cacheFunc(result.error.issues);
	}
}

/**
 * Implementation of the IssueMessage interface.
 */
class _IssueMessage<
	T extends IssueType,
	Vars extends
		| Array<ParseKeys | Primitive>
		| Record<string, ParseKeys | Primitive> = never,
> implements IssueMessage<T, Vars>
{
	constructor(
		public readonly type: T,
		private readonly key: ParseKeys,
		private readonly vars?: Vars,
	) {}

	/**
	 * Gets the variables of the issue.
	 * @returns {Vars} The variables of the issue.
	 */
	getVars(): Vars {
		return this.vars as Vars;
	}

	/**
	 * The string representation of the issue.
	 * @param {TFunction} t - The i18n function.
	 * @param {TOptions} tOptions - The i18n options.
	 * @returns {string} The string representation of the issue.
	 */
	toString(t?: TFunction, tOptions?: TOptions): string {
		if (!t) return this.key;

		const _tOptions = tOptions ?? {};

		const _vars = Object.fromEntries(
			Object.entries(this.vars ?? {}).map(([key, value]) => [
				key,
				t(value.toString() as ParseKeys, _tOptions),
			]),
		);

		return t(this.key, { ..._vars, ..._tOptions });
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
 * A decoder for booleans.
 */
const booleanDecoder = new _Decoder<
	boolean,
	Issues<
		"boolean",
		IssueMessage<"boolean", { expected: "type.boolean"; received: string }>
	>
>((value) => {
	if (typeof value === "boolean") return { ok: true, value };

	const issue = {} as Issues<
		"boolean",
		IssueMessage<"boolean", { expected: "type.boolean"; received: string }>
	>;
	const issueMessage = new _IssueMessage(
		"boolean",
		"issue.aExpectedIsExpectedButTheValueIsAReceived",
		{
			expected: "type.boolean",
			received: typeOf(value),
		},
	);

	weakMap.set(issue, issueMessage);

	return {
		error: new DecodeError("Boolean expected", issue),
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
		IssueMessage<
			"integer",
			{ expected: "type.integer" | "type.number"; received: string }
		>
	>
>((value) => {
	// If the value is not a number, return an error.
	if (typeof value !== "number") {
		const issue = {};
		const issueMessage = new _IssueMessage(
			"integer",
			"issue.aExpectedIsExpectedButTheValueIsAReceived",
			{
				expected: "type.number",
				received: typeOf(value),
			},
		);

		weakMap.set(issue, issueMessage);

		return {
			error: new DecodeError("Integer expected", issue as never),
			ok: false,
		};
	}

	// If the value is not an integer, return an error.
	if (!Number.isInteger(value)) {
		const issue = {};
		const issueMessage = new _IssueMessage(
			"integer",
			"issue.aExpectedIsExpectedButTheValueIsAReceived",
			{
				expected: "type.integer",
				received: "type.float",
			},
		);

		weakMap.set(issue, issueMessage);

		return {
			error: new DecodeError("Integer expected", issue as never),
			ok: false,
		};
	}

	// If the value is an integer, return the value.
	return { ok: true, value };
});

/**
 * A decoder for floats.
 */
const floatDecoder = new _Decoder<
	number,
	Issues<
		"float",
		IssueMessage<"float", { expected: "type.float"; received: string }>
	>
>((value) => {
	if (typeof value === "number") return { ok: true, value };

	const issue = {} as Issues<
		"float",
		IssueMessage<"float", { expected: "type.float"; received: string }>
	>;
	const issueMessage = new _IssueMessage(
		"float",
		"issue.aExpectedIsExpectedButTheValueIsAReceived",
		{
			expected: "type.float",
			received: typeOf(value),
		},
	);

	weakMap.set(issue, issueMessage);

	return {
		error: new DecodeError("Float expected", issue),
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
		IssueMessage<"string", { expected: "type.string"; received: string }>
	>
>((value) => {
	if (typeof value === "string") return { ok: true, value };

	const issue = {} as Issues<
		"string",
		IssueMessage<"string", { expected: "type.string"; received: string }>
	>;
	const issueMessage = new _IssueMessage(
		"string",
		"issue.aExpectedIsExpectedButTheValueIsAReceived",
		{
			expected: "type.string",
			received: typeOf(value),
		},
	);

	weakMap.set(issue, issueMessage);

	return {
		error: new DecodeError("Expected string", issue),
		ok: false,
	};
});

/**
 * Creates a decoder that always returns the same value.
 * @param {T} expected - The value to return.
 * @returns {DecodeFunction<T, Issues<"constant", IssueMessage<"constant", { expected: Primitive; received: Primitive }>>>} A decoder that always returns the given value.
 */
const decodeConstantFunc =
	<T extends Primitive>(
		expected: T,
	): DecodeFunction<
		T,
		Issues<
			"constant",
			IssueMessage<"constant", { expected: Primitive; received: Primitive }>
		>
	> =>
	(value) => {
		if (value === expected) return { ok: true, value: value as T };

		const issue = {};
		const issueMessage = new _IssueMessage(
			"constant",
			"issue.aExpectedIsExpectedButTheValueIsAReceived",
			typeof value === typeof expected
				? {
						expected: expected,
						received: quoteValue(value as Primitive),
					}
				: { expected: quoteValue(expected), received: typeOf(value) },
		);

		weakMap.set(issue, issueMessage);

		return {
			error: new DecodeError("Constant expected", issue as never),
			ok: false,
		};
	};

/**
 * Creates a decoder that always fails with the given message and issues.
 * @param {string} message - The message to display when the decoder fails.
 * @param {T} issues - The issues to display when the decoder fails.
 * @returns {DecodeFunction<never, IssueMessage | T>} A decoder that always fails with the given message and issues.
 */
const decodeFailedFunc = <
	T extends Issues = Issues<"failed", IssueMessage<"failed", never>>,
>(
	message?: string,
	issues?: T,
): DecodeFunction<never, T> => {
	const issue =
		issues ?? ({} as Issues<"failed", IssueMessage<"failed", never>> as T);
	const issueMessage = new _IssueMessage("failed", "issue.failedToDecode");

	weakMap.set(issue, issueMessage);

	return () => {
		return {
			error: new DecodeError(message ?? "Failed to decode", issue),
			ok: false,
		};
	};
};

/**
 * Creates a decoder that decodes an object.
 * @template T - The type of the object.
 * @template {ObjectDecoders<T>} U - The type of the decoders.
 * @param {U} decoders - The decoders for the object properties.
 * @returns {DecodeFunction<ObjectDecodeResponse<U>, IssueMessage<"object", { expected: string; received: string }> | ObjectDecodeIssues<U>>} A decoder that decodes an object.
 */
const decodeObjectFunc =
	<T extends Record<string, unknown>, U extends ObjectDecoders<T>>(
		decoders: U,
	): DecodeFunction<
		ObjectDecodeResponse<U>,
		ObjectDecodeIssues<
			U,
			IssueMessage<"object", { expected: "type.object"; received: string }>
		>
	> =>
	(value) => {
		if (!isRecord(value)) {
			const issue = {} as ObjectDecodeIssues<
				U,
				IssueMessage<"object", { expected: "type.object"; received: string }>
			>;
			const issueMessage = new _IssueMessage(
				"object",
				"issue.aExpectedIsExpectedButTheValueIsAReceived",
				{
					expected: "type.object",
					received: typeOf(value),
				},
			);

			weakMap.set(issue, issueMessage);

			return {
				error: new DecodeError("Object expected", issue),
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
				IssueMessage<"object", { expected: "type.object"; received: string }>
			>;
			const issueMessage = new _IssueMessage(
				"object",
				"issue.aExpectedIsExpectedButTheValueIsAReceived",
				{
					expected: "type.object",
					received: typeOf(value),
				},
			);

			weakMap.set(issues, issueMessage);

			return {
				error: new DecodeError("Object expected", issues),
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

/**
 * Creates a decoder that always succeeds with the given value.
 * @param {unknown} value - The value to return.
 * @returns {DecodeFunction<unknown>} A decoder that always returns the given value.
 */
const valueDecoder = new _Decoder<unknown, never>((value) => {
	return { ok: true, value };
});

/**
 * A decoder for booleans.
 * @returns {Decoder<boolean, IssueMessage<"boolean", { expected: "type.boolean"; received: string }>>}
 */
export function boolean(): Decoder<
	boolean,
	Issues<
		"boolean",
		IssueMessage<"boolean", { expected: "type.boolean"; received: string }>
	>
> {
	return booleanDecoder;
}

/**
 * A decoder that always returns the same value.
 *
 * @template {boolean | number | string} T The type of the value.
 * @param {T} expected The value to return.
 * @returns {Decoder<T, Issues<"constant", IssueMessage<"constant", { expected: Primitive; received: Primitive }>>>} A decoder that always returns the given value.
 */
export function constant<T extends boolean | number | string>(
	expected: T,
): Decoder<
	T,
	Issues<
		"constant",
		IssueMessage<"constant", { expected: Primitive; received: Primitive }>
	>
> {
	return new _Decoder(decodeConstantFunc(expected));
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
export function failed(
	message?: string,
): Decoder<
	never,
	Issues<"failed", IssueMessage<"failed", { message: string }>>
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
	return new _Decoder<never, T>(decodeFailedFunc(message, issues));
}

/**
 * A decoder for integers.
 *
 * @returns {Decoder<number, Issues<"integer", IssueMessage<"integer", { expected: "type.integer" | "type.number"; received: string }>>>} A decoder for integers.
 */
export function integer(): Decoder<
	number,
	Issues<
		"integer",
		IssueMessage<
			"integer",
			{ expected: "type.integer" | "type.number"; received: string }
		>
	>
> {
	return integerDecoder;
}

/**
 * A decoder for floats.
 *
 * @returns {Decoder<number, Issues<"float", IssueMessage<"float", { expected: "type.float"; received: string }>>>} A decoder for floats.
 */
export function float(): Decoder<
	number,
	Issues<
		"float",
		IssueMessage<"float", { expected: "type.float"; received: string }>
	>
> {
	return floatDecoder;
}

/**
 * Create a decoder for an object.
 *
 * @template T The type of the object.
 * @template {ObjectDecoders<T>} U The type of the decoders.
 * @param {U} decoders The decoders for the object properties.
 * @returns {Decoder<ObjectDecodeResponse<U>, ObjectDecodeIssues<U, IssueMessage<"object", { expected: "type.object"; received: string }>>>} A decoder for the object.
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
		IssueMessage<"object", { expected: "type.object"; received: string }>
	>
> {
	return new _Decoder(decodeObjectFunc<T, U>(decoders));
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
	return new _Decoder((value) => {
		if (value == null) return { ok: true, value: undefined as T | undefined };

		return decoder.decodeValue(value);
	});
}

/**
 * A decoder for strings.
 *
 * @returns {Decoder<string, Issues<"string", IssueMessage<"string", { expected: "type.string"; received: string }>>>} A decoder for strings.
 */
export function string(): Decoder<
	string,
	Issues<
		"string",
		IssueMessage<"string", { expected: "type.string"; received: string }>
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
	return new _Decoder<T, never>(decodeSucceedFunc(value));
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

/**
 * Creates a decoder that always succeeds with the given value.
 * @template T The type of the value.
 * @returns {Decoder<T, never>} A decoder that always returns the given value.
 */
export function value<T = unknown>(): Decoder<T, never> {
	return valueDecoder as Decoder<T, never>;
}

export function issueMessage<T extends Issues>(
	issues: T | undefined,
): T extends Issues<IssueType, infer I> ? I | undefined : undefined {
	if (issues == null) return undefined;

	return weakMap.get(issues) as T extends Issues<IssueType, infer I>
		? I | undefined
		: undefined;
}
