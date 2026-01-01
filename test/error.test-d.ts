import { describe, expectTypeOf, test } from "vitest";

import {
	boolean,
	constant,
	type Decoder,
	float,
	type IssueMessage,
	type Issues,
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
	Result<unknown, infer I>,
]
	? I extends IssueMessage
		? never
		: NonNullable<I>
	: never;

type GetVars<T extends Result<unknown, Issues>> = [T] extends [
	Result<unknown, infer I>,
]
	? I extends IssueMessage
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
					readonly bar?: IssueMessage<
						"integer",
						{ expected: "type.integer" | "type.number"; received: string }
					>;
					readonly foo?: IssueMessage<
						"string",
						{ expected: "type.string"; received: string }
					>;
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
					readonly bar?:
						| {
								readonly foo?: IssueMessage<
									"string",
									{ expected: "type.string"; received: string }
								>;
						  }
						| IssueMessage<
								"object",
								{ expected: "type.object"; received: string }
						  >;
				}>();
			});
		});
	});
});
