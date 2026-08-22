import { describe, expect, test } from "vitest";
import {
	array,
	at,
	boolean,
	constant,
	type Decoder,
	field,
	index,
	int,
	map,
	number,
	object,
	oneOrMore,
	record,
	string,
	succeed,
	tuple,
	union,
} from "../src";

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
			const decoder = array(string());

			describe("validate value", () => {
				test("success", () => {
					expectValidateSync(decoder, ["foo", "bar"], {
						value: ["foo", "bar"],
					});
				});

				test("fail", () => {
					expectValidateSync(decoder, [true, 1], {
						issues: [
							{
								message: "One or more array elements failed validation.",
								path: undefined,
							},
							{
								message: "Expected string, but received boolean.",
								path: ["0"],
							},
							{ message: "Expected string, but received number.", path: ["1"] },
						],
					});
				});
			});

			describe("validate parsed string", () => {
				test("success", () => {
					expectValidateSync(decoder, JSON.parse('["foo","bar"]'), {
						value: ["foo", "bar"],
					});
				});

				test("fail", () => {
					expectValidateSync(decoder, JSON.parse("[true,1]"), {
						issues: [
							{
								message: "One or more array elements failed validation.",
								path: undefined,
							},
							{
								message: "Expected string, but received boolean.",
								path: ["0"],
							},
							{ message: "Expected string, but received number.", path: ["1"] },
						],
					});
				});
			});
		});

		describe("async", () => {
			const decoder = array(
				string().andThen((value) => {
					return new Promise<Decoder<string, never>>((resolve) =>
						resolve(succeed(value)),
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
					await expectValidateAsync(decoder, [true, 1], {
						issues: [
							{
								message: "One or more array elements failed validation.",
								path: undefined,
							},
							{
								message: "Expected string, but received boolean.",
								path: ["0"],
							},
							{ message: "Expected string, but received number.", path: ["1"] },
						],
					});
				});
			});

			describe("validate parsed string", () => {
				test("success", async () => {
					await expectValidateAsync(decoder, JSON.parse('["foo","bar"]'), {
						value: ["foo", "bar"],
					});
				});

				test("fail", async () => {
					await expectValidateAsync(decoder, JSON.parse("[true,1]"), {
						issues: [
							{
								message: "One or more array elements failed validation.",
								path: undefined,
							},
							{
								message: "Expected string, but received boolean.",
								path: ["0"],
							},
							{ message: "Expected string, but received number.", path: ["1"] },
						],
					});
				});
			});
		});
	});

	describe("at", () => {
		describe("sync", () => {
			const decoder = at(["foo", "bar"], string());

			describe("validate value", () => {
				test("success", () => {
					expectValidateSync(decoder, { foo: { bar: "baz" } }, {
						value: "baz",
					} as const);
				});

				test("fail", () => {
					expectValidateSync(
						decoder,
						{ foo: { baz: "baz" } },
						{
							issues: [
								{
									message: 'Object property "foo" failed validation.',
									path: undefined,
								},
								{
									message: 'Object property "bar" failed validation.',
									path: ["foo"],
								},
								{
									message: "Expected string, but received undefined.",
									path: ["foo", "bar"],
								},
							],
						},
					);
				});
			});

			describe("validate parsed string", () => {
				test("success", () => {
					expectValidateSync(decoder, JSON.parse('{"foo":{"bar":"baz"}}'), {
						value: "baz",
					} as const);
				});

				test("fail", () => {
					expectValidateSync(decoder, JSON.parse('{"foo":{"baz":"baz"}}'), {
						issues: [
							{
								message: 'Object property "foo" failed validation.',
								path: undefined,
							},
							{
								message: 'Object property "bar" failed validation.',
								path: ["foo"],
							},
							{
								message: "Expected string, but received undefined.",
								path: ["foo", "bar"],
							},
						],
					});
				});
			});
		});

		describe("async", () => {
			const decoder = at(
				["foo", "bar"],
				string().andThen((value) => {
					return new Promise<Decoder<string, never>>((resolve) =>
						resolve(succeed(value)),
					);
				}),
			);

			describe("validate value", () => {
				test("success", async () => {
					await expectValidateAsync(decoder, { foo: { bar: "baz" } }, {
						value: "baz",
					} as const);
				});

				test("fail", async () => {
					await expectValidateAsync(
						decoder,
						{ foo: { baz: "baz" } },
						{
							issues: [
								{
									message: 'Object property "foo" failed validation.',
									path: undefined,
								},
								{
									message: 'Object property "bar" failed validation.',
									path: ["foo"],
								},
								{
									message: "Expected string, but received undefined.",
									path: ["foo", "bar"],
								},
							],
						},
					);
				});
			});

			describe("validate parsed string", () => {
				test("success", async () => {
					await expectValidateAsync(
						decoder,
						JSON.parse('{"foo":{"bar":"baz"}}'),
						{
							value: "baz",
						} as const,
					);
				});

				test("fail", async () => {
					await expectValidateAsync(
						decoder,
						JSON.parse('{"foo":{"baz":"baz"}}'),
						{
							issues: [
								{
									message: 'Object property "foo" failed validation.',
									path: undefined,
								},
								{
									message: 'Object property "bar" failed validation.',
									path: ["foo"],
								},
								{
									message: "Expected string, but received undefined.",
									path: ["foo", "bar"],
								},
							],
						},
					);
				});
			});
		});
	});

	describe("boolean", () => {
		const decoder = boolean();

		describe("validate value", () => {
			test("success", () => {
				expectValidateSync(decoder, true, { value: true } as const);
			});

			test("fail", () => {
				expectValidateSync(decoder, "foo", {
					issues: [
						{
							message: "Expected boolean, but received string.",
							path: undefined,
						},
					],
				});
			});
		});

		describe("validate parsed string", () => {
			test("success", () => {
				expectValidateSync(decoder, JSON.parse("true"), {
					value: true,
				} as const);
			});

			test("fail", () => {
				expectValidateSync(decoder, JSON.parse('"foo"'), {
					issues: [
						{
							message: "Expected boolean, but received string.",
							path: undefined,
						},
					],
				});
			});
		});
	});

	describe("constant", () => {
		describe("string", () => {
			const decoder = constant("foo");

			describe("validate value", () => {
				test("success", () => {
					expectValidateSync(decoder, "foo", { value: "foo" } as const);
				});

				test("fail", () => {
					expectValidateSync(decoder, "bar", {
						issues: [
							{
								message: 'Expected "foo", but received "bar".',
								path: undefined,
							},
						],
					});
				});
			});

			describe("validate parsed string", () => {
				test("success", () => {
					expectValidateSync(decoder, JSON.parse('"foo"'), {
						value: "foo",
					} as const);
				});

				test("fail", () => {
					expectValidateSync(decoder, JSON.parse('"bar"'), {
						issues: [
							{
								message: 'Expected "foo", but received "bar".',
								path: undefined,
							},
						],
					});
				});
			});
		});

		describe("null", () => {
			const decoder = constant(null);

			describe("validate value", () => {
				test("success", () => {
					expectValidateSync(decoder, null, { value: null } as const);
				});

				test("fail", () => {
					expectValidateSync(decoder, "foo", {
						issues: [
							{
								message: 'Expected null, but received "foo".',
								path: undefined,
							},
						],
					});
				});
			});
		});
	});

	describe("field", () => {
		describe("sync", () => {
			const decoder = field("foo", string());

			describe("validate value", () => {
				test("success", () => {
					expectValidateSync(decoder, { foo: "foo" }, {
						value: "foo",
					} as const);
				});

				test("fail", () => {
					expectValidateSync(
						decoder,
						{ bar: "bar" },
						{
							issues: [
								{
									message: 'Object property "foo" failed validation.',
									path: undefined,
								},
								{
									message: "Expected string, but received undefined.",
									path: ["foo"],
								},
							],
						},
					);
				});
			});

			describe("validate parsed string", () => {
				test("success", () => {
					expectValidateSync(decoder, JSON.parse('{"foo":"foo"}'), {
						value: "foo",
					} as const);
				});

				test("fail", () => {
					expectValidateSync(decoder, JSON.parse('{"bar":"bar"}'), {
						issues: [
							{
								message: 'Object property "foo" failed validation.',
								path: undefined,
							},
							{
								message: "Expected string, but received undefined.",
								path: ["foo"],
							},
						],
					});
				});
			});
		});

		describe("async", () => {
			const decoder = field(
				"foo",
				string().andThen((value) => {
					return new Promise<Decoder<string, never>>((resolve) =>
						resolve(succeed(value)),
					);
				}),
			).andThen((value) => {
				return new Promise<Decoder<typeof value, never>>((resolve) =>
					resolve(succeed(value)),
				);
			});

			describe("validate value", () => {
				test("success", async () => {
					await expectValidateAsync(decoder, { foo: "foo" }, {
						value: "foo",
					} as const);
				});

				test("fail", async () => {
					await expectValidateAsync(
						decoder,
						{ bar: "bar" },
						{
							issues: [
								{
									message: 'Object property "foo" failed validation.',
									path: undefined,
								},
								{
									message: "Expected string, but received undefined.",
									path: ["foo"],
								},
							],
						},
					);
				});
			});

			describe("validate parsed string", () => {
				test("success", async () => {
					await expectValidateAsync(decoder, JSON.parse('{"foo":"foo"}'), {
						value: "foo",
					} as const);
				});

				test("fail", async () => {
					await expectValidateAsync(decoder, JSON.parse('{"bar":"bar"}'), {
						issues: [
							{
								message: 'Object property "foo" failed validation.',
								path: undefined,
							},
							{
								message: "Expected string, but received undefined.",
								path: ["foo"],
							},
						],
					});
				});
			});
		});
	});

	describe("index", () => {
		describe("sync", () => {
			const decoder = index(1, string());

			describe("validate value", () => {
				test("success", () => {
					expectValidateSync(decoder, ["foo", "bar"], {
						value: "bar",
					} as const);
				});

				test("fail", () => {
					expectValidateSync(decoder, ["foo"], {
						issues: [
							{
								message: 'Array index "1" failed validation.',
								path: undefined,
							},
							{
								message: "Expected string, but received undefined.",
								path: ["1"],
							},
						],
					});
				});
			});

			describe("validate parsed string", () => {
				test("success", () => {
					expectValidateSync(decoder, JSON.parse('["foo","bar"]'), {
						value: "bar",
					} as const);
				});

				test("fail", () => {
					expectValidateSync(decoder, JSON.parse('["foo"]'), {
						issues: [
							{
								message: 'Array index "1" failed validation.',
								path: undefined,
							},
							{
								message: "Expected string, but received undefined.",
								path: ["1"],
							},
						],
					});
				});
			});
		});

		describe("async", () => {
			const decoder = object({
				bar: int(),
				foo: string(),
			}).andThen((value) => {
				return new Promise<Decoder<typeof value, never>>((resolve) =>
					resolve(succeed(value)),
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
						{
							issues: [
								{
									message: "One or more object properties failed validation.",
									path: undefined,
								},
								{
									message: "Expected number, but received string.",
									path: ["bar"],
								},
							],
						},
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
					expectValidateSync(decoder, JSON.parse('{"bar":"1","foo":"foo"}'), {
						issues: [
							{
								message: "One or more object properties failed validation.",
								path: undefined,
							},
							{
								message: "Expected number, but received string.",
								path: ["bar"],
							},
						],
					});
				});
			});
		});
	});

	describe("map", () => {
		describe("sync", () => {
			const decoder = map(
				(foo, bar) => ({ bar, foo }),
				field("foo", string()),
				field("bar", int()),
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
						{
							issues: [
								{
									message: 'Object property "bar" failed validation.',
									path: undefined,
								},
								{
									message: "Expected number, but received string.",
									path: ["bar"],
								},
							],
						},
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
					expectValidateSync(decoder, JSON.parse('{"bar":"2","foo":"foo"}'), {
						issues: [
							{
								message: 'Object property "bar" failed validation.',
								path: undefined,
							},
							{
								message: "Expected number, but received string.",
								path: ["bar"],
							},
						],
					});
				});
			});
		});

		describe("async", () => {
			describe("async decoder", () => {
				const decoder = map(
					(foo, bar) => ({ bar, foo }),
					field("foo", string()),
					field("bar", int()).andThen((value) => {
						return new Promise<Decoder<number, never>>((resolve) =>
							resolve(succeed(value)),
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
							{
								issues: [
									{
										message: 'Object property "bar" failed validation.',
										path: undefined,
									},
									{
										message: "Expected number, but received string.",
										path: ["bar"],
									},
								],
							},
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
							{
								issues: [
									{
										message: 'Object property "bar" failed validation.',
										path: undefined,
									},
									{
										message: "Expected number, but received string.",
										path: ["bar"],
									},
								],
							},
						);
					});
				});
			});

			describe("async map function", () => {
				const decoder = map(
					(foo, bar) =>
						new Promise<{ bar: number; foo: string }>((resolve) =>
							resolve({ bar, foo }),
						),
					field("foo", string()),
					field("bar", int()),
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
							{
								issues: [
									{
										message: 'Object property "bar" failed validation.',
										path: undefined,
									},
									{
										message: "Expected number, but received string.",
										path: ["bar"],
									},
								],
							},
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
						expectValidateSync(decoder, JSON.parse('{"bar":"1","foo":"foo"}'), {
							issues: [
								{
									message: 'Object property "bar" failed validation.',
									path: undefined,
								},
								{
									message: "Expected number, but received string.",
									path: ["bar"],
								},
							],
						});
					});
				});
			});
		});
	});

	describe("object", () => {
		describe("flattened object", () => {
			describe("sync", () => {
				const decoder = object({
					bar: int(),
					foo: string(),
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
							{
								issues: [
									{
										message: "One or more object properties failed validation.",
										path: undefined,
									},
									{
										message: "Expected number, but received string.",
										path: ["bar"],
									},
								],
							},
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
						expectValidateSync(decoder, JSON.parse('{"bar":"1","foo":"foo"}'), {
							issues: [
								{
									message: "One or more object properties failed validation.",
									path: undefined,
								},
								{
									message: "Expected number, but received string.",
									path: ["bar"],
								},
							],
						});
					});
				});
			});

			describe("async", () => {
				const decoder = object({
					bar: int(),
					foo: string(),
				}).andThen((value) => {
					return new Promise<Decoder<typeof value, never>>((resolve) =>
						resolve(succeed(value)),
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
							{
								issues: [
									{
										message: "One or more object properties failed validation.",
										path: undefined,
									},
									{
										message: "Expected number, but received string.",
										path: ["bar"],
									},
								],
							},
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
						expectValidateSync(decoder, JSON.parse('{"bar":"1","foo":"foo"}'), {
							issues: [
								{
									message: "One or more object properties failed validation.",
									path: undefined,
								},
								{
									message: "Expected number, but received string.",
									path: ["bar"],
								},
							],
						});
					});
				});
			});
		});

		describe("nested object", () => {
			describe("sync", () => {
				const decoder = object({
					bar: object({
						foo: string(),
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
							{
								issues: [
									{
										message: "One or more object properties failed validation.",
										path: undefined,
									},
									{
										message: "Expected object, but received string.",
										path: ["bar"],
									},
								],
							},
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
						expectValidateSync(decoder, JSON.parse('{"bar":"1","foo":"foo"}'), {
							issues: [
								{
									message: "One or more object properties failed validation.",
									path: undefined,
								},
								{
									message: "Expected object, but received string.",
									path: ["bar"],
								},
							],
						});
					});
				});
			});

			describe("async", () => {
				const decoder = object({
					bar: object({
						foo: string().andThen((value) => {
							return new Promise<Decoder<typeof value, never>>((resolve) =>
								resolve(succeed(value)),
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
							{
								issues: [
									{
										message: "One or more object properties failed validation.",
										path: undefined,
									},
									{
										message: "Expected object, but received string.",
										path: ["bar"],
									},
								],
							},
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
							{
								issues: [
									{
										message: "One or more object properties failed validation.",
										path: undefined,
									},
									{
										message: "Expected object, but received string.",
										path: ["bar"],
									},
								],
							},
						);
					});
				});
			});
		});
	});

	describe("oneOrMore", () => {
		describe("sync", () => {
			const decoder = oneOrMore(string());

			describe("validate value", () => {
				test("success", () => {
					expectValidateSync(decoder, ["foo", "bar"], {
						value: ["foo", "bar"],
					});
				});

				test("fail", () => {
					expectValidateSync(decoder, [true, 1], {
						issues: [
							{
								message: "One or more array elements failed validation.",
								path: undefined,
							},
							{
								message: "Expected string, but received boolean.",
								path: ["0"],
							},
							{ message: "Expected string, but received number.", path: ["1"] },
						],
					});
				});

				test("empty", () => {
					expectValidateSync(decoder, [], {
						issues: [
							{
								message: "Expected array length 1, but received 0.",
								path: undefined,
							},
						],
					});
				});
			});
		});
	});

	describe("record", () => {
		describe("sync", () => {
			const decoder = record(string(), string());

			describe("validate value", () => {
				test("success", () => {
					expectValidateSync(
						decoder,
						{ bar: "bar", foo: "foo" },
						{
							value: { bar: "bar", foo: "foo" },
						},
					);
				});

				test("fail", () => {
					expectValidateSync(
						decoder,
						{ bar: 1, foo: "foo" },
						{
							issues: [
								{
									message: "One or more record properties failed validation.",
									path: undefined,
								},
								{
									message: "Expected string, but received number.",
									path: ["bar"],
								},
							],
						},
					);
				});
			});

			describe("validate parsed string", () => {
				test("success", () => {
					expectValidateSync(decoder, JSON.parse('{"bar":"bar","foo":"foo"}'), {
						value: { bar: "bar", foo: "foo" },
					});
				});

				test("fail", () => {
					expectValidateSync(decoder, JSON.parse('{"bar":1,"foo":"foo"}'), {
						issues: [
							{
								message: "One or more record properties failed validation.",
								path: undefined,
							},
							{
								message: "Expected string, but received number.",
								path: ["bar"],
							},
						],
					});
				});
			});
		});

		describe("async", () => {
			const decoder = record(
				string(),
				string().andThen((value) => {
					return new Promise<Decoder<string, never>>((resolve) =>
						resolve(succeed(value)),
					);
				}),
			);

			describe("validate value", () => {
				test("success", async () => {
					await expectValidateAsync(
						decoder,
						{ bar: "bar", foo: "foo" },
						{
							value: { bar: "bar", foo: "foo" },
						},
					);
				});

				test("fail", async () => {
					await expectValidateAsync(
						decoder,
						{ bar: 1, foo: "foo" },
						{
							issues: [
								{
									message: "One or more record properties failed validation.",
									path: undefined,
								},
								{
									message: "Expected string, but received number.",
									path: ["bar"],
								},
							],
						},
					);
				});
			});

			describe("validate parsed string", () => {
				test("success", async () => {
					await expectValidateAsync(
						decoder,
						JSON.parse('{"bar":"bar","foo":"foo"}'),
						{ value: { bar: "bar", foo: "foo" } },
					);
				});

				test("fail", async () => {
					await expectValidateAsync(
						decoder,
						JSON.parse('{"bar":1,"foo":"foo"}'),
						{
							issues: [
								{
									message: "One or more record properties failed validation.",
									path: undefined,
								},
								{
									message: "Expected string, but received number.",
									path: ["bar"],
								},
							],
						},
					);
				});
			});
		});

		describe("key decoder", () => {
			const decoder = record(union(constant("a"), constant("b")), int());

			test("invalid key", () => {
				expectValidateSync(
					decoder,
					{ c: 1 },
					{
						issues: [
							{
								message: 'Record key "c" failed validation.',
								path: undefined,
							},
						],
					},
				);
			});
		});
	});

	describe("string", () => {
		const decoder = string();

		describe("validate value", () => {
			test("success", () => {
				expectValidateSync(decoder, "foo", { value: "foo" } as const);
			});

			test("fail", () => {
				expectValidateSync(decoder, true, {
					issues: [
						{
							message: "Expected string, but received boolean.",
							path: undefined,
						},
					],
				});
			});
		});

		describe("validate parsed string", () => {
			test("success", () => {
				expectValidateSync(decoder, JSON.parse('"foo"'), {
					value: "foo",
				} as const);
			});

			test("fail", () => {
				expectValidateSync(decoder, JSON.parse("true"), {
					issues: [
						{
							message: "Expected string, but received boolean.",
							path: undefined,
						},
					],
				});
			});
		});
	});

	describe("tuple", () => {
		describe("sync", () => {
			const decoder = tuple(string(), int());

			describe("validate value", () => {
				test("success", () => {
					expectValidateSync(decoder, ["foo", 1], { value: ["foo", 1] });
				});

				test("fail", () => {
					expectValidateSync(decoder, [true, 1], {
						issues: [
							{
								message: "One or more array elements failed validation.",
								path: undefined,
							},
							{
								message: "Expected string, but received boolean.",
								path: ["0"],
							},
						],
					});
				});
			});

			describe("validate parsed string", () => {
				test("success", () => {
					expectValidateSync(decoder, JSON.parse('["foo",1]'), {
						value: ["foo", 1],
					});
				});

				test("fail", () => {
					expectValidateSync(decoder, JSON.parse("[true,1]"), {
						issues: [
							{
								message: "One or more array elements failed validation.",
								path: undefined,
							},
							{
								message: "Expected string, but received boolean.",
								path: ["0"],
							},
						],
					});
				});
			});
		});

		describe("async", () => {
			const decoder = tuple(
				string(),
				int().andThen((value) => {
					return new Promise<Decoder<number, never>>((resolve) =>
						resolve(succeed(value)),
					);
				}),
			);

			describe("validate value", () => {
				test("success", async () => {
					await expectValidateAsync(decoder, ["foo", 1], { value: ["foo", 1] });
				});

				test("fail", async () => {
					await expectValidateAsync(decoder, [true, 1], {
						issues: [
							{
								message: "One or more array elements failed validation.",
								path: undefined,
							},
							{
								message: "Expected string, but received boolean.",
								path: ["0"],
							},
						],
					});
				});
			});

			describe("validate parsed string", () => {
				test("success", async () => {
					await expectValidateAsync(decoder, JSON.parse('["foo",1]'), {
						value: ["foo", 1],
					});
				});

				test("fail", async () => {
					await expectValidateAsync(decoder, JSON.parse("[true,1]"), {
						issues: [
							{
								message: "One or more array elements failed validation.",
								path: undefined,
							},
							{
								message: "Expected string, but received boolean.",
								path: ["0"],
							},
						],
					});
				});
			});
		});
	});

	describe("union", () => {
		describe("sync", () => {
			const decoder = union(string(), int());

			describe("validate value", () => {
				test("success", () => {
					expectValidateSync(decoder, "foo", { value: "foo" } as const);
				});

				test("fail", () => {
					expectValidateSync(decoder, true, {
						issues: [
							{
								message: "None of the union members matched.",
								path: undefined,
							},
							{
								message: "Expected string, but received boolean.",
								path: undefined,
							},
							{
								message: "Expected number, but received boolean.",
								path: undefined,
							},
						],
					});
				});
			});

			describe("validate parsed string", () => {
				test("success", () => {
					expectValidateSync(decoder, JSON.parse('"foo"'), {
						value: "foo",
					} as const);
				});

				test("fail", () => {
					expectValidateSync(decoder, JSON.parse("true"), {
						issues: [
							{
								message: "None of the union members matched.",
								path: undefined,
							},
							{
								message: "Expected string, but received boolean.",
								path: undefined,
							},
							{
								message: "Expected number, but received boolean.",
								path: undefined,
							},
						],
					});
				});
			});
		});

		describe("async", () => {
			const decoder = union(
				string(),
				int().andThen((value) => {
					return new Promise<Decoder<number, never>>((resolve) =>
						resolve(succeed(value)),
					);
				}),
			);

			describe("validate value", () => {
				test("success", () => {
					expectValidateSync(decoder, "foo", { value: "foo" } as const);
				});

				test("fail", async () => {
					await expectValidateAsync(decoder, true, {
						issues: [
							{
								message: "None of the union members matched.",
								path: undefined,
							},
							{
								message: "Expected string, but received boolean.",
								path: undefined,
							},
							{
								message: "Expected number, but received boolean.",
								path: undefined,
							},
						],
					});
				});
			});

			describe("validate parsed string", () => {
				test("success", () => {
					expectValidateSync(decoder, JSON.parse('"foo"'), {
						value: "foo",
					} as const);
				});

				test("fail", async () => {
					await expectValidateAsync(decoder, JSON.parse("true"), {
						issues: [
							{
								message: "None of the union members matched.",
								path: undefined,
							},
							{
								message: "Expected string, but received boolean.",
								path: undefined,
							},
							{
								message: "Expected number, but received boolean.",
								path: undefined,
							},
						],
					});
				});
			});
		});
	});

	describe("decoder method", () => {
		describe("andThen", () => {
			describe("sync", () => {
				const decoder = number().andThen(() => int());

				describe("validate value", () => {
					test("success", () => {
						expectValidateSync(decoder, 1, { value: 1 } as const);
					});

					test("fail", () => {
						expectValidateSync(decoder, 1.5, {
							issues: [
								{
									message: "Expected integer, but received float.",
									path: undefined,
								},
							],
						});
					});
				});

				describe("validate parsed string", () => {
					test("success", () => {
						expectValidateSync(decoder, JSON.parse("1"), { value: 1 } as const);
					});

					test("fail", () => {
						expectValidateSync(decoder, JSON.parse("1.5"), {
							issues: [
								{
									message: "Expected integer, but received float.",
									path: undefined,
								},
							],
						});
					});
				});
			});

			describe("async", () => {
				const decoder = number().andThen(
					() => new Promise<Decoder<number>>((resolve) => resolve(int())),
				);

				describe("validate value", () => {
					test("success", async () => {
						await expectValidateAsync(decoder, 1, { value: 1 } as const);
					});

					test("fail", async () => {
						await expectValidateAsync(decoder, 1.5, {
							issues: [
								{
									message: "Expected integer, but received float.",
									path: undefined,
								},
							],
						});
					});
				});

				describe("validate parsed string", () => {
					test("success", async () => {
						await expectValidateAsync(decoder, JSON.parse("1"), {
							value: 1,
						} as const);
					});

					test("fail", async () => {
						await expectValidateAsync(decoder, JSON.parse("1.5"), {
							issues: [
								{
									message: "Expected integer, but received float.",
									path: undefined,
								},
							],
						});
					});
				});
			});
		});

		describe("map", () => {
			describe("sync", () => {
				const decoder = string().map((value) => Number(value));

				describe("validate value", () => {
					test("success", () => {
						expectValidateSync(decoder, "1", { value: 1 } as const);
					});

					test("fail", () => {
						expectValidateSync(decoder, 1, {
							issues: [
								{
									message: "Expected string, but received number.",
									path: undefined,
								},
							],
						});
					});
				});

				describe("validate parsed string", () => {
					test("success", () => {
						expectValidateSync(decoder, JSON.parse('"1"'), {
							value: 1,
						} as const);
					});

					test("fail", () => {
						expectValidateSync(decoder, JSON.parse("1"), {
							issues: [
								{
									message: "Expected string, but received number.",
									path: undefined,
								},
							],
						});
					});
				});
			});

			describe("async", () => {
				const decoder = string().map(
					(value) => new Promise<number>((resolve) => resolve(Number(value))),
				);

				describe("validate value", () => {
					test("success", async () => {
						await expectValidateAsync(decoder, "1", { value: 1 } as const);
					});

					test("fail", () => {
						expectValidateSync(decoder, 1, {
							issues: [
								{
									message: "Expected string, but received number.",
									path: undefined,
								},
							],
						});
					});
				});

				describe("validate parsed string", () => {
					test("success", async () => {
						await expectValidateAsync(decoder, JSON.parse('"1"'), {
							value: 1,
						} as const);
					});

					test("fail", () => {
						expectValidateSync(decoder, JSON.parse("1"), {
							issues: [
								{
									message: "Expected string, but received number.",
									path: undefined,
								},
							],
						});
					});
				});
			});
		});
	});
});
