import type { FormatterModule } from "i18next";
import type { Primitive } from "katabami";

/**
 * The format function for the quote string.
 * @param {Primitive} value - The value to format.
 * @returns {`"${string}"` | boolean | number} The formatted value.
 */
const quoteString = (value: Primitive): `"${string}"` | boolean | number =>
	typeof value === "string" ? `"${value}"` : value;

/**
 * The formatter module for the katabami.
 * @returns {FormatterModule} The formatter module.
 */
export const formatter: FormatterModule = {
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
