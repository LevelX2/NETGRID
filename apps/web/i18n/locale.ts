export const APP_LOCALES = ["de", "en"] as const;
export type AppLocale = (typeof APP_LOCALES)[number];

export const DEFAULT_APP_LOCALE: AppLocale = "de";
export const APP_LOCALE_COOKIE_NAME = "netgrid.locale";
export const APP_LOCALE_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

export function isAppLocale(value: unknown): value is AppLocale {
  return typeof value === "string" && APP_LOCALES.includes(value as AppLocale);
}

export function normalizeAppLocale(value: unknown): AppLocale {
  return isAppLocale(value) ? value : DEFAULT_APP_LOCALE;
}

export function appLocaleCookie(locale: AppLocale): string {
  return `${APP_LOCALE_COOKIE_NAME}=${encodeURIComponent(locale)}; Path=/; Max-Age=${APP_LOCALE_COOKIE_MAX_AGE_SECONDS}; SameSite=Lax`;
}

