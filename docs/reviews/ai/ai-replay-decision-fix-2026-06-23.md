# KI-Replay-Decision-Fix

Stand: 2026-06-23  
Paket: `REPLAY-AI-4`

## Fix

`runner.obtain_breaker_coverage` blockiert `start_run`-Overrides nicht mehr pauschal. Generische Coverage-Fallbacks wie `gain_credit` oder `draw_card` bleiben nur bei engem Score-Abstand geschützt. Sobald der beste Semantic-Choice den gemappten generischen Coverage-Choice um mehr als `PLAN_MAPPED_CHOICE_MAX_SCORE_GAP` schlägt, darf der bessere legale Run übernehmen.

Direkte Coverage-Antworten wie `trigger_ability`, `install_card`, `play_event` oder andere konkrete Kartenantworten bleiben geschützt und werden nicht durch den Run-Gap-Override verdrängt.

Geändert:

- `packages/ai/src/runtime/semantic-choice-ranking.ts`
- `packages/ai/src/runtime/semantic-choice-ranking.test.ts`
- `packages/ai/src/semantic-ai-runtime-cutover.test.ts`

## Before/After

Same-State-Probe: `replay-case-509c7f2d5d6a49c2`, `match_fd1266b1e2949d3a`, `stateVersion=13`.

| Stand | Aktion | Typ | Grund |
| --- | --- | --- | --- |
| Vor Fix | `runner.gain_credit` | `gain_credit` | Coverage-Plan-Mapping ueberstimmt besseren Run knapp |
| Nach Fix | `runner.start_run.rd` | `start_run` | klar besserer Semantic-Run uebernimmt |

Nach dem Fix:

| Rang | Aktion | Typ | Priority |
| ---: | --- | --- | ---: |
| 1 | `runner.start_run.rd` | `start_run` | 7645 |
| 2 | `runner.gain_credit` | `gain_credit` | 7025 |
| 3 | `runner.start_run.hq` | `start_run` | 5955 |

## Verifikation

- `corepack pnpm --filter @netgrid/ai exec vitest run src/runtime/semantic-choice-ranking.test.ts src/semantic-ai-runtime-cutover.test.ts --maxWorkers=1 --testTimeout=30000`
  - 2 Testdateien, 58 Tests grün.
- `corepack pnpm --filter @netgrid/ai exec vitest run src/runtime/semantic-choice-ranking.test.ts src/evaluation/replay-decision-case-clustering.test.ts --maxWorkers=1 --testTimeout=30000`
  - 2 Testdateien, 3 Tests grün.
- `corepack pnpm --filter @netgrid/ai typecheck`
  - grün.
- Lokale Same-State-Probe gegen `netgrid.sqlite`
  - nach Fix `currentActionType=start_run`.

Einschränkung:

- Der volle `@netgrid/ai test` ist durch 4 Shell-Traders-Tests in `src/index.test.ts` rot. Der erste dieser Fehler ist unverändert auf `main` reproduzierbar und scheitert bereits daran, dass die erwartete `trigger_ability`-LegalAction im Testzustand fehlt. Das ist kein durch diesen Fix eingeführter Ranking-Regressionsbefund.

## Vertragsprüfung

- Keine Engine-Änderung.
- Keine LegalAction-Erzeugung geändert.
- Keine Änderung an `applyAction`.
- Keine Änderung an Replay, StateHash oder Randomness.
- Keine Hidden-Info-Ausweitung: die Auswahl nutzt weiter nur PlayerView und LegalActions.
