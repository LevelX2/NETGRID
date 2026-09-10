"use client";

import { Award } from "lucide-react";
import { useTranslations } from "use-intl/react";

import { type DeckAgendaStatus } from "./deck-editor-model";

const AgendaIcon = Award;

export function DeckAgendaStatusBadge({
  status,
}: {
  status: DeckAgendaStatus | null;
}) {
  const t = useTranslations("Decks.agendaStatus");
  if (!status) return null;
  const complete = status.missingAgendaPoints === 0;
  const loading = status.agendaPoints === null;
  const missingLabel = loading
    ? t("loading")
    : complete
      ? t("complete")
      : t("missing", { count: status.missingAgendaPoints ?? 0 });
  return (
    <p
      className={`deckAgendaStatus ${loading ? "loading" : complete ? "complete" : "missing"}`}
      title={t("title", { count: status.effectiveCardsForMinimum ?? 0 })}
    >
      <AgendaIcon size={14} />
      <span>
        {loading
          ? t("minimum", { minimum: status.minimumAgendaPoints })
          : t("points", {
              points: status.agendaPoints!,
              minimum: status.minimumAgendaPoints,
            })}
      </span>
      <strong>{missingLabel}</strong>
    </p>
  );
}
