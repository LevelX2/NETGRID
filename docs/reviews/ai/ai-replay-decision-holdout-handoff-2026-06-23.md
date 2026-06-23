# KI-Replay-Holdout und Handoff

Stand: 2026-06-23  
Paket: `REPLAY-AI-5`

## Holdout-Ergebnis

Der Holdout wurde erst nach Cluster-Auswahl, Repro und Fix betrachtet.

| Metrik | Wert |
| --- | ---: |
| Holdout-Cases | 283 |
| Holdout-Kandidaten nach gleicher High-Gap-Heuristik | 36 |
| Holdout-Fälle im gefixten Muster `draw_card|runner.obtain_breaker_coverage -> start_run|simple_hq_or_rnd_pressure` | 3 |

Die 3 Holdout-Fälle im gefixten Muster bestätigen, dass der Fix nicht nur ein Discovery-Einzelfall ist. Die Fixlogik wurde dadurch nicht nachträglich geändert.

## Nicht nachgezogenes Muster

Das stärkste weitere Holdout-Muster ist nicht Bestandteil dieser Iteration:

| Muster | Fälle |
| --- | ---: |
| `gain_credit|runner.build_credit_base -> start_run|remote_contest` | 11 |

Dieses Muster betrifft Remote-Contest-/Creditbase-Priorisierung. Es wurde in dieser Iteration nicht als Same-State-Fix validiert, weil sonst ein zweiter Fehlercluster in denselben Minimalfix geschnitten würde.

## Activity-Handoff

Angelegt:

- `docs/activities/inbox/act-2026-06-23-ai-remote-contest-creditbase-holdout.md`

## Checks

- `corepack pnpm --filter @netgrid/ai exec vitest run src/runtime/semantic-choice-ranking.test.ts src/evaluation/replay-decision-case-clustering.test.ts --maxWorkers=1 --testTimeout=30000`
  - 2 Testdateien, 3 Tests grün.

## Vertragsprüfung

- Holdout wurde nicht zum Justieren des bereits gesetzten Fixes verwendet.
- Keine Engine-, LegalAction-, `applyAction`-, Replay-, StateHash-, Randomness- oder Hidden-Info-Änderung.

