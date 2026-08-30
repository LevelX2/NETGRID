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

const APP_LOCALE_SELF_NAMES: Record<AppLocale, string> = {
  de: "Deutsch",
  en: "English",
  fr: "Français",
};

export function LocaleSelect({
  className = "",
  presentation = "default",
}: {
  className?: string;
  presentation?: "default" | "header";
}) {
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
      {presentation === "header" ? <LanguageGlobeIcon /> : null}
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
            {presentation === "header"
              ? APP_LOCALE_SELF_NAMES[optionLocale]
              : `${APP_LOCALE_FLAGS[optionLocale]} ${t(APP_LOCALE_MESSAGE_KEYS[optionLocale])}`}
          </option>
        ))}
      </select>
    </label>
  );
}

function LanguageGlobeIcon() {
  return (
    <svg
      className="optionsHeaderLocaleIcon"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle className="optionsHeaderLocaleIconFill" cx="12" cy="12" r="10" />
      <path
        className="optionsHeaderLocaleIconGrid"
        d="M2.75 12h18.5M12 2c2.85 2.72 4.4 6.2 4.4 10S14.85 19.28 12 22M12 2c-2.85 2.72-4.4 6.2-4.4 10S9.15 19.28 12 22"
      />
    </svg>
  );
}
