import type { DefaultNamespace, FlatNamespace, ParseKeys } from "i18next";

type InferArrayValuesElseReturnType<T> = T extends (infer A)[] ? A : T;

type NormalizeIntoArray<T> = T extends readonly unknown[] ? T : [T];

/**
 * Same namespace list as `i18next.t`: default NS first, then the rest.
 * Enables both unprefixed keys and `namespace:key.value` completion.
 */
type TFunctionNamespaces = [
	...NormalizeIntoArray<DefaultNamespace>,
	...Exclude<FlatNamespace, InferArrayValuesElseReturnType<DefaultNamespace>>[],
];

declare module "katabami" {
	interface CustomTypeOptions {
		issueMessageKeys: ParseKeys<TFunctionNamespaces>;
	}
}
