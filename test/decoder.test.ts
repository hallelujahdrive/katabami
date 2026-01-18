import { describe, expect, test } from "vitest";

import {
	boolean,
	constant,
	DecodeError,
	integer,
	object,
	string,
	tuple,
	union,
} from "../src/index.js";

describe("decoder", () => {
	describe("boolean", () => {
		const decoder = boolean();

		describe("decode value", () => {
			test("success", () => {
				const result = decoder.decodeValue(true);

				const expectedResult = { ok: true, value: true };

				expect(result).toStrictEqual(expectedResult);
			});

			test("fail", () => {
				const result = decoder.decodeValue("foo");

				const expectedResult = { error: expect.any(DecodeError), ok: false };

				expect(result).toStrictEqual(expectedResult);
			});
		});

		describe("decode string", () => {
			test("success", () => {
				const result = decoder.decodeString("true");

				const expectedResult = { ok: true, value: true };

				expect(result).toStrictEqual(expectedResult);
			});

			test("fail", () => {
				const result = decoder.decodeValue("foo");

				const expectedResult = { error: expect.any(DecodeError), ok: false };

				expect(result).toStrictEqual(expectedResult);
			});
		});
	});

	describe("constant", () => {
		const decoder = constant("foo");

		describe("decode value", () => {
			test("success", () => {
				const result = decoder.decodeValue("foo");

				const expectedResult = { ok: true, value: "foo" };

				expect(result).toStrictEqual(expectedResult);
			});

			test("fail", () => {
				const result = decoder.decodeValue("bar");

				const expectedResult = { error: expect.any(DecodeError), ok: false };

				expect(result).toStrictEqual(expectedResult);
			});
		});

		describe("decode string", () => {
			test("success", () => {
				const result = decoder.decodeString('"foo"');

				const expectedResult = { ok: true, value: "foo" };

				expect(result).toStrictEqual(expectedResult);
			});

			test("fail", () => {
				const result = decoder.decodeString('"bar"');

				const expectedResult = { error: expect.any(DecodeError), ok: false };

				expect(result).toStrictEqual(expectedResult);
			});
		});
	});

	describe("object", () => {
		describe("flattened object", () => {
			const decoder = object({
				bar: integer(),
				foo: string(),
			});

			describe("decode value", () => {
				test("success", () => {
					const result = decoder.decodeValue({
						bar: 1,
						foo: "foo",
					});

					const expectedResult = { ok: true, value: { bar: 1, foo: "foo" } };

					expect(result).toStrictEqual(expectedResult);
				});

				test("fail", () => {
					const result = decoder.decodeValue({
						bar: "1",
						foo: "foo",
					});

					const expectedResult = { error: expect.any(DecodeError), ok: false };

					expect(result).toStrictEqual(expectedResult);
				});
			});

			describe("decode string", () => {
				test("success", () => {
					const result = decoder.decodeString('{"bar":1,"foo":"foo"}');

					const expectedResult = { ok: true, value: { bar: 1, foo: "foo" } };

					expect(result).toStrictEqual(expectedResult);
				});

				test("fail", () => {
					const result = decoder.decodeString('{"bar":"1","foo":"foo"}');

					const expectedResult = { error: expect.any(DecodeError), ok: false };

					expect(result).toStrictEqual(expectedResult);
				});
			});
		});
	});

	describe("nested object", () => {
		const decoder = object({
			bar: object({
				foo: string(),
			}),
		});

		describe("decode value", () => {
			test("success", () => {
				const result = decoder.decodeValue({
					bar: {
						foo: "foo",
					},
				});

				const expectedResult = { ok: true, value: { bar: { foo: "foo" } } };

				expect(result).toStrictEqual(expectedResult);
			});

			test("fail", () => {
				const result = decoder.decodeValue({
					bar: "1",
					foo: "foo",
				});

				const expectedResult = { error: expect.any(DecodeError), ok: false };

				expect(result).toStrictEqual(expectedResult);
			});
		});

		describe("decode string", () => {
			test("success", () => {
				const result = decoder.decodeString('{"bar":{"foo":"foo"}}');

				const expectedResult = { ok: true, value: { bar: { foo: "foo" } } };

				expect(result).toStrictEqual(expectedResult);
			});

			test("fail", () => {
				const result = decoder.decodeString('{"bar":"1","foo":"foo"}');

				const expectedResult = { error: expect.any(DecodeError), ok: false };

				expect(result).toStrictEqual(expectedResult);
			});
		});
	});

	describe("string", () => {
		const decoder = string();

		describe("decode value", () => {
			test("success", () => {
				const result = decoder.decodeValue("foo");

				const expectedResult = { ok: true, value: "foo" };

				expect(result).toStrictEqual(expectedResult);
			});

			test("fail", () => {
				const result = decoder.decodeValue(true);

				const expectedResult = { error: expect.any(DecodeError), ok: false };

				expect(result).toStrictEqual(expectedResult);
			});
		});

		describe("decode string", () => {
			test("success", () => {
				const result = decoder.decodeString('"foo"');

				const expectedResult = { ok: true, value: "foo" };

				expect(result).toStrictEqual(expectedResult);
			});

			test("fail", () => {
				const result = decoder.decodeString("true");

				const expectedResult = { error: expect.any(DecodeError), ok: false };

				expect(result).toStrictEqual(expectedResult);
			});
		});
	});

	describe("tuple", () => {
		const decoder = tuple(string(), integer());

		describe("decode value", () => {
			test("success", () => {
				const result = decoder.decodeValue(["foo", 1]);

				const expectedResult = { ok: true, value: ["foo", 1] };

				expect(result).toStrictEqual(expectedResult);
			});

			test("fail", () => {
				const result = decoder.decodeValue([true, 1]);

				const expectedResult = { error: expect.any(DecodeError), ok: false };

				expect(result).toStrictEqual(expectedResult);
			});
		});

		describe("decode string", () => {
			test("success", () => {
				const result = decoder.decodeString('["foo",1]');

				const expectedResult = { ok: true, value: ["foo", 1] };

				expect(result).toStrictEqual(expectedResult);
			});

			test("fail", () => {
				const result = decoder.decodeString("[true,1]");

				const expectedResult = { error: expect.any(DecodeError), ok: false };

				expect(result).toStrictEqual(expectedResult);
			});
		});
	});

	describe("union", () => {
		const decoder = union(string(), integer());

		describe("decode value", () => {
			test("success", () => {
				const result = decoder.decodeValue("foo");

				const expectedResult = { ok: true, value: "foo" };

				expect(result).toStrictEqual(expectedResult);
			});

			test("fail", () => {
				const result = decoder.decodeValue(true);

				const expectedResult = { error: expect.any(DecodeError), ok: false };

				expect(result).toStrictEqual(expectedResult);
			});
		});

		describe("decode string", () => {
			test("success", () => {
				const result = decoder.decodeString('"foo"');

				const expectedResult = { ok: true, value: "foo" };

				expect(result).toStrictEqual(expectedResult);
			});

			test("fail", () => {
				const result = decoder.decodeString("true");

				const expectedResult = { error: expect.any(DecodeError), ok: false };

				expect(result).toStrictEqual(expectedResult);
			});
		});
	});
});
