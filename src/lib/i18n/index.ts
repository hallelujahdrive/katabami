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

type CommonLanguage = keyof typeof i18nResources;

/**
 * Supported languages
 */
export type Language = ({} & string) | CommonLanguage;

/**
 * Resource language
 */
export type ResourceLanguage = (typeof i18nResources)[CommonLanguage];

/**
 * i18n resource
 */
export type Resource = { [key in Language]: ResourceLanguage };

/**
 * Interface for locale resources
 */
interface ResourceInterface {
	[key: string]: ResourceInterface | string;
}

/**
 * Prefixes keys with their hierarchical path
 */
type Prefix<T extends null | string> = T extends string ? `${T}.` : "";

/**
 * Recursively generates locale templates by prefixing keys with their hierarchical path
 */
type ResourceTemplateInterface<
	T extends ResourceInterface,
	U extends null | string = null,
> = {
	[key in keyof T]: T[key] extends string
		? `${Prefix<U>}${key extends symbol ? string : key}`
		: T[key] extends ResourceInterface
			? ResourceTemplateInterface<
					T[key],
					`${Prefix<U>}${key extends symbol ? string : key}`
				>
			: never;
};

/**
 * Recursively generates locale templates by prefixing keys with their hierarchical path.
 *
 * @template T - The type extending ResourceInterface.
 * @param {T} resource - The resource object containing locale entries.
 * @param {string} [objectKey] - The key to use as prefix for nested objects.
 * @returns {T} - The transformed resource with prefixed keys.
 */
const generateLocaleTemplates = <
	T extends ResourceInterface,
	U extends null | string = null,
>(
	resource: T,
	objectKey?: U,
): ResourceTemplateInterface<T, U> => {
	const prefix = objectKey == null ? "" : `${objectKey}.`;

	return Object.fromEntries(
		Object.entries(resource).map(([key, value]) => [
			key,
			typeof value === "string"
				? `${prefix}${key}`
				: generateLocaleTemplates(value, `${prefix}${key}`),
		]),
	) as ResourceTemplateInterface<T, U>;
};

/**
 * Language templates
 */
export const resourceLanguageTemplates = generateLocaleTemplates(
	i18nResources.ja,
);

const mergeNamespaces = (
	defaultNamespaces?: Namespace,
	namespaces?: Namespace,
): Namespace | undefined => {
	if (defaultNamespaces == null || namespaces == null)
		return namespaces ?? defaultNamespaces;

	const _defaultNamespaces = Array.isArray(defaultNamespaces)
		? defaultNamespaces
		: [defaultNamespaces];
	const _namespaces = Array.isArray(namespaces) ? namespaces : [namespaces];

	return [...new Set([..._defaultNamespaces, ..._namespaces])];
};

const mergeFallbackNamespaces = (
	defaultNamespaces?: false | Namespace,
	namespaces?: false | Namespace,
): false | Namespace | undefined => {
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
