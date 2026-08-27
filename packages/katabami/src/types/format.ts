/**
 * This interface can be augmented to customize issue message keys.
 *
 * `@katabami/i18next` registers i18next `ParseKeys` here so `createIssues`
 * autocompletes the same keys as `t()`.
 *
 * @example
 * ```ts
 * declare module "katabami" {
 *   interface CustomTypeOptions {
 *     issueMessageKeys: import("i18next").ParseKeys;
 *   }
 * }
 * ```
 */
// biome-ignore lint/suspicious/noEmptyInterface: module augmentation target, same pattern as i18next CustomTypeOptions
export interface CustomTypeOptions {}

/**
 * The issue message keys.
 *
 * Falls back to built-in `issue.*` keys when nothing is registered, or when
 * the registered keys widen to `string` (i18next without typed resources).
 */
export type IssueMessageKeys = [RegisteredIssueMessageKeys] extends [never]
	? BuiltInIssueMessageKeys
	: string extends RegisteredIssueMessageKeys
		? BuiltInIssueMessageKeys
		: BuiltInIssueMessageKeys | RegisteredIssueMessageKeys;

/**
 * The message resources for Katabami.
 */
export type MessageResources = {
	/**
	 * The issue message resources for Katabami.
	 */
	issue: {
		/**
		 * The message for the issue when the decoding fails.
		 */
		failedToDecode: string;
		/**
		 * The message for the issue when one or more array elements are invalid.
		 */
		invalidArrayElements: string;
		/**
		 * The message for the issue when the index of the array is invalid.
		 */
		invalidArrayIndex: string;
		/**
		 * The message for the issue when the length of the array is invalid.
		 */
		invalidArrayLength: string;
		/**
		 * The message for the issue when one or more object properties fail validation.
		 */
		invalidObject: string;
		/**
		 * The message for the issue when an object property is invalid.
		 */
		invalidObjectField: string;
		/**
		 * The message for the issue when one or more record properties fail validation.
		 */
		invalidRecord: string;
		/**
		 * The message for the issue when the key of the record is invalid.
		 */
		invalidRecordKey: string;
		/**
		 * The message for the issue when none of the union members match.
		 */
		invalidUnion: string;
		/**
		 * The message for the issue when the value is unexpected.
		 */
		unexpectedType: string;
		/**
		 * The message for the issue when the value is unexpected.
		 */
		unexpectedValue: string;
	};

	/**
	 * The type names resources for Katabami.
	 */
	type: {
		/**
		 * The name for the type when the value is an array.
		 */
		array: string;
		/**
		 * The name for the type when the value is a bigint.
		 */
		bigint: string;
		/**
		 * The name for the type when the value is a boolean.
		 */
		boolean: string;
		/**
		 * The name for the type when the value is a decimal.
		 */
		decimal: string;
		/**
		 * The name for the type when the value is a float.
		 */
		float: string;
		/**
		 * The name for the type when the value is a function.
		 */
		function: string;
		/**
		 * The name for the type when the value is an integer.
		 */
		integer: string;
		/**
		 * The name for the type when the value is null.
		 */
		null: string;
		/**
		 * The name for the type when the value is a number.
		 */
		number: string;
		/**
		 * The name for the type when the value is an object.
		 */
		object: string;
		/**
		 * The name for the type when the value is a string.
		 */
		string: string;
		/**
		 * The name for the type when the value is a symbol.
		 */
		symbol: string;
		/**
		 * The name for the type when the value is undefined.
		 */
		undefined: string;
	};
};

/**
 * The type message keys.
 */
export type TypeKeys = `type.${keyof MessageResources["type"]}`;

/**
 * The built-in issue message keys.
 */
type BuiltInIssueMessageKeys = `issue.${keyof MessageResources["issue"]}`;

/**
 * Keys registered via {@link CustomTypeOptions.issueMessageKeys}.
 */
type RegisteredIssueMessageKeys = CustomTypeOptions extends {
	issueMessageKeys: infer Keys extends string;
}
	? Keys
	: never;
