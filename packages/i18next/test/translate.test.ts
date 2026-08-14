import i18next from "i18next";
import * as katabami from "katabami";
import {
	createIssues,
	DecodeError,
	flattenIssues,
	getIssueMessage,
	unflattenIssues,
} from "katabami";
import { describe, expect, test } from "vitest";
import { createFormatter } from "../src";

describe("translate", () => {
	const formatter = createFormatter(i18next.t, { lng: "ja" });

	describe("array decoder", () => {
		const decoder = katabami.array(katabami.string());

		test("unexpected type", () => {
			const result = decoder.decodeValue(1);

			expect(
				getIssueMessage(result.error?.issues)?.format(formatter),
			).toStrictEqual("配列が期待されましたが、数値でした。");
		});

		test("unexpected value", () => {
			const result = decoder.decodeValue([1]);

			expect(
				getIssueMessage(result.error?.issues?.[0])?.format(formatter),
			).toStrictEqual("文字列が期待されましたが、数値でした。");
		});
	});

	describe("oneOrMore decoder", () => {
		const decoder = katabami.oneOrMore(katabami.string());

		test("empty array", () => {
			const result = decoder.decodeValue([]);

			expect(
				getIssueMessage(result.error?.issues)?.format(formatter),
			).toStrictEqual("配列の長さは1が期待されましたが、0でした。");
		});
	});

	describe("boolean decoder", () => {
		const decoder = katabami.boolean();

		test("unexpected type", () => {
			const result = decoder.decodeValue("foo");

			expect(
				getIssueMessage(result.error?.issues)?.format(formatter),
			).toStrictEqual("真偽値が期待されましたが、文字列でした。");
		});
	});

	describe("constant decoder", () => {
		const decoder = katabami.constant("foo");

		test("unexpected type", () => {
			const result = decoder.decodeValue(1);

			expect(
				getIssueMessage(result.error?.issues)?.format(formatter),
			).toStrictEqual('"foo"が期待されましたが、1でした。');
		});

		test("null constant", () => {
			const result = katabami.constant(null).decodeValue("foo");

			expect(
				getIssueMessage(result.error?.issues)?.format(formatter),
			).toStrictEqual('nullが期待されましたが、"foo"でした。');
		});
	});

	describe("failed decoder", () => {
		const decoder = katabami.failed();

		test("default message", () => {
			const result = decoder.decodeValue("foo");

			expect(
				getIssueMessage(result.error?.issues)?.format(formatter),
			).toStrictEqual("デコードに失敗しました。");
		});
	});

	describe("field decoder", () => {
		const decoder = katabami.field("foo", katabami.string());

		test("unexpected type", () => {
			const result = decoder.decodeValue(1);

			expect(result).toStrictEqual({
				error: expect.any(DecodeError),
				ok: false,
			});

			expect(
				getIssueMessage(result.error?.issues)?.format(formatter),
			).toStrictEqual("オブジェクトが期待されましたが、数値でした。");
		});

		test("missing field", () => {
			const result = decoder.decodeValue({});

			expect(result).toStrictEqual({
				error: expect.any(DecodeError),
				ok: false,
			});

			expect(
				getIssueMessage(result.error?.issues)?.format(formatter),
			).toStrictEqual(
				'オブジェクトプロパティ"foo"のバリデーションに失敗しました。',
			);
		});

		describe("optional field", () => {
			const decoder = katabami.field(
				"foo",
				katabami.optional(katabami.string()),
			);

			test("missing field", () => {
				const result = decoder.decodeValue({});

				expect(result).toStrictEqual({
					ok: true,
					value: undefined,
				});
			});
		});
	});

	describe("float decoder", () => {
		const decoder = katabami.float();

		test("unexpected type", () => {
			const result = decoder.decodeValue("foo");

			expect(result).toStrictEqual({
				error: expect.any(DecodeError),
				ok: false,
			});

			expect(
				getIssueMessage(result.error?.issues)?.format(formatter),
			).toStrictEqual("浮動小数点数が期待されましたが、文字列でした。");
		});
	});

	describe("index decoder", () => {
		const decoder = katabami.index(0, katabami.string());

		test("unexpected type", () => {
			const result = decoder.decodeValue(1);

			expect(result).toStrictEqual({
				error: expect.any(DecodeError),
				ok: false,
			});

			expect(
				getIssueMessage(result.error?.issues)?.format(formatter),
			).toStrictEqual("配列が期待されましたが、数値でした。");
		});

		test("out of bounds", () => {
			const result = decoder.decodeValue([]);

			expect(result).toStrictEqual({
				error: expect.any(DecodeError),
				ok: false,
			});

			expect(
				getIssueMessage(result.error?.issues)?.format(formatter),
			).toStrictEqual('配列のインデックス"0"のバリデーションに失敗しました。');

			expect(
				getIssueMessage(result.error?.issues?.[0])?.format(formatter),
			).toStrictEqual("文字列が期待されましたが、undefinedでした。");
		});

		test("unexpected value", () => {
			const result = decoder.decodeValue([1]);

			expect(result).toStrictEqual({
				error: expect.any(DecodeError),
				ok: false,
			});

			expect(
				getIssueMessage(result.error?.issues)?.format(formatter),
			).toStrictEqual('配列のインデックス"0"のバリデーションに失敗しました。');

			expect(
				getIssueMessage(result.error?.issues?.[0])?.format(formatter),
			).toStrictEqual("文字列が期待されましたが、数値でした。");
		});
	});

	describe("integer decoder", () => {
		const decoder = katabami.int();

		test("unexpected type", () => {
			const result = decoder.decodeValue("foo");

			expect(result).toStrictEqual({
				error: expect.any(DecodeError),
				ok: false,
			});

			expect(
				getIssueMessage(result.error?.issues)?.format(formatter),
			).toStrictEqual("数値が期待されましたが、文字列でした。");
		});

		test("value is not an integer", () => {
			const result = decoder.decodeValue(1.5);

			expect(result).toStrictEqual({
				error: expect.any(DecodeError),
				ok: false,
			});

			expect(
				getIssueMessage(result.error?.issues)?.format(formatter),
			).toStrictEqual("整数が期待されましたが、浮動小数点数でした。");
		});
	});

	describe("map decoder", () => {
		const decoder = katabami.map(
			(foo, bar) => ({ bar, foo }),
			katabami.field("foo", katabami.string()),
			katabami.field("bar", katabami.string()),
		);

		test("unexpected type", () => {
			const result = decoder.decodeValue(1);

			expect(result).toStrictEqual({
				error: expect.any(DecodeError),
				ok: false,
			});

			expect(
				getIssueMessage(result.error?.issues)?.format(formatter),
			).toStrictEqual("オブジェクトが期待されましたが、数値でした。");
		});

		test("missing field", () => {
			const result = decoder.decodeValue({});

			expect(result).toStrictEqual({
				error: expect.any(DecodeError),
				ok: false,
			});

			expect(
				getIssueMessage(result.error?.issues)?.format(formatter),
			).toStrictEqual(
				'オブジェクトプロパティ"foo"のバリデーションに失敗しました。',
			);
		});
	});

	describe("object decoder", () => {
		const decoder = katabami.object({
			foo: katabami.string(),
		});

		test("unexpected type", () => {
			const result = decoder.decodeValue(1);

			expect(result).toStrictEqual({
				error: expect.any(DecodeError),
				ok: false,
			});

			expect(
				getIssueMessage(result.error?.issues)?.format(formatter),
			).toStrictEqual("オブジェクトが期待されましたが、数値でした。");
		});

		test("invalid object", () => {
			const result = decoder.decodeValue({ foo: 1 });

			expect(result).toStrictEqual({
				error: expect.any(DecodeError),
				ok: false,
			});

			expect(
				getIssueMessage(result.error?.issues)?.format(formatter),
			).toStrictEqual(
				"1つ以上のオブジェクトプロパティのバリデーションに失敗しました。",
			);

			expect(
				getIssueMessage(result.error?.issues?.foo)?.format(formatter),
			).toStrictEqual("文字列が期待されましたが、数値でした。");
		});
	});

	describe("record decoder", () => {
		const decoder = katabami.record(katabami.string());

		test("unexpected type", () => {
			const result = decoder.decodeValue(1);

			expect(result).toStrictEqual({
				error: expect.any(DecodeError),
				ok: false,
			});

			expect(
				getIssueMessage(result.error?.issues)?.format(formatter),
			).toStrictEqual("オブジェクトが期待されましたが、数値でした。");
		});

		test("invalid record", () => {
			const result = decoder.decodeValue({ foo: 1 });

			expect(result).toStrictEqual({
				error: expect.any(DecodeError),
				ok: false,
			});

			expect(
				getIssueMessage(result.error?.issues)?.format(formatter),
			).toStrictEqual(
				"1つ以上のレコードプロパティのバリデーションに失敗しました。",
			);

			expect(
				getIssueMessage(result.error?.issues?.foo)?.format(formatter),
			).toStrictEqual("文字列が期待されましたが、数値でした。");
		});
	});

	describe("string decoder", () => {
		const decoder = katabami.string();

		test("unexpected type", () => {
			const result = decoder.decodeValue(1);

			expect(result).toStrictEqual({
				error: expect.any(DecodeError),
				ok: false,
			});

			expect(
				getIssueMessage(result.error?.issues)?.format(formatter),
			).toStrictEqual("文字列が期待されましたが、数値でした。");
		});
	});

	describe("tuple decoder", () => {
		const decoder = katabami.tuple(katabami.string(), katabami.int());

		test("unexpected type", () => {
			const result = decoder.decodeValue(1);

			expect(result).toStrictEqual({
				error: expect.any(DecodeError),
				ok: false,
			});

			expect(
				getIssueMessage(result.error?.issues)?.format(formatter),
			).toStrictEqual("配列が期待されましたが、数値でした。");
		});

		test("invalid array length", () => {
			const result = decoder.decodeValue([1]);

			expect(result).toStrictEqual({
				error: expect.any(DecodeError),
				ok: false,
			});

			expect(
				getIssueMessage(result.error?.issues)?.format(formatter),
			).toStrictEqual("配列の長さは2が期待されましたが、1でした。");
		});

		test("unexpected element type", () => {
			const result = decoder.decodeValue([undefined, 1]);

			expect(result).toStrictEqual({
				error: expect.any(DecodeError),
				ok: false,
			});

			expect(
				getIssueMessage(result.error?.issues)?.format(formatter),
			).toStrictEqual("1つ以上の配列要素のバリデーションに失敗しました。");

			expect(
				getIssueMessage(result.error?.issues?.[0])?.format(formatter),
			).toStrictEqual("文字列が期待されましたが、undefinedでした。");

			expect(
				getIssueMessage(result.error?.issues?.[1])?.format(formatter),
			).toStrictEqual(undefined);
		});
	});

	describe("union decoder", () => {
		const decoder = katabami.union(katabami.string(), katabami.int());

		test("unexpected type", () => {
			const result = decoder.decodeValue(true);

			expect(result).toStrictEqual({
				error: expect.any(DecodeError),
				ok: false,
			});

			expect(
				getIssueMessage(result.error?.issues)?.format(formatter),
			).toStrictEqual("ユニオンのメンバーのいずれにも一致しませんでした。");

			expect(
				getIssueMessage(result.error?.issues[0])?.format(formatter),
			).toStrictEqual("文字列が期待されましたが、真偽値でした。");

			expect(
				getIssueMessage(result.error?.issues[1])?.format(formatter),
			).toStrictEqual("数値が期待されましたが、真偽値でした。");
		});

		describe("nested union", () => {
			const decoder = katabami.union(
				katabami.constant("foo"),
				katabami.union(katabami.constant("bar"), katabami.constant("baz")),
			);

			test("unexpected type", () => {
				const result = decoder.decodeValue(1);

				expect(result).toStrictEqual({
					error: expect.any(DecodeError),
					ok: false,
				});

				expect(
					getIssueMessage(result.error?.issues)?.format(formatter),
				).toStrictEqual("ユニオンのメンバーのいずれにも一致しませんでした。");

				expect(
					getIssueMessage(result.error?.issues[0])?.format(formatter),
				).toStrictEqual('"foo"が期待されましたが、1でした。');

				expect(
					getIssueMessage(result.error?.issues[1])?.format(formatter),
				).toStrictEqual('"bar"が期待されましたが、1でした。');

				expect(
					getIssueMessage(result.error?.issues[2])?.format(formatter),
				).toStrictEqual('"baz"が期待されましたが、1でした。');
			});
		});
	});

	describe("Decoder methods", () => {
		test("andThen", () => {
			const decoder = katabami.string().andThen(() => katabami.constant("foo"));

			const result = decoder.decodeValue("bar");

			expect(result).toStrictEqual({
				error: expect.any(DecodeError),
				ok: false,
			});

			expect(
				getIssueMessage(result.error?.issues)?.format(formatter),
			).toStrictEqual('"foo"が期待されましたが、"bar"でした。');
		});

		test("catch", () => {
			const decoder = katabami.string().catch(() => {
				return {
					error: new DecodeError(
						"Custom error",
						createIssues("custom", "Custom issue"),
					),
					ok: false,
				};
			});

			const result = decoder.decodeValue(1);

			expect(result).toStrictEqual({
				error: expect.any(DecodeError),
				ok: false,
			});

			expect(
				getIssueMessage(result.error?.issues)?.format(formatter),
			).toStrictEqual("Custom issue");
		});

		test("map", () => {
			const decoder = katabami.string().map((value) => value.toUpperCase());

			const result = decoder.decodeValue(1);

			expect(result).toStrictEqual({
				error: expect.any(DecodeError),
				ok: false,
			});

			expect(
				getIssueMessage(result.error?.issues)?.format(formatter),
			).toStrictEqual("文字列が期待されましたが、数値でした。");
		});
	});

	describe("unflattenIssues", () => {
		test("round-trips object issues", () => {
			const decoder = katabami.object({
				foo: katabami.string(),
			});
			const result = decoder.decodeValue({ foo: 1 });

			expect(result.ok).toBe(false);
			if (result.ok) return;

			const restored = unflattenIssues<typeof decoder>(
				flattenIssues(result.error.issues, formatter),
			);

			expect(getIssueMessage(restored)?.format()).toStrictEqual(
				"1つ以上のオブジェクトプロパティのバリデーションに失敗しました。",
			);
			expect(getIssueMessage(restored.foo)?.format()).toStrictEqual(
				"文字列が期待されましたが、数値でした。",
			);
			expect(getIssueMessage(restored.foo)?.message).toStrictEqual(
				"文字列が期待されましたが、数値でした。",
			);
		});

		test("round-trips nested object issues", () => {
			const decoder = katabami.object({
				foo: katabami.object({
					bar: katabami.string(),
				}),
			});
			const result = decoder.decodeValue({ foo: { bar: 1 } });

			expect(result.ok).toBe(false);
			if (result.ok) return;

			const restored = unflattenIssues<typeof decoder>(
				flattenIssues(result.error.issues, formatter),
			);

			expect(getIssueMessage(restored)?.format()).toStrictEqual(
				"1つ以上のオブジェクトプロパティのバリデーションに失敗しました。",
			);
			expect(getIssueMessage(restored.foo)?.format()).toStrictEqual(
				"1つ以上のオブジェクトプロパティのバリデーションに失敗しました。",
			);
			expect(getIssueMessage(restored.foo?.bar)?.format()).toStrictEqual(
				"文字列が期待されましたが、数値でした。",
			);
			expect(getIssueMessage(restored.foo?.bar)?.message).toStrictEqual(
				"文字列が期待されましたが、数値でした。",
			);
		});

		test("round-trips array issues", () => {
			const decoder = katabami.array(katabami.string());
			const result = decoder.decodeValue([1, true]);

			expect(result.ok).toBe(false);
			if (result.ok) return;

			const restored = unflattenIssues<typeof decoder>(
				flattenIssues(result.error.issues, formatter),
			);

			expect(getIssueMessage(restored)?.format()).toStrictEqual(
				"1つ以上の配列要素のバリデーションに失敗しました。",
			);
			expect(getIssueMessage(restored[0])?.format()).toStrictEqual(
				"文字列が期待されましたが、数値でした。",
			);
			expect(getIssueMessage(restored[1])?.format()).toStrictEqual(
				"文字列が期待されましたが、真偽値でした。",
			);
		});

		test("round-trips union issues", () => {
			const decoder = katabami.union(katabami.string(), katabami.int());
			const result = decoder.decodeValue(true);

			expect(result.ok).toBe(false);
			if (result.ok) return;

			const restored = unflattenIssues(
				flattenIssues(result.error.issues, formatter),
			);

			expect(getIssueMessage(restored)?.format()).toStrictEqual(
				"ユニオンのメンバーのいずれにも一致しませんでした。",
			);
			expect(getIssueMessage(restored[0])?.format()).toStrictEqual(
				"文字列が期待されましたが、真偽値でした。",
			);
			expect(getIssueMessage(restored[1])?.format()).toStrictEqual(
				"数値が期待されましたが、真偽値でした。",
			);
		});

		test("round-trips primitive issues", () => {
			const decoder = katabami.string();
			const result = decoder.decodeValue(1);

			expect(result.ok).toBe(false);
			if (result.ok) return;

			const restored = unflattenIssues<typeof decoder>(
				flattenIssues(result.error.issues, formatter),
			);

			expect(getIssueMessage(restored)?.format()).toStrictEqual(
				"文字列が期待されましたが、数値でした。",
			);
			expect(getIssueMessage(restored)?.message).toStrictEqual(
				"文字列が期待されましたが、数値でした。",
			);
		});

		test("accepts PathSegment objects", () => {
			const restored = unflattenIssues([
				{ message: "root failed", path: undefined },
				{ message: "nested failed", path: [{ key: "foo" }] },
			]);

			expect(getIssueMessage(restored)?.format()).toStrictEqual("root failed");
			expect(getIssueMessage(restored.foo)?.format()).toStrictEqual(
				"nested failed",
			);
		});
	});
});
