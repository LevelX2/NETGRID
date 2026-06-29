# AI-COMPLETE-20 Action-Type-Dominance Smoke 2026-06-29

## Lauf

```text
corepack pnpm --filter @netgrid/server exec tsx ../../scripts/run-ai-ps2-play-strength-gate.ts --out docs/reviews/ai/ai-complete-20-action-type-dominance-smoke-2026-06-29.json --pairs a --seeds ai-v143-tuning-001 --max-actions 80
```

## Ergebnis

| Szenario | Leg | Status | Top Share | Top Action All | Top Action Runner | Top Action Corp |
| --- | --- | --- | ---: | --- | --- | --- |
| `default_demo` | `legacy` | `complete` | 0.188 | `access_card` | `access_card` | `advance_card` |
| `default_demo` | `candidate_runner` | `complete` | 0.225 | `start_run` | `start_run` | `install_card` |
| `default_demo` | `candidate_corp` | `complete` | 0.263 | `start_run` | `start_run` | `install_card` |
| `A` | `legacy` | `complete` | 0.154 | `access_card` | `access_card` | `advance_card` |
| `A` | `candidate_runner` | `complete` | 0.185 | `access_card` | `access_card` | `advance_card` |
| `A` | `candidate_corp` | `complete` | 0.2 | `start_run` | `start_run` | `end_turn` |

## Safety

- `safetyGreen`: true.
- Candidate Runner: 0 IllegalActions, 0 ReplayFailures.
- Candidate Corp: 0 IllegalActions, 0 ReplayFailures.
- Alle sechs Action-Type-Dominance-Reports sind `complete`.
- Maximale Top-Share im Smoke: 0.263.

## Bewertung

Der Smoke belegt noch nicht den kompletten `AI-COMPLETE-20`-Abschluss, weil er nur Pair A und einen Seed nutzt. Er schließt aber die bisher fehlende Messoberfläche für Action-Type-Dominanz und zeigt im ersten reproduzierbaren Gate-Fenster keine Dominanz.
