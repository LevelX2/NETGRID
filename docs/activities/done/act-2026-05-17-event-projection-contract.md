---
activityId: act-2026-05-17-event-projection-contract
status: done
kind: architecture
area: server
priority: normal
primaryAgent: architecture-review-agent
requiresImplementation: true
createdAt: 2026-05-17
startedAt: 2026-05-17
completedAt: 2026-05-17
branch:
releaseTarget:
blockedBy: []
resultArtifacts:
  - apps/server/src/event-projection.ts
  - apps/server/src/multiplayer.ts
  - apps/server/src/multiplayer.test.ts
checks:
  - corepack pnpm --filter @netgrid/server test -- -t "builds V1.5.0 private replay views|keeps replay DecisionDebug side-safe"
  - corepack pnpm --filter @netgrid/server typecheck
---

# EngineEvent, ServerEventRecord und PublicGameEvent sauber projizieren

## Ziel

Replay- und Public-Event-Daten sollen eindeutig modelliert werden: Engine-Events bleiben die Replay-Quelle, ServerEventRecords dienen Transport/Index/Replay-View, und PublicGameEvents bleiben side-redigierte Anzeigeereignisse.

## Kontext und Quellen

- Architektur-Check-Finding vom 2026-05-17: Replay- und Public-Event-Daten sind doppelt modelliert.
- Betroffene Anker: `apps/server/src/multiplayer.ts` ca. Zeile 2466, 2516 und 2521.
- Beobachtung: `record.eventLog` speichert public/redacted-nahe `EventRecord`; `record.gameState.eventLog` bleibt zusätzlich Engine-Quelle mit Replay-PrivatePayload. AI erweitert für Server-Replay die öffentliche Eventkopie, nicht zwingend die Engine-Eventkopie.
- Risiko: Drift zwischen Anzeige-Replay, Persistenz und Engine-Replay. Kein aktueller Leak-Befund, aber Wartbarkeitsrisiko für Public Replay und Debugdaten.
- Nutzerklärung vom 2026-05-17: Public Replay ist noch keine feste Produktentscheidung. Falls NETGRID später öffentlich geteilt wird, ist ein vollständig betrachtbares Spiel grundsätzlich akzeptabel; die Architekturfrage bleibt trotzdem offen, ob Replays aus privaten Engine-Daten oder aus einer redigierten/öffentlichen Projektion laufen sollen.

## Scope

- Dokumentierte Event-Projection-Schicht einführen oder vorbereiten.
- Begriffe und Verantwortlichkeiten festlegen:
  - `EngineEvent`: einzige deterministische Replay-Quelle.
  - `ServerEventRecord`: Transport, Index, Storage-Metadaten und Replay-View.
  - `PublicGameEvent`: side-redigierte Anzeige.
- AI-Debug-/Server-Replay-Anreicherungen so prüfen, dass sie nicht mit Engine-Replay verwechselt werden.
- Tests ergänzen, die AI-Debug, Hidden-Info-Barriere, Replay-Hash und Perspective-Redaction gemeinsam prüfen.

## Nicht im Scope

- Kein Public-Replay-Produktfeature ohne eigenes Gate.
- Keine Vorentscheidung, dass NETGRID überhaupt public gehen muss.
- Keine Änderung an Replay-PrivatePayload-Semantik.
- Keine Redaction-Aufweichung.
- Keine Migration historischer Storage-Daten, außer sie ist minimal und ausdrücklich nötig.
- Keine Engine-Event-Formatänderung ohne separates Gate.

## Akzeptanzkriterien

- [x] Eine dokumentierte Projection-Schicht oder ein klar benannter Builder trennt Engine-, Server- und Public-Event-Verantwortlichkeiten.
- [x] Engine-Event bleibt Replay-Quelle.
- [x] ServerEventRecord wird nicht als private Replay-Quelle missverstanden.
- [x] AI-Debugdaten und PublicEvents bleiben side-sicher.
- [x] Tests prüfen gemeinsam AI-Debug, Hidden-Info-Barriere, Replay-Hash und Perspective-Redaction.

## Umsetzungshinweise

- Zuerst Dokumentation und Typ-/Builder-Grenzen schaffen, dann erst Datenfluss ändern.
- Bestehende Redaction-Tests als Schutznetz verwenden.
- Falls Public Replay langfristig geplant ist, dafür ein eigenes Anschluss-Gate anlegen.

## Ergebnisnotiz

Abgeschlossen. `apps/server/src/event-projection.ts` trennt die Begriffe jetzt explizit: `EngineEvent` bleibt `GameEvent` und damit Replay-Quelle, `ServerEventRecord` ist der Transport-/Index-/Replay-View-Datensatz ohne private Replay-Payload, und `PublicGameEvent` wird über benannte Projektionsfunktionen aus Engine-Events bzw. aus ServerEventRecords für eine Replay-Perspektive erzeugt.

`MultiplayerService` nutzt diese Builder für gespeicherte EventRecords und perspektivische Replay-Events; `replayStateHashChecks` läuft weiterhin ausschließlich über `record.gameState.eventLog`. Die Tests prüfen, dass Engine-Events weiterhin private Replay-Payloads haben können, ServerEventRecords diese nicht als Feld tragen, Hidden-Info-Barrieren in Replay-Views erscheinen, Perspective-Redaction side-sicher bleibt und AI-DecisionDebug nicht leakt.
