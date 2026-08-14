/**
 * Checks if the value is a record.
 * @param {unknown} value - The value to check.
 * @returns {boolean} True if the value is a record, false otherwise.
 */
export const isRecord = (value?: unknown): value is Record<string, unknown> => {
	if (typeof value !== "object" || value == null) return false;

	if (Array.isArray(value)) return false;

	const proto = Object.getPrototypeOf(value);
	if (proto !== Object.prototype && proto != null) return false;

	return true;
};

/**
 * Replaces "a" with "an" and "an" with "a" in the value.
 * @param {string} value - The value to replace.
 * @returns {string} The replaced value.
 */
export const replaceArticle = (value: string): string => {
	return value
		.replace(/^A ([aeiou])/, "An $1")
		.replace(/(?<=\s)a ([aeiou])/, "an $1");
};
