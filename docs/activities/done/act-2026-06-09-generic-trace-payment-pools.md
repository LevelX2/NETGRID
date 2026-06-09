---
activityId: act-2026-06-09-generic-trace-payment-pools
status: done
kind: architecture
area: engine
priority: normal
primaryAgent: architecture-review-agent
requiresImplementation: true
createdAt: 2026-06-09
startedAt: 2026-06-09
completedAt: 2026-06-09
branch:
releaseTarget:
blockedBy: []
relatedActivities:
  - act-2026-05-17-generic-counter-credit-pool-resolver
resultArtifacts:
  - packages/engine/src/game/payment/trace-payment.ts
  - packages/engine/src/game/payment/trace-payment.test.ts
  - packages/engine/src/game/trace/trace-orchestration.ts
  - packages/engine/src/game/run/encounter-printed-effects.ts
  - packages/engine/src/game/run/fort-run-side-families.ts
  - packages/shared/src/index.ts
  - packages/engine/src/game/engine-runtime-internal/
  - KI-Wissen-NETGRID/03 Betrieb/Log 2026-06.md
checks:
  - corepack pnpm --filter @netgrid/engine exec vitest run src/game/payment/trace-payment.test.ts
  - corepack pnpm --filter @netgrid/engine typecheck
  - corepack pnpm --filter @netgrid/engine exec vitest run src/game/trace/trace-orchestration.test.ts src/game/run/encounter-printed-effects.test.ts
  - corepack pnpm --filter @netgrid/engine exec vitest run src/index-tests/mechanics/assets-nodes-upgrades.test.ts -t "Krumz|Paris City Grid|Turbeau"
  - corepack pnpm --filter @netgrid/engine exec vitest run src/index-tests/mechanics/trace-tags-resources.test.ts -t "Hacker Tracker"
  - corepack pnpm --filter @netgrid/engine exec vitest run src/index-tests/originalset/agenda-scorearea-recurring.test.ts -t "Hell's Run"
  - corepack pnpm --filter @netgrid/engine exec vitest run src/game/payment/trace-payment.test.ts src/game/trace/trace-orchestration.test.ts src/game/run/encounter-printed-effects.test.ts
  - corepack pnpm --filter @netgrid/engine exec vitest run src/game/install/install-card.test.ts src/game/rez/rez-card.test.ts src/game/run/fort-run-side-families.test.ts
  - git diff --check
---

# Trace-Payment-Pools generisch parametrieren

## Ziel

Trace-Zahlungsquellen sollen nicht mehr als einzelne Kartenpfade wie `Paris City Grid`, `Krumz`, `Hacker Tracker Central` oder `Hells Run` im allgemeinen Payment-Code verdrahtet sein. Stattdessen soll ein parametrisierter Trace-Payment-Pool entstehen, der Quelle, Countertyp, Nutzungszweck, Priorität, Scope und Refresh-Regel beschreibt.

## Kontext und Quellen

- Architekturprüfung vom 2026-06-09 zu Kartennamen in allgemeinen Mechanikpfaden.
- `packages/engine/src/game/payment/trace-payment.ts` führt getrennte Felder wie `parisCityGridPoolToPay`, `krumzBitsToPay`, `hackerTrackerCountersToPay` und `hellsRunCreditsToPay`.
- `quoteRunnerTracePayment` behandelt Hells Run als Sonderfall innerhalb gehosteter Trace-Link-Credits.
- `packages/engine/src/game/trace/base-link.ts` und `packages/engine/src/game/trace/trace-orchestration.ts` kennen `Submarine Uplink` namentlich für den Jack-out-after-encounter-Zusatz.
- Erledigtes Vorgängerpaket `act-2026-05-17-generic-counter-credit-pool-resolver` hat allgemeine Counter-Helfer gebaut, aber Trace-Zahlungsquellen ausdrücklich nicht vollständig zusammengelegt.

## Scope

- Bestehende Trace-Zahlungsquellen in eine kleine Pool-Matrix aufnehmen:
  - temporäre Trace-Credits während Encounter oder Trace,
  - Fort-gebundene Trace-Bits während Runs,
  - Corp-Trace-Bits von rezzed Assets,
  - Trace-Counter, die Strength und Limit erhöhen,
  - Runner-Trace-Link-Credits inklusive Hells-Run-artiger Quelle,
  - Base-/Post-bid-Link-Quellen mit optionalem Folgeeffekt.
