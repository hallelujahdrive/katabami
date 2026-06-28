import { describe, expectTypeOf, test } from "vitest";

import {
	type Decoder,
	type Issue,
	type Issues,
	type IssueType,
	katabami,
	type ObjectDecodeIssues,
	type Primitive,
	type Resolved,
	type Result,
	type TupleDecodeIssues,
	type TypeKeys,
	type UnionDecodeIssues,
} from "../src/index.js";

type DecodeResult<T extends Decoder<unknown, Issues>> = Resolved<
	ReturnType<T["decodeValue"]>
>;

type ExtractIssue<I extends Issues> =
	I extends Issues<IssueType, infer Issue>
		? Issue
		: I extends UnionDecodeIssues<infer _, infer Issue>
			? Issue
			: I extends TupleDecodeIssues<infer _, infer Issue>
				? Issue
				: I extends ObjectDecodeIssues<
							Record<string, Decoder<unknown>>,
							infer Issue
						>
					? Issue
					: I extends infer U
						? U extends Issues
							? ExtractIssue<U>
							: never
						: never;

type GetIssues<T extends Result<unknown, Issues>> = [T] extends [
	Result<unknown, infer Is>,
]
	? GetIssuesObject<Is>
	: never;

type GetIssuesFromIssueTuple<T> = {
	readonly [K in keyof T as K extends `${number}`
		? K
		: never]: T[K] extends Issues ? GetIssuesObject<T[K]> : never;
};

type GetIssuesObject<I extends Issues> =
	I extends UnionDecodeIssues<infer _, infer __>
		? GetIssuesFromIssueTuple<I>
		: I extends Record<string, Issues>
			? { [k in keyof Omit<I, symbol>]: GetIssuesObject<I[k]> }
			: I;

type GetVars<T extends Decoder<unknown, Issues>> =
	IssueVars<
		ExtractIssue<T extends Decoder<unknown, infer I> ? I : never>
	> extends infer Vars
		? [Vars] extends [undefined]
			? undefined
			: NonNullable<Vars>
		: never;

type IssueVars<I> =
	I extends Issue<IssueType, string, infer Vars> ? Vars : never;

describe("DecodeError", () => {
	describe("array", () => {
		const _decoder = katabami.array(katabami.int());

		test("issue message", () => {
			expectTypeOf<GetVars<typeof _decoder>>().toEqualTypeOf<{
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

		expectTypeOf<GetVars<typeof _decoder>>().toEqualTypeOf<{
			expected: "type.boolean";
			received: string;
		}>();
	});

	test("constant", () => {
		const _decoder = katabami.constant("foo");

		expectTypeOf<GetVars<typeof _decoder>>().toEqualTypeOf<{
			expected: "foo";
			received: Primitive;
		}>();
	});

	test("int", () => {
		const _decoder = katabami.int();

		expectTypeOf<GetVars<typeof _decoder>>().toEqualTypeOf<{
			expected: "type.integer" | "type.number";
			received: string;
		}>();
	});

	test("float", () => {
		const _decoder = katabami.float();

		expectTypeOf<GetVars<typeof _decoder>>().toEqualTypeOf<{
			expected: "type.number";
			received: string;
		}>();
	});

	test("string", () => {
		const _decoder = katabami.string();

		expectTypeOf<GetVars<typeof _decoder>>().toEqualTypeOf<{
			expected: "type.string";
			received: string;
		}>();
	});

	describe("map", () => {
		const _decoder = katabami.map(
			(foo, bar) => ({ ...foo, ...bar }),
			katabami.object({ foo: katabami.float() }),
			katabami.object({ bar: katabami.string() }),
		);

		test("issue message", () => {
			expectTypeOf<GetVars<typeof _decoder>>().toEqualTypeOf<{
				expected: "type.object";
				received: TypeKeys;
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

	describe("object", () => {
		describe("flattened", () => {
			const _decoder = katabami.object({
				bar: katabami.int(),
				foo: katabami.string(),
			});

			test("issue message", () => {
				expectTypeOf<GetVars<typeof _decoder>>().toEqualTypeOf<{
					expected: "type.object";
					received: TypeKeys;
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
				expectTypeOf<GetVars<typeof _decoder>>().toEqualTypeOf<{
					expected: "type.object";
					received: TypeKeys;
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
			expectTypeOf<GetVars<typeof _decoder>>().toEqualTypeOf<
				| {
						expected: "type.array";
						received: TypeKeys;
				  }
				| {
						expected: number;
						received: number;
				  }
			>();
		});

		test("tuple decode issues", () => {
			expectTypeOf<GetIssues<DecodeResult<typeof _decoder>>>().toEqualTypeOf<{
				readonly 0?: Record<never, never>;
				readonly 1?: Record<never, never>;
			}>();
		});
	});

	describe("union", () => {
		const _decoder = katabami.union(katabami.int(), katabami.string());

		test("issue message", () => {
			expectTypeOf<GetVars<typeof _decoder>>().toEqualTypeOf<undefined>();
		});

		test("union decode issues", () => {
			expectTypeOf<GetIssues<DecodeResult<typeof _decoder>>>().toEqualTypeOf<{
				readonly 0: Record<never, never>;
				readonly 1: Record<never, never>;
			}>();
		});
	});
});
