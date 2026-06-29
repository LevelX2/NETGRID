# AI-COMPLETE-20 Play-Quality Gate 2026-06-29

## Lauf

```text
corepack pnpm --filter @netgrid/server exec tsx ../../scripts/run-ai-ps2-play-strength-gate.ts --out docs/reviews/ai/ai-complete-20-play-quality-gate-2026-06-29.json --pairs a,b --max-actions 160
```

## Gate-Fenster

- Szenarien: `default_demo`, Pair A, Pair B.
- Seeds: `ai-v143-tuning-001` bis `ai-v143-tuning-005`.
- Legs: Legacy vs Legacy, Candidate Runner vs Legacy Corp, Legacy Runner vs Candidate Corp.
- Spiele je Leg-Aggregat: 15.

## Ergebnis

| Metrik | Legacy | Candidate Runner | Candidate Corp |
| --- | ---: | ---: | ---: |
| Action-Limits | 0 | 0 | 0 |
| Runner Steals | 16 | 31 | n/a |
| Corp Scores | 15 | n/a | 19 |
| IllegalActions | 0 | 0 | 0 |
| ReplayFailures | 0 | 0 | 0 |

## Action-Type-Dominanz und Erklärbarkeit

| Szenario | Leg | Decisions | Dominanzstatus | Top Share | Why-Coverage | Missing Why-Coverage |
| --- | --- | ---: | --- | ---: | --- | ---: |
| `default_demo` | `legacy` | 676 | `complete` | 0.204 | `complete` | 0 |
| `default_demo` | `candidate_runner` | 693 | `complete` | 0.212 | `complete` | 0 |
| `default_demo` | `candidate_corp` | 756 | `complete` | 0.231 | `complete` | 0 |
| `A` | `legacy` | 666 | `complete` | 0.209 | `complete` | 0 |
| `A` | `candidate_runner` | 639 | `complete` | 0.169 | `complete` | 0 |
| `A` | `candidate_corp` | 762 | `complete` | 0.188 | `complete` | 0 |
| `B` | `legacy` | 655 | `complete` | 0.176 | `complete` | 0 |
| `B` | `candidate_runner` | 758 | `complete` | 0.216 | `complete` | 0 |
| `B` | `candidate_corp` | 628 | `complete` | 0.196 | `complete` | 0 |

## Bewertung

- Safety ist im breiteren Fenster grün: 0 IllegalActions, 0 ReplayFailures, RedactionSafe true.
- Kein Leg zeigt Action-Type-Dominanz; maximale Top-Share ist 0.231.
- Why-Coverage ist in allen Legs `complete` und hat keine Missing-Signale.
- Candidate Runner verbessert Runner-Steals von 16 auf 31.
- Candidate Corp verbessert Corp-Scores von 15 auf 19.
- `mergeAllowed` bleibt false, weil der separate Taktik-Hit-Rate-Delta in diesem Lauf 0 ist; das ist kein Runtime-Default-Cutover.
