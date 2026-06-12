# AI108 Alternate Deck Benchmark Comparison

Datum: 2026-06-12

## Ziel

AI108 prüft, wie stark der finale AI107-Befund vom festen A-D-x5-Setup abhängt. Der Lauf ist ein Vergleichsbenchmark und Regressionstest für Safety-Metriken, aber kein allgemeiner KI-Spielstärke-Nachweis und kein Runtime-Tuning-Block.

Referenz:

- `docs/reviews/ai/ai107-final-a-d-5seed-2026-06-12.json`
- `docs/reviews/ai/ai107-final-full-sweep-review-2026-06-12.md`
- `docs/reviews/ai/ai106-action-limit-target-decision-2026-06-12.md`

Neue Artefakte:

- Pair-Set: `docs/reviews/ai/ai108-alternate-deck-pairs-2026-06-12.json`
- Ergebnis-JSON: `docs/reviews/ai/ai108-alternate-deck-benchmark-comparison-2026-06-12.json`

## Setup

- Spiele: 20
- Pair IDs: E-H
- Seeds: `ai-v143-tuning-001` bis `ai-v143-tuning-005`
- `maxActions`: 160
- Runner/Korp-Modus: `current_candidate`
- Trace-Runner: `scripts/run-ai-selfplay-trace-matrix.ts`
- Zweck: deterministischer Vergleich gegen AI107 A-D-x5 mit gleichem Seed- und Action-Limit-Rahmen

Gewählte Pairings:

| Pair | Rolle | Runner | Korp |
| --- | --- | --- | --- |
| E | aggressives Runner-vs-Korp-Pressure-Paar | Event Pressure | Tag Ops Control |
| F | economy-/setup-lastiges Starter-Paar | Starter Pressure | Starter Score Grid |
| G | ICE-/Breaker-Coverage-Paar | Stealth Interface Starter | Ivory Bastion |
| H | Korp-Scoring-/Remote-Pressure-Paar | Blink Pressure Rig | Siren Fortress |

Die Auswahl nutzt vorhandene frozen Snapshots und erzeugt keine neuen Deckdaten. Das JSON enthält nur Snapshot-IDs, Hashes, Summaries und redigierte Debug-Facts, keine vollständigen verdeckten Decklisten.

## AI107 vs AI108

| Metrik | AI107 A-D-x5 | AI108 E-H-x5 | Bewertung |
| --- | ---: | ---: | --- |
| Spiele | 20 | 20 | gleicher Umfang |
| `maxActions` | 160 | 160 | gleicher Grenzwert |
| `illegalActions` | 0 | 0 | stabil |
| `replayFailures` | 0 | 0 | stabil |
| `redactionSafe` | true | true | stabil |
| `actionLimitReached` | 9 | 14 | kippt stark |
| `mixed_unknown` | 0 | 0 | stabil |
| `continue_without_progress` | 0 | 2 | neuer Restcluster |
| `unsafeScoreChosen` | 3 | 1 | niedriger |
| `passiveActionWithScoreLineAvailable` | 4 | 2 | niedriger |
| `corpAgendaScores` | 12 | 28 | stark höher |
| `runnerAgendaSteals` | 33 | 22 | niedriger |
| `corpFlatlines` | 5 | 1 | niedriger |
| durchschnittliche Spiellänge | 124.9 | 156.55 | deutlich länger |

## AI108 Pair-Ergebnisse

| Pair | `actionLimitReached` | `illegalActions` | `replayFailures` | `redactionSafe` | Korp-Scores | Runner-Steals | Korp-Flatlines |
| --- | ---: | ---: | ---: | --- | ---: | ---: | ---: |
| E | 2/5 | 0 | 0 | true | 12 | 5 | 0 |
| F | 5/5 | 0 | 0 | true | 8 | 2 | 0 |
| G | 4/5 | 0 | 0 | true | 6 | 4 | 1 |
| H | 3/5 | 0 | 0 | true | 2 | 11 | 0 |
| Gesamt | 14/20 | 0 | 0 | true | 28 | 22 | 1 |

## Action-Limit-Subcluster

