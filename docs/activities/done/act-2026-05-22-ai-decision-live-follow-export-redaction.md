---
activityId: act-2026-05-22-ai-decision-live-follow-export-redaction
status: done
kind: architecture
area: server
priority: normal
primaryAgent: test-quality-agent
requiresImplementation: true
createdAt: 2026-05-22
startedAt: 2026-05-22
completedAt: 2026-05-22
branch:
releaseTarget:
blockedBy:
  - act-2026-05-22-maintenance-ai-decision-viewer
resultArtifacts:
  - apps/server/src/http-server.ts
  - apps/server/src/multiplayer.ts
  - apps/server/src/storage-sqlite.ts
  - apps/server/src/multiplayer.test.ts
  - apps/web/app/maintenance.ts
  - apps/web/app/maintenance/page.tsx
  - apps/web/app/maintenance.test.ts
checks:
  - corepack pnpm --filter @netgrid/web exec vitest run app/maintenance.test.ts
  - corepack pnpm --filter @netgrid/server exec vitest run src/multiplayer.test.ts -t "AI decision traces"
  - corepack pnpm --filter @netgrid/web typecheck
  - corepack pnpm --filter @netgrid/server typecheck
---

# KI-Entscheidungsansicht mit Live-Follow, Export und Redaction-Tests absichern

## Ziel

Die private KI-Entscheidungsansicht kann einem laufenden Match folgen und optional redigiert exportieren, ohne KI-Debugdaten in normale Logs, Public Replay, Spectator, Moderation oder Spielerpayloads zu leaken.

## Kontext und Quellen

- Nutzerwunsch: parallel spielen und auf zweitem Bildschirm live verfolgen, welche KI-Entscheidungen entstehen.
- Bisheriger Vorschlag: Live-Follow zunächst pragmatisch per Polling, später optional WebSocket.
- Bestehende Grenzen:
  - Observability-Redaction verbietet `AIInput`/`DecisionDebug` in normalen Logs.
  - Public Replay darf keine `DecisionDebug`-Daten enthalten.
  - Moderation/RBAC klassifiziert KI-Debug als `D6_ai_debug_data`.

## Scope

- Live-Follow-Modus in der privaten Wartungsansicht ergänzen.
- Polling- oder WebSocket-Mechanismus implementieren, der nur neue Trace-ViewModels seit Cursor/StateVersion lädt.
- Pausieren/Fortsetzen und "zur neuesten Entscheidung springen" unterstützen.
- Optionalen lokalen Export als Markdown oder NDJSON aus der privaten Ansicht vorbereiten oder implementieren.
- Negative Redaction-Tests für API, UI-Text, Export und normale Payload-/Replay-/Observability-Grenzen ergänzen.

## Nicht im Scope

- Kein automatisches Öffnen der Analyseansicht für Spieler.
- Kein Export von FullState, `AIInput`, `privatePayload`, `cardInstances`, Hidden Cards, Decklisten, Tokenwerten oder lokalen Pfaden.
- Kein Public- oder Account-Share.
- Kein Analytics-/Telemetry-System.
- Keine KI-Gewichtungsänderung.

## Akzeptanzkriterien

- [ ] Live-Follow zeigt neue KI-Entscheidungen eines laufenden Matches ohne Seitenreload.
- [ ] Nutzer kann Live-Follow pausieren, historisch scrollen und wieder zur neuesten Entscheidung springen.
- [ ] Export enthält nur redigierte Trace-Projektionen und ist als lokales Diagnoseartefakt klar gekennzeichnet.
- [ ] Negative Tests scannen API-/Export-/UI-Beispiele gegen verbotene Felder und Inhalte.
- [ ] Normale Match-Payloads, Public Replay, Spectator-/Moderationflächen und Observability-Logs bleiben frei von KI-Trace-Daten.

## Umsetzungshinweise

- Für den ersten Schnitt reicht Polling alle 1-2 Sekunden, solange die Ansicht offen ist.
- Export erst nach stabiler Anzeigeprojektion freigeben; vorher kann ein Button bewusst weggelassen oder deaktiviert bleiben.
- Die Tests sollten die bestehenden Redaction-Helper wiederverwenden, statt eine zweite Pattern-Liste einzuführen.

## Ergebnisnotiz

Erledigt am 2026-05-22.

- Wartungs-API unterstuetzt fuer KI-Trace-Timelines `afterDecisionIndex`, damit Live-Follow nur neue Entscheidungen seit Cursor abfragt.
- Private Wartungsansicht hat Live-Follow, Pause/Fortsetzen, Sprung zur neuesten Entscheidung und redigierten NDJSON-Export der Trace-Index-Projektion.
- Redaction-Helper blockieren `AIInput`, `DecisionDebug`, `decisionDebug`, private Payload-/Token-/Deck-/FullState-Marker und lokale Pfade im Export.
- Server- und Webtests decken Cursor-Abfrage, Export-Redaction und bestehende Wartungsprojektionen ab.
