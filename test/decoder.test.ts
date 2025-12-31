import { describe, expect, test } from "vitest";

import { boolean, constant, DecodeError, string } from "../src/index.js";

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
});
