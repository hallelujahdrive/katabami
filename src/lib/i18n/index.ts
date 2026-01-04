import type { InitOptions, Namespace } from "i18next";
import en from "./locales/en.json" with { type: "json" };
import ja from "./locales/ja.json" with { type: "json" };

/**
 * Supported language resources
 */
export const i18nResources = {
	en,
	ja,
} as const;

/**
 * Supported languages
 */
export type Language = ({} & string) | CommonLanguage;

/**
 * i18n resource
 */
export type Resource = { [key in Language]: ResourceLanguage };

/**
 * Resource language
 */
export type ResourceLanguage = (typeof i18nResources)[CommonLanguage];

type CommonLanguage = keyof typeof i18nResources;

const mergeNamespaces = (
	defaultNamespaces?: Namespace<string>,
	namespaces?: Namespace<string>,
): Namespace<string> | undefined => {
	if (defaultNamespaces == null || namespaces == null)
		return namespaces ?? defaultNamespaces;

	const _defaultNamespaces = Array.isArray(defaultNamespaces)
		? defaultNamespaces
		: [defaultNamespaces];
	const _namespaces = Array.isArray(namespaces) ? namespaces : [namespaces];

	return [...new Set([..._defaultNamespaces, ..._namespaces])];
};

const mergeFallbackNamespaces = (
	defaultNamespaces?: false | Namespace<string>,
	namespaces?: false | Namespace<string>,
): false | Namespace<string> | undefined => {
	if (defaultNamespaces === false) return namespaces;
	if (namespaces === false) return defaultNamespaces;

	return mergeNamespaces(defaultNamespaces, namespaces);
};

const mergePreload = (
	defaultPreload?: InitOptions["preload"],
	preload?: InitOptions["preload"],
): InitOptions["preload"] | undefined => {
	if (defaultPreload == null || preload == null)
		return preload ?? defaultPreload;

	if (defaultPreload === false) return preload;
	if (preload === false) return defaultPreload;

	// Always return an array
	return mergeNamespaces(defaultPreload, preload) as InitOptions["preload"];
};

/**
 * Merges two resource objects into one.
 *
 * If either of the arguments is `undefined`, the other argument is returned.
 *
 * @param {InitOptions["resources"] | undefined} defaultResources - The default resource object.
 * @param {InitOptions["resources"] | undefined} resources - The resource object to merge into the default resources.
 * @returns {InitOptions["resources"] | undefined} - The merged resource object.
 */
const mergeResources = (
	defaultResources?: InitOptions["resources"],
	resources?: InitOptions["resources"],
): InitOptions["resources"] | undefined => {
	if (defaultResources == null || resources == null)
		return resources ?? defaultResources;

	return Object.fromEntries(
		Object.entries(defaultResources).map(([key, value]) => [
			key,
			{
				// If the key is present in the resources object, merge the values.
				// Otherwise, use the value from the default resources object.
				...value,
				...resources[key],
			},
		]),
	);
};

const mergeInitOptions = (
	defaultInitOptions: InitOptions,
	initOptions: InitOptions,
): InitOptions => {
	return {
		...defaultInitOptions,
		...initOptions,
		defaultNS: mergeFallbackNamespaces(
			defaultInitOptions.defaultNS,
			initOptions.defaultNS,
		),
		fallbackNS: mergeFallbackNamespaces(
			defaultInitOptions.fallbackNS,
			initOptions.fallbackNS,
		),
		ns: mergeNamespaces(defaultInitOptions.ns, initOptions.ns),
		preload: mergePreload(defaultInitOptions.preload, initOptions.preload),
		resources: mergeResources(
			defaultInitOptions.resources,
			initOptions.resources,
		),
	};
};

const buildResources = (
	ns: string,
	resources: Resource,
): InitOptions["resources"] => {
	return Object.fromEntries(
		Object.entries(resources).map(([key, value]) => [
			key,
			{
				[ns]: value,
			},
		]),
	);
};

/**
 * Sets up the initialization options for the i18next library.
 *
 * @param {string} [ns] - The namespace of Katabami.
 * @returns {InitOptions} - The set up initialization options.
 */
export function setupI18nInitOptions(ns?: string): InitOptions;

/**
 * Sets up the initialization options for the i18next library.
 *
 * @param {InitOptions} [initOptions] - The initialization options.
 * @param {string} [ns] - The namespace of Katabami.
 * @returns {InitOptions} - The set up initialization options.
 */
export function setupI18nInitOptions(
	initOptions: InitOptions,
	ns?: string,
): InitOptions;

export function setupI18nInitOptions(
	arg0?: InitOptions | string,
	arg1?: string,
): InitOptions {
	const initOptions: InitOptions = typeof arg0 === "object" ? arg0 : {};
	const ns = (typeof arg0 === "object" ? arg1 : arg0) ?? "__katabami";

	return mergeInitOptions(initOptions, {
		fallbackNS: [ns],
		katabamiNS: ns,
		resources: buildResources(ns, i18nResources),
	});
}
