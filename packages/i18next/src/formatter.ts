import type { TFunction, TOptions } from "i18next";
import type { Formatter } from "katabami";

type Translate = (key: string, options?: TOptions) => string;

/**
 * Creates a formatter for the katabami.
 * @param {TFunction} t - The i18next t function.
 * @returns {Formatter} The formatter.
 */
export const createFormatter = (
	t: TFunction,
	tOptions?: TOptions,
): Formatter => {
	// i18next 27 overloads do not overlap a plain (key, options) call.
	const translate = t as unknown as Translate;

	return (issue) => {
		const { message, vars } = issue;

		const translatedVars = vars
			? Object.fromEntries(
					Object.entries(vars).map(([key, value]) => {
						if (typeof value === "string") {
							return [key, translate(value, tOptions)];
						}
						return [key, value];
					}),
				)
			: {};

		return translate(message, {
			...tOptions,
			...translatedVars,
		});
	};
};
