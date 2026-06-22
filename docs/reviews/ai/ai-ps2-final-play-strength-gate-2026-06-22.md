# AI-PS2 Final Play Strength Gate

Datum: 2026-06-22

## Lauf

```text
corepack pnpm --filter @netgrid/server exec tsx ../../scripts/run-ai-ps2-play-strength-gate.ts --out docs/reviews/ai/ai-ps2-final-play-strength-gate-2026-06-22.json --pairs a,b --max-actions 160
```

Konfiguration:

- Szenarien: `default_demo`, Pair A, Pair B
- Seeds: `ai-v143-tuning-001` bis `ai-v143-tuning-005`
- Spiele je Leg: 15
- Legs:
  - Legacy Runner vs Legacy Corp
  - Candidate Runner vs Legacy Corp
  - Legacy Runner vs Candidate Corp

## Ergebnis

| Metrik | Legacy | Candidate Runner | Candidate Corp |
|---|---:|---:|---:|
| Spiele je Leg | 15 | 15 | 15 |
| Action-Limits | 11 | 8 | 9 |
| Runner Steals | 21 | 22 | 25 |
| Corp Scores | 11 | 14 | 19 |
| IllegalActions | 0 | 0 | 0 |
| ReplayFailures | 0 | 0 | 0 |

Taktik-Benchmark:

| Selector | Trefferquote |
|---|---:|
| Frozen Legacy | 0/40 |
| Practical Tactic Overlay | 40/40 |

## Entscheidung

`mergeAllowed: true`

`recommendation: keep_candidate_opt_in`

Begründung:

- Safety-Gates sind grün: 0 IllegalActions, 0 ReplayFailures, RedactionSafe true.
- Der Taktik-Benchmark verbessert sich um +1.0 Trefferquote.
- Candidate-Runner verbessert Action-Limits von 11 auf 8 und Runner-Steals von
  21 auf 22.
- Candidate-Corp verbessert Action-Limits von 11 auf 9 und Corp-Scores von 11
  auf 19.
- Der Lauf ist noch kein Default-Cutover-Gate, weil der Kandidat weiterhin nur
  opt-in aktiviert wird und nicht über alle bekannten Holdout-Paare x20/x50
  geprüft wurde.

## Folgegrenze

Der Code ist als kontrollierter opt-in Candidate mergefähig. Nächste sinnvolle
Arbeit wäre kein weiterer Diagnoseblock, sondern entweder ein explizites
Default-Gate mit größerer Holdout-Matrix oder ein neuer konkreter
Verhaltenskandidat mit eigener gepaarter Evidenz.
