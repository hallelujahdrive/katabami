import type { StandardJSONSchemaV1 } from "./standardJsonSchema";

/**
 * A JSON Schema document as a plain object.
 */
export type JsonSchema = Record<string, unknown>;

/**
 * Options for {@link toJsonSchema}.
 */
export type ToJsonSchemaOptions = {
	/** Explicit support for additional vendor-specific parameters, if needed. */
	readonly libraryOptions?: Record<string, unknown> | undefined;
	/**
	 * Target JSON Schema dialect.
	 * @default "draft-2020-12"
	 */
	readonly target?: StandardJSONSchemaV1.Target;
};

/**
 * Targets supported by this package.
 */
export const SUPPORTED_TARGETS = [
	"draft-07",
	"draft-2020-12",
	"openapi-3.0",
] as const satisfies readonly StandardJSONSchemaV1.Target[];

export type SupportedTarget = (typeof SUPPORTED_TARGETS)[number];
