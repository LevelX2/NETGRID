---
activityId: act-2026-08-22-trace-payment-module-split-review
status: inbox
kind: architecture
area: engine
priority: low
primaryAgent: architecture-review-agent
requiresImplementation: false
createdAt: 2026-08-22
startedAt:
completedAt:
branch:
releaseTarget:
blockedBy: []
resultArtifacts: []
checks:
  - Payment-/Orchestrierungsowner und Änderungshistorie geprüft
  - corepack pnpm check:engine-source-structure
---

# Trace-Payment-Module aufteilen

## Ziel

Prüfen, ob Corp- und Runner-Zahlung aus `trace-payment.ts` herausgelöst und
über einen kleinen gemeinsamen Allokations- und Validierungskern verbunden
werden sollten.

## Kontext und Quellen

- Regel-Engine-Review Batch 5 vom 2026-08-22.
- Regel-Engine-Review Batch 6 vom 2026-08-22: `trace-orchestration.ts`
  bündelt zusätzlich Bid-Aufbau, mehrstufige Payment-Auswahl, Post-Bid-Fähigkeiten
  und Trace-Abschluss.
- Der numerische Safe-Integer-Vertrag aller Payment-Pools ist bereits umgesetzt
  und bleibt harte Voraussetzung.
- Aktivierungsauslöser: nächste neue Trace-Zahlungsquelle oder Änderung auf
  beiden Seiten.

## Scope

- Gemeinsame Allokation von side-spezifischer Quote, Auswahl und Zahlung trennen.
- Controller-Grenzen zwischen Corp-/Runner-Bid, Base-Link/Post-Bid-Fähigkeiten
  und Trace-Abschluss erfassen.
- Zielbild `corp-trace-payment.ts`, `runner-trace-payment.ts` und kleiner Kern bewerten.
- Bei positivem Ergebnis Migration in kleinen Folgepaketen planen.

## Nicht im Scope

- Änderung von Payment-Prioritäten oder Trace-Regeln.
- Duplizierte Validierung oder stille Zahlen-Normalisierung.

## Akzeptanzkriterien

- [ ] Quote und Zahlung verwenden weiterhin denselben numerischen Vertrag.
- [ ] Corp- und Runner-Pfade besitzen keine duplizierte Allokationsautorität.
- [ ] Commit-/Reveal-, Replay- und StateHash-Verträge bleiben erhalten.

## Umsetzungshinweise

- Machine-Code `runtime_invalid_trace_payment_pool_amount` ist ein Bestandsvertrag.

## Ergebnisnotiz

Review vom 2026-08-23: **derzeit ohne ausreichenden Nutzen oder
Aktivierungsauslöser zurückgestellt**. `trace-payment.ts` hält Quote,
Allokation, Revalidierung und Zahlung; `trace-orchestration.ts` hält
Commit/Reveal, Choice-Stufen, Post-Bid-Fähigkeiten und Abschluss. Das sind
benachbarte, aber nicht duplizierte Owner. `8226755d8` härtete den gemeinsamen
Safe-Integer-Vertrag, `3e8afe801` erweiterte nur die Runner-Supportkapazität;
es kam keine neue Zahlungsquelle und keine Änderung auf beiden Seiten hinzu.
Ein gemeinsamer Umbau beider großen Module wäre zu breit. Keine Folge-Activity;
beim Trigger zuerst getrennte kleine Pakete für Kernvertrag, Corp-Pfad und
Runner-Pfad schneiden, ohne Orchestrierung mitzubewegen.
