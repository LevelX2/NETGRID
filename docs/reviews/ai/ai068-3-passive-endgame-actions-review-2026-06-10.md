# AI068-3 Passive Endgame Actions Review

Stand: 2026-06-10
Status: abgeschlossen im Paket `AI068-3`
Branch: `codex/ai068-ai072-selfplay-quality`

## Ziel

Passive Corp-Aktionen sollen in scorebaren Endgame-Lagen abgewertet werden, ohne Safety-Blocker zu ignorieren oder Advance-/Score-Aktionen fälschlich als passiv zu zählen.

## Umsetzung

- Die Semantic-Runtime ergänzt eine negative Score-Komponente `corp_passive_scoreline_available`, wenn:
  - eine Corp-Scoreline über die bestehende `assessCorpScoreTerminalWindow`-Analyse verfügbar ist,
  - die gewählte Action nicht selbst `score_agenda`, `advance_card` oder eine Agenda-Install-Scoreline ist,
  - keine Terminal-Safety-Blocker wie Credits, Cheap Contest, Runner Contest oder HQ-Threat greifen.
- Passive Kategorien werden differenziert:
  - Economy, Draw und End Turn: starke Abwertung.
  - Install- und ICE-Install-Aktionen: mittlere Abwertung.
  - Rez/Decline-Rez: schwächere Abwertung.
- Die Trace-Mining-Aggregation zählt `advance_card` und `score_agenda` nicht mehr als `passiveActionWithScoreLineAvailable`.

## A-D-Messlauf

Kommando:

```powershell
corepack pnpm --filter @netgrid/server exec tsx -e "import { readFileSync } from 'node:fs'; import { benchmarkDeckFromFrozenLocalSnapshot, runAiSelfplayTraceMining } from '@netgrid/ai'; process.chdir('../..'); const pairs = ['a','b','c','d'].map((id) => JSON.parse(readFileSync('docs/reviews/ai/ai-selfplay-trace-mining-' + id + '.json', 'utf8')).pair); const seeds = ['ai-v143-tuning-001','ai-v143-tuning-002','ai-v143-tuning-003','ai-v143-tuning-004','ai-v143-tuning-005']; const out = pairs.map((pair) => { const runner = benchmarkDeckFromFrozenLocalSnapshot(pair.runner); const corp = benchmarkDeckFromFrozenLocalSnapshot(pair.corp); const result = runAiSelfplayTraceMining({ seeds, runnerDeck: runner.deck, corpDeck: corp.deck, runnerDeckMetadata: runner.metadata, corpDeckMetadata: corp.metadata, maxActions: 160, maxFindings: 20 }); return { pair: pair.id, label: pair.label, aggregate: result.aggregate }; }); console.log(JSON.stringify(out, null, 2));"
```

Ergebnis nach AI068-3:

| Metric | Wert |
| --- | ---: |
| games | 20 |
| illegalActions | 0 |
| replayFailures | 0 |
| allRedactionSafe | 1 |
| criticalFindings | 0 |
| corp_never_scores_long_game | 5 |
| actionLimitReached | 11 |
| corpAgendaScores | 11 |
| runnerAgendaSteals | 29 |
| corpFlatlines | 4 |
| scoreWindowMissed | 0 |
| unsafeScoreChosen | 5 |
| passiveActionWithScoreLineAvailable | 5 |

Pair-Auszug:

| Pair | passiveActionWithScoreLineAvailable | unsafeScoreChosen | actionLimitReached |
| --- | ---: | ---: | ---: |
| A | 1 | 1 | 1 |
| B | 0 | 0 | 3 |
| C | 0 | 0 | 4 |
| D | 4 | 4 | 3 |

## Bewertung

Die echte passive Scoreline-Metrik ist nach AI068-3 eng und niedrig. Ein Teil der vorherigen D-Zählung waren `advance_card`-Aktionen unter HQ-Threat-Blocker; diese sind nicht passiv und werden nicht mehr in dieser Metrik geführt.

`actionLimitReached` bleibt bei 11. Die verbleibenden Action-Limits sind nicht mehr primär ein passives Corp-Endgame-Thema und werden in AI069 über Runner-Recovery-/No-Progress-Loops weiter angegangen.

## Verification

- `corepack pnpm --filter @netgrid/ai typecheck`: grün.
- `corepack pnpm --filter @netgrid/ai exec vitest run src/index.test.ts -t "downranks passive economy when a safe scoreline is available"`: grün.
- `corepack pnpm --filter @netgrid/ai exec vitest run src/simulation/benchmark-reports.test.ts -t "runs and formats a small selfplay trace-mining smoke"`: grün.
- `git diff --check`: grün.
- A-D-Trace-Mining-Lauf: ausgeführt, Safety grün.

## Sicherheitsgrenzen

- Keine Änderung an Engine, LegalAction-Erzeugung, `applyAction`, Replay, StateHash oder Randomness.
- Keine Hidden-Info-Erweiterung.
- Keine Karten-ID-Hardcodierung.
- Safety-Blocker verhindern die passive Abwertung, wenn ein Score-Fenster konservativ nicht sicher nutzbar ist.
