# AI Trace Planner Strength Loop Final Review

Datum: 2026-06-22

## Ergebnis

Die Trace-/Planner-Schleife hat einen echten Kandidaten gefunden, umgesetzt,
gemessen und wegen Safety verworfen.

## Planning Gate

Trace-Matrix über Pair A-D:

| Metrik | Wert |
|---|---:|
| Spiele | 20 |
| Entscheidungen | 2492 |
| Findings | 836 |
| IllegalActions | 0 |
| ReplayFailures | 0 |
| RedactionSafe | true |
| Action-Limits | 11 |

Der stärkste konkrete Hebel war ein Planner-Mapping-Fall: `runner.build_credit_base`
blieb aktiv, obwohl legale nützliche Runner-Handentwicklung verfügbar war.

## Umgesetzter Kandidat

Kandidat: Credit-Base sollte bei vorhandener legaler nützlicher
Handentwicklung zurücktreten, solange keine harte Reserve-, Remote-Contest-
oder Overdraw-Not besteht.

Fokussierte Checks:

```text
corepack pnpm --filter @netgrid/ai exec vitest run src/tactical-plans.test.ts
corepack pnpm --filter @netgrid/ai typecheck
git diff --check
```

Alle fokussierten Checks waren grün.

## Gate-Wirkung

Das breite PS2-Gate zeigte Nutzen:

| Metrik | PS3-Stand | Kandidat |
|---|---:|---:|
| Candidate-Runner Action-Limits | 13 | 10 |
| Candidate-Runner Steals | 47 | 47 |
| Candidate-Corp Action-Limits | 13 | 13 |
| Candidate-Corp Scores | 21 | 21 |
| IllegalActions im PS2-Gate | 0 | 0 |
| ReplayFailures im PS2-Gate | 0 | 0 |

Die Post-Candidate-Trace-Matrix zeigte aber einen Safety-Blocker:

| Befund | Wert |
|---|---|
| `illegalActions` | 1 |
| Pair | C, `Blink Pressure Rig vs Ivory Bastion` |
| Seed | `ai-v143-tuning-005` |
| Fehler | `ERR_INVALID_TARGET at stateVersion 50` |

## Entscheidung

Der Kandidat wurde per Revert entfernt. Messbare Spielstärkeverbesserung reicht
nicht aus, wenn ein breiteres Trace-Gate einen neuen illegalen Pfad zeigt.

Finaler Status: `no_clear_low_risk_potential_after_safety_reject`.

## Folgeempfehlung

Nicht weiter heuristisch optimieren. Als separates Paket sinnvoll:

`ERR_INVALID_TARGET` in Pair C Seed `ai-v143-tuning-005` mit gespeicherter
State-/Action-Repro-Fixture isolieren und klären, ob die Ursache in Choice-
Targeting, Corp-Install-/Rez-Zielbindung oder einem Simulationsharness-Vertrag
liegt.
