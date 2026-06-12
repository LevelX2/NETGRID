# AI147 Semantic Endgame Scorecard

Datum: 2026-06-12

Branch: `codex/ai140-ai148-semantic-endgame-optimization`

## Ziel

AI147 bündelt die Sicherheits-, Trace- und Semantikmetriken des AI131-AI146-Blocks in einer stabilen Scorecard. Die Scorecard ist bewusst deskriptiv: Sie macht Fortschritt, verbleibende Action-Limits und belegte No-Go-Grenzen sichtbar, ohne neue Runtime-Gewichte einzuführen.

## Safety Gates

| Metrik | x10-Wert |
| --- | ---: |
| IllegalActions | 0 |
| Replay-Failures | 0 |
| Critical Findings | 0 |
| Redaction-safe | 1 |

## Trace-Metriken

| Metrik | x5 | x10 |
| --- | ---: | ---: |
| Spiele | 20 | 40 |
| Entscheidungen | 2498 | 5264 |
| Action-Limits | 9 | 21 |
| Action-Limit-Rate | 45.00% | 52.50% |
| Repeated No-Progress Run | 31 | 53 |
| Unsafe Score Chosen | 3 | 8 |
| Passive Action With Score Line Available | 4 | 8 |
| Durchschnittliche Spiellänge | 124.9 | 131.6 |
| Corp Agenda Scores | 12 | 25 |
| Runner Agenda Steals | 33 | 57 |
| Corp Flatlines | 5 | 8 |
| Score Window Missed | 0 | 0 |

## Semantik-Metriken

| Metrik | Wert |
| --- | ---: |
| Progress-Conversion-Rate | 53.17% |
| Stale-No-Progress-Anteil | 32.94% |
| Runner-Coverage-Completion-Rate | 66.67% |
| Corp-Tempo-Conversion-Rate | 100.00% |
| Endgame-Intent-Conversion-Rate | 58.33% |
| Endgame-Intent-Blocked-Rate | 36.46% |
| Endgame-Intent-Stale-Rate | 5.21% |

## Interpretation

Der Sicherheitszustand bleibt hart grün: keine IllegalActions, keine Replay-Failures, keine Critical Findings und Redaction-safe im x10-Stand. Semantisch bleibt der Engpass sichtbar: x10 erreicht 21 Action-Limits, und der AI132-Corpus enthält 415 stale No-Progress-Aktionen bei 1260 gelabelten Aktionen. Shadow-Signale zeigen klare Optimierungsrichtungen, aber AI146 bestätigt, dass daraus ohne same-state LegalAction-Beweis kein Runtime-Cutover abgeleitet werden darf.

## Quellen

- `docs/reviews/ai/ai132-progress-delta-labeler-2026-06-12.json`
- `docs/reviews/ai/ai139-final-a-d-5seed-2026-06-12.json`
- `docs/reviews/ai/ai139-final-a-d-10seed-2026-06-12.json`
- `docs/reviews/ai/ai142-runner-coverage-goal-completion-shadow-2026-06-12.md`
- `docs/reviews/ai/ai143-corp-tempo-conversion-shadow-2026-06-12.md`
- `docs/reviews/ai/ai144-endgame-intent-memory-shadow-2026-06-12.md`

## Verifikation

- `corepack pnpm --filter @netgrid/server exec tsx ../../scripts/build-ai147-semantic-endgame-scorecard.ts`
- `git diff --check`
