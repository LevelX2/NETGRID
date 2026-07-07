# Runner-KI Plancontroller Final Report 2026-07-07

## Ergebnis

Die Runner-KI priorisiert aktive TacticalPlans jetzt vor globalen Aktionsscores. Plan-kompatible Aktionen werden innerhalb des ausgewählten Plans bewertet; off-plan Runner-Aktionen werden blockiert, solange kein enger Hard-Interrupt oder ein expliziter Plan-Abbruchgrund vorliegt.

## Analysiertes Match

- Match: `match_c1057cdd40d936ed`
- Modus: `human_corp_vs_runner_ai`
- KI-Seite: Runner
- Abschluss: 2026-07-07T21:16:54.326Z
- Ergebnis: Corp gewinnt über `agenda_points`
- Evidence: `docs/reviews/ai/runner-plan-controller-evidence-2026-07-07.md`

## Umgesetzte Änderungen

- `packages/ai/src/runtime/semantic-choice-ranking.ts`
  - Runner-Planmapping dominiert normale off-plan Scores.
  - Planinterne Kandidaten werden nach semantischem Score gerankt.
  - Hard-Interrupts bleiben eng begrenzt auf dringende Run-Payoffs; wiederholte Runs ohne Fortschritt dürfen weiterhin auf Planabbruch/Fallback yielden.

- `packages/ai/src/plans/tactical-plan-runner-run-targets.ts`
  - Remote-Score-Threats bekommen Plan-Urgency, auch wenn der nächste Schritt `gain_credits` ist.
  - Deckstrategie wirkt als Planprioritäts-Fit für R&D-, HQ- und Remote-Planinstanzen.
  - Score-Threat-Evidence wird nur bei echter Bedrohung ausgegeben.

- `packages/ai/src/known-central-access-payoff.ts`
  - R&D-Planbewertung prüft bei installiertem Multiaccess die bekannte zugreifbare Sequenz.
  - Vollständig bekannte Sequenzen ohne Agenda oder sicheren Trash-Payoff werden als `knownNoCurrentPayoff` gesperrt.
  - Bekannte Agenda- oder sicher trashbare Karten in der Sequenz bleiben positive Payoffs.

## Regressionen

- Short-Circuit-/Coverage-Search kann einen aktiven score-bedrohten Remote-Plan nicht mehr allein über globalen Score verdrängen.
- Ein R&D-Deck erhält R&D-Planpriorität, aber ein score-bedrohter Remote-Plan bleibt höher priorisiert.
- R&D mit bekanntem Multiaccess-Fenster auf nur Low-Value-/nicht trashbare Karten wird nicht als guter R&D-Plan behandelt; eine bekannte Agenda im selben Fenster hält den Druck.
- Normale Runner-Planaktionen werden innerhalb des Plans gerankt, nicht gegen den gesamten LegalAction-Raum.

## Checks

- `corepack pnpm exec vitest run packages/ai/src/known-central-access-payoff.test.ts packages/ai/src/runtime/semantic-choice-ranking.test.ts packages/ai/src/plans/tactical-plan-runner-run-targets.test.ts --maxWorkers=1 --testTimeout=30000`
- `corepack pnpm exec vitest run packages/ai/src/plans/tactical-plan-progression.test.ts packages/ai/src/plans/tactical-plan-run-action-matching.test.ts packages/ai/src/tactical-plans.test.ts --maxWorkers=1 --testTimeout=30000`
- `corepack pnpm --filter @netgrid/ai typecheck`
- `git diff --check`

## Grenzen

- Security Purge facedown/faceup ist nicht Teil dieses Pakets.
- Broker-/Proker-Mehrzugplanung bleibt als eigenes Economy-Engine-Folgepaket sinnvoll.
- Eine vollständige Plan-Kalibrierung aller Planinstanzen bleibt bewusst nachgelagert; dieses Paket stellt die Plan-vor-Ranking-Invariante her.
