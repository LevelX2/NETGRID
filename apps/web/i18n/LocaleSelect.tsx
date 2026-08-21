"use client";

import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "use-intl/react";

import {
  APP_LOCALES,
  appLocaleCookie,
  normalizeAppLocale,
  type AppLocale,
} from "./locale";

const APP_LOCALE_FLAGS: Record<AppLocale, string> = {
  de: "🇩🇪",
  en: "🇬🇧",
  fr: "🇫🇷",
};

const APP_LOCALE_MESSAGE_KEYS: Record<
  AppLocale,
  "german" | "english" | "french"
> = {
  de: "german",
  en: "english",
  fr: "french",
};

export function LocaleSelect({ className = "" }: { className?: string }) {
  const locale = normalizeAppLocale(useLocale());
  const t = useTranslations("LocaleSettings");
  const router = useRouter();

  function selectLocale(nextLocale: AppLocale): void {
    if (nextLocale === locale) return;
    document.cookie = appLocaleCookie(nextLocale);
    document.documentElement.lang = nextLocale;
    router.refresh();
  }

  return (
    <label className={`localeSelect ${className}`.trim()}>
      <span className="srOnly">{t("groupLabel")}</span>
      <select
        value={locale}
        onChange={(event) =>
          selectLocale(normalizeAppLocale(event.target.value))
        }
        aria-label={t("groupLabel")}
        title={t("groupLabel")}
      >
        {APP_LOCALES.map((optionLocale) => (
          <option key={optionLocale} value={optionLocale}>
            {APP_LOCALE_FLAGS[optionLocale]}{" "}
            {t(APP_LOCALE_MESSAGE_KEYS[optionLocale])}
          </option>
        ))}
      </select>
    </label>
  );
}
