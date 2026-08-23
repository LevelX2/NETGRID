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
checks: []
---

# Trace-Payment-Module aufteilen

## Ziel

Prüfen, ob Corp- und Runner-Zahlung aus `trace-payment.ts` herausgelöst und
über einen kleinen gemeinsamen Allokations- und Validierungskern verbunden
werden sollten.

## Kontext und Quellen

- Regel-Engine-Review Batch 5 vom 2026-08-22.
- Der numerische Safe-Integer-Vertrag aller Payment-Pools ist bereits umgesetzt
  und bleibt harte Voraussetzung.
- Aktivierungsauslöser: nächste neue Trace-Zahlungsquelle oder Änderung auf
  beiden Seiten.

## Scope

- Gemeinsame Allokation von side-spezifischer Quote, Auswahl und Zahlung trennen.
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

Noch offen.
