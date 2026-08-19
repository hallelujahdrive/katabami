import type { FormatterModule } from "i18next";
import type { Primitive } from "katabami";

/**
 * The format function for the quote string.
 * @param {Primitive} value - The value to format.
 * @returns {"null" | `"${string}"` | boolean | number} The formatted value.
 */
const quoteString = (
	value: Primitive,
): "null" | `"${string}"` | boolean | number => {
	if (typeof value === "string") {
		return `"${value}"`;
	}

	if (value === null) {
		return "null";
	}

	return value;
};

/**
 * i18next plugin required when using `@katabami/i18next`.
 */
export const initKatabami: FormatterModule = {
	add: () => {},
	addCached: () => {},
	format: (value, format) => {
		switch (format) {
			case "quoteString":
				return quoteString(value);
			default:
				return value;
		}
	},
	init: () => {},
	type: "formatter",
};
