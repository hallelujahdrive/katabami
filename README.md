# Katabami

[![CI](https://github.com/hallelujahdrive/katabami/actions/workflows/ci.yml/badge.svg)](https://github.com/hallelujahdrive/katabami/actions/workflows/ci.yml)

Katabami is a TypeScript JSON decoding library.

Compose small decoders into a larger one, then turn unknown JSON into a typed
`Result`. Failures keep a nested issue tree, so you can report errors at the
same shape as the input. Decoders also implement
[Standard Schema](https://standardschema.dev/).

## Motivation

Katabami follows [elm/json](https://package.elm-lang.org/packages/elm/json/latest/):
a small set of type-level decoders, composed into larger ones. There is no
constraint DSL (`min`, `email`, `regex`, and so on). The primitive building
blocks are the types themselves (`string`, `int`, `object`, `union`, …).

The job is to take serialized data from a boundary (HTTP, storage, a worker)
and recover typed values on this side. That is decoding, not validation.

A validator asks whether a value is acceptable and usually leaves it as
`unknown` or the same runtime shape. A decoder answers a different question:
given untyped input, can it be turned into this type? Success yields a value
the type system can trust; failure yields issues that explain why it could
not.

Katabami is a decoder library.

## Features

- **A minimal type DSL, in the spirit of elm/json.** The combinators are the
  types themselves (`string`, `int`, `object`, `union`, …). You compose those
  into the shape you want to recover. There is no separate constraint language.
- **Types flow both ways.** `katabami.Infer` reads the decoded type off a
  decoder. The same combinators also take a generic, so you can start from a
  type and build a decoder that must match it.

```ts
import * as katabami from "katabami";

const fromDecoder = katabami.object({
	age: katabami.int(),
	name: katabami.string(),
});

type User = katabami.Infer<typeof fromDecoder>;
// { age: number; name: string }

const fromType = katabami.object<User>({
	age: katabami.int(),
	name: katabami.string(),
});
```

- **Async and sync compose the same way.** A decoder that returns a `Promise`
  (`map`, `andThen`, `lazy`) nests inside `object`, `array`, and the rest
  exactly like a synchronous one. Decoding still goes through `decodeValue` /
  `decodeString`; the result is a `Promise` only when the decoder is async.
- **Issues follow the value’s structure.** Decode failures are not a flat list
  first. `error.issues` is a nested object you can read like the input:
  `issues.user?.address?.zip`. `getIssueMessage` pulls the message off any
  node.

```ts
import * as katabami from "katabami";

const decoder = katabami.object({
	user: katabami.object({
		age: katabami.int(),
		name: katabami.string(),
	}),
});

const result = decoder.decodeValue({ user: { age: "20", name: "Ada" } });

if (!result.ok) {
	katabami.getIssueMessage(result.error.issues.user?.age)?.format();
	// "Expected number, but received string."
}
```

- **[Standard Schema](https://standardschema.dev/) compatible.** Every decoder
  implements Standard Schema v1 (`vendor: "katabami"`), so it works with any
  Standard Schema consumer.

## Packages

This repository is a pnpm workspace:

| Package | Description |
| --- | --- |
| [`katabami`](packages/katabami) | Core decoders, issues, and Standard Schema |
| [`@katabami/json-schema`](packages/json-schema) | JSON Schema generation and Standard JSON Schema |
| [`@katabami/i18next`](packages/i18next) | i18next message formatting (`en` / `ja`) |

## Install

```sh
pnpm add katabami
# npm install katabami
```

Optional integrations:

```sh
pnpm add @katabami/json-schema
pnpm add @katabami/i18next i18next
```

## Quick start

```ts
import * as katabami from "katabami";

const user = katabami.object({
	age: katabami.int(),
	name: katabami.string(),
	tags: katabami.optional(katabami.array(katabami.string())),
});

type User = katabami.Infer<typeof user>;
// { age: number; name: string; tags: string[] | undefined }

const result = user.decodeValue({ age: 20, name: "Ada" });

if (result.ok) {
	console.log(result.value.name);
} else {
	console.log(katabami.getIssueMessage(result.error.issues)?.format());
}
```

`decodeString` parses JSON first, then decodes:

```ts
user.decodeString('{"age":20,"name":"Ada"}');
```

## Decoders

### Primitives

| Decoder | Accepts |
| --- | --- |
| `string()` | `string` |
| `boolean()` | `boolean` |
| `int()` | integers (`Number.isInteger`) |
| `float()` | any `number` |
| `constant(value)` | a literal (`string`, `number`, `boolean`, or `null`) |
| `value()` | anything (typed as `unknown` by default) |
| `succeed(value)` | anything; always returns `value` |
| `failed()` | nothing; always fails |

### Structure

```ts
import * as katabami from "katabami";

katabami.array(katabami.string());
katabami.oneOrMore(katabami.string()); // [string, ...string[]]
katabami.tuple(katabami.string(), katabami.int());
katabami.record(katabami.string(), katabami.int()); // Record<string, number>
katabami.union(katabami.string(), katabami.int());
katabami.nullable(katabami.string()); // string | null
katabami.optional(katabami.string()); // string | undefined (null/undefined → undefined)
```

`object` strips missing/`undefined` properties and keeps `null`:

```ts
import * as katabami from "katabami";

const decoder = katabami.object({
	name: katabami.string(),
	nickname: katabami.optional(katabami.string()),
});

decoder.decodeValue({ name: "Ada" });
// { ok: true, value: { name: "Ada" } }
```

### Extraction

Read a nested field without decoding the whole object:

```ts
import * as katabami from "katabami";

katabami.field("name", katabami.string());
katabami.at(["person", "name"], katabami.string());
katabami.index(0, katabami.int());
```

`at(["person", "name"], string())` is the same as
`field("person", field("name", string()))`.

### Combining values

`map` runs several decoders against the **same** input, then combines the
results. `.map()` on a decoder transforms an already decoded value.

```ts
import * as katabami from "katabami";

const pair = katabami.map(
	(foo, bar) => ({ bar, foo }),
	katabami.field("foo", katabami.string()),
	katabami.field("bar", katabami.int()),
);

pair.decodeValue({ bar: 1, foo: "x" });
// { ok: true, value: { bar: 1, foo: "x" } }
```

`lazy` defers decoder construction (useful for recursive types):

```ts
import * as katabami from "katabami";

type Node = { children: Node[]; name: string };

const node: katabami.Decoder<Node> = katabami.lazy(() =>
	katabami.object({
		children: katabami.array(node),
		name: katabami.string(),
	}),
);
```

## Results and issues

`decodeValue` / `decodeString` return a `Result`:

```ts
import * as katabami from "katabami";

type Result<T, I> =
	| { ok: true; value: T }
	| { ok: false; error: katabami.DecodeError<I> };
```

Issues are a nested object (or array for unions) that follows the input shape.
`getIssueMessage` reads the message attached to a node:

```ts
import * as katabami from "katabami";

const decoder = katabami.object({
	foo: katabami.object({
		bar: katabami.string(),
	}),
});

const result = decoder.decodeValue({ foo: { bar: 1 } });

if (!result.ok) {
	katabami.getIssueMessage(result.error.issues)?.format();
	// "One or more object properties failed validation."
	katabami.getIssueMessage(result.error.issues.foo?.bar)?.format();
	// "Expected string, but received number."
}
```

`flattenIssues` turns that tree into Standard Schema `{ message, path }[]`.
Pass a formatter as the second argument to format messages while flattening.
The flattened list keeps the source issues type, so `unflattenIssues` can
rebuild typed paths without a generic. Messages stay pre-formatted.

```ts
import * as katabami from "katabami";

const decoder = katabami.object({
	foo: katabami.object({
		bar: katabami.string(),
	}),
});

const result = decoder.decodeValue({ foo: { bar: 1 } });

if (!result.ok) {
	const flattened = katabami.flattenIssues(result.error.issues);
	// [
	//   { message: "One or more object properties failed validation.", path: undefined },
	//   { message: "One or more object properties failed validation.", path: ["foo"] },
	//   { message: "Expected string, but received number.", path: ["foo", "bar"] },
	// ]

	const restored = katabami.unflattenIssues(flattened);
	katabami.getIssueMessage(restored)?.format();
	// "One or more object properties failed validation."
	katabami.getIssueMessage(restored.foo?.bar)?.format();
	// "Expected string, but received number."
	katabami.getIssueMessage(restored.foo?.bar)?.message;
	// already a formatted string
}
```

`unflattenIssues` also accepts Standard Schema `PathSegment` objects (`{ key }`):

```ts
import * as katabami from "katabami";

const restored = katabami.unflattenIssues([
	{ message: "root failed", path: undefined },
	{ message: "nested failed", path: [{ key: "foo" }] },
]);

katabami.getIssueMessage(restored.foo)?.format();
// "nested failed"
```

Custom issues use `createIssues`:

```ts
import * as katabami from "katabami";

const decoder = katabami.string().catch(() => ({
	error: new katabami.DecodeError(
		"Custom error",
		katabami.createIssues("custom", "Custom issue"),
	),
	ok: false,
}));
```

`catch` can also recover by returning `{ ok: true, value }`.

## Decoder methods

| Method | Purpose |
| --- | --- |
| `decodeValue(value)` | Decode an unknown value |
| `decodeString(json)` | `JSON.parse`, then decode |
| `map(fn)` | Transform a successful value |
| `andThen(fn)` | Continue with another decoder |
| `catch(fn)` | Recover or remap issues |
| `getSchema()` | Accepted-value schema for plugins |

```ts
import * as katabami from "katabami";

const port = katabami
	.string()
	.map(Number)
	.andThen((n) => (Number.isInteger(n) ? katabami.succeed(n) : katabami.failed()));
```

## Async decoding

If `map`, `andThen`, or `lazy` returns a `Promise`, the decoder becomes async:
`decodeValue` / `decodeString` return `Promise<Result<...>>`.

```ts
import * as katabami from "katabami";

const decoder = katabami.string().map(async (id) => fetchUser(id));

const result = await decoder.decodeValue("42");
```

## Standard Schema

Every decoder implements Standard Schema v1 (`vendor: "katabami"`):

```ts
import * as katabami from "katabami";

const user = katabami.object({
	age: katabami.int(),
	name: katabami.string(),
});

const result = user["~standard"].validate({ age: 20, name: "Ada" });

if (result.issues) {
	console.log(result.issues);
} else {
	console.log(result.value);
}
```

Pass a custom formatter through `libraryOptions`:

```ts
import * as katabami from "katabami";

const user = katabami.object({
	age: katabami.int(),
	name: katabami.string(),
});

user["~standard"].validate(input, {
	libraryOptions: { formatter },
});
```

## JSON Schema

`@katabami/json-schema` converts a decoder (or `getSchema()` output) to JSON
Schema. Targets: `draft-2020-12` (default), `draft-07`, `openapi-3.0`.
`toStandardJsonSchema` implements
[Standard JSON Schema](https://standardschema.dev/json-schema).

```ts
import * as katabami from "katabami";
import { toJsonSchema, toStandardJsonSchema } from "@katabami/json-schema";

const decoder = katabami.object({
	age: katabami.int(),
	name: katabami.optional(katabami.string()),
});

toJsonSchema(decoder);
// {
//   $schema: "https://json-schema.org/draft/2020-12/schema",
//   type: "object",
//   properties: { age: { type: "integer" }, name: { type: ["string", "null"] } },
//   required: ["age"]
// }

toJsonSchema(decoder, { target: "draft-07" });
toStandardJsonSchema(decoder)["~standard"].jsonSchema.input({
	target: "openapi-3.0",
});
```

Async `getSchema()` is not supported by `toJsonSchema`. Resolve the schema
first, then convert.

`DecoderSchema` from `getSchema()` describes accepted **input**. `map` /
`andThen` do not change that shape.

## i18next

`@katabami/i18next` ships English and Japanese resources plus an i18next
formatter module (`quoteString`).

```ts
import i18next from "i18next";
import * as katabami from "katabami";
import { createFormatter, formatter, resources } from "@katabami/i18next";

await i18next.use(formatter).init({
	interpolation: { escapeValue: false },
	lng: "ja",
	resources: {
		en: { translation: resources.en },
		ja: { translation: resources.ja },
	},
});

const format = createFormatter(i18next.t);
const result = katabami.string().decodeValue(1);

if (!result.ok) {
	katabami.getIssueMessage(result.error.issues)?.format(format);
	// 文字列が期待されましたが、数値でした。

	const flattened = katabami.flattenIssues(result.error.issues, format);
	// [{ message: "文字列が期待されましたが、数値でした。", path: undefined }]

	const restored = katabami.unflattenIssues(flattened);
	katabami.getIssueMessage(restored)?.format();
	// 文字列が期待されましたが、数値でした。
}
```

## Development

Tooling is managed with [devbox](https://www.jetify.com/devbox). From the
repository root:

```sh
devbox run -- pnpm install
devbox run -- pnpm test -- --run
devbox run -- pnpm test:typecheck -- --run
devbox run -- pnpm build
devbox run -- pnpm check
```

## Release

Bump every workspace package, commit, and tag:

```sh
devbox run -- pnpm release -- patch
devbox run -- pnpm release -- minor
devbox run -- pnpm release -- prerelease --preid beta
devbox run -- pnpm release -- 0.1.0 --push
```

`--push` also pushes the commit and tag. A `v*` tag triggers GitHub Actions
to publish [Release Drafter](https://github.com/release-drafter/release-drafter)
notes and the npm packages. Merges to `main` keep the next draft release up to
date.

## License

Copyright (C) 2025-2026 hallelujahdrive.

Released under the [DO WHAT THE FUCK YOU WANT TO PUBLIC LICENSE](LICENSE)
(WTFPL Version 2). See [wtfpl.net](http://www.wtfpl.net/) for the license
home page.
