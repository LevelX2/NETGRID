# AI-PS2 Preflight Play Strength Gate

Datum: 2026-06-22

## Lauf

```text
corepack pnpm --filter @netgrid/server exec tsx ../../scripts/run-ai-ps2-play-strength-gate.ts --out docs/reviews/ai/ai-ps2-preflight-play-strength-gate-2026-06-22.json --pairs a --seeds ai-v143-tuning-001 --max-actions 80
```

## Zweck

AI-PS2-0 verbreitert den AI224-Gate-Lauf, ohne eine neue Reporting-Kaskade zu
erzeugen. Das neue Skript vergleicht Legacy, Candidate-Runner und
Candidate-Corp über dieselben Seeds und optional mehrere eingefrorene
Deckpaare.

## Ergebnis

| Metrik | Legacy | Candidate Runner | Candidate Corp |
|---|---:|---:|---:|
| Spiele je Leg | 2 | 2 | 2 |
| Action-Limits | 1 | 1 | 2 |
| Runner Steals | 3 | 4 | 3 |
| Corp Scores | 1 | 1 | 0 |
| IllegalActions | 0 | 0 | 0 |
| ReplayFailures | 0 | 0 | 0 |

Taktik-Benchmark:

| Selector | Trefferquote |
|---|---:|
| Frozen Legacy | 0/32 |
| Practical Tactic Overlay | 32/32 |

## Entscheidung für Folgepakete

Der Preflight bestätigt, dass der Gate-Runner nutzbar ist und Safety grün
bleibt. Die Wirkung ist aber asymmetrisch: Candidate-Runner verbessert im
kleinen Lauf Runner-Steals, Candidate-Corp verschlechtert sich in dieser
verbreiterten Probe. AI-PS2-1 und AI-PS2-2 bleiben deshalb getrennte,
eng begrenzte Verhaltenspakete. Kein Default-Cutover.
