---
activityId: act-2026-05-20-corp-ai-overtime-incentives-net-loss
status: done
kind: fix
area: ai
priority: high
primaryAgent: card-enablement-ai-knowledge-agent
requiresImplementation: true
createdAt: 2026-05-20
startedAt: 2026-05-20
completedAt: 2026-05-20
branch:
releaseTarget: Corp AI action economy
blockedBy: []
relatedActivities:
  - act-2026-05-19-corp-ai-installed-asset-economy-bbs
  - act-2026-05-19-corp-ai-unprotected-advanced-agenda-repeat
resultArtifacts:
  - packages/ai/src/corp-plans.ts
  - packages/ai/src/index.test.ts
checks:
  - corepack pnpm --filter @netgrid/ai exec vitest run src/index.test.ts -t "Overtime Incentives"
  - corepack pnpm --filter @netgrid/ai exec vitest run src/index.test.ts -t "Corp AI|Corp plan|Corp strategic|Overtime Incentives|installed Corp economy|advanced remote agenda|scoring-progress|Rezreserve|agenda|economy"
  - corepack pnpm --filter @netgrid/ai typecheck
  - corepack pnpm --filter @netgrid/ai exec vitest run src/index.test.ts
---

# Korp-KI: Overtime Incentives nicht für Nettoverlust-Economy spielen

## Ziel

Die Korp-KI soll `Overtime Incentives` nicht spielen, wenn der einzige erkennbare Nutzen darin besteht, die zwei zusätzlichen Aktionen anschließend für normale 1-Credit-Aktionen zu verwenden. Bei Kosten 4 und nur 2 Credits Rückgewinn ist das ein klarer Nettoverlust und strategisch unsinnig. Die Karte soll nur dann attraktiv werden, wenn die zusätzlichen Aktionen einen echten taktischen Zweck erfüllen, insbesondere ein Agenda-Score-Fenster, eine entscheidende Installation/Advancement-Linie oder eine andere wertvolle Korp-Sequenz.

## Kontext und Quellen

- Nutzerbeobachtung vom 2026-05-20 aus einem Playtest-Screenshot: Die Korp spielt als Aktion 3 `Overtime Incentives`, bezahlt 4 Credits und nutzt danach zwei Aktionen nur dafür, jeweils 1 Credit zu nehmen. Das ergibt netto -2 Credits und keinen Fortschritt.
- Lokale Kartendaten bestätigen den Kosten-/Effektvertrag:
  - `packages/shared/src/index.ts`: `onr_v1_297_overtime-incentives`, `cost: 4`, `rulesText: "Gain two actions."`
  - `packages/engine/src/index.ts`: Resolver für den LegalAction-only-Aktionsgewinn.
- Wissensstand: V1.2.3 hat `Overtime Incentives` engine-/human-playable eingeführt; der aktuelle KI-Deckpool enthält die Karte inzwischen über aktive AI-Hints/Supportdaten, sodass eine konkrete Korp-KI-Regression nötig ist.
- Verwandte erledigte Pakete:
  - `act-2026-05-19-corp-ai-installed-asset-economy-bbs`: Korp-KI bewertet sichtbare Economy-Aktionen gegen normale 1-Credit-Aktionen.
  - `act-2026-05-19-corp-ai-unprotected-advanced-agenda-repeat`: Korp-KI bewertet Remote-/Scoring-Linien, Schutz und Rezreserve.

## Scope

- Einen fokussierten Korp-KI-Test bauen, der den Screenshot-Fall reproduziert:
  - Korp hat `Overtime Incentives` spielbar auf der Hand,
  - die Karte kostet 4 Credits und gibt zwei zusätzliche Aktionen,
  - nach dem Spielen sind nur normale 1-Credit-Aktionen oder vergleichbar niedrige Folgeaktionen sinnvoll verfügbar,
  - die KI soll `Overtime Incentives` nicht wählen.
- Planbewertung für zusätzliche Korp-Aktionen prüfen:
  - erwarteter Wert der gewonnenen Aktionen,
  - unmittelbare Kartenkosten,
  - nachfolgende LegalActions,
  - Score-/Advance-/Install-/Rez-Fenster,
  - Economy-Alternativen.
- `Overtime Incentives` als Regressionsanker verwenden, aber die Bewertung möglichst generisch für "bezahle Ressourcen für zusätzliche Aktionen" modellieren.
- Positive Gegenfixtures ergänzen:
  - `Overtime Incentives` darf attraktiv sein, wenn die Korp damit im selben Zug eine Agenda scoren kann,
  - oder wenn die Zusatzaktionen eine klar bessere Sequenz als normale Economy ermöglichen.
