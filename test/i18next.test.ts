import i18next, { t } from "i18next";
import { beforeAll, describe, expect, test } from "vitest";

import {
	boolean,
	constant,
	DecodeError,
	integer,
	issueMessage,
	object,
	setupI18nInitOptions,
	string,
} from "../src/index.js";

describe("i18next", () => {
	beforeAll(async () => {
		await i18next.init(
			setupI18nInitOptions({ fallbackLng: "en", supportedLngs: ["en", "ja"] }),
		);
	});

	describe("boolean", () => {
		const decoder = boolean();

		describe("decode value", () => {
			test("en", () => {
				const result = decoder.decodeValue("foo");

				const expectedResult = { error: expect.any(DecodeError), ok: false };

				expect(result).toStrictEqual(expectedResult);
				expect(issueMessage(result.error?.issues)?.toString(t)).toBe(
					"A boolean is expected, but the value is a string.",
				);
			});

			test("ja", () => {
				const result = decoder.decodeValue("foo");

				const expectedResult = { error: expect.any(DecodeError), ok: false };

				expect(result).toStrictEqual(expectedResult);
				expect(
					issueMessage(result.error?.issues)?.toString(t, { lng: "ja" }),
				).toBe("真偽値が期待されていますが、値は文字列です。");
			});
		});

		describe("decode string", () => {
			test("en", () => {
				const result = decoder.decodeValue("foo");

				const expectedResult = { error: expect.any(DecodeError), ok: false };

				expect(result).toStrictEqual(expectedResult);
				expect(issueMessage(result.error?.issues)?.toString(t)).toBe(
					"A boolean is expected, but the value is a string.",
				);
			});

			test("ja", () => {
				const result = decoder.decodeValue("foo");

				const expectedResult = { error: expect.any(DecodeError), ok: false };

				expect(result).toStrictEqual(expectedResult);
				expect(
					issueMessage(result.error?.issues)?.toString(t, { lng: "ja" }),
				).toBe("真偽値が期待されていますが、値は文字列です。");
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
		const decoder = object({
			bar: integer(),
			foo: string(),
		});

		describe("decode value", () => {
			test("en", () => {
				const result = decoder.decodeValue({
					bar: "1",
					foo: "foo",
				});

				const expectedResult = { error: expect.any(DecodeError), ok: false };

				expect(result).toStrictEqual(expectedResult);
				expect(issueMessage(result.error?.issues?.bar)?.toString(t)).toBe(
					"A number is expected, but the value is a string.",
				);
			});

			test("ja", () => {
				const result = decoder.decodeValue("foo");

				const expectedResult = { error: expect.any(DecodeError), ok: false };

				expect(result).toStrictEqual(expectedResult);
				expect(
					issueMessage(result.error?.issues)?.toString(t, { lng: "ja" }),
				).toBe("オブジェクトが期待されていますが、値は文字列です。");
			});
		});

		describe("decode string", () => {
			test("en", () => {
				const result = decoder.decodeValue("foo");

				const expectedResult = { error: expect.any(DecodeError), ok: false };

				expect(result).toStrictEqual(expectedResult);
				expect(issueMessage(result.error?.issues)?.toString(t)).toBe(
					"An object is expected, but the value is a string.",
				);
			});

			test("ja", () => {
				const result = decoder.decodeValue("foo");

				const expectedResult = { error: expect.any(DecodeError), ok: false };

				expect(result).toStrictEqual(expectedResult);
				expect(
					issueMessage(result.error?.issues)?.toString(t, { lng: "ja" }),
				).toBe("オブジェクトが期待されていますが、値は文字列です。");
			});
		});
	});
});
