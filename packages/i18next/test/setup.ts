import i18next from "i18next";
import { formatter, resources } from "../src";

i18next.use(formatter).init({
	interpolation: {
		escapeValue: false,
	},
	resources: {
		en: { translation: resources.en },
		ja: { translation: resources.ja },
	},
});
