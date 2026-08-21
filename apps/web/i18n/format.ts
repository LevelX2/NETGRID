import type { AppLocale } from "./locale";

const APP_LOCALE_TAGS: Record<AppLocale, string> = {
  de: "de-DE",
  en: "en-US",
  fr: "fr-FR",
};

export function appLocaleTag(locale: AppLocale): string {
  return APP_LOCALE_TAGS[locale];
}

export function formatAppDateTime(
  value: string | number | Date,
  locale: AppLocale,
  options: Intl.DateTimeFormatOptions,
): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat(appLocaleTag(locale), options).format(date);
}

export function createAppCollator(
  locale: AppLocale,
  options?: Intl.CollatorOptions,
): Intl.Collator {
  return new Intl.Collator(appLocaleTag(locale), options);
}

export function lowercaseInitial(value: string, locale: AppLocale): string {
  if (!value) return value;
  return `${value.charAt(0).toLocaleLowerCase(appLocaleTag(locale))}${value.slice(1)}`;
}
