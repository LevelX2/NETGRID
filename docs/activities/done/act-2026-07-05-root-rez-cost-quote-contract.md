---
activityId: act-2026-07-05-root-rez-cost-quote-contract
status: done
kind: architecture
area: engine
priority: high
primaryAgent: architecture-review-agent
requiresImplementation: true
createdAt: 2026-07-05
startedAt: 2026-07-17
completedAt: 2026-07-17
branch:
releaseTarget:
blockedBy: []
resultArtifacts:
  - packages/engine/src/game/payment/corp-rez-cost.ts
  - packages/engine/src/game/payment/corp-rez-cost.test.ts
  - packages/engine/src/game/payment/index.ts
  - packages/engine/src/game/run/run-rez-window.ts
  - packages/engine/src/game/turn/corp-main-actions.ts
  - packages/engine/src/game/turn/corp-main-actions.test.ts
  - packages/engine/src/game/turn/main-action-hosts.ts
  - packages/engine/src/game/rez/rez-card.ts
  - packages/engine/src/game/rez/rez-card.test.ts
  - packages/engine/src/game/engine-runtime-internal/action-runtime-bootstrap.ts
  - packages/engine/src/game/engine-runtime-internal/card-lifecycle-runtime-hosts.ts
  - packages/engine/src/game/engine-runtime-internal/legal-action-runtime-hosts.ts
  - packages/engine/src/index-tests/mechanics/per-card-longtail.test.ts
  - packages/engine/src/index-tests/mechanics/trace-tags-resources.test.ts
  - packages/engine/src/index-tests/originalset/per-card-followups.test.ts
  - packages/engine/src/index-tests/proteus/bad-publicity-run-replacement-suite.test.ts
  - packages/engine/src/index-tests/releases/mechanic-package-smokes-v16-v199.test.ts
checks:
  - corepack pnpm --filter @netgrid/engine exec vitest run src/game/payment/corp-rez-cost.test.ts src/game/run/run-rez-window.test.ts src/game/rez/rez-card.test.ts src/game/turn/corp-main-actions.test.ts
  - corepack pnpm --filter @netgrid/engine exec vitest run src/index-tests/releases/mechanic-package-smokes-v16-v199.test.ts -t "ACME|Superior Net Barriers"
  - corepack pnpm --filter @netgrid/engine exec vitest run src/index.test.ts -t "lets the Corp rez non-ICE root cards"
  - corepack pnpm --filter @netgrid/engine typecheck
  - corepack pnpm --filter @netgrid/engine test
  - git diff --check
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

- [x] Es gibt genau eine benannte Engine-Quelle für Root-Rez-Bezahlbarkeit und Root-Rez-Kostenpayloads.
- [x] Run-Root-Rez und normaler Korp-Root-Rez verwenden diese Quelle.
- [x] Eine Root-Rez-Action, deren Kosten anhand des aktuellen States nicht bezahlbar sind, erscheint nicht in `getLegalActions`.
- [x] Eine bezahlbare Root-Rez-Action enthält alle für Revalidation und PublicEvent nötigen öffentlichen Kostenmetadaten.
- [x] `applyAction` validiert Seite, StateVersion, actionId, Zielkarte, Timing, Credits, Zusatzkosten und Payload erneut gegen denselben Kostenvertrag.
- [x] Bestehende ACME-Regressionsfälle bleiben grün; mindestens ein neuer Test deckt den gemeinsamen Quote-Pfad ab.
- [x] Keine Hidden-Info-Daten gelangen in PlayerViews, PublicEvents, Replay, WebSocket- oder Fehlerpayloads.

## Umsetzungshinweise

- Bevorzugt klein schneiden: zuerst Root-Rez, nicht das komplette Payment-System.
- Vorhandene Funktionen wie `quoteCorpRezCost`, `rezCostForCard`, `rezCostReductionSourceDefinitionIdsFor` und ACME-Agenda-Punkt-Kosten prüfen, bevor ein neuer Typ eingeführt wird.
- Falls `LegalAction.costs` weiterhin nur `clicks` und `credits` tragen soll, Agenda-Punkt-Kosten explizit über den bestehenden Payload-Vertrag modellieren und dokumentieren.
- Wenn sich beim Entwurf zeigt, dass auch andere Kostenfamilien denselben Quote-Mechanismus brauchen, dafür eigene Folge-Activities anlegen statt dieses Paket auszuweiten.

## Ergebnisnotiz

Abgeschlossen. `quoteCorpRootRezCost` ist jetzt die gemeinsame, mutationsfreie Engine-Quelle für Credit-Kosten, aktuelle Rez-Kostenmodifikatoren, Serverzuordnung und zusätzliche öffentliche Agenda-Punkt-Kosten. Normaler Korp-Root-Rez, das Paid-Window zwischen Runner-Aktionen und beide Run-Root-Rez-Fenster erzeugen ihre `LegalAction.costs` und Kostenpayloads daraus. `rezCard` revalidiert unmittelbar vor Zahlung über `assertCorpRootRezCostQuoteValid` Ziel, Seite, Timingfenster, Server, Credits, Agenda-Punkte und sämtliche öffentlichen Quote-Felder; stale oder manipulierte Verträge werden abgelehnt. ACME-Angebot, Zahlung und deterministisches Replay sind regressionsgeschützt, und öffentliche Root-Rez-Events verwenden konsistent den bereits vorgesehenen Typ `rez_card`. Der vollständige Engine-Lauf ist mit 188 Testdateien und 1709 Tests grün.
