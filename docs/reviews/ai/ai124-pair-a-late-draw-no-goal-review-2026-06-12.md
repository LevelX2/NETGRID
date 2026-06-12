# AI124 Pair-A Late-Draw No-Goal Regression

Datum: 2026-06-12

Branch: `codex/ai123-ai130-x10-residual-action-limit-sweep`

## Ziel

AI124 isoliert den Pair-A-Fall `late_draw_without_coverage_or_hand_goal = 1` aus dem A-D-x10-Korpus und sichert ab, dass echte No-Goal-Draws nicht mit Coverage-Draws vermischt werden.

## Ausgangsdaten

Quelle:

- `docs/reviews/ai/ai120-residual-action-limit-a-d-10seed-2026-06-12.json`
- `docs/reviews/ai/ai123-x10-residual-cluster-inventory-2026-06-12.json`

Pair A:

- Runner: `real_scene_runner_deep_market_engine_snapshot_v1`
- Corp: `real_scene_corp_siren_fortress_snapshot_v1`

Offizielle AI120-Subcluster für Pair A:

| Subcluster | Spiele |
| --- | ---: |
| `late_draw_without_coverage_or_hand_goal` | 1 |
| `run_microstep_required` | 1 |
| `runner_late_gain_credit_real_reserve` | 1 |

## Isolierter Fall

Der konkrete Late-Draw-Kandidat ist Pair A / `ai-v143-tuning-006`.

| Merkmal | Befund |
| --- | --- |
| Final agenda points | Runner 2 / Corp 0 |
| Action-Limit | ja, 160 Actions |
| Endfenster-Dominanz aus AI123 | `continue_chain_to_access` |
| Zweiter Endfenster-Subcluster | `corp_late_gain_credit_no_safe_alternative` |
| letzte Progress-Aktion | Action 159: Corp `advance_card` auf `remote_1` |

Late-Draw-Fenster in den letzten 60 Actions:

| Action | Side | Action | Plan | Coverage-Flag | Pressure-Flag |
| ---: | --- | --- | --- | --- | --- |
| 124 | Runner | `draw_card` | `runner.obtain_breaker_coverage` | nein | nein |
| 126 | Runner | `draw_card` | `runner.obtain_breaker_coverage` | nein | nein |
| 138 | Runner | `draw_card` | `basic_economy_draw` | nein | nein |
| 153 | Runner | `draw_card` | `basic_economy_draw` | nein | nein |

Die letzten zehn Actions zeigen danach keine reine Draw-Schleife, sondern Run-Microsteps, Runner-Handentwicklung und Corp-Scoreline-Aktionen:

| Action | Side | Action | Plan |
| ---: | --- | --- | --- |
| 150 | Corp | `decline_rez` | `simple_rez` |
| 151 | Runner | `continue_run` | `simple_run_choice` |
| 152 | Runner | `continue_run` | `simple_run_choice` |
| 153 | Runner | `draw_card` | `basic_economy_draw` |
| 154 | Runner | `play_event` | `runner.develop_hand_card` |
| 155 | Runner | `end_turn` | `end_turn` |
| 156 | Corp | `mandatory_draw` | `mandatory_draw` |
| 157 | Corp | `install_card` | `basic_install` |
| 158 | Corp | `advance_card` | `corp.create_score_window` |
| 159 | Corp | `advance_card` | `corp.create_score_window` |

## Coverage-Gegenprobe

Pair A / `ai-v143-tuning-008` enthält späte Runner-Draws, die korrekt nicht als No-Goal-Draw zählen:

| Action | Side | Action | Plan | Coverage-Flag | Pressure-Flag |
| ---: | --- | --- | --- | --- | --- |
| 113 | Runner | `draw_card` | `runner.obtain_breaker_coverage` | `special` | ja |
| 121 | Runner | `draw_card` | `runner.obtain_breaker_coverage` | `special` | ja |
| 139 | Runner | `draw_card` | `runner.obtain_breaker_coverage` | `special` | ja |

Damit bleibt die Detector-Grenze fachlich sinnvoll:

- echter No-Goal-Draw ohne strukturierte Coverage-/Pressure-Facts bleibt `late_draw_without_coverage_or_hand_goal`;
- Draw mit Coverage-Lücke bleibt `late_draw_for_coverage_or_hand_goal`.

## Prüfpunkte

| Frage | Ergebnis |
| --- | --- |
| Gibt es wirklich keine Coverage-Lücke? | Für A006 im gespeicherten Endfenster: keine strukturierte `runnerSetupMissingCoverageTypes`-Coverage. |
| Gibt es ein Handziel? | Nur generisches `basic_economy_draw` beziehungsweise `runner.obtain_breaker_coverage`; kein belastbares Handziel-Fact. |
| Gibt es ein Survival-/Tag-/Damage-Ziel? | Im AI123-Endfenster kein entsprechendes strukturiertes Zielsignal. |
| Gab es eine sichere LegalAction-Alternative? | In AI123 nicht belegbar, weil Action-Alternativen dort noch nicht für diesen Finding-Typ integriert sind. |
| Folge von Basic-Setup-Pilot oder Legacy-Plan? | Reason/Plan laufen über Semantic `basic_economy_draw`; kein Legacy-Only-Befund. |

## Test

Ergänzt:

- `packages/ai/src/simulation/benchmark-reports.test.ts`
- Test: `keeps the pair A late no-goal draw regression separate from coverage draws`

Der Test sichert zwei Fälle:

- Pair-A-artiger No-Goal-Draw bleibt `late_draw_without_coverage_or_hand_goal`.
- Pair-A-artiger Coverage-Draw mit `runnerSetupMissingCoverageTypes: ["special"]` bleibt `late_draw_for_coverage_or_hand_goal`.

## Entscheidung

AI124 markiert A006 noch nicht als Runtime-Fix-Kandidat.

Begründung:

- Es gibt einen echten Detector-Fall, aber keine belegte sichere LegalAction-Alternative.
- Das Endfenster ist nicht nur Draw; nach dem Draw folgen `play_event`, Corp-Install und Corp-Advance.
- Ein pauschaler Draw-Malus wäre zu breit und würde den A008-Coverage-Gegenfall riskieren.

Möglicher Kandidat für AI128 nur dann:

- AI127 liefert für A006 oder wiederholte ähnliche Fälle side-safe Action-Alternative-Snapshots.
- Die Alternative zeigt keine Coverage-, Survival- oder Handziel-Notwendigkeit.
- Die Alternative konvertiert reproduzierbar besser, ohne `actionLimitReached`, `unsafeScoreChosen` oder `repeated_no_progress_run` zu verschlechtern.

## Verifikation

- `corepack pnpm --filter @netgrid/ai exec vitest run src/simulation/benchmark-reports.test.ts -- -t "pair A late no-goal draw"`
- `git diff --check`
