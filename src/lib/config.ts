import type { KatabamiConfig, MessageResources } from "../types/index.js";

/**
 * The default message resources.
 */
const defaultMessageResources = {
	issue: {
		failedToDecode: "Failed to decode.",
		unexpectedValue:
			"A {{expected}} is expected, but the value is a {{received}}.",
	},
	type: {
		array: "array",
		bigint: "bigint",
		boolean: "boolean",
		decimal: "decimal",
		float: "float",
		function: "function",
		integer: "integer",
		null: "null",
		number: "number",
		object: "object",
		string: "string",
		symbol: "symbol",
		undefined: "undefined",
	},
} as const satisfies MessageResources;

/**
 * The default configuration.
 */
export const defaultConfig = {
	/**
	 * The default message resources.
	 */
	messages: defaultMessageResources,
} as const satisfies KatabamiConfig;
