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