- Ein generisches Datenmodell oder Helper-API entwerfen und für mindestens zwei konkrete aktuelle Quellen anwenden.
- Öffentliche Payloads weiter verständlich halten, aber interne Felder wie `parisCityGridPoolToPay` nach Möglichkeit neutralisieren.
- Trace-Zahlungspriorität explizit machen, damit Verhaltensänderungen nicht versehentlich durch Refactoring entstehen.
- Fokussierte Tests für Quote, Revalidation, Spend und PublicPayload ergänzen oder anpassen.

## Nicht im Scope

- Keine Änderung an Trace-Regeln, Trace-Limit, Link-Berechnung oder Kartentexten.
- Keine neue Reihenfolge der Zahlungsquellen, außer sie wird ausdrücklich im Test nachgewiesen und fachlich begründet.
- Keine Hidden-Info-Ausweitung in PublicEvents, PlayerViews, AI-Inputs, Replays oder Logs.
- Keine Migration aller Counter-/Credit-Pools außerhalb Trace.
- Keine KI-Neugewichtung von Trace-Entscheidungen, außer bestehende Tests an neutrale Payload-Namen angepasst werden müssen.

## Akzeptanzkriterien

- [x] Mindestens zwei bisher getrennte Trace-Payment-Quellen laufen über dieselbe generische Quote-/Spend-Struktur.
- [x] Hells-Run-artige Runner-Trace-Link-Credits sind nicht mehr über einen hart codierten DefinitionId-Vergleich als eigene Payment-Kind-Ausnahme modelliert.
- [x] Fort-gebundene Trace-Bits sind intern neutral benannt, auch wenn PublicPayload oder Chronik weiterhin die Quelle anzeigen darf.
- [x] Quote-Revalidation verhindert stale Payment weiterhin deterministisch.
- [x] PublicPayload bleibt side-sicher und enthält keine verdeckten Quellen.
- [x] Fokussierte Engine-Tests decken Corp-Trace-Pool, Runner-Trace-Link-Pool und einen negativen stale-Quote-Fall ab.

## Umsetzungshinweise

- Einstiegspunkte:
  - `packages/engine/src/game/payment/trace-payment.ts`
  - `packages/engine/src/game/trace/trace-orchestration.ts`
  - `packages/engine/src/game/trace/base-link.ts`
  - `packages/engine/src/game/run/fort-run-side-families.ts`
  - `packages/shared/src/index.ts`
- Nützliche Richtung: `TracePaymentPool` mit `side`, `sourceCardInstanceId`, `sourceDefinitionId`, `counterType`, `available`, `usableFor`, `scope`, `priority`, `publicKind`.
- Der erste Schnitt darf die äußeren PublicPayload-Felder beibehalten, wenn eine sofortige Payload-Migration zu breit wäre; wichtig ist die interne neutrale Quelle.

## Ergebnisnotiz

Trace-Payment nutzt jetzt intern priorisierte `TracePaymentPool`-Descriptors. Korp-Bids allokieren temporäre Trace-Credits, Fort-Trace-Bits, normale Credits, Korp-Trace-Bits und Korp-Trace-Counter über denselben Quote-Pfad; Runner-Bids nutzen für PK-/Hell's-Run-artige Credits denselben `runner_trace_link_credit`-Kind. `Hell's Run` wird im Payment-Modul nicht mehr über eine DefinitionId-Ausnahme als eigener Payment-Kind behandelt, sondern nur noch als optionales Public-Kind aus der Source-Discovery für die bestehende sichtbare Payload markiert.

Interne Fort-Bit-Pool-Felder und Helper heißen `fortTraceBitPool...`; die bestehenden öffentlichen `parisCityGridPool...`-Payloadfelder bleiben für aktuelle Anzeige- und Regressionstests erhalten. Quote-Revalidation vergleicht jetzt neben Summen auch Breakdown-Kind, Source und Server. Neue Payment-Unit-Tests decken Corp-Pools, Runner-Trace-Link-Pools und stale Quote-Drift ab; fokussierte Trace-/Index-Smokes, betroffene Install-/Rez-/Fort-Run-Units, Typecheck und `git diff --check` sind grün.
