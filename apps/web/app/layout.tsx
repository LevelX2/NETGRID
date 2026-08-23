import type { Metadata } from "next";
import { cookies } from "next/headers";

import { AppIntlProvider } from "../i18n/AppIntlProvider";
import { APP_LOCALE_COOKIE_NAME, normalizeAppLocale } from "../i18n/locale";
import { loadAppMessages } from "../i18n/messages";
import { CardImageCollectionRevisionProvider } from "../features/cards/card-image-service";
import { currentPersonalCardImageCollectionRevision } from "../server/card-image-runtime";
import "./globals.css";

export const metadata: Metadata = {
  title: "NETGRID",
  description: "Private NETGRID Spieloberfläche",
  icons: {
    icon: "/brand/netgrid.ico",
    shortcut: "/brand/netgrid.ico",
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const locale = normalizeAppLocale(
    cookieStore.get(APP_LOCALE_COOKIE_NAME)?.value,
  );
  const messages = await loadAppMessages(locale);
  const cardImageCollectionRevision =
    await currentPersonalCardImageCollectionRevision();

  return (
    <html lang={locale}>
      <body>
        <AppIntlProvider locale={locale} messages={messages}>
          <CardImageCollectionRevisionProvider
            revision={cardImageCollectionRevision}
          >
            {children}
          </CardImageCollectionRevisionProvider>
        </AppIntlProvider>
      </body>
    </html>
  );
}
