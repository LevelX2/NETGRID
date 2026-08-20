"use client";

import type { ReactNode } from "react";
import type { AbstractIntlMessages } from "use-intl";
import { IntlProvider } from "use-intl/react";

import type { AppLocale } from "./locale";

export function AppIntlProvider({
  children,
  locale,
  messages,
}: {
  children: ReactNode;
  locale: AppLocale;
  messages: AbstractIntlMessages;
}) {
  return (
    <IntlProvider locale={locale} messages={messages} timeZone="Europe/Berlin">
      {children}
    </IntlProvider>
  );
}
