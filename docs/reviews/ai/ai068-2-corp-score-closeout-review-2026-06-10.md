# AI068-2 Corp Score-Closeout Review

Stand: 2026-06-10
Status: abgeschlossen im Paket `AI068-2`
Branch: `codex/ai068-ai072-selfplay-quality`

## Ziel

Die Corp soll vorhandene Score-/Advance-Score-Linien früher in echte Scoring-Remote-Entwicklung übersetzen. Das Paket bleibt in der KI-Auswahl- und Diagnoseebene; Engine, LegalActions und `applyAction` bleiben unverändert.

## Umsetzung

- Die semantische Corp-Action-Bewertung behandelt Remote-ICE in eine leere Remote nicht mehr pauschal als Planless-Remote-Nachteil, wenn alle folgenden Bedingungen erfüllt sind:
  - die Corp sieht in der eigenen HQ eine Agenda,
  - es gibt noch keine leere geschützte Remote-Kapazität,
  - die Corp kann die ICE-Installationskosten zahlen und behält mindestens 2 Credits.
- Die Änderung erzeugt nur einen positiven Kontext für das Vorbereiten einer geschützten Scoring-Remote.
- Nackte Agenda-Installationen bleiben weiterhin schlechter als Remote-ICE-Aufbau.
- Die Action muss weiterhin aus `input.legalActions` kommen.

## A-D-Messlauf

Kommando:

```powershell
corepack pnpm --filter @netgrid/server exec tsx -e "import { readFileSync } from 'node:fs'; import { benchmarkDeckFromFrozenLocalSnapshot, runAiSelfplayTraceMining } from '@netgrid/ai'; process.chdir('../..'); const pairs = ['a','b','c','d'].map((id) => JSON.parse(readFileSync('docs/reviews/ai/ai-selfplay-trace-mining-' + id + '.json', 'utf8')).pair); const seeds = ['ai-v143-tuning-001','ai-v143-tuning-002','ai-v143-tuning-003','ai-v143-tuning-004','ai-v143-tuning-005']; const out = pairs.map((pair) => { const runner = benchmarkDeckFromFrozenLocalSnapshot(pair.runner); const corp = benchmarkDeckFromFrozenLocalSnapshot(pair.corp); const result = runAiSelfplayTraceMining({ seeds, runnerDeck: runner.deck, corpDeck: corp.deck, runnerDeckMetadata: runner.metadata, corpDeckMetadata: corp.metadata, maxActions: 160, maxFindings: 20 }); return { pair: pair.id, label: pair.label, aggregate: result.aggregate }; }); console.log(JSON.stringify(out, null, 2));"
```

Vergleich zum Eingang A-D:

| Metric | Eingang | Nach AI068-2 |
| --- | ---: | ---: |
| games | 20 | 20 |
| illegalActions | 0 | 0 |
| replayFailures | 0 | 0 |
| allRedactionSafe | 1 | 1 |
| criticalFindings | 0 | 0 |
| corp_never_scores_long_game | 14 | 5 |
| actionLimitReached | 13 | 11 |
| corpAgendaScores | nicht erhoben | 11 |
| runnerAgendaSteals | nicht erhoben | 30 |
| corpFlatlines | nicht erhoben | 4 |
| scoreWindowMissed | nicht erhoben | 0 |
| unsafeScoreChosen | nicht erhoben | 5 |
| passiveActionWithScoreLineAvailable | nicht erhoben | 41 |

Pair-Auszug nach AI068-2:

| Pair | corp_never_scores_long_game | actionLimitReached | corpAgendaScores | runnerAgendaSteals | unsafeScoreChosen | passiveActionWithScoreLineAvailable |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| A | 1 | 1 | 2 | 13 | 1 | 19 |
| B | 1 | 3 | 3 | 3 | 0 | 8 |
| C | 3 | 4 | 1 | 9 | 0 | 1 |
| D | 0 | 3 | 5 | 5 | 4 | 13 |

## Bewertung

Das High-Finding-Ziel für `corp_never_scores_long_game` ist erreicht: 14 sinkt auf 5 und liegt damit unter dem Zielwert 7. `actionLimitReached` verbessert sich nur auf 11 und bleibt über dem Zielwert 8. Die verbleibenden Action-Limits enthalten nun mehrere Spiele mit Corp-Scores oder Corp-Flatlines und passen fachlich besser zu den Folgepaketen:

- AI068-3: `passiveActionWithScoreLineAvailable` und `unsafeScoreChosen`.
- AI069: Runner-Recovery-/No-Progress-Loops.

## Verification

- `corepack pnpm --filter @netgrid/ai typecheck`: grün.
- `corepack pnpm --filter @netgrid/ai exec vitest run src/index.test.ts -t "installs affordable remote ICE before exposing a new naked agenda"`: grün.
- A-D-Trace-Mining-Lauf: ausgeführt, Safety grün.

## Sicherheitsgrenzen

- Keine Änderung an Engine, LegalAction-Erzeugung, `applyAction`, Replay, StateHash oder Randomness.
- Keine Hidden-Info-Erweiterung; verwendet werden nur eigene HQ-Informationen der Corp und öffentliche Remote-Struktur.
- Keine Karten-ID-Hardcodierung.
- Keine Proteus-Freigabe.
