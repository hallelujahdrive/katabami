import type {
  CatchFunction,
  DecodeFunction,
  Decoder,
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
import { DecodeError } from "./error.js";

class _Decoder<T, I extends Issues = Issues<TypeOf<T>>>
  implements Decoder<T, I>
{
  constructor(decodeFunc: DecodeFunction<T, I>);
  constructor(
    decodeFunc: DecodeFunction<T, Issues>,
    cacheFunc: CatchFunction<T, Issues, I>
  );
  constructor(
    private readonly decodeFunc: DecodeFunction<T, Issues>,
    private readonly cacheFunc?: CatchFunction<T, Issues, I>
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
   * @template U
   * @template {Issues<TypeOf<U>>} J
   * @param {Decoder<U, I | J>} decoder
   * @returns {Decoder<U, I | J>}
   */
  public andThen<U, J extends Issues = Issues<TypeOf<U>>>(
    decoder: Decoder<U, J>
  ): Decoder<U, I | J> {
    return new _Decoder((value) => {
      const result = this._decode(value);
      if (!result.ok) return result as Result<U, I | J>;

      return decoder.decodeValue(result.value);
    });
  }

  public catch<K extends Issues>(
    catchFunc: CatchFunction<T, I, K>
  ): Decoder<T, K> {
    return new _Decoder(
      this.decodeFunc,
      catchFunc as CatchFunction<T, Issues, K>
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

  private _decode(value: unknown): Result<T, I> {
    const result = this.decodeFunc(value);
    if (result.ok || !this.cacheFunc) return result as Result<T, I>;

    return this.cacheFunc(result.error.issues);
  }
}

/**
 * Determines the type of a given value.
 *
 * @param {unknown} value - The value to check the type of.
 * @returns {string} - A string representing the type of the value.
 */
const typeOf = (value: unknown): string => {
  if (value === null) return "null";

  if (typeof value === "object") {
    return Array.isArray(value) ? "array" : "object";
  }

  return typeof value;
};

const decodeBooleanFunc: DecodeFunction<boolean> = (value) => {
  if (typeof value === "boolean") return { ok: true, value };

  return {
    error: new DecodeError("Expected boolean", {
      args: { expected: "boolean", received: typeOf(value) },
      template: "",
      type: "boolean",
    }),
    ok: false,
  };
};

const decodeConstantFunc =
  <T extends boolean | number | string>(
    expected: T
  ): DecodeFunction<T, Issues<"constant">> =>
  (value) => {
    if (value === expected) return { ok: true, value: value as T };

    return {
      error: new DecodeError("Expected constant", {
        args: { expected: expected, received: typeOf(value) },
        template: "",
        type: "constant",
      }),
      ok: false,
    };
  };

const decodeFiledFunc = <T extends Issues>(
  message: string,
  issues?: T
): DecodeFunction<never, T> => {};

const decodeIntegerFunc: DecodeFunction<number> = (value) => {
  if (typeof value === "number") return { ok: true, value };

  return {
    error: new DecodeError("Expected number", {
      args: { expected: "number", received: typeOf(value) },
      template: "",
      type: "number",
    }),
    ok: false,
  };
};

const decodeNumberFunc: DecodeFunction<number> = (value) => {
  if (typeof value === "number") return { ok: true, value };

  return {
    error: new DecodeError("Expected number", {
      args: { expected: "number", received: typeOf(value) },
      template: "",
      type: "number",
    }),
    ok: false,
  };
};

const decodeStringFunc: DecodeFunction<string> = (value) => {
  if (typeof value === "string") return { ok: true, value };

  return {
    error: new DecodeError("Expected string", {
      args: { expected: "string", received: typeOf(value) },
      template: "",
      type: "string",
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
export const boolean = (): Decoder<boolean, Issues<TypeOf<boolean>>> => {
  return new _Decoder(decodeBooleanFunc);
};

/**
 * A decoder that always returns the same value.
 *
 * @template {boolean | number | string} T The type of the value.
 * @param {T} expected The value to return.
 * @returns {Decoder<T>} A decoder that always returns the given value.
 */
export const constant = <T extends boolean | number | string>(
  expected: T
): Decoder<T, Issues<"constant">> => new _Decoder(decodeConstantFunc(expected));

export const map = <
  T,
  U extends Array<Decoder<unknown>> = Array<Decoder<unknown>>
>(
  mapFunc: MapDecodeFunction<T, U>,
  ...decoders: U
): Decoder<MapDecodeResponse<MapDecodeFunction<T, U>>> => {};

/**
 * Create a decoder that always fails with the given message and issues.
 *
 * @template {Issues} T The type of the issues.
 * @param {string} message The failure message.
 * @param {T} [issues] Optional issues related to the failure.
 * @returns {Decoder<never, T>} A decoder that always fails with the given message and issues.
 */
export const failed = <T extends Issues>(
  message: string,
  issues?: T
): Decoder<never, T> =>
  new _Decoder<never, T>(decodeFiledFunc(message, issues));

/**
 * A decoder for integers.
 *
 * @returns {Decoder<number, Issues<TypeOf<number>>>} A decoder for integers.
 */
export const integer = (): Decoder<number, Issues<TypeOf<number>>> =>
  new _Decoder(decodeIntegerFunc);

/**
 * A decoder for numbers.
 *
 * @returns {Decoder<number, Issues<TypeOf<number>>>} A decoder for numbers.
 */
export const number = (): Decoder<number, Issues<TypeOf<number>>> =>
  new _Decoder(decodeNumberFunc);

/**
 * Create a decoder for an object.
 *
 * @template T The type of the object.
 * @template {ObjectDecoders<T>} U The type of the decoders.
 * @param {U} decoders The decoders for the object properties.
 * @returns {Decoder<ObjectDecodeResponse<U>, ObjectDecodeIssues<U>>} A decoder for the object.
 */
export const object = <
  T extends Record<string, unknown>,
  U extends
    | ObjectDecoders<T>
    | Record<string, Decoder<unknown>> = ObjectDecoders<T>
>(
  decoders: U
): Decoder<ObjectDecodeResponse<U>, ObjectDecodeIssues<U>> => {};

/**
 * Create a decoder that makes a decoder optional.
 *
 * @template T The type of the value.
 * @template {Issues<TypeOf<T>>} I The type of the issues.
 * @param {Decoder<T, I>} decoder The decoder to make optional.
 * @returns {Decoder<T | undefined, I>} A decoder that accepts either the original value or undefined.
 */
export const optional = <T, I extends Issues = Issues>(
  decoder: Decoder<T, I>
): Decoder<T | undefined, I> => new _Decoder((value) => {});

/**
 * A decoder for strings.
 *
 * @returns {Decoder<string, Issues<TypeOf<string>>>} A decoder for strings.
 */
export const string = (): Decoder<string, Issues<TypeOf<string>>> =>
  new _Decoder(decodeStringFunc);

/**
 * Create a decoder that always succeeds with the given value.
 *
 * @template T The type of the value.
 * @param {T} value The value to always return.
 * @returns {Decoder<T>} A decoder that always returns the given value.
 */
export const succeed = <T>(value: T): Decoder<T, never> =>
  new _Decoder<T, never>(decodeSucceedFunc(value));

/**
 * Create a decoder for a tuple.
 *
 * @template T The type of the tuple.
 * @template {Array<Decoder<unknown>> | TupleDecoders<T>} U The type of the decoders.
 * @param {...U} decoders The decoders for each tuple element.
 * @returns {Decoder<TupleDecodeResponse<U>>} A decoder for the tuple.
 */
export const tuple = <
  T extends unknown[],
  U extends Array<Decoder<unknown>> | TupleDecoders<T> = TupleDecoders<T>
>(
  ...decoders: U
): Decoder<TupleDecodeResponse<U>> => {
  // Implementation logic goes here
};

/**
 * Create a decoder that accepts any of the given decoders.
 *
 * @template T The type of the value.
 * @template {UnionDecoders<T>} U The type of the decoders.
 * @param {U} decoders The decoders to use.
 * @returns {Decoder<UnionDecodeResponse<U>>} A decoder that accepts any of the given decoders.
 */
export const union = <
  T,
  U extends Array<Decoder<unknown>> | UnionDecoders<T> = UnionDecoders<T>
>(
  ...decoders: U
): Decoder<UnionDecodeResponse<U>> => {};

export const value = <T = unknown>(): Decoder<T> =>
  new _Decoder<T>(decodeValueFunc as DecodeFunction<T>);
