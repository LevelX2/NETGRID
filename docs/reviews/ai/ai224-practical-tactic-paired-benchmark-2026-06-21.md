# AI224 Practical Tactic Paired Benchmark

Datum: 2026-06-21

## Lauf

```text
corepack pnpm --filter @netgrid/server exec tsx ../../scripts/run-ai224-practical-tactic-paired-benchmark.ts --out docs/reviews/ai/ai224-practical-tactic-paired-benchmark-2026-06-21.json --max-actions 160
```

Seeds:

```text
ai-v143-tuning-001
ai-v143-tuning-002
ai-v143-tuning-003
ai-v143-tuning-004
ai-v143-tuning-005
```

## Vergleich

| Leg | Action-Limits | IllegalActions | ReplayFailures | RedactionSafe |
|---|---:|---:|---:|---|
| Legacy vs Legacy | 5/5 | 0 | 0 | true |
| Candidate Runner vs Legacy Corp | 5/5 | 0 | 0 | true |
| Legacy Runner vs Candidate Corp | 2/5 | 0 | 0 | true |

## Praktische Metriken

| Metrik | Legacy vs Legacy | Candidate Runner | Candidate Corp |
|---|---:|---:|---:|
| Runner Steals | 8 | 6 | 6 |
| Corp Scores | 5 | 3 | 7 |
| Corp Flatlines | 0 | 0 | 0 |
| Average Game Length | 160 | 160 | 126.4 |

## Taktik-Benchmark

| Selector | Trefferquote |
|---|---:|
| Frozen Legacy | 0/32 |
| Practical Tactic Overlay | 32/32 |

## Entscheidung

`mergeAllowed: true`, aber nur als kontrollierter opt-in Kandidat.

Begründung:

- Safety-Gates sind grün: 0 IllegalActions, 0 ReplayFailures, RedactionSafe true.
- Taktik-Benchmark ist deutlich besser als Legacy.
- Mindestens eine praktische Matchmetrik verbessert sich: Candidate-Corp senkt Action-Limits von 5/5 auf 2/5 und erhöht Corp-Scores von 5 auf 7.
- Candidate-Runner verbessert die x5-Matchmetrik nicht und verliert Runner-Steals; deshalb kein globaler Default-Cutover.

## Folgegrenze

Kein weiterer Analyseblock ist aus diesem Ergebnis abzuleiten. Der sinnvolle nächste Schritt wäre nur ein ausdrücklicher größerer Vergleichslauf, falls der opt-in Kandidat später als Default-Kandidat geprüft werden soll.

