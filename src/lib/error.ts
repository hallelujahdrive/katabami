import type { DecodeErrorInterface, Issues } from "../types/index.js";

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
