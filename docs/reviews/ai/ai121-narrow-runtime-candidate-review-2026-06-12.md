# AI121 Narrow Runtime Candidate Review

Datum: 2026-06-12

Branch: `codex/ai115-ai122-residual-action-limit-evidence-sweep`

## Ziel

AI121 testet genau einen engen Runtime-Kandidaten oder dokumentiert ein explizites No-Go.

## Getesteter Kandidat

Kandidat aus AI115/AI117:

- Runner-`gain_credit`
- wiederholte Reserve-Credits
- sichtbare Coverage-Lücke
- legale `draw_card`-Alternative
- keine sichere Run-Alternative
- keine generelle Credit-Strafe

Der getestete Score-Guard gab `gain_credit` in diesem engen Muster einen Malus mit Evidence:

- `runner_reserve_no_conversion_guard:true`
- `coverage_gap:<type>`
- `safe_alternative:draw_card`
- `not_general_credit_penalty:true`

## Kandidaten-Trace

Artefakt:

- `docs/reviews/ai/ai121-candidate-a-d-5seed-2026-06-12.json`

Kernwerte des Kandidaten:

| Metrik | AI114 Basis | AI121 Kandidat |
| --- | ---: | ---: |
| Spiele | 20 | 20 |
| Entscheidungen | 2498 | 2556 |
| Illegale Actions | 0 | 0 |
| Replay-Fehler | 0 | 0 |
| Redaction safe | true | true |
| `actionLimitReached` | 9 | 10 |
| `repeated_no_progress_run` | 31 | 31 |
| `unsafeScoreChosen` | 3 | 3 |
| `passiveActionWithScoreLineAvailable` | 4 | 4 |

## Entscheidung

No-Go. Der Runtime-Kandidat wird nicht übernommen.

Grund:

- `actionLimitReached` sinkt nicht.
- `actionLimitReached` steigt von 9 auf 10.
- Damit greift die Stop-Regel: nicht übernehmen, wenn der Zielwert nicht sinkt.

Safety war zwar grün, aber das reicht nicht. Der Kandidat verschiebt den Residual-Verlauf und erzeugt mehr Action-Limit-Spiele.

## Schlussfolgerung

B005 bleibt als belegter Diagnosefall wertvoll, aber der getestete Coverage-Draw-Malus ist kein zulässiger Runtime-Fix. Der nächste sinnvolle Schritt ist kein weiteres Tuning im selben Paket, sondern ein separater Folgeblock zu den x10-Restclustern und zum neu aufgetauchten Pair-A-Late-Draw-ohne-Coverage-Ziel.

## Verifikation

- `corepack pnpm --filter @netgrid/ai typecheck`
- `corepack pnpm --filter @netgrid/ai exec vitest run src/simulation/ai121-generate-candidate-trace.test.ts` temporär zur Kandidatenmessung
- `git diff --check`
