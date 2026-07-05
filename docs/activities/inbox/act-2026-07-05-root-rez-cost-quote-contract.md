---
activityId: act-2026-07-05-root-rez-cost-quote-contract
status: inbox
kind: architecture
area: engine
priority: high
primaryAgent: architecture-review-agent
requiresImplementation: true
createdAt: 2026-07-05
startedAt:
completedAt:
branch:
releaseTarget:
blockedBy: []
resultArtifacts: []
checks: []
---

# Root-Rez-Kosten-Quote für LegalActions und applyAction vereinheitlichen

## Ziel

Root-Rez-Aktionen sollen ihre Bezahlbarkeit, `LegalAction.costs`, Payload-Metadaten und spätere `applyAction`-Revalidierung aus einer gemeinsamen Engine-Quelle ableiten. Dadurch dürfen LegalActions keine Root-Rez-Aktion mehr anbieten, die `applyAction` aufgrund bekannter Kostenbedingungen später ablehnt.

## Kontext und Quellen

- Befund vom 2026-07-05 im laufenden Match `match_a7da2e5a06516b81`: `buildCorpRunRootRezActions` bot `ACME Savings and Loan` im Run-Root-Rez-Fenster an, obwohl die Korp keinen Agenda-Punkt zahlen konnte.
- Der akute Fix filtert Agenda-Punkt-Rez-Kosten im Run-Root-Rez-Pfad und ergänzt den bestehenden `agendaPointCost`-/`obligationDebtAbility`-Payload.
- Der strukturelle Restpunkt bleibt: Root-Rez-Kostenlogik ist über LegalAction-Erzeugung und `rezCard`-/`applyAction`-Validierung verteilt.
- Relevante Dateien:
  - `packages/engine/src/game/run/run-rez-window.ts`
  - `packages/engine/src/game/turn/corp-main-actions.ts`
  - `packages/engine/src/game/rez/rez-card.ts`
  - `packages/engine/src/game/payment/corp-rez-cost.ts`
  - `packages/shared/src/index.ts`

## Scope

- Einen gemeinsamen Root-Rez-Kosten-Quote oder eng benannten Helper entwerfen und umsetzen, der mindestens liefert:
  - `canPay`
  - sichtbare/öffentliche Kostenbestandteile für `LegalAction.costs` und Payload
  - normale Credit-Rez-Kosten inklusive bestehender Rez-Kostenreduktionen
  - zusätzliche Agenda-Punkt-Rez-Kosten aus Card-Implementations wie ACME
  - stabile Revalidierungsdaten für `applyAction`
- `buildCorpRunRootRezActions` und den normalen Korp-Root-Rez-Pfad so anbinden, dass sie denselben Quote verwenden.
- `applyAction`/Rez-Ausführung so prüfen, dass sie denselben Vertrag validiert und keine zweite, abweichende Kostenwahrheit pflegt.
- Regressionen ergänzen für:
  - nicht bezahlbare Zusatzkosten werden nicht als LegalAction angeboten,
  - bezahlbare Zusatzkosten erscheinen mit korrektem Payload,
  - stale oder manipulierte Payloads werden bei `applyAction` abgelehnt,
  - Replay und StateHash bleiben deterministisch.

## Nicht im Scope

- Keine allgemeine Neugestaltung aller Zahlungsflüsse für Trace, Install, Access-Trash, Icebreaker-Use oder Runner-Programminstallation.
- Keine Änderung an KI-Scoring oder KI-Fallbacks; die KI darf weiterhin LegalActions vertrauen.
- Keine UI-Regelautorität oder clientseitige Bezahlbarkeitsberechnung.
- Keine Abschwächung von Hidden-Info-, LegalAction-, Replay- oder StateHash-Gates.

## Akzeptanzkriterien

- [ ] Es gibt genau eine benannte Engine-Quelle für Root-Rez-Bezahlbarkeit und Root-Rez-Kostenpayloads.
- [ ] Run-Root-Rez und normaler Korp-Root-Rez verwenden diese Quelle.
- [ ] Eine Root-Rez-Action, deren Kosten anhand des aktuellen States nicht bezahlbar sind, erscheint nicht in `getLegalActions`.
- [ ] Eine bezahlbare Root-Rez-Action enthält alle für Revalidation und PublicEvent nötigen öffentlichen Kostenmetadaten.
- [ ] `applyAction` validiert Seite, StateVersion, actionId, Zielkarte, Timing, Credits, Zusatzkosten und Payload erneut gegen denselben Kostenvertrag.
- [ ] Bestehende ACME-Regressionsfälle bleiben grün; mindestens ein neuer Test deckt den gemeinsamen Quote-Pfad ab.
- [ ] Keine Hidden-Info-Daten gelangen in PlayerViews, PublicEvents, Replay, WebSocket- oder Fehlerpayloads.

## Umsetzungshinweise

- Bevorzugt klein schneiden: zuerst Root-Rez, nicht das komplette Payment-System.
- Vorhandene Funktionen wie `quoteCorpRezCost`, `rezCostForCard`, `rezCostReductionSourceDefinitionIdsFor` und ACME-Agenda-Punkt-Kosten prüfen, bevor ein neuer Typ eingeführt wird.
- Falls `LegalAction.costs` weiterhin nur `clicks` und `credits` tragen soll, Agenda-Punkt-Kosten explizit über den bestehenden Payload-Vertrag modellieren und dokumentieren.
- Wenn sich beim Entwurf zeigt, dass auch andere Kostenfamilien denselben Quote-Mechanismus brauchen, dafür eigene Folge-Activities anlegen statt dieses Paket auszuweiten.

## Ergebnisnotiz

Noch offen.
