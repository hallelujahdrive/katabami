import { describe, expect, test } from "vitest";

import { type Decoder, katabami } from "../src/index.js";

const validationFailure = {
	issues: expect.arrayContaining([
		expect.objectContaining({ message: expect.any(String) }),
	]),
} as const;

async function expectValidateAsync(
	decoder: Decoder<unknown>,
	value: unknown,
	expected: Record<string, unknown>,
) {
	const result = validate(decoder, value);
	expect(result).toBeInstanceOf(Promise);
	await expect(result).resolves.toStrictEqual(expected);
}

function expectValidateSync(
	decoder: Decoder<unknown>,
	value: unknown,
	expected: Record<string, unknown>,
) {
	const result = validate(decoder, value);
	expect(result).not.toBeInstanceOf(Promise);
	expect(result).toStrictEqual(expected);
}

function validate(decoder: Decoder<unknown>, value: unknown) {
	return decoder["~standard"].validate(value);
}

describe("StandardSchemaV1", () => {
	describe("array", () => {
		describe("sync", () => {
			const decoder = katabami.array(katabami.string());

			describe("validate value", () => {
				test("success", () => {
					expectValidateSync(decoder, ["foo", "bar"], {
						value: ["foo", "bar"],
					});
				});

				test("fail", () => {
					expectValidateSync(decoder, [true, 1], validationFailure);
				});
			});

			describe("validate parsed string", () => {
				test("success", () => {
					expectValidateSync(decoder, JSON.parse('["foo","bar"]'), {
						value: ["foo", "bar"],
					});
				});

				test("fail", () => {
					expectValidateSync(
						decoder,
						JSON.parse("[true,1]"),
						validationFailure,
					);
				});
			});
		});

		describe("async", () => {
			const decoder = katabami.array(
				katabami.string().andThen((value) => {
					return new Promise<Decoder<string, never>>((resolve) =>
						resolve(katabami.succeed(value)),
					);
				}),
			);

			describe("validate value", () => {
				test("success", async () => {
					await expectValidateAsync(decoder, ["foo", "bar"], {
						value: ["foo", "bar"],
					});
				});

				test("fail", async () => {
					await expectValidateAsync(decoder, [true, 1], validationFailure);
				});
			});

			describe("validate parsed string", () => {
				test("success", async () => {
					await expectValidateAsync(decoder, JSON.parse('["foo","bar"]'), {
						value: ["foo", "bar"],
					});
				});

				test("fail", async () => {
					await expectValidateAsync(
						decoder,
						JSON.parse("[true,1]"),
						validationFailure,
					);
				});
			});
		});
	});

	describe("boolean", () => {
		const decoder = katabami.boolean();

		describe("validate value", () => {
			test("success", () => {
				expectValidateSync(decoder, true, { value: true } as const);
			});

			test("fail", () => {
				expectValidateSync(decoder, "foo", validationFailure);
			});
		});

		describe("validate parsed string", () => {
			test("success", () => {
				expectValidateSync(decoder, JSON.parse("true"), {
					value: true,
				} as const);
			});

			test("fail", () => {
				expectValidateSync(decoder, JSON.parse('"foo"'), validationFailure);
			});
		});
	});

	describe("constant", () => {
		const decoder = katabami.constant("foo");

		describe("validate value", () => {
			test("success", () => {
				expectValidateSync(decoder, "foo", { value: "foo" } as const);
			});

			test("fail", () => {
				expectValidateSync(decoder, "bar", validationFailure);
			});
		});

		describe("validate parsed string", () => {
			test("success", () => {
				expectValidateSync(decoder, JSON.parse('"foo"'), {
					value: "foo",
				} as const);
			});

			test("fail", () => {
				expectValidateSync(decoder, JSON.parse('"bar"'), validationFailure);
			});
		});
	});

	describe("field", () => {
		describe("sync", () => {
			const decoder = katabami.field("foo", katabami.string());

			describe("validate value", () => {
				test("success", () => {
					expectValidateSync(decoder, { foo: "foo" }, {
						value: "foo",
					} as const);
				});

				test("fail", () => {
					expectValidateSync(decoder, { bar: "bar" }, validationFailure);
				});
			});

			describe("validate parsed string", () => {
				test("success", () => {
					expectValidateSync(decoder, JSON.parse('{"foo":"foo"}'), {
						value: "foo",
					} as const);
				});

				test("fail", () => {
					expectValidateSync(
						decoder,
						JSON.parse('{"bar":"bar"}'),
						validationFailure,
					);
				});
			});
		});

		describe("async", () => {
			const decoder = katabami
				.object({
					bar: katabami.int(),
					foo: katabami.string(),
				})
				.andThen((value) => {
					return new Promise<Decoder<typeof value, never>>((resolve) =>
						resolve(katabami.succeed(value)),
					);
				});

			describe("validate value", () => {
				test("success", async () => {
					await expectValidateAsync(
						decoder,
						{
							bar: 1,
							foo: "foo",
						},
						{ value: { bar: 1, foo: "foo" } } as const,
					);
				});

				test("fail", () => {
					expectValidateSync(
						decoder,
						{
							bar: "1",
							foo: "foo",
						},
						validationFailure,
					);
				});
			});

			describe("validate parsed string", () => {
				test("success", async () => {
					await expectValidateAsync(
						decoder,
						JSON.parse('{"bar":1,"foo":"foo"}'),
						{ value: { bar: 1, foo: "foo" } } as const,
					);
				});

				test("fail", () => {
					expectValidateSync(
						decoder,
						JSON.parse('{"bar":"1","foo":"foo"}'),
						validationFailure,
					);
				});
			});
		});
	});

	describe("index", () => {
		describe("sync", () => {
			const decoder = katabami.index(1, katabami.string());

			describe("validate value", () => {
				test("success", () => {
					expectValidateSync(decoder, ["foo", "bar"], {
						value: "bar",
					} as const);
				});

				test("fail", () => {
					expectValidateSync(decoder, ["foo"], validationFailure);
				});
			});

			describe("validate parsed string", () => {
				test("success", () => {
					expectValidateSync(decoder, JSON.parse('["foo","bar"]'), {
						value: "bar",
					} as const);
				});

				test("fail", () => {
					expectValidateSync(decoder, JSON.parse('["foo"]'), validationFailure);
				});
			});
		});

		describe("async", () => {
			const decoder = katabami
				.object({
					bar: katabami.int(),
					foo: katabami.string(),
				})
				.andThen((value) => {
					return new Promise<Decoder<typeof value, never>>((resolve) =>
						resolve(katabami.succeed(value)),
					);
				});

			describe("validate value", () => {
				test("success", async () => {
					await expectValidateAsync(
						decoder,
						{
							bar: 1,
							foo: "foo",
						},
						{ value: { bar: 1, foo: "foo" } } as const,
					);
				});

				test("fail", () => {
					expectValidateSync(
						decoder,
						{
							bar: "1",
							foo: "foo",
						},
						validationFailure,
					);
				});
			});

			describe("validate parsed string", () => {
				test("success", async () => {
					await expectValidateAsync(
						decoder,
						JSON.parse('{"bar":1,"foo":"foo"}'),
						{ value: { bar: 1, foo: "foo" } } as const,
					);
				});

				test("fail", () => {
					expectValidateSync(
						decoder,
						JSON.parse('{"bar":"1","foo":"foo"}'),
						validationFailure,
					);
				});
			});
		});
	});

	describe("map", () => {
		describe("sync", () => {
			const decoder = katabami.map(
				(foo, bar) => ({ bar, foo }),
				katabami.field("foo", katabami.string()),
				katabami.field("bar", katabami.int()),
			);

			describe("validate value", () => {
				test("success", () => {
					expectValidateSync(
						decoder,
						{ bar: 1, foo: "foo" },
						{ value: { bar: 1, foo: "foo" } },
					);
				});

				test("fail", () => {
					expectValidateSync(
						decoder,
						{ bar: "1", foo: "foo" },
						validationFailure,
					);
				});
			});

			describe("validate parsed string", () => {
				test("success", () => {
					expectValidateSync(decoder, JSON.parse('{"bar":1,"foo":"foo"}'), {
						value: { bar: 1, foo: "foo" },
					});
				});

				test("fail", () => {
					expectValidateSync(
						decoder,
						JSON.parse('{"bar":"1","foo":"foo"}'),
						validationFailure,
					);
				});
			});
		});

		describe("async", () => {
			describe("async decoder", () => {
				const decoder = katabami.map(
					(foo, bar) => ({ bar, foo }),
					katabami.field("foo", katabami.string()),
					katabami.field("bar", katabami.int()).andThen((value) => {
						return new Promise<Decoder<number, never>>((resolve) =>
							resolve(katabami.succeed(value)),
						);
					}),
				);

				describe("validate value", () => {
					test("success", async () => {
						await expectValidateAsync(
							decoder,
							{ bar: 1, foo: "foo" },
							{ value: { bar: 1, foo: "foo" } },
						);
					});

					test("fail", async () => {
						await expectValidateAsync(
							decoder,
							{ bar: "1", foo: "foo" },
							validationFailure,
						);
					});
				});

				describe("validate parsed string", () => {
					test("success", async () => {
						await expectValidateAsync(
							decoder,
							JSON.parse('{"bar":1,"foo":"foo"}'),
							{ value: { bar: 1, foo: "foo" } },
						);
					});

					test("fail", async () => {
						await expectValidateAsync(
							decoder,
							JSON.parse('{"bar":"1","foo":"foo"}'),
							validationFailure,
						);
					});
				});
			});

			describe("async map function", () => {
				const decoder = katabami.map(
					(foo, bar) =>
						new Promise<{ bar: number; foo: string }>((resolve) =>
							resolve({ bar, foo }),
						),
					katabami.field("foo", katabami.string()),
					katabami.field("bar", katabami.int()),
				);

				describe("validate value", () => {
					test("success", async () => {
						await expectValidateAsync(
							decoder,
							{ bar: 1, foo: "foo" },
							{ value: { bar: 1, foo: "foo" } },
						);
					});

					test("fail", () => {
						expectValidateSync(
							decoder,
							{ bar: "1", foo: "foo" },
							validationFailure,
						);
					});
				});

				describe("validate parsed string", () => {
					test("success", async () => {
						await expectValidateAsync(
							decoder,
							JSON.parse('{"bar":1,"foo":"foo"}'),
							{ value: { bar: 1, foo: "foo" } },
						);
					});

					test("fail", () => {
						expectValidateSync(
							decoder,
							JSON.parse('{"bar":"1","foo":"foo"}'),
							validationFailure,
						);
					});
				});
			});
		});
	});

	describe("object", () => {
		describe("flattened object", () => {
			describe("sync", () => {
				const decoder = katabami.object({
					bar: katabami.int(),
					foo: katabami.string(),
				});

				describe("validate value", () => {
					test("success", () => {
						expectValidateSync(
							decoder,
							{
								bar: 1,
								foo: "foo",
							},
							{ value: { bar: 1, foo: "foo" } } as const,
						);
					});

					test("fail", () => {
						expectValidateSync(
							decoder,
							{
								bar: "1",
								foo: "foo",
							},
							validationFailure,
						);
					});
				});

				describe("validate parsed string", () => {
					test("success", () => {
						expectValidateSync(decoder, JSON.parse('{"bar":1,"foo":"foo"}'), {
							value: { bar: 1, foo: "foo" },
						} as const);
					});

					test("fail", () => {
						expectValidateSync(
							decoder,
							JSON.parse('{"bar":"1","foo":"foo"}'),
							validationFailure,
						);
					});
				});
			});

			describe("async", () => {
				const decoder = katabami
					.object({
						bar: katabami.int(),
						foo: katabami.string(),
					})
					.andThen((value) => {
						return new Promise<Decoder<typeof value, never>>((resolve) =>
							resolve(katabami.succeed(value)),
						);
					});

				describe("validate value", () => {
					test("success", async () => {
						await expectValidateAsync(
							decoder,
							{
								bar: 1,
								foo: "foo",
							},
							{ value: { bar: 1, foo: "foo" } } as const,
						);
					});

					test("fail", () => {
						expectValidateSync(
							decoder,
							{
								bar: "1",
								foo: "foo",
							},
							validationFailure,
						);
					});
				});

				describe("validate parsed string", () => {
					test("success", async () => {
						await expectValidateAsync(
							decoder,
							JSON.parse('{"bar":1,"foo":"foo"}'),
							{ value: { bar: 1, foo: "foo" } } as const,
						);
					});

					test("fail", () => {
						expectValidateSync(
							decoder,
							JSON.parse('{"bar":"1","foo":"foo"}'),
							validationFailure,
						);
					});
				});
			});
		});

		describe("nested object", () => {
			describe("sync", () => {
				const decoder = katabami.object({
					bar: katabami.object({
						foo: katabami.string(),
					}),
				});

				describe("validate value", () => {
					test("success", () => {
						expectValidateSync(
							decoder,
							{
								bar: {
									foo: "foo",
								},
							},
							{ value: { bar: { foo: "foo" } } } as const,
						);
					});

					test("fail", () => {
						expectValidateSync(
							decoder,
							{
								bar: "1",
								foo: "foo",
							},
							validationFailure,
						);
					});
				});

				describe("validate parsed string", () => {
					test("success", () => {
						expectValidateSync(decoder, JSON.parse('{"bar":{"foo":"foo"}}'), {
							value: { bar: { foo: "foo" } },
						} as const);
					});

					test("fail", () => {
						expectValidateSync(
							decoder,
							JSON.parse('{"bar":"1","foo":"foo"}'),
							validationFailure,
						);
					});
				});
			});

			describe("async", () => {
				const decoder = katabami.object({
					bar: katabami.object({
						foo: katabami.string().andThen((value) => {
							return new Promise<Decoder<typeof value, never>>((resolve) =>
								resolve(katabami.succeed(value)),
							);
						}),
					}),
				});

				describe("validate value", () => {
					test("success", async () => {
						await expectValidateAsync(
							decoder,
							{
								bar: {
									foo: "foo",
								},
							},
							{ value: { bar: { foo: "foo" } } } as const,
						);
					});

					test("fail", async () => {
						await expectValidateAsync(
							decoder,
							{
								bar: "1",
								foo: "foo",
							},
							validationFailure,
						);
					});
				});

				describe("validate parsed string", () => {
					test("success", async () => {
						await expectValidateAsync(
							decoder,
							JSON.parse('{"bar":{"foo":"foo"}}'),
							{ value: { bar: { foo: "foo" } } } as const,
						);
					});

					test("fail", async () => {
						await expectValidateAsync(
							decoder,
							JSON.parse('{"bar":"1","foo":"foo"}'),
							validationFailure,
						);
					});
				});
			});
		});
	});

	describe("string", () => {
		const decoder = katabami.string();

		describe("validate value", () => {
			test("success", () => {
				expectValidateSync(decoder, "foo", { value: "foo" } as const);
			});

			test("fail", () => {
				expectValidateSync(decoder, true, validationFailure);
			});
		});

		describe("validate parsed string", () => {
			test("success", () => {
				expectValidateSync(decoder, JSON.parse('"foo"'), {
					value: "foo",
				} as const);
			});

			test("fail", () => {
				expectValidateSync(decoder, JSON.parse("true"), validationFailure);
			});
		});
	});

	describe("tuple", () => {
		describe("sync", () => {
			const decoder = katabami.tuple(katabami.string(), katabami.int());

			describe("validate value", () => {
				test("success", () => {
					expectValidateSync(decoder, ["foo", 1], { value: ["foo", 1] });
				});

				test("fail", () => {
					expectValidateSync(decoder, [true, 1], validationFailure);
				});
			});

			describe("validate parsed string", () => {
				test("success", () => {
					expectValidateSync(decoder, JSON.parse('["foo",1]'), {
						value: ["foo", 1],
					});
				});

				test("fail", () => {
					expectValidateSync(
						decoder,
						JSON.parse("[true,1]"),
						validationFailure,
					);
				});
			});
		});

		describe("async", () => {
			const decoder = katabami.tuple(
				katabami.string(),
				katabami.int().andThen((value) => {
					return new Promise<Decoder<number, never>>((resolve) =>
						resolve(katabami.succeed(value)),
					);
				}),
			);

			describe("validate value", () => {
				test("success", async () => {
					await expectValidateAsync(decoder, ["foo", 1], { value: ["foo", 1] });
				});

				test("fail", async () => {
					await expectValidateAsync(decoder, [true, 1], validationFailure);
				});
			});

			describe("validate parsed string", () => {
				test("success", async () => {
					await expectValidateAsync(decoder, JSON.parse('["foo",1]'), {
						value: ["foo", 1],
					});
				});

				test("fail", async () => {
					await expectValidateAsync(
						decoder,
						JSON.parse("[true,1]"),
						validationFailure,
					);
				});
			});
		});
	});

	describe("union", () => {
		describe("sync", () => {
			const decoder = katabami.union(katabami.string(), katabami.int());

			describe("validate value", () => {
				test("success", () => {
					expectValidateSync(decoder, "foo", { value: "foo" } as const);
				});

				test("fail", () => {
					expectValidateSync(decoder, true, validationFailure);
				});
			});

			describe("validate parsed string", () => {
				test("success", () => {
					expectValidateSync(decoder, JSON.parse('"foo"'), {
						value: "foo",
					} as const);
				});

				test("fail", () => {
					expectValidateSync(decoder, JSON.parse("true"), validationFailure);
				});
			});
		});

		describe("async", () => {
			const decoder = katabami.union(
				katabami.string(),
				katabami.int().andThen((value) => {
					return new Promise<Decoder<number, never>>((resolve) =>
						resolve(katabami.succeed(value)),
					);
				}),
			);

			describe("validate value", () => {
				test("success", () => {
					expectValidateSync(decoder, "foo", { value: "foo" } as const);
				});

				test("fail", async () => {
					await expectValidateAsync(decoder, true, validationFailure);
				});
			});

			describe("validate parsed string", () => {
				test("success", () => {
					expectValidateSync(decoder, JSON.parse('"foo"'), {
						value: "foo",
					} as const);
				});

				test("fail", async () => {
					await expectValidateAsync(
						decoder,
						JSON.parse("true"),
						validationFailure,
					);
				});
			});
		});
	});

	describe("decoder method", () => {
		describe("andThen", () => {
			describe("sync", () => {
				const decoder = katabami.float().andThen(() => katabami.int());

				describe("validate value", () => {
					test("success", () => {
						expectValidateSync(decoder, 1, { value: 1 } as const);
					});

					test("fail", () => {
						expectValidateSync(decoder, 1.5, validationFailure);
					});
				});

				describe("validate parsed string", () => {
					test("success", () => {
						expectValidateSync(decoder, JSON.parse("1"), { value: 1 } as const);
					});

					test("fail", () => {
						expectValidateSync(decoder, JSON.parse("1.5"), validationFailure);
					});
				});
			});

			describe("async", () => {
				const decoder = katabami
					.float()
					.andThen(
						() =>
							new Promise<Decoder<number>>((resolve) =>
								resolve(katabami.int()),
							),
					);

				describe("validate value", () => {
					test("success", async () => {
						await expectValidateAsync(decoder, 1, { value: 1 } as const);
					});

					test("fail", async () => {
						await expectValidateAsync(decoder, 1.5, validationFailure);
					});
				});

				describe("validate parsed string", () => {
					test("success", async () => {
						await expectValidateAsync(decoder, JSON.parse("1"), {
							value: 1,
						} as const);
					});

					test("fail", async () => {
						await expectValidateAsync(
							decoder,
							JSON.parse("1.5"),
							validationFailure,
						);
					});
				});
			});
		});

		describe("map", () => {
			describe("sync", () => {
				const decoder = katabami.string().map((value) => Number(value));

				describe("validate value", () => {
					test("success", () => {
						expectValidateSync(decoder, "1", { value: 1 } as const);
					});

					test("fail", () => {
						expectValidateSync(decoder, 1, validationFailure);
					});
				});

				describe("validate parsed string", () => {
					test("success", () => {
						expectValidateSync(decoder, JSON.parse('"1"'), {
							value: 1,
						} as const);
					});

					test("fail", () => {
						expectValidateSync(decoder, JSON.parse("1"), validationFailure);
					});
				});
			});

			describe("async", () => {
				const decoder = katabami
					.string()
					.map(
						(value) => new Promise<number>((resolve) => resolve(Number(value))),
					);

				describe("validate value", () => {
					test("success", async () => {
						await expectValidateAsync(decoder, "1", { value: 1 } as const);
					});

					test("fail", () => {
						expectValidateSync(decoder, 1, validationFailure);
					});
				});

				describe("validate parsed string", () => {
					test("success", async () => {
						await expectValidateAsync(decoder, JSON.parse('"1"'), {
							value: 1,
						} as const);
					});

					test("fail", () => {
						expectValidateSync(decoder, JSON.parse("1"), validationFailure);
					});
				});
			});
		});
	});
});
