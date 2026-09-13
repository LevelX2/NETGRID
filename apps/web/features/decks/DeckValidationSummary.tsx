import type { DeckValidationResult } from "@netgrid/decks";
import { localizedDeckValidationIssues } from "../../i18n/deck-validation";

type DeckSnapshotView = {
  deckHash: string;
};

import { useTranslations } from "use-intl/react";

export function DeckValidationSummary({
  validation,
  snapshot,
}: {
  validation: DeckValidationResult | null;
  snapshot: DeckSnapshotView | null;
}) {
  const t = useTranslations("Decks.validation");
  const issueT = useTranslations("Decks.issues");
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
      {localizedDeckValidationIssues(validation, issueT).map((message) => (
        <small key={message}>{message}</small>
      ))}
    </div>
  );
}
