import { describe, expectTypeOf, test } from "vitest";

import {
	type Decoder,
	type Issues,
	type IssueType,
	katabami,
	type Primitive,
	type Result,
} from "../src/index.js";

type DecodeResult<T extends Decoder<unknown, Issues>> = Awaited<
	ReturnType<T["decodeValue"]>
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
		? NonNullable<I["vars"]>
		: never
	: never;

describe("DecodeError", () => {
	describe("array", () => {
		const decoder = katabami.array(katabami.int());

		test("issue message", () => {
			expectTypeOf<GetVars<DecodeResult<typeof decoder>>>().toEqualTypeOf<{
				expected: string;
				received: string;
			}>();
		});

		test("array decode issues", () => {
			expectTypeOf<GetIssues<DecodeResult<typeof decoder>>>().toEqualTypeOf<{
				readonly [key: number]: Record<never, never>;
			}>();
		});
	});

	test("boolean", () => {
		const decoder = katabami.boolean();

		expectTypeOf<GetVars<DecodeResult<typeof decoder>>>().toEqualTypeOf<{
			expected: string;
			received: string;
		}>();
	});

	test("constant", () => {
		const decoder = katabami.constant("foo");

		expectTypeOf<GetVars<DecodeResult<typeof decoder>>>().toEqualTypeOf<{
			expected: "foo";
			received: Primitive;
		}>();
	});

	test("int", () => {
		const decoder = katabami.int();

		expectTypeOf<GetVars<DecodeResult<typeof decoder>>>().toEqualTypeOf<{
			expected: string;
			received: string;
		}>();
	});

	test("float", () => {
		const decoder = katabami.float();

		expectTypeOf<GetVars<DecodeResult<typeof decoder>>>().toEqualTypeOf<{
			expected: string;
			received: string;
		}>();
	});

	test("string", () => {
		const decoder = katabami.string();

		expectTypeOf<GetVars<DecodeResult<typeof decoder>>>().toEqualTypeOf<{
			expected: string;
			received: string;
		}>();
	});

	describe("object", () => {
		describe("flattened", () => {
			const decoder = katabami.object({
				bar: katabami.int(),
				foo: katabami.string(),
			});

			test("issue message", () => {
				expectTypeOf<GetVars<DecodeResult<typeof decoder>>>().toEqualTypeOf<{
					expected: string;
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

		describe("nested", () => {
			const decoder = katabami.object({
				bar: katabami.object({
					foo: katabami.string(),
				}),
			});

			test("issue message", () => {
				expectTypeOf<GetVars<DecodeResult<typeof decoder>>>().toEqualTypeOf<{
					expected: string;
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

	describe("tuple", () => {
		const decoder = katabami.tuple(katabami.int(), katabami.string());

		test("issue message", () => {
			expectTypeOf<GetVars<DecodeResult<typeof decoder>>>().toEqualTypeOf<{
				expected: string;
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

	describe("map", () => {
		const decoder = katabami.map(
			(foo, bar) => ({ ...foo, ...bar }),
			katabami.object({ foo: katabami.float() }),
			katabami.object({ bar: katabami.string() }),
		);

		test("issue message", () => {
			expectTypeOf<GetVars<DecodeResult<typeof decoder>>>().toEqualTypeOf<{
				expected: string;
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
