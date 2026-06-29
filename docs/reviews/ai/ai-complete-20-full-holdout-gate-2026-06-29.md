# AI-COMPLETE-20 Full Holdout Gate 2026-06-29

## Lauf

```text
corepack pnpm --filter @netgrid/server exec tsx ../../scripts/run-ai-ps2-play-strength-gate.ts --out docs/reviews/ai/ai-complete-20-full-holdout-gate-2026-06-29.json --pairs a,b,c,d --max-actions 160
```

## Gate-Fenster

- Szenarien: `default_demo`, Pair A, Pair B, Pair C, Pair D.
- Seeds: `ai-v143-tuning-001` bis `ai-v143-tuning-005`.
- Legs: Legacy vs Legacy, Candidate Runner vs Legacy Corp, Legacy Runner vs Candidate Corp.
- Spiele gesamt über alle Legs: 75.
- Entscheidungen gesamt über alle Legs: 9477.

## Gesamtergebnis

| Metrik | Wert |
| --- | ---: |
| Action-Limits | 0 |
| IllegalActions | 0 |
| ReplayFailures | 0 |
| RedactionSafe | 1 |
| Why-Coverage Missing Signals | 0 |
| Max Action-Type Top Share | 0.253 |

## Vergleich

| Metrik | Legacy | Candidate Runner | Candidate Corp |
| --- | ---: | ---: | ---: |
| Spiele je Leg-Aggregat | 25 | 25 | 25 |
| Action-Limits | 0 | 0 | 0 |
| Runner Steals | 35 | 54 | n/a |
| Corp Scores | 18 | n/a | 23 |
| IllegalActions | 0 | 0 | 0 |
| ReplayFailures | 0 | 0 | 0 |

## Dominanz und Why-Coverage

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
| `C` | `legacy` | 800 | `complete` | 0.209 | `complete` | 0 |
| `C` | `candidate_runner` | 656 | `complete` | 0.253 | `complete` | 0 |
| `C` | `candidate_corp` | 611 | `complete` | 0.226 | `complete` | 0 |
| `D` | `legacy` | 369 | `complete` | 0.168 | `complete` | 0 |
| `D` | `candidate_runner` | 320 | `complete` | 0.156 | `complete` | 0 |
| `D` | `candidate_corp` | 488 | `complete` | 0.182 | `complete` | 0 |

## Bewertung

- Die AI-COMPLETE-20-Safety-Anforderungen sind im vollen A-D-Holdout erfüllt: 0 IllegalActions, 0 ReplayFailures und RedactionSafe true.
- Es gibt keine Action-Type-Dominanz: alle 15 Dominanzberichte sind `complete`.
- Die Erklärbarkeit ist im Gate belegt: alle 15 Why-Coverage-Berichte sind `complete` und haben 0 Missing-Coverage-Signale.
- Candidate Runner verbessert Runner-Steals von 35 auf 54.
- Candidate Corp verbessert Corp-Scores von 18 auf 23.
- `mergeAllowed` bleibt false, weil dieser Lauf kein Default-Cutover ist und der separate Taktik-Hit-Rate-Delta 0 bleibt.