| Subcluster | AI107 | AI108 | Bewertung |
| --- | ---: | ---: | --- |
| `runner_late_gain_credit_real_reserve` | 4 | 5 | stabil bis leicht höher |
| `corp_late_gain_credit_real_rez_or_protection_reserve` | 1 | 0 | verschwindet |
| `corp_late_gain_credit_no_safe_alternative` | 1 | 0 | verschwindet |
| `late_draw_without_coverage_or_hand_goal` | 1 | 0 | verschwindet |
| `run_microstep_required` | 1 | 1 | stabil |
| `break_pump_required` | 1 | 0 | verschwindet |
| `runner_late_gain_credit_without_funding_need` | 0 | 1 | neu |
| `continue_chain_to_access` | 0 | 2 | neu |
| `continue_without_progress` | 0 | 2 | neu |
| `access_pending` | 0 | 3 | neu |
| `mixed_unknown` | 0 | 0 | stabil |

AI108 verschiebt die Restlast weg von Korp-Reserve- und Late-Draw-Fällen hin zu längeren Access-/Continue-Endfenstern und Runner-Reserve-/Low-Value-Endlagen. Pair F ist besonders relevant: Das Starter-Paar erreicht in allen fünf Seeds das Action-Limit und trägt drei `access_pending`-Fälle.

## Setupabhängigkeit

Stabil bleiben die harten Regression-Gates: `illegalActions = 0`, `replayFailures = 0`, `redactionSafe = true`, `mixed_unknown = 0` und `scoreWindowMissed = 0`. Das spricht dafür, dass die Safety- und Determinismus-Verträge nicht am A-D-Setup hängen.

Stark setupabhängig sind Progression und Endfensterqualität. `actionLimitReached` steigt von 9/20 auf 14/20, die durchschnittliche Spiellänge steigt auf 156.55 Aktionen, und drei von vier neuen Pairs laufen in mindestens drei Seeds ins Limit. Gleichzeitig steigen Korp-Scores stark von 12 auf 28, während Runner-Steals und Flatlines sinken. Das ist kein linearer Spielstärke-Befund, sondern zeigt, dass unterschiedliche Deckprofile andere Endfenster erzeugen.

Neue Restcluster sind `continue_without_progress`, `continue_chain_to_access`, `access_pending` und einmal `runner_late_gain_credit_without_funding_need`. Diese Cluster waren im finalen AI107-Zielwert nicht mehr sichtbar und müssen getrennt betrachtet werden, bevor ein breiteres Action-Limit-Gate behauptet wird.

## Gate-Bewertung

`actionLimitReached <= 9` ist nach AI108 für A-D-x5 plausibel, aber nicht als breiteres Gate tragfähig. Für den neuen E-H-x5-Korpus liegt der Wert bei 14/20. Der Zielwert darf daher aktuell nur als korpusgebundener A-D-Regressionswert gelesen werden.

Breiter tragfähig bleiben dagegen die harten Safety-Gates:

- `illegalActions = 0`
- `replayFailures = 0`
- `redactionSafe = true`
- `mixed_unknown = 0`

Für ein breiteres KI-Progression-Gate braucht es entweder einen repräsentativeren Multi-Pair-Baselinewert oder getrennte Grenzwerte pro Pair-Familie. AI108 liefert dafür den ersten Gegenkorpus, aber noch keine Tuning-Freigabe.

## Verifikation

Ausgeführt:

- `corepack pnpm --filter @netgrid/ai typecheck`
- `corepack pnpm tsx scripts/run-ai-selfplay-trace-matrix.ts --no-default-pairs --pair-file docs/reviews/ai/ai108-alternate-deck-pairs-2026-06-12.json --out docs/reviews/ai/ai108-alternate-deck-benchmark-comparison-2026-06-12.json --seeds ai-v143-tuning-001,ai-v143-tuning-002,ai-v143-tuning-003,ai-v143-tuning-004,ai-v143-tuning-005 --max-actions 160`
- `git diff --check`

Codeänderung:

- `scripts/run-ai-selfplay-trace-matrix.ts` kann zusätzlich explizite `--pair-file`-Dateien und `--no-default-pairs` lesen. Das war nötig, um denselben Metrikstil ohne A-D-Beimischung auf alternative Pair-Sets anzuwenden.
- Keine Runtime-Tuning-Änderung, keine Änderung an Rules Engine, LegalActions, Replay, StateHash, Randomness oder Redaction-Verträgen.
