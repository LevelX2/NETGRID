---
activityId: act-2026-05-17-decisiondebug-schema-redaction-snapshots
status: done
kind: architecture
area: ai
priority: normal
primaryAgent: architecture-review-agent
requiresImplementation: true
createdAt: 2026-05-17
startedAt: 2026-05-17
completedAt: 2026-05-17
branch: codex/activity-worker-2
releaseTarget:
blockedBy: []
resultArtifacts:
  - packages/shared/src/index.ts
  - packages/ai/src/index.ts
  - packages/ai/src/corp-plans.ts
  - packages/ai/src/runner-plans.ts
  - apps/server/src/multiplayer.ts
  - packages/ai/src/index.test.ts
  - apps/server/src/multiplayer.test.ts
checks:
  - corepack pnpm --filter @netgrid/ai test -- -t "DecisionDebug"
  - corepack pnpm --filter @netgrid/server test -- -t "keeps replay DecisionDebug side-safe"
  - corepack pnpm --filter @netgrid/shared typecheck
  - corepack pnpm --filter @netgrid/ai typecheck
  - corepack pnpm --filter @netgrid/server typecheck
  - git diff --check
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

- [x] `DecisionDebug` hat einen nachvollziehbaren Vertrag: Typ, Builder, Schema oder eng getestete Snapshot-Grenze.
- [x] Runner- und Korp-Snapshots zeigen nur side-sichere Debugdaten.
- [x] Verbotene Debugfelder scheitern oder werden deterministisch redigiert.
- [x] Neue Debugfelder erfordern sichtbare Testanpassung.
- [x] Replay-/Reconnect-/Log-nahes Verhalten bleibt side-sicher und bestehende Event-Projection-Tests bleiben grün.

## Umsetzungshinweise

- Nicht mit AI-Input-DTO-Allowlist verwechseln: dieses Paket behandelt Debugausgaben und Projektionen, nicht die primäre AI-Entscheidungseingabe.
- Snapshot-Churn begrenzen, indem das Schema fachliche Felder gruppiert statt rohe interne Objekte abzulegen.
- Hidden-Info-Gate: Debug darf keine private Gegenseite in AIInput, Logs, Reconnect, Undo oder Public Replay tragen.

## Ergebnisnotiz

Abgeschlossen. `DecisionDebug` ist jetzt über `AiDecisionDebug` mit `ai-decision-debug-v1`, zentralem Sanitizer und Replay-Projektionsgrenze versioniert. Runner- und Korp-Debug-Ausgaben haben Snapshot-Tests; verbotene Debug-Key-/Value-Muster für private Payloads, FullState, Token-/Sessionwerte und gegnerische Hidden-Zone-Inhalte werden deterministisch redigiert oder nicht in Replay-Projektionen übernommen. Public Replay/Reconnect-nahe Replay-Views bleiben bei fremder Perspektive vollständig redigiert und bei eigener Perspektive auf die erlaubten Debugfelder begrenzt.

Checks: AI-DecisionDebug-Tests, Server-Replay-DecisionDebug-Test, Shared-/AI-/Server-Typechecks und `git diff --check` grün.

Offene Folgepunkte: keine im Scope dieses Pakets.
