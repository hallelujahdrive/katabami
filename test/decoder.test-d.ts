import { describe, expectTypeOf, test } from "vitest";
import {
	constant,
	type Infer,
	map,
	number,
	object,
	optional,
	string,
	tuple,
	type TupleDecoders,
	union,
} from "../src/index.js";

describe("decoder", () => {
	describe("map", () => {
		test("fixed", () => {
			const _decoder = map<
        { bar: number; foo: number },
        TupleDecoders<[{ bar: number }, { foo: number }]>
      >(
      	(foo, bar) => Object.assign(foo, bar),
      	object({ bar: number() }),
      	object({ foo: number() })
      );

			expectTypeOf<Infer<typeof _decoder>>().toEqualTypeOf<{
        bar: number;
        foo: number;
      }>();
		});

		test("complement", () => {
			const _decoder = map(
				(foo, bar) => Object.assign(foo, bar),
				object({ foo: number() }),
				object({ bar: number() })
			);

			expectTypeOf<Infer<typeof _decoder>>().toEqualTypeOf<
        {
          bar: number;
        } & {
          foo: number;
        }
      >();
		});
	});

	describe("object", () => {
		test("fixed", () => {
			const _decoder = object<{ num: number; optionalStr?: string }>({
				num: number(),
				optionalStr: optional(string()),
			});

			expectTypeOf<Infer<typeof _decoder>>().toEqualTypeOf<{
        num: number;
        optionalStr: string | undefined;
      }>();
		});

		test("complement", () => {
			const _decoder = object({
				num: number(),
				optionalStr: optional(string()),
			});

			expectTypeOf<Infer<typeof _decoder>>().toEqualTypeOf<{
        num: number;
        optionalStr: string | undefined;
      }>();
		});
	});

	describe("optional", () => {
		test("fixed", () => {
			const _decoder = optional<number>(number());

			expectTypeOf<Infer<typeof _decoder>>().toEqualTypeOf<
        number | undefined
      >();
		});

		test("complement", () => {
			const _decoder = optional(number());

			expectTypeOf<Infer<typeof _decoder>>().toEqualTypeOf<
        number | undefined
      >();
		});
	});

	describe("tuple", () => {
		test("fixed", () => {
			const _decoder = tuple<["foo", "bar"]>(constant("foo"), constant("bar"));

			expectTypeOf<Infer<typeof _decoder>>().toEqualTypeOf<["foo", "bar"]>();
		});

		test("complement", () => {
			const _decoder = tuple(constant("foo"), constant("bar"));

			expectTypeOf<Infer<typeof _decoder>>().toEqualTypeOf<["foo", "bar"]>();
		});
	});

	describe("union", () => {
		test("fixed", () => {
			const _decoder = union<"bar" | "foo">(constant("bar"), constant("foo"));

			expectTypeOf<Infer<typeof _decoder>>().toEqualTypeOf<"bar" | "foo">();
		});

		test("complement", () => {
			const _decoder = union(constant("bar"), constant("foo"));

			expectTypeOf<Infer<typeof _decoder>>().toEqualTypeOf<"bar" | "foo">();
		});
	});
});
