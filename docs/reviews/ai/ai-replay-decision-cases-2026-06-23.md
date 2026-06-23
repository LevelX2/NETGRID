# KI-Replay-DecisionCases

Stand: 2026-06-23

Quelle: lokale SQLite-Runtime, read-only

Cutoff: 2026-06-23T19:58:35.456Z

## Ergebnis

| Metrik | Wert |
| --- | ---: |
| DecisionCases | 1494 |
| Discovery | 1211 |
| Holdout | 283 |
| Redaction | passed |
| Runtime-Effekt | 0 |

## Seiten

| Wert | Anzahl |
| --- | ---: |
| `runner` | 1464 |
| `corp` | 30 |

## Modi

| Wert | Anzahl |
| --- | ---: |
| `human_corp_vs_runner_ai` | 1464 |
| `human_runner_vs_corp_ai` | 30 |

## Aktionstypen

| Wert | Anzahl |
| --- | ---: |
| `start_run` | 255 |
| `gain_credit` | 210 |
| `continue_run` | 201 |
| `access_card` | 189 |
| `end_turn` | 166 |
| `install_card` | 71 |
| `resolve_choice` | 66 |
| `decline_trash` | 63 |
| `draw_card` | 61 |
| `activated_card_ability` | 42 |
| `play_event` | 39 |
| `break_subroutine` | 34 |
| `trash_accessed_card` | 20 |
| `none` | 19 |
| `remove_tag` | 17 |
| `steal_agenda` | 13 |
| `trigger_ability` | 12 |
| `pump_breaker` | 10 |
| `mandatory_draw` | 4 |
| `jack_out` | 2 |

## Planarten

| Wert | Anzahl |
| --- | ---: |
| `access_trash_steal` | 285 |
| `simple_run_choice` | 210 |
| `runner.build_credit_base` | 181 |
| `end_turn` | 165 |
| `runner.obtain_breaker_coverage` | 149 |
| `runner.opportunistic_central_run` | 92 |
| `runner.contest_remote` | 71 |
| `choice_resolution` | 66 |
| `runner.develop_hand_card` | 55 |
| `encounter_survival` | 44 |
| `simple_hq_or_rnd_pressure` | 36 |
| `basic_install` | 31 |
| `none` | 19 |
| `runner.build_credit_bank` | 19 |
| `tag_removal` | 18 |
| `basic_economy_draw` | 13 |
| `remote_contest` | 7 |
| `recover_economy` | 6 |
| `runner.cash_out_credit_bank` | 5 |
| `draw_for_answers` | 4 |

## Sicherheitsgrenzen

- Die JSON-Datei enthaelt keine Roh-Trace-JSONs, keine FullState-Snapshots und keine privaten Deckdaten.
- Jeder Case enthaelt nur reproduzierbare Anker, ausgewaehlte Aktionsklasse, begrenzte sichtbarkeitsorientierte Diagnosefelder und einen Trace-Digest.
- Holdout-Cases duerfen erst nach Cluster-Auswahl und Minimalfix fuer Nebenwirkungspruefung genutzt werden.

## Verifikation

- `corepack pnpm --filter @netgrid/ai typecheck`
- `corepack pnpm --filter @netgrid/ai exec vitest run src/evaluation/replay-decision-case-extraction.test.ts --maxWorkers=1 --testTimeout=30000`
