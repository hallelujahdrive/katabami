import type { DecodeErrorInterface } from "../types/decoder.js";
import type { Issues } from "../types/issue.js";

export class DecodeError<T extends Issues>
	extends Error
	implements DecodeErrorInterface<T>
{
	constructor(
		message: string,
		public readonly issues: T,
	) {
		super(message);

		this.name = "DecodeError";
	}
}
