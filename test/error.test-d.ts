import { describe, expectTypeOf, test } from "vitest";

import {
	type Decoder,
	type Issues,
	type IssueType,
	katabami,
	type Primitive,
	type Resolved,
	type Result,
} from "../src/index.js";

type DecodeResult<T extends Decoder<unknown, Issues>> = Resolved<
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
		const _decoder = katabami.array(katabami.int());

		test("issue message", () => {
			expectTypeOf<GetVars<DecodeResult<typeof _decoder>>>().toEqualTypeOf<{
				expected: string;
				received: string;
			}>();
		});

		test("array decode issues", () => {
			expectTypeOf<GetIssues<DecodeResult<typeof _decoder>>>().toEqualTypeOf<{
				readonly [key: number]: Record<never, never>;
			}>();
		});
	});

	test("boolean", () => {
		const _decoder = katabami.boolean();

		expectTypeOf<GetVars<DecodeResult<typeof _decoder>>>().toEqualTypeOf<{
			expected: string;
			received: string;
		}>();
	});

	test("constant", () => {
		const _decoder = katabami.constant("foo");

		expectTypeOf<GetVars<DecodeResult<typeof _decoder>>>().toEqualTypeOf<{
			expected: "foo";
			received: Primitive;
		}>();
	});

	test("int", () => {
		const _decoder = katabami.int();

		expectTypeOf<GetVars<DecodeResult<typeof _decoder>>>().toEqualTypeOf<{
			expected: string;
			received: string;
		}>();
	});

	test("float", () => {
		const _decoder = katabami.float();

		expectTypeOf<GetVars<DecodeResult<typeof _decoder>>>().toEqualTypeOf<{
			expected: string;
			received: string;
		}>();
	});

	test("string", () => {
		const _decoder = katabami.string();

		expectTypeOf<GetVars<DecodeResult<typeof _decoder>>>().toEqualTypeOf<{
			expected: string;
			received: string;
		}>();
	});

	describe("object", () => {
		describe("flattened", () => {
			const _decoder = katabami.object({
				bar: katabami.int(),
				foo: katabami.string(),
			});

			test("issue message", () => {
				expectTypeOf<GetVars<DecodeResult<typeof _decoder>>>().toEqualTypeOf<{
					expected: string;
					received: string;
				}>();
			});

			test("object decode issues", () => {
				expectTypeOf<GetIssues<DecodeResult<typeof _decoder>>>().toEqualTypeOf<{
					readonly bar?: Record<never, never>;
					readonly foo?: Record<never, never>;
				}>();
			});
		});

		describe("nested", () => {
			const _decoder = katabami.object({
				bar: katabami.object({
					foo: katabami.string(),
				}),
			});

			test("issue message", () => {
				expectTypeOf<GetVars<DecodeResult<typeof _decoder>>>().toEqualTypeOf<{
					expected: string;
					received: string;
				}>();
			});

			test("object decode issues", () => {
				expectTypeOf<GetIssues<DecodeResult<typeof _decoder>>>().toEqualTypeOf<{
					readonly bar?: {
						readonly foo?: Record<never, never>;
					};
				}>();
			});
		});
	});

	describe("tuple", () => {
		const _decoder = katabami.tuple(katabami.int(), katabami.string());

		test("issue message", () => {
			expectTypeOf<GetVars<DecodeResult<typeof _decoder>>>().toEqualTypeOf<{
				expected: string;
				received: string;
			}>();
		});

		test("tuple decode issues", () => {
			expectTypeOf<GetIssues<DecodeResult<typeof _decoder>>>().toEqualTypeOf<
				| {
						readonly 0?: Record<never, never>;
						readonly 1?: Record<never, never>;
				  }
				| Record<never, never>
			>();
		});
	});

	describe("map", () => {
		const _decoder = katabami.map(
			(foo, bar) => ({ ...foo, ...bar }),
			katabami.object({ foo: katabami.float() }),
			katabami.object({ bar: katabami.string() }),
		);

		test("issue message", () => {
			expectTypeOf<GetVars<DecodeResult<typeof _decoder>>>().toEqualTypeOf<{
				expected: string;
				received: string;
			}>();
		});

		test("map decode issues", () => {
			expectTypeOf<GetIssues<DecodeResult<typeof _decoder>>>().toEqualTypeOf<
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
