# AI-PS3 Planning Gate 1

Datum: 2026-06-22

## Lauf

```text
corepack pnpm --filter @netgrid/server exec tsx ../../scripts/run-ai-ps2-play-strength-gate.ts --out docs/reviews/ai/ai-ps3-planning-gate-1-2026-06-22.json --pairs a,b,c,d --max-actions 160
```

## Ergebnis

| Metrik | Legacy | Candidate Runner | Candidate Corp |
|---|---:|---:|---:|
| Spiele je Leg | 25 | 25 | 25 |
| Action-Limits | 16 | 13 | 13 |
| Runner Steals | 40 | 47 | 44 |
| Corp Scores | 12 | 14 | 21 |
| IllegalActions | 0 | 0 | 0 |
| ReplayFailures | 0 | 0 | 0 |

Taktik-Benchmark:

| Selector | Trefferquote |
|---|---:|
| Frozen Legacy | 0/40 |
| Practical Tactic Overlay | 40/40 |

## Szenario-Befund

Der Candidate bleibt insgesamt besser als Legacy, aber nicht jedes Szenario ist
monoton besser. Das auffälligste Restpotential liegt bei Pair D
`R&D Interface Dig vs Shadoe Tag & Bag`: Candidate-Runner verbessert
Runner-Steals, verschlechtert dort aber Action-Limits von 0 auf 2.

## Umsetzungshypothese

AI-PS3-1 soll keinen weiteren Run-Druck hinzufügen. Der engste Hebel ist
Tag-Sicherheit:

- Wenn Runner getaggt ist,
- eine legale `remove_tag`-Action vorhanden ist,
- und das Overlay sonst nur einen High-Payoff-Run gegenüber passiver
  Vorbereitung erzwingen würde,
- soll Tag-Removal die High-Payoff-Run-Übersteuerung schlagen.

Grenzen:

- Steal, Trash und aktuelle Access-Aktion bleiben höher priorisiert.
- Keine neue LegalAction-Erzeugung.
- Keine Hidden-Info-Erweiterung.
- Kein Default-Cutover.
