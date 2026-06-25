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

export function DeckValidationSummary({ validation, snapshot }: { validation: DeckValidationView | null; snapshot: DeckSnapshotView | null }) {
  if (!validation) return null;
  return (
    <div className={`deckValidation ${validation.ok ? "ok" : "bad"}`}>
      <strong>{validation.ok ? "Validiert" : "Nicht valide"}</strong>
      <span>
        {validation.totalCards} Karten{validation.agendaPoints !== null ? ` · ${validation.agendaPoints} Agenda Points` : ""}
      </span>
      {snapshot ? <small>{snapshot.deckHash}</small> : null}
      {[...validation.errors, ...validation.warnings].map((message) => (
        <small key={message}>{message}</small>
      ))}
    </div>
  );
}
