import { describe, expectTypeOf, test } from "vitest";

import {
	boolean,
	constant,
	type Decoder,
	float,
	type Issues,
	type IssueType,
	integer,
	map,
	object,
	type Primitive,
	type Result,
	string,
	tuple,
} from "../src/index.js";

type DecodeResult<T extends Decoder<unknown, Issues>> = ReturnType<
	T["decodeValue"]
>;

type GetIssues<T extends Result<unknown, Issues>> = [T] extends [
	Result<unknown, infer Is>,
]
	? GetIssuesObject<Is>
	: never;

type GetIssuesObject<I extends Issues> =
	I extends Record<string, Issues>
		? { [k in keyof Omit<I, symbol>]: GetIssuesObject<I[k]> }
		: I;

type GetVars<T extends Result<unknown, Issues>> = [T] extends [
	Result<unknown, infer Is>,
]
	? Is extends Issues<IssueType, infer I>
		? ReturnType<NonNullable<I["getVars"]>>
		: never
	: never;

describe("DecodeError", () => {
	describe("Primitives", () => {
		test("boolean", () => {
			const decoder = boolean();

			expectTypeOf<GetVars<DecodeResult<typeof decoder>>>().toEqualTypeOf<{
				expected: "type.boolean";
				received: string;
			}>();
		});

		test("constant", () => {
			const decoder = constant("foo");

			expectTypeOf<GetVars<DecodeResult<typeof decoder>>>().toEqualTypeOf<{
				expected: Primitive;
				received: Primitive;
			}>();
		});

		test("integer", () => {
			const decoder = integer();

			expectTypeOf<GetVars<DecodeResult<typeof decoder>>>().toEqualTypeOf<{
				expected: "type.integer" | "type.number";
				received: string;
			}>();
		});

		test("float", () => {
			const decoder = float();

			expectTypeOf<GetVars<DecodeResult<typeof decoder>>>().toEqualTypeOf<{
				expected: "type.float";
				received: string;
			}>();
		});

		test("string", () => {
			const decoder = string();

			expectTypeOf<GetVars<DecodeResult<typeof decoder>>>().toEqualTypeOf<{
				expected: "type.string";
				received: string;
			}>();
		});
	});

	describe("Data Structures", () => {
		describe("object", () => {
			describe("flattened", () => {
				const decoder = object({
					bar: integer(),
					foo: string(),
				});

				test("issue message", () => {
					expectTypeOf<GetVars<DecodeResult<typeof decoder>>>().toEqualTypeOf<{
						expected: "type.object";
						received: string;
					}>();
				});

				test("object decode issues", () => {
					expectTypeOf<
						GetIssues<DecodeResult<typeof decoder>>
					>().toEqualTypeOf<{
						readonly bar?: Record<never, never>;
						readonly foo?: Record<never, never>;
					}>();
				});
			});

			describe("nested", () => {
				const decoder = object({
					bar: object({
						foo: string(),
					}),
				});

				test("issue message", () => {
					expectTypeOf<GetVars<DecodeResult<typeof decoder>>>().toEqualTypeOf<{
						expected: "type.object";
						received: string;
					}>();
				});

				test("object decode issues", () => {
					expectTypeOf<
						GetIssues<DecodeResult<typeof decoder>>
					>().toEqualTypeOf<{
						readonly bar?: {
							readonly foo?: Record<never, never>;
						};
					}>();
				});
			});
		});

		describe("tuple", () => {
			const decoder = tuple(integer(), string());

			test("issue message", () => {
				expectTypeOf<GetVars<DecodeResult<typeof decoder>>>().toEqualTypeOf<{
					expected: "type.array";
					received: string;
				}>();
			});

			test("tuple decode issues", () => {
				expectTypeOf<GetIssues<DecodeResult<typeof decoder>>>().toEqualTypeOf<
					| {
							readonly 0?: Record<never, never>;
							readonly 1?: Record<never, never>;
					  }
					| Record<never, never>
				>();
			});
		});
	});

	describe("Mapping", () => {
		describe("map", () => {
			const decoder = map(
				(foo, bar) => ({ ...foo, ...bar }),
				object({ foo: float() }),
				object({ bar: string() }),
			);

			test("issue message", () => {
				expectTypeOf<GetVars<DecodeResult<typeof decoder>>>().toEqualTypeOf<{
					expected: "type.object";
					received: string;
				}>();
			});

			test("map decode issues", () => {
				expectTypeOf<GetIssues<DecodeResult<typeof decoder>>>().toEqualTypeOf<
					| {
							readonly bar?: Record<never, never>;
					  }
					| {
							readonly foo?: Record<never, never>;
					  }
				>();
			});
		});
	});
});
