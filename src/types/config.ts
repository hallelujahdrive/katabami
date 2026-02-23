/**
 * The configuration for Katabami.
 */
export type KatabamiConfig = {
	/**
	 * The message resources for Katabami.
	 */
	messages?: MessageResources;
};

/**
 * The message resources for Katabami.
 */
export type MessageResources = {
	/**
	 * The issue message resources for Katabami.
	 */
	issue?: {
		/**
		 * The message for the issue when the decoding fails.
		 */
		failedToDecode?: string;
		/**
		 * The message for the issue when the value is unexpected.
		 */
		unexpectedValue?: string;
	};

	/**
	 * The type names resources for Katabami.
	 */
	type?: {
		/**
		 * The name for the type when the value is an array.
		 */
		array?: string;
		/**
		 * The name for the type when the value is a bigint.
		 */
		bigint?: string;
		/**
		 * The name for the type when the value is a boolean.
		 */
		boolean?: string;
		/**
		 * The name for the type when the value is a decimal.
		 */
		decimal?: string;
		/**
		 * The name for the type when the value is a float.
		 */
		float?: string;
		/**
		 * The name for the type when the value is a function.
		 */
		function?: string;
		/**
		 * The name for the type when the value is an integer.
		 */
		integer?: string;
		/**
		 * The name for the type when the value is null.
		 */
		null?: string;
		/**
		 * The name for the type when the value is a number.
		 */
		number?: string;
		/**
		 * The name for the type when the value is an object.
		 */
		object?: string;
		/**
		 * The name for the type when the value is a string.
		 */
		string?: string;
		/**
		 * The name for the type when the value is a symbol.
		 */
		symbol?: string;
		/**
		 * The name for the type when the value is undefined.
		 */
		undefined?: string;
	};
};
