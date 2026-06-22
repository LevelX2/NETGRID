# AI-PS2 Runner Practical Tactic Improvement

Datum: 2026-06-22

## Änderung

AI-PS2-1 ergänzt zwei eng begrenzte Runner-Fälle im Practical-Tactic-Overlay:

- `runner_open_access_card`: Eine aktuelle legale `access_card` wird gegenüber
  passiver Vorbereitung gewählt.
- `runner_take_high_payoff_run`: Ein legaler `start_run` mit side-safe
  `accessPayoff` wie `fresh`, `agenda`, `score_threat`, `trash_affordable` oder
  `access_bonus` wird gegenüber passiver Vorbereitung gewählt.

Keine neue LegalAction-Erzeugung, keine Engine-Änderung, keine Hidden-Info-
Erweiterung und kein Default-Cutover.

## Checks

```text
corepack pnpm --filter @netgrid/ai exec vitest run src/runtime/practical-tactic-overlay.test.ts src/evaluation/practical-tactic-benchmark.test.ts
corepack pnpm --filter @netgrid/ai run typecheck
corepack pnpm --filter @netgrid/server exec tsx ../../scripts/run-ai-ps2-play-strength-gate.ts --out docs/reviews/ai/ai-ps2-runner-improvement-gate-2026-06-22.json --pairs a --seeds ai-v143-tuning-001 --max-actions 80
git diff --check
```

## Ergebnis

| Selector | Trefferquote |
|---|---:|
| Frozen Legacy | 0/40 |
| Practical Tactic Overlay | 40/40 |

Kleiner Gate-Lauf:

| Metrik | Legacy | Candidate Runner | Candidate Corp |
|---|---:|---:|---:|
| Spiele je Leg | 2 | 2 | 2 |
| Action-Limits | 1 | 1 | 2 |
| Runner Steals | 3 | 4 | 3 |
| Corp Scores | 1 | 1 | 0 |
| IllegalActions | 0 | 0 | 0 |
| ReplayFailures | 0 | 0 | 0 |

## Entscheidung

Die Runner-Erweiterung ist mergefähig als opt-in Candidate-Verhalten. Sie reicht
nicht für einen Default-Cutover.
