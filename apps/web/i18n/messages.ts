import "server-only";

import type { AbstractIntlMessages } from "use-intl";

import type { AppLocale } from "./locale";

const messageLoaders: Record<AppLocale, () => Promise<AbstractIntlMessages>> = {
  de: async () =>
    mergeMaintenanceMessages(
      (await import("../messages/de.json")).default,
      (await import("../messages/maintenance/de.json")).default,
    ),
  en: async () =>
    mergeMaintenanceMessages(
      (await import("../messages/en.json")).default,
      (await import("../messages/maintenance/en.json")).default,
    ),
  fr: async () =>
    mergeMaintenanceMessages(
      (await import("../messages/fr.json")).default,
      (await import("../messages/maintenance/fr.json")).default,
    ),
};

function mergeMaintenanceMessages(
  base: AbstractIntlMessages,
  maintenance: AbstractIntlMessages,
): AbstractIntlMessages {
  return {
    ...base,
    Maintenance: {
      ...((base.Maintenance as AbstractIntlMessages | undefined) ?? {}),
      ...maintenance,
    },
  };
}

export async function loadAppMessages(
  locale: AppLocale,
): Promise<AbstractIntlMessages> {
  return messageLoaders[locale]();
}
