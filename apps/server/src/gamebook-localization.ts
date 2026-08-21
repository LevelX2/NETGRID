export const GAMEBOOK_LOCALES = ["de", "en", "fr"] as const;

export type GamebookLocale = (typeof GAMEBOOK_LOCALES)[number];

export const DEFAULT_GAMEBOOK_LOCALE: GamebookLocale = "en";

export function isGamebookLocale(value: unknown): value is GamebookLocale {
  return (
    typeof value === "string" &&
    GAMEBOOK_LOCALES.includes(value as GamebookLocale)
  );
}

export function normalizeGamebookLocale(value: unknown): GamebookLocale {
  return isGamebookLocale(value) ? value : DEFAULT_GAMEBOOK_LOCALE;
}

export function gamebookDownloadFilename(
  matchId: string,
  locale: GamebookLocale,
): string {
  return `netgrid-gamebook-${locale}-${matchId}.md`;
}
