import type { PostProcessorModule } from "i18next";
import { replaceArticle } from "../../utils/index.js";

/**
 * A post processor that replaces "a" with "an" and "an" with "a" in the value.
 * @param {string} ns - The namespace to process.
 * @returns {PostProcessorModule} The post processor.
 */
export function katabamiPostProcessor(
	_ns: string = "__katabami",
): PostProcessorModule {
	return {
		name: "katabamiPostProcessor",
		process: (value, _key, options) => {
			// if (options.ns !== ns) return value;
			if (options.lng !== "en") return value;

			// Replace "a" with "an" and "an" with "a" in the value.
			return replaceArticle(value);
		},
		type: "postProcessor",
	};
}
