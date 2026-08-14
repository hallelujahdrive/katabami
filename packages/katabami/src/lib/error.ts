import type { DecodeErrorInterface } from "../types/decoder";
import type { Issues } from "../types/issue";

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
