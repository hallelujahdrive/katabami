import i18next from "i18next";
import { initKatabami, resources } from "../src";

i18next.use(initKatabami).init({
	interpolation: {
		escapeValue: false,
	},
	resources: {
		en: { translation: resources.en },
		ja: { translation: resources.ja },
	},
});
