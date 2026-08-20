import "server-only";

import type { AbstractIntlMessages } from "use-intl";

import type { AppLocale } from "./locale";

const messageLoaders: Record<
  AppLocale,
  () => Promise<AbstractIntlMessages>
> = {
  de: async () => (await import("../messages/de.json")).default,
  en: async () => (await import("../messages/en.json")).default,
  fr: async () => (await import("../messages/fr.json")).default,
};

export async function loadAppMessages(
  locale: AppLocale,
): Promise<AbstractIntlMessages> {
  return messageLoaders[locale]();
}
