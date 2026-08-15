import type {
	DeserializedDecodeResult,
	Err,
	Decoder as IDecoder,
	Ok,
	Result,
	SerializedDecodeResult,
} from "../types/decoder";
import type { FlattenedIssues, Formatter, Issues } from "../types/issue";
import type { StandardSchemaV1 } from "../types/standardSchema";
import { DecodeError } from "./error";
import { flattenIssues, getIssueMessage, unflattenIssues } from "./issue";

type SerializedDecodeResultInput =
	| { issues: ReadonlyArray<StandardSchemaV1.Issue>; ok: false; value?: never }
	| { issues?: never; ok: true; value: unknown };

/**
 * Restores a {@link Result} from {@link serializeDecodeResult}.
 * {@link flattenIssues} brands the failure list, so typed issue paths come back
 * without a generic. After `JSON.parse`, pass `typeof decoder`:
 * `deserializeDecodeResult<typeof decoder>(parsed)`.
 *
 * @template {IDecoder<unknown, Issues, boolean>} D - Decoder used to restore typed issue paths.
 * @template S - The serialized result type.
 * @param {S} serialized - The serialized decode result.
 * @returns {DeserializedDecodeResult<S, D>} The restored result.
 */
export function deserializeDecodeResult<
	D extends IDecoder<unknown, Issues, boolean> = never,
	S extends SerializedDecodeResultInput = SerializedDecodeResultInput,
>(serialized: S): DeserializedDecodeResult<S, D> {
	if (serialized.ok) {
		return {
			ok: true,
			value: serialized.value,
		} as DeserializedDecodeResult<S, D>;
	}

	return {
		issues: unflattenIssues<D>(
			serialized.issues as ReadonlyArray<StandardSchemaV1.Issue>,
		),
		ok: false,
	} as DeserializedDecodeResult<S, D>;
}

/**
 * Converts a {@link Result} into a JSON-safe value.
 * Success is unchanged; failure issues are flattened like {@link flattenIssues}.
 *
 * @template T - The decoded value type.
 * @template {Issues} I - The issues type.
 * @param {Result<T, I>} result - The decode result.
 * @param {Formatter} [formatter] - The formatter to use when flattening issues.
 * @returns {SerializedDecodeResult<T, I>} The serializable result.
 */
export function serializeDecodeResult<T>(
	result: Ok<T>,
	formatter?: Formatter,
): { issues?: never; ok: true; value: T };
export function serializeDecodeResult<I extends Issues>(
	result: Err<I>,
	formatter?: Formatter,
): { issues: FlattenedIssues<I>; ok: false; value?: never };
export function serializeDecodeResult<T, I extends Issues>(
	result: Result<T, I>,
	formatter?: Formatter,
): SerializedDecodeResult<T, I>;
export function serializeDecodeResult<T, I extends Issues>(
	result: Result<T, I>,
	formatter?: Formatter,
): SerializedDecodeResult<T, I> {
	if (result.ok) {
		return { ok: true, value: result.value };
	}

	return {
		issues: flattenIssues(result.issues, formatter),
		ok: false,
	};
}

/**
 * Returns the decoded value, or throws {@link DecodeError} when decoding failed.
 *
 * @template T - The decoded value type.
 * @template {Issues} I - The issues type.
 * @param {Result<T, I>} result - The decode result.
 * @param {Formatter | string} [message] - A custom error message, or a formatter for the issue message. Defaults to `"Failed to decode"`.
 * @returns {T} The decoded value.
 */
export function unwrapDecodeResult<T>(
	result: Ok<T>,
	message?: Formatter | string,
): T;
export function unwrapDecodeResult<I extends Issues>(
	result: Err<I>,
	message?: Formatter | string,
): never;
export function unwrapDecodeResult<T, I extends Issues>(
	result: Result<T, I>,
	message?: Formatter | string,
): T;
export function unwrapDecodeResult<T, I extends Issues>(
	result: Result<T, I>,
	message?: Formatter | string,
): T {
	if (result.ok) return result.value;

	throw new DecodeError(
		decodeErrorMessage(result.issues, message),
		result.issues,
	);
}

const decodeErrorMessage = (
	issues: Issues,
	message?: Formatter | string,
): string => {
	if (typeof message === "string") return message;
	if (message === undefined) return "Failed to decode";

	return getIssueMessage(issues)?.format(message) ?? "Failed to decode";
};
