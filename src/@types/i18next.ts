import "i18next";

import type en from "../lib/i18n/locales/en.json";

declare module "i18next" {
	interface CustomTypeOptions {
		resources: {
			[key: string]: typeof en;
		};
	}

	interface CustomPluginOptions {
		katabamiNS?: string;
	}
}
