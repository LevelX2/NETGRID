# AI068-1 Scoreline-Telemetrie Review

Stand: 2026-06-10
Status: abgeschlossen im Paket `AI068-1`
Branch: `codex/ai068-ai072-selfplay-quality`

## Ziel

Selfplay-Trace-Mining soll die Kernmetriken der AI068-AI072-Paketfolge direkt im JSON-Aggregat und im Markdown-Report ausgeben. Das Paket ändert keine Spielentscheidung und keine Engine- oder LegalAction-Logik.

## Umsetzung

- `AiSimulationSummary` übernimmt den bestehenden öffentlichen `gameEndReason` aus dem finalen `GameState`.
- `AiSelfplayTraceMiningResult.aggregate` enthält zusätzlich:
  - `allRedactionSafe`
  - `averageGameLength`
  - `corpAgendaScores`
  - `runnerAgendaSteals`
  - `corpFlatlines`
  - `scoreWindowMissed`
  - `unsafeScoreChosen`
  - `passiveActionWithScoreLineAvailable`
- `formatAiSelfplayTraceMiningReport` zeigt diese Felder im Aggregate-Block.
- `scoreWindowMissed` nutzt die vorhandene einfache Score-Action-Fenster-Metrik.
- `unsafeScoreChosen` bleibt getrennt und zählt nur tatsächlich gewählte Corp-Scores in einem Terminalfenster mit hoher sichtbarer Runner-Access-Gefahr ohne Protected-Remote-Signal.
- `passiveActionWithScoreLineAvailable` zählt konservativ Corp-Terminalfenster, in denen eine Nicht-Score-/Nicht-Advance-Linie gewählt und von der bestehenden Terminaldiagnostik als Skip klassifiziert wurde.

## Kleiner Trace-Lauf

Kommando:

```powershell
corepack pnpm --filter @netgrid/server exec tsx -e "import { runAiSelfplayTraceMining } from '@netgrid/ai'; const result = runAiSelfplayTraceMining({ seeds: ['ai-v143-tuning-001'], maxActions: 20, maxFindings: 5 }); console.log(JSON.stringify(result.aggregate, null, 2));"
```

Ergebnis:

| Metric | Value |
| --- | ---: |
| games | 1 |
| decisions | 20 |
| findings | 7 |
| illegalActions | 0 |
| replayFailures | 0 |
| actionLimitReached | 1 |
| allRedactionSafe | 1 |
| averageGameLength | 20 |
| corpAgendaScores | 0 |
| runnerAgendaSteals | 0 |
| corpFlatlines | 0 |
| scoreWindowMissed | 0 |
| unsafeScoreChosen | 0 |
| passiveActionWithScoreLineAvailable | 0 |

Detector-Auszug:

| Detector | Count |
| --- | ---: |
| corp_never_scores_long_game | 1 |
| recovery_low_value_loop | 2 |
| plan_step_action_mismatch | 3 |
| semantic_override_suspicious | 5 |
| runner_never_accesses_long_game | 1 |

## Verification

- `corepack pnpm --filter @netgrid/ai typecheck`: grün.
- `corepack pnpm --filter @netgrid/ai exec vitest run src/simulation/benchmark-reports.test.ts`: grün, 5 Tests.
- `git diff --check`: grün.

## Sicherheitsgrenzen

- Keine Änderung an Engine, LegalAction-Erzeugung, `applyAction`, Replay, StateHash oder Randomness.
- Keine Hidden-Info-Erweiterung.
- Keine neue Action-Auswahl oder Gewichtung in diesem Paket.
- `plan_step_action_mismatch` und `semantic_override_suspicious` bleiben observation-only.