- Debug-/Evidence-Felder prüfen oder ergänzen, z. B. `extra_action_expected_value`, `overtime_net_value`, `score_window_after_extra_actions`, `basic_credit_followup_only`.

## Nicht im Scope

- Kein Verbot von `Overtime Incentives`.
- Keine Änderung am Engine-Resolver, sofern der Aktionsgewinn korrekt legal, deterministisch und replay-stabil ist.
- Keine Änderung an Kartenkosten oder Kartentext.
- Keine vollständige Korp-KI-Neuschreibung.
- Keine Hidden-Info-Ausweitung: Die Korp-KI darf eigene Hand-/Boardinformationen und LegalActions nutzen, aber keine Runner-Hidden-Info oder FullState-Daten außerhalb des erlaubten AI-Inputs.
- Keine UI-/Chroniknummerierung; das ist im separaten Paket `act-2026-05-20-action-chronicle-extra-action-numbering` geschnitten.

## Akzeptanzkriterien

- [ ] Ein AI-Test deckt den beobachteten Fehlpfad ab: `Overtime Incentives` wird nicht gespielt, wenn die gewonnenen Aktionen nur zu zwei normalen 1-Credit-Aktionen führen.
- [ ] Die Bewertung berücksichtigt die Kosten 4 gegen den erwarteten Wert der zwei Zusatzaktionen und behandelt den Screenshot-Fall als Nettoverlust.
- [ ] Eine positive Regression zeigt, dass `Overtime Incentives` weiterhin gespielt werden kann, wenn dadurch ein realistisches Score-/Advance-/Install-Fenster entsteht.
- [ ] Die Entscheidung bleibt LegalAction-basiert und side-sicher; Debug/Evidence enthält keine privaten Runner-Daten, FullState-Fragmente oder verdeckten fremden Karteninformationen.
- [ ] Bestehende Korp-KI-Regressionen zu Economy, Remote-Scoring, Rezreserve, Agenda-Schutz und installierter Asset-Economy bleiben grün.

## Umsetzungshinweise

- Wahrscheinliche Startpunkte:
  - `packages/ai/src/corp-plans.ts`
  - `packages/ai/src/index.ts`
  - `packages/ai/src/index.test.ts`
  - optional `packages/ai/src/input-dto.ts`, falls nötige LegalAction-/Payload-Felder für Kosten oder Aktionsgewinn fehlen.
- Nicht nur auf Kartennamen oder UI-Label prüfen. Besser ist eine strukturierte Bewertung aus Kosten, gewonnenen Aktionen und möglichen Folgeaktionen.
- Falls die KI aktuell nur eine einzelne Aktion bewertet und die zwei Zusatzaktionen nicht als Sequenz simuliert, soll der Fix klein bleiben: `Overtime Incentives` braucht mindestens einen konservativen Guard gegen den reinen Basic-Credit-Follow-up-Fall und einen positiven Score-Window-Fall.

## Ergebnisnotiz

Umgesetzt. Die Korp-Planbewertung erkennt jetzt Corp-Operationen, die Aktionen kaufen, bewertet Kosten gegen erwartete Folgeaktionen und markiert den reinen Basic-Credit-Follow-up-Fall als Nettoverlust. `Overtime Incentives` wird in der Regression nicht mehr gewählt, wenn danach nur zwei normale Credit-Aktionen sinnvoll sind; eine positive Regression zeigt weiter, dass die Karte gewählt werden kann, wenn sie ein unmittelbares Advance-zu-Score-Fenster öffnet. Debug/Evidence bleibt side-sicher und enthält nur kategoriale bzw. numerische Felder wie `extra_action_expected_value`, `overtime_net_value`, `score_window_after_extra_actions` und `basic_credit_followup_only`.

Grün: fokussierte Overtime-Tests, 58 Korp-relevante AI-Regressionen und `@netgrid/ai`-Typecheck. Nicht grün: der vollständige Lauf `corepack pnpm --filter @netgrid/ai exec vitest run src/index.test.ts` hat einen bestehenden, nicht paketbezogenen Contract-Test zur Baseline-Serialisierung (`builds side-neutral AI inputs without FullState or forbidden transport fields`) rot gemeldet; die neuen Korp-Fälle waren in diesem Lauf grün.
