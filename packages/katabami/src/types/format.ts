import type { Issue } from "./decoder";

/**
 * The formatter function.
 */
export type Formatter = (issue: Issue) => string;

/**
 * The issue message keys.
 */
export type IssueMessageKeys = `issue.${keyof MessageResources["issue"]}`;

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
		 * The message for the issue when the length of the array is invalid.
		 */
		invalidArrayLength: string;
		/**
		 * The message for the issue when one or more object properties fail validation.
		 */
		invalidObject: string;
		/**
		 * The message for the issue when none of the union members match.
		 */
		invalidUnion: string;
		/**
		 * The message for the issue when the index is out of bounds.
		 */
		outOfBounds: string;
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
