---
activityId: act-2026-05-17-decisiondebug-schema-redaction-snapshots
status: inbox
kind: architecture
area: ai
priority: normal
primaryAgent: architecture-review-agent
requiresImplementation: true
createdAt: 2026-05-17
startedAt:
completedAt:
branch:
releaseTarget:
blockedBy: []
resultArtifacts: []
checks: []
---

# DecisionDebug-Schema und Redaction-Snapshots absichern

## Ziel

`DecisionDebug` soll erklärbar und nützlich bleiben, aber als versionierter, side-sicherer Vertrag abgesichert werden. Neue Debugfelder sollen bewusst geprüft werden, statt als freie Nebenpayloads in Logs, Replay-Views oder AI-nahe Ausgaben zu geraten.

## Kontext und Quellen

- `docs/derived/AI_CAPABILITY_DEEP_ANALYSIS_2026_05_17.md`, Abschnitt `P1: DecisionDebug Schema und Redaction-Snapshots`.
- Verwandtes erledigtes Paket: `docs/activities/done/act-2026-05-17-event-projection-contract.md` trennt EngineEvents, ServerEventRecords und PublicGameEvents und prüft AI-Debug-Side-Safety.
- Dieses Follow-up fokussiert das Debugschema selbst, nicht die Event-Projektion.

## Scope

- Bestehende `DecisionDebug`-Struktur in AI und Server-Transportpfaden inventarisieren.
- Ein versioniertes Schema oder eine zentrale Typ-/Builder-Grenze für Debugdaten etablieren oder dokumentieren.
- Runner- und Korp-Snapshots für Debugausgaben ergänzen.
- Verbotene Key-/Value-Muster testen, mindestens: gegnerische Hand/Deck/Stack/R&D/HQ-Inhalte, `privatePayload`, `FullState`, Session-/Tokenwerte, unredigierte Decklisten.
- Klären, welche Debugdaten in Public Replay, Reconnect, Logs und AIInput ausdrücklich nicht erscheinen dürfen.

## Nicht im Scope

- Kein neues Replay-Produktfeature.
- Keine Ausweitung von Debugdaten für bessere KI-Entscheidungen.
- Keine Änderung an Engine-Replay-Quelle, StateHash oder PublicEvent-Regeln.
- Keine allgemeine Observability-Redaction; dafür existiert `act-2026-05-17-v2-observability-redaction-baseline`.

## Akzeptanzkriterien

- [ ] `DecisionDebug` hat einen nachvollziehbaren Vertrag: Typ, Builder, Schema oder eng getestete Snapshot-Grenze.
- [ ] Runner- und Korp-Snapshots zeigen nur side-sichere Debugdaten.
- [ ] Verbotene Debugfelder scheitern oder werden deterministisch redigiert.
- [ ] Neue Debugfelder erfordern sichtbare Testanpassung.
- [ ] Replay-/Reconnect-/Log-nahes Verhalten bleibt side-sicher und bestehende Event-Projection-Tests bleiben grün.

## Umsetzungshinweise

- Nicht mit AI-Input-DTO-Allowlist verwechseln: dieses Paket behandelt Debugausgaben und Projektionen, nicht die primäre AI-Entscheidungseingabe.
- Snapshot-Churn begrenzen, indem das Schema fachliche Felder gruppiert statt rohe interne Objekte abzulegen.
- Hidden-Info-Gate: Debug darf keine private Gegenseite in AIInput, Logs, Reconnect, Undo oder Public Replay tragen.

## Ergebnisnotiz

Noch offen.
