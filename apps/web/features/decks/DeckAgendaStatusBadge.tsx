"use client";

import { Award } from "lucide-react";

import { type DeckAgendaStatus } from "../../app/deck-editor-ui";

const AgendaIcon = Award;

export function DeckAgendaStatusBadge({ status }: { status: DeckAgendaStatus | null }) {
  if (!status) return null;
  const complete = status.missingAgendaPoints === 0;
  const loading = status.agendaPoints === null;
  const missingLabel = loading ? "wird geladen" : complete ? "Mindestmenge erfüllt" : `${status.missingAgendaPoints} fehlen`;
  return (
    <p
      className={`deckAgendaStatus ${loading ? "loading" : complete ? "complete" : "missing"}`}
      title={`Agenda-Mindestmenge berechnet für ${status.effectiveCardsForMinimum} Karten.`}
    >
      <AgendaIcon size={14} />
      <span>{loading ? `Agenda-Punkte / min. ${status.minimumAgendaPoints}` : `${status.agendaPoints} / ${status.minimumAgendaPoints} Agenda-Punkte`}</span>
      <strong>{missingLabel}</strong>
    </p>
  );
}
