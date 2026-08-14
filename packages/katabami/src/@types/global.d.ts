export {};

declare global {
	interface JSON {
		parse(
			text: string,
			reviver?: (this: never, key: string, value: unknown) => unknown,
		): unknown;
	}
}
