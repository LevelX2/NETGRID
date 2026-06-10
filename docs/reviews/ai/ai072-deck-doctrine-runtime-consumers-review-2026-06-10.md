# AI072 DeckDoctrine-Runtime-Consumer Review

Stand: 2026-06-10
Status: abgeschlossen im Paket `AI072`
Branch: `codex/ai068-ai072-selfplay-quality`

## Ziel

DeckDoctrine soll nach AI070/AI071 nicht global den Planner ersetzen, sondern nur konkrete, messbare Semantic-Runtime-Consumer beeinflussen: Corp-Scoreline, Runner-Remote-Contest und Runner-Access-Pressure.

## Umsetzung

- Runner-`start_run`-Aktionen erhalten ein begrenztes `deck_doctrine_runtime_weight` für:
  - `pressure_rnd` bei R&D-Runs.
  - `pressure_hq` bei HQ-Runs.
  - `contest_remote` bei Remote-Runs.
- Corp-Scoreline-Aktionen erhalten ein begrenztes `deck_doctrine_runtime_weight` für:
  - `score_now` bei `score_agenda`.
  - `score_next_turn` bei `advance_card`.
  - `build_scoring_remote` bei Scoreline-Installationen.
- Ohne eigenes, side-passendes `ownDeckDoctrine` bleibt der Runtime-Score unverändert.
- Die Debug-Komponente enthält nur Plan-Key, rohen Weight und gekürzte Archetype-Tags. Es werden keine Kartenlisten, CardInstances oder private Payloads ausgegeben.

## A-D-Messlauf

Vergleich zum Stand nach AI071:

| Metric | Nach AI071 | Nach AI072 |
| --- | ---: | ---: |
| games | 20 | 20 |
| illegalActions | 0 | 0 |
| replayFailures | 0 | 0 |
| allRedactionSafe | 1 | 1 |
| criticalFindings | 0 | 0 |
| corp_never_scores_long_game | 3 | 3 |
| actionLimitReached | 11 | 11 |
| repeated_no_progress_run | 33 | 34 |
| repeated_known_no_payoff_remote | 0 | 1 |
| recovery_low_value_loop | 88 | 99 |
| plan_step_action_mismatch | 528 | 533 |
| semantic_override_suspicious | 436 | 423 |
| corpAgendaScores | 13 | 14 |
| runnerAgendaSteals | 30 | 29 |
| corpFlatlines | 4 | 4 |
| scoreWindowMissed | 0 | 0 |
| unsafeScoreChosen | 6 | 6 |
| passiveActionWithScoreLineAvailable | 6 | 6 |

Pair-Auszug nach AI072:

| Pair | repeated_no_progress_run | recovery_low_value_loop | plan_step_action_mismatch | semantic_override_suspicious | corpAgendaScores | runnerAgendaSteals |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| A | 4 | 17 | 144 | 72 | 3 | 13 |
| B | 6 | 50 | 169 | 102 | 4 | 2 |
| C | 11 | 23 | 144 | 149 | 2 | 7 |
| D | 13 | 9 | 76 | 100 | 5 | 7 |

## Bewertung

AI072 erfüllt den gezielten Consumer-Anschluss: Doctrine wirkt sichtbar in Scoreline-, Remote-Contest- und Access-Pressure-Breakdowns, ohne Legalität, Replay oder Redaction zu verändern. Der A-D-Lauf zeigt eine kleine Spielverhaltensverschiebung: `semantic_override_suspicious` sinkt um 13 und Corp punktet einmal mehr, während `recovery_low_value_loop` um 11 und `repeated_no_progress_run` um 1 steigt.

Das ist für dieses Paket kein Blocker, weil die Safety-Gates grün bleiben und AI072 ausdrücklich nur einen begrenzten Runtime-Consumer anschließt. Der nächste KI-Qualitätsblock sollte Recovery-Loops und den einzelnen `repeated_known_no_payoff_remote`-Fund wieder als priorisierte Diagnose aufnehmen.

## Verification

- `corepack pnpm --filter @netgrid/ai exec vitest run src/index.test.ts -t "applies deck doctrine to semantic Runner access pressure|applies deck doctrine to semantic Runner remote contest|applies deck doctrine to semantic Corp scoreline actions"`: grün.
- `corepack pnpm --filter @netgrid/ai typecheck`: grün.
- `git diff --check`: grün.
- A-D-Trace-Mining-Lauf: ausgeführt, keine illegalen Actions, keine Replay-Fehler, keine Hidden-Info-Marker, keine Critical Findings.

## Sicherheitsgrenzen

- Keine Änderung an Engine, LegalAction-Erzeugung, `applyAction`, Replay, StateHash oder Randomness.
- Kein globaler Planner-Umbau und keine neue Aktionsquelle.
- Doctrine wirkt nur bei side-passendem `ownDeckDoctrine`; fehlende Doctrine bleibt neutral.
- Debug bleibt side-safe und enthält keine verdeckten Kartendaten.
