type DeckValidationView = {
  ok: boolean;
  totalCards: number;
  agendaPoints: number | null;
  errors: string[];
  warnings: string[];
};

type DeckSnapshotView = {
  deckHash: string;
};

import { useTranslations } from "use-intl/react";

export function DeckValidationSummary({
  validation,
  snapshot,
}: {
  validation: DeckValidationView | null;
  snapshot: DeckSnapshotView | null;
}) {
  const t = useTranslations("Decks.validation");
  if (!validation) return null;
  return (
    <div className={`deckValidation ${validation.ok ? "ok" : "bad"}`}>
      <strong>{validation.ok ? t("valid") : t("invalid")}</strong>
      <span>
        {t("cards", { count: validation.totalCards })}
        {validation.agendaPoints !== null
          ? ` · ${t("agendaPoints", { count: validation.agendaPoints })}`
          : ""}
      </span>
      {snapshot ? <small>{snapshot.deckHash}</small> : null}
      {[...validation.errors, ...validation.warnings].map((message) => (
        <small key={message}>{message}</small>
      ))}
    </div>
  );
}
