# AI069 Runner Recovery-/No-Progress-Loops Review

Stand: 2026-06-10
Status: abgeschlossen im Paket `AI069`
Branch: `codex/ai068-ai072-selfplay-quality`

## Ziel

Runner-Loops mit niedriger Wertentwicklung sollen reduziert werden, ohne Recovery generell zu verbieten. Das Paket fokussiert den messbaren Detector `repeated_no_progress_run`; Recovery bleibt legal und wählbar, wenn der Plan- oder Ressourcenkontext sie weiterhin trägt.

## Umsetzung

- Die Semantic-Runtime zählt Same-server-Run-Wiederholungen jetzt über ein kurzes Cross-turn-Fenster statt nur bis zum nächsten Corp-/Turn-Ereignis.
- Der Wiederholungszähler bricht bei Fortschrittssignalen ab:
  - `steal_agenda`
  - `score_agenda`
  - `trash_accessed_card`
  - `advance_card`
  - `install_card`
- Wiederholte Runs auf demselben Server erhalten einen deutlich stärkeren `runner_recent_same_server_runs`-Malus.
- Ein gemappter Tactical-Plan-Run darf von einer besser bewerteten Nicht-Run-Alternative überstimmt werden, wenn der gemappte Run genau diesen Same-server-Repeat-Malus trägt.
- Die Änderung erzeugt keine LegalActions und verändert keine Engine-Regeln.

## A-D-Messlauf

Kommando:

```powershell
corepack pnpm --filter @netgrid/server exec tsx -e "import { readFileSync } from 'node:fs'; import { benchmarkDeckFromFrozenLocalSnapshot, runAiSelfplayTraceMining } from '@netgrid/ai'; process.chdir('../..'); const pairs = ['a','b','c','d'].map((id) => JSON.parse(readFileSync('docs/reviews/ai/ai-selfplay-trace-mining-' + id + '.json', 'utf8')).pair); const seeds = ['ai-v143-tuning-001','ai-v143-tuning-002','ai-v143-tuning-003','ai-v143-tuning-004','ai-v143-tuning-005']; const out = pairs.map((pair) => { const runner = benchmarkDeckFromFrozenLocalSnapshot(pair.runner); const corp = benchmarkDeckFromFrozenLocalSnapshot(pair.corp); const result = runAiSelfplayTraceMining({ seeds, runnerDeck: runner.deck, corpDeck: corp.deck, runnerDeckMetadata: runner.metadata, corpDeckMetadata: corp.metadata, maxActions: 160, maxFindings: 20 }); return { pair: pair.id, label: pair.label, aggregate: result.aggregate }; }); console.log(JSON.stringify(out, null, 2));"
```

Vergleich zum Stand nach AI068-3:

| Metric | Nach AI068-3 | Nach AI069 |
| --- | ---: | ---: |
| games | 20 | 20 |
| illegalActions | 0 | 0 |
| replayFailures | 0 | 0 |
| allRedactionSafe | 1 | 1 |
| criticalFindings | 0 | 0 |
| corp_never_scores_long_game | 5 | 3 |
| actionLimitReached | 11 | 11 |
| repeated_no_progress_run | 60 | 33 |
| recovery_low_value_loop | 89 | 88 |
| corpAgendaScores | 11 | 13 |
| runnerAgendaSteals | 29 | 30 |
| corpFlatlines | 4 | 4 |
| scoreWindowMissed | 0 | 0 |
| unsafeScoreChosen | 5 | 6 |
| passiveActionWithScoreLineAvailable | 5 | 6 |

Pair-Auszug nach AI069:

| Pair | repeated_no_progress_run | recovery_low_value_loop | actionLimitReached | unsafeScoreChosen |
| --- | ---: | ---: | ---: | ---: |
| A | 3 | 17 | 1 | 1 |
| B | 6 | 44 | 3 | 0 |
| C | 11 | 18 | 4 | 1 |
| D | 13 | 9 | 3 | 4 |

## Bewertung

Das Hauptziel für `repeated_no_progress_run` ist erreicht: 60 sinkt auf 33. `recovery_low_value_loop` sinkt nur minimal von 89 auf 88; der Fix vermeidet bewusst eine breite Recovery-Abwertung, weil frühere Zwischenversuche Safety-Regressionsmarken erzeugt haben.

`actionLimitReached` bleibt bei 11. `unsafeScoreChosen` und `passiveActionWithScoreLineAvailable` steigen jeweils leicht von 5 auf 6. Das ist kein Legalitäts- oder Redaction-Blocker, bleibt aber als Follow-up-Signal für die kommenden Pakete sichtbar.

## Verification

- `corepack pnpm --filter @netgrid/ai typecheck`: grün.
- `corepack pnpm --filter @netgrid/ai exec vitest run src/index.test.ts -t "penalizes repeated runner pressure on the same server across no-progress setup"`: grün.
- `git diff --check`: grün.
- A-D-Trace-Mining-Lauf: ausgeführt, Safety grün.

## Sicherheitsgrenzen

- Keine Änderung an Engine, LegalAction-Erzeugung, `applyAction`, Replay, StateHash oder Randomness.
- Keine Hidden-Info-Erweiterung.
- Keine Karten-ID-Hardcodierung.
- Die KI priorisiert ausschließlich vorhandene `input.legalActions` um.
