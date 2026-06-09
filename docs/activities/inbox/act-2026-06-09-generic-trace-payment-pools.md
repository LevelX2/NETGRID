---
activityId: act-2026-06-09-generic-trace-payment-pools
status: inbox
kind: architecture
area: engine
priority: normal
primaryAgent: architecture-review-agent
requiresImplementation: true
createdAt: 2026-06-09
startedAt:
completedAt:
branch:
releaseTarget:
blockedBy: []
relatedActivities:
  - act-2026-05-17-generic-counter-credit-pool-resolver
resultArtifacts: []
checks: []
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

- [ ] Mindestens zwei bisher getrennte Trace-Payment-Quellen laufen über dieselbe generische Quote-/Spend-Struktur.
- [ ] Hells-Run-artige Runner-Trace-Link-Credits sind nicht mehr über einen hart codierten DefinitionId-Vergleich als eigene Payment-Kind-Ausnahme modelliert.
- [ ] Fort-gebundene Trace-Bits sind intern neutral benannt, auch wenn PublicPayload oder Chronik weiterhin die Quelle anzeigen darf.
- [ ] Quote-Revalidation verhindert stale Payment weiterhin deterministisch.
- [ ] PublicPayload bleibt side-sicher und enthält keine verdeckten Quellen.
- [ ] Fokussierte Engine-Tests decken Corp-Trace-Pool, Runner-Trace-Link-Pool und einen negativen stale-Quote-Fall ab.

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

Noch offen.
