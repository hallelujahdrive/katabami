import type { MessageResources } from "../types/format.js";
import type { Formatter } from "../types/issue.js";
import type { Primitive } from "../types/primitive.js";

/**
 * The resource type.
 */
interface Resource {
	[key: string]: Resource | string;
}

/**
 * The formats.
 */
const formats: Record<string, (value: Primitive) => Primitive> = {
	quoteString: (value: Primitive) =>
		typeof value === "string" ? `"${value}"` : value,
};

/**
 * The default message resources.
 */
export const defaultMessageResources = {
	issue: {
		failedToDecode: "Failed to decode.",
		invalidArrayElements: "One or more array elements failed validation.",
		invalidArrayLength:
			"Expected array length {{expected}}, but received {{received}}.",
		invalidObject: "One or more object properties failed validation.",
		invalidUnion: "None of the union members matched.",
		missingField: 'Expected field "{{key}}", but received undefined.',
		outOfBounds: "Index {{index}} is out of bounds.",
		unexpectedType: "Expected {{expected}}, but received {{received}}.",
		unexpectedValue:
			"Expected {{expected, quoteString}}, but received {{received, quoteString}}.",
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
 * The default formatter.
 * @param {Issue} issue - The issue to format.
 * @returns {string} The formatted issue message.
 */
export const defaultFormatter: Formatter = (issue) => {
	const { message, vars } = issue;

	const template =
		getTemplate(message.split("."), defaultMessageResources) ?? message;

	return template.replace(/{{(.*?)}}/g, (_, p1) => {
		const [key, format] = p1.split(",").map((p: string) => p.trim());

		const value = vars?.[key];
		if (value == null || typeof value !== "string") {
			return value ?? key;
		}

		const _value =
			getTemplate(value.split("."), defaultMessageResources) ?? value;

		return formats[format]?.(_value) ?? _value;
	});
};

/**
 * Gets the template.
 * @param {string[]} keys - The keys to get the template.
 * @param {Resource} resource - The resource to get the template.
 * @returns {string | undefined} The template.
 */
const getTemplate = (
	keys: string[],
	resource: Resource,
): string | undefined => {
	if (keys.length === 0) {
		return undefined;
	}

	const [key, ...rest] = keys as [string, ...string[]];

	const value = resource[key];

	if (value == null || typeof value === "string") {
		return value;
	}

	return getTemplate(rest, value);
};
