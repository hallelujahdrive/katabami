# @katabami/i18next

i18next message formatting for [Katabami](https://github.com/hallelujahdrive/katabami)
issues. Ships English and Japanese resources plus an i18next formatter module
(`quoteString`).

## Install

```sh
pnpm add katabami @katabami/i18next i18next
# npm install katabami @katabami/i18next i18next
```

`i18next` is a peer dependency (`>=25.0.0 <27.0.0`).

## Quick start

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

## Documentation

https://github.com/hallelujahdrive/katabami#i18next

## License

Copyright (C) 2025-2026 hallelujahdrive.

Released under the [DO WHAT THE FUCK YOU WANT TO PUBLIC LICENSE](https://github.com/hallelujahdrive/katabami/blob/main/LICENSE)
(WTFPL Version 2).
