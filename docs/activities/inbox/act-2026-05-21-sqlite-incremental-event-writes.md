---
activityId: act-2026-05-21-sqlite-incremental-event-writes
status: inbox
kind: cleanup
area: server
priority: high
primaryAgent: release-implementation-agent
requiresImplementation: true
createdAt: 2026-05-21
startedAt:
completedAt:
branch:
releaseTarget:
blockedBy: []
resultArtifacts: []
checks: []
---

# SQLite-Events inkrementell schreiben

## Ziel

Der SQLite-Save-Pfad soll bei langen Matches nicht mehr bei jedem Zug die gesamte Event-Historie erneut durchlaufen und schreiben, sondern nur neue oder durch Undo entfernte Events behandeln.

## Kontext und Quellen

- Nutzerbeobachtung vom 2026-05-21: späte Züge fühlen sich langsamer an.
- Bereits umgesetzt: State-Blobs speichern neue Event-Historie nicht mehr eingebettet; private Engine-Events liegen separat in `engine_events`.
- Offener Performancepunkt: `apps/server/src/storage-sqlite.ts` iteriert beim Speichern weiterhin über `record.eventLog` und `record.gameState.eventLog`.
- Betroffene Tabellen: `events`, `engine_events`.

## Scope

- Bestehenden Event-Schreibpfad auf append-/truncate-orientierte Semantik umbauen.
- Vor dem Schreiben den vorhandenen Eventstand je Match bestimmen, z. B. höchste `event_index` oder vorhandene Event-IDs.
- Nur fehlende neue `events` und `engine_events` einfügen.
- Bei Undo oder anderen Rückschnitten Events ab dem neuen Eventende löschen.
- Konfliktverhalten für bereits vorhandene gleiche Event-IDs explizit testen.
- Bestehende Full-Load-, Partial-Load-, Replay- und Undo-Semantik unverändert lassen.

## Nicht im Scope

- Keine Änderung am Replayformat.
- Kein Kürzen der Event-Historie.
- Keine Änderung an `applyAction`, LegalActions, Rules Engine oder PlayerViews.
- Keine Migration alter Snapshot-Blobs; das ist `act-2026-05-21-sqlite-existing-snapshot-compaction`.

## Akzeptanzkriterien

- [ ] Normale neue Züge schreiben nur die neu hinzugekommenen öffentlichen und privaten Engine-Events.
- [ ] Undo oder Rückschnitt entfernt überzählige Events aus `events` und `engine_events`.
- [ ] Replay-StateHash-Checks bleiben nach Save, Reload und Undo grün.
- [ ] Ein Regressionstest simuliert ein Match mit mehreren Events, speichert erneut und bestätigt, dass vorhandene Eventzeilen nicht unnötig umgeschrieben werden.
- [ ] Checks: `corepack pnpm --filter @netgrid/server typecheck`, `corepack pnpm --filter @netgrid/server test`.

## Umsetzungshinweise

- Die bestehende relationale Hydrierung in `SqliteMatchStorage` beibehalten.
- Hidden-Info-Grenze beachten: `events` bleibt public/redigiert, `engine_events` bleibt lokale private Storage-Schicht.
- Bei unklarer Messbarkeit kann der Test über Zeilenzähler, Event-IDs und gezielte Update-Zeitstempel/Probe-Spalten vermieden werden; wichtiger ist die Logik, nicht ein fragiler Timing-Test.

## Ergebnisnotiz

Noch offen.
