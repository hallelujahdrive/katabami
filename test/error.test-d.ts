import { describe, expectTypeOf, test } from "vitest";

import {
	boolean,
	constant,
	type Decoder,
	float,
	type Issues,
	type IssueType,
	integer,
	object,
	type Primitive,
	type Result,
	string,
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

	describe("Object", () => {
		describe("flattened object", () => {
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
				expectTypeOf<GetIssues<DecodeResult<typeof decoder>>>().toEqualTypeOf<{
					readonly bar?: Record<never, never>;
					readonly foo?: Record<never, never>;
				}>();
			});
		});

		describe("nested object", () => {
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
				expectTypeOf<GetIssues<DecodeResult<typeof decoder>>>().toEqualTypeOf<{
					readonly bar?: {
						readonly foo?: Record<never, never>;
					};
				}>();
			});
		});
	});
});
