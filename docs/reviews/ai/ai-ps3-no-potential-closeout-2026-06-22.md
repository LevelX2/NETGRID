# AI-PS3 No-Potential Closeout

Datum: 2026-06-22

## Ausgangspunkt

Das AI-PS3-Planungsgate bestätigte den PS2-Stand über Pair A-D:

| Metrik | Legacy | Candidate Runner | Candidate Corp |
|---|---:|---:|---:|
| Spiele je Leg | 25 | 25 | 25 |
| Action-Limits | 16 | 13 | 13 |
| Runner Steals | 40 | 47 | 44 |
| Corp Scores | 12 | 14 | 21 |
| IllegalActions | 0 | 0 | 0 |
| ReplayFailures | 0 | 0 | 0 |

Der Candidate bleibt damit insgesamt besser und safety-grün. Das auffälligste
Restpotential war Pair D: Der Runner erzielte dort mehr Steals, zeigte aber
schlechtere Action-Limit-Werte.

## Verworfener Umsetzungskandidat

Als engster Low-Risk-Hebel wurde lokal ein
`runner_tag_cleanup_before_pressure`-Kandidat ausprobiert:

- nur Runner-Seite,
- nur bei sichtbarem Runner-Tag,
- nur bei legaler `remove_tag`-Action,
- keine LegalAction-Erzeugung,
- keine Hidden-Info-Erweiterung,
- opt-in im Practical-Tactic-Overlay.

Die fokussierten Checks waren grün:

```text
corepack pnpm --filter @netgrid/ai exec vitest run src/runtime/practical-tactic-overlay.test.ts src/evaluation/practical-tactic-benchmark.test.ts
corepack pnpm --filter @netgrid/ai typecheck
git diff --check
```

Die anschließenden Gates rechtfertigten die Übernahme aber nicht:

| Gate | Ergebnis |
|---|---|
| Pair-D-Fokus | Safety grün, aber kein praktischer Action-Limit-Fix |
| Pair A-D breit | Metrisch identisch zum AI-PS3-Planungsgate |

Der Kandidat wurde deshalb vor dem Commit entfernt. Das verhindert, dass eine
Fixture-Erweiterung als echte Spielstärkeverbesserung in das KI-Verhalten
wandert.

## Schlussfolgerung

Innerhalb des aktuellen Overlay-Zuschnitts ist kein weiterer klarer,
risikoarmer LegalAction-Kandidat sichtbar. Die verbleibenden Signale sind
gemischt und brauchen erst Trace-Ursachenanalyse oder ein separates
Default-/Planner-Gate. Eine weitere kleine Heuristik wäre ohne diese Diagnose
zu wahrscheinlich Setup-Tuning.

Entscheidung: `no_clear_low_risk_potential`.
