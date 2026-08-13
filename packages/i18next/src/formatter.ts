import type { TFunction, TOptions } from "i18next";
import type { Formatter } from "katabami";

/**
 * Creates a formatter for the katabami.
 * @param {TFunction} t - The i18next t function.
 * @returns {Formatter} The formatter.
 */
export const createFormatter = (
	t: TFunction,
	tOptions?: TOptions,
): Formatter => {
	return (issue) => {
		const { message, vars } = issue;

		const translatedVars = vars
			? Object.fromEntries(
					Object.entries(vars).map(([key, value]) => {
						if (typeof value === "string") {
							return [key, t(value, tOptions)];
						}
						return [key, value];
					}),
				)
			: {};

		return t(message, { ...(tOptions ?? {}), ...translatedVars });
	};
};
