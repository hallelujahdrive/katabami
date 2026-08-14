# Katabami

[![CI](https://github.com/hallelujahdrive/katabami/actions/workflows/ci.yml/badge.svg)](https://github.com/hallelujahdrive/katabami/actions/workflows/ci.yml)

Katabami is a TypeScript JSON decoding library.

Compose small decoders into a larger one, then turn unknown JSON into a typed
`Result`. Failures keep a nested issue tree, so you can report errors at the
same shape as the input. Decoders also implement
[Standard Schema](https://standardschema.dev/).

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

## Issues

Decode failures keep a nested issue tree you can read like the input:

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

## Documentation

Full decoder list, `flattenIssues` / `unflattenIssues`, Standard Schema, JSON
Schema, and i18next usage:

https://github.com/hallelujahdrive/katabami

## License

Copyright (C) 2025-2026 hallelujahdrive.

Released under the [DO WHAT THE FUCK YOU WANT TO PUBLIC LICENSE](https://github.com/hallelujahdrive/katabami/blob/main/LICENSE)
(WTFPL Version 2).
