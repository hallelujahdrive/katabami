import "i18next";

import type en from "../resources/en.json";

declare module "i18next" {
	interface CustomPluginOptions {
		katabamiNS?: string;
	}

	interface CustomTypeOptions {
		resources: {
			[key: string]: typeof en;
		};
	}
}
