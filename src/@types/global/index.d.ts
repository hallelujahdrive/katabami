export {};

declare global {
	interface JSON {
		parse(
			text: string,
			reviver?: (this: any, key: string, value: any) => unknown,
		): unknown;
	}
}
