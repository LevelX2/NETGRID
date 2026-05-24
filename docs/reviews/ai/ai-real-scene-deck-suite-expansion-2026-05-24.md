# AI Real-Scene Deck-Suite Expansion 2026-05-24

## Kurzfazit

Die Match-Progression-Deck-Suite hat jetzt zwei vollständige `real_scene_holdout`-Slots. Beide Paare sind als frozen Repo-Snapshots materialisiert, AI-runnable validiert und laufen ohne AppData- oder Demo-Fallback. Sie bleiben `holdout_only`.

Der erste 160er Full-Suite-Lauf zeigt: Safety bleibt für `belief_ai_v1_4_2` und `current_candidate` sauber. Die neuen Paare erhöhen aber die Stagnationsdiagnose: Real Scene Pair 1 bleibt bei beiden Profilen bei `ActionLimitRate = 0.556`; Real Scene Pair 2 ist hart und bleibt bei `current_candidate = 0.889` bzw. Baseline `1.000`.

## Gewählte Deckpaare

| Slot                | Runner                    | Runner-Rolle                             | Corp                    | Corp-Rolle                               | Auswahlgrund                                                                                |
| ------------------- | ------------------------- | ---------------------------------------- | ----------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------- |
| `real_scene_pair_1` | Deep Market Engine        | `real_scene_runner_rig_economy_pressure` | Siren Fortress          | `real_scene_corp_glacier_remote_scoring` | Rig-/Economy-/Pressure-Runner gegen Glacier-Fort; andere Belastung als Local Pair 1/2.      |
| `real_scene_pair_2` | Stealth Interface Starter | `real_scene_runner_rnd_multiaccess`      | Manhunt Pressure Bureau | `real_scene_corp_tag_punish`             | Stealth-/Interface-/Multiaccess-Runner gegen Tag-/Punish-Corp; anderer Drucktyp als Pair 1. |

## Quellen und Snapshots

Quelle war der lokale Deck-Editor-Export unter `%APPDATA%/NetGrid/Decks` als Importquelle. Die Suite liest zur Laufzeit ausschließlich die versionierten Snapshots im Repo:

- `data/ai/ai-real-scene-benchmark-deck-snapshots-2026-05-24.json`
- `data/ai/ai-real-scene-benchmark-decks-2026-05-24.json`

| Snapshot                                                  | Source deck                              | Source file                                   | Hash             | Karten | Agenda Points |
| --------------------------------------------------------- | ---------------------------------------- | --------------------------------------------- | ---------------- | -----: | ------------: |
| `real_scene_runner_deep_market_engine_snapshot_v1`        | `local_runner_deep_market_engine`        | `local_runner_deep_market_engine.json`        | `fnv1a:b409555d` |     43 |           n/a |
| `real_scene_corp_siren_fortress_snapshot_v1`              | `local_corp_siren_fortress`              | `local_corp_siren_fortress.json`              | `fnv1a:c10cdf3d` |     45 |            25 |
| `real_scene_runner_stealth_interface_starter_snapshot_v1` | `local_runner_stealth_interface_starter` | `local_runner_stealth_interface_starter.json` | `fnv1a:c0db223e` |     43 |           n/a |
| `real_scene_corp_manhunt_pressure_bureau_snapshot_v1`     | `local_corp_manhunt_pressure_bureau`     | `local_corp_manhunt_pressure_bureau.json`     | `fnv1a:6e07aa9b` |     43 |             9 |

## Validierung

Alle vier Decks wurden über den bestehenden AI-Benchmark-Adapter gegen Runtime-Katalog, Formatprofil und AI-Support validiert.

| Deck                      | Missing Cards | Unsupported Cards | Non-Deck-Legal Cards | Ambiguous Names | Status   |
| ------------------------- | ------------: | ----------------: | -------------------: | --------------: | -------- |
| Deep Market Engine        |             0 |                 0 |                    0 |               0 | runnable |
| Siren Fortress            |             0 |                 0 |                    0 |               0 | runnable |
| Stealth Interface Starter |             0 |                 0 |                    0 |               0 | runnable |
| Manhunt Pressure Bureau   |             0 |                 0 |                    0 |               0 | runnable |

## Slotstatus

| Slot                                          | Type                      | Status   | Use                | Runner                                                    | Corp                                                  |
| --------------------------------------------- | ------------------------- | -------- | ------------------ | --------------------------------------------------------- | ----------------------------------------------------- |
| `safety_smoke_demo_008`                       | `smoke`                   | runnable | safety_regression  | `demo_runner_008`                                         | `demo_corp_008`                                       |
| `progression_tuning_origin_rig_vs_tax`        | `snapshot_tuning`         | runnable | progression_tuning | `onr_origin_runner_ai_snapshot_v1`                        | `onr_origin_corp_ai_snapshot_v1`                      |
| `progression_tuning_origin_pressure_vs_tax`   | `snapshot_tuning`         | runnable | progression_tuning | `onr_origin_runner_ai_event_pressure_snapshot_v1`         | `onr_origin_corp_ai_snapshot_v1`                      |
| `snapshot_holdout_origin_pressure_vs_tag_ops` | `snapshot_holdout`        | runnable | holdout_only       | `onr_origin_runner_ai_event_pressure_snapshot_v1`         | `onr_origin_corp_ai_tag_ops_snapshot_v1`              |
| `local_realistic_pair_1`                      | `local_realistic_holdout` | runnable | holdout_only       | `local_realistic_runner_blink_pressure_rig_snapshot_v1`   | `local_realistic_corp_ivory_bastion_snapshot_v1`      |
| `local_realistic_pair_2`                      | `local_realistic_holdout` | runnable | holdout_only       | `local_realistic_runner_rnd_interface_dig_snapshot_v1`    | `local_realistic_corp_shadoe_tag_bag_snapshot_v1`     |
| `real_scene_pair_1`                           | `real_scene_holdout`      | runnable | holdout_only       | `real_scene_runner_deep_market_engine_snapshot_v1`        | `real_scene_corp_siren_fortress_snapshot_v1`          |
| `real_scene_pair_2`                           | `real_scene_holdout`      | runnable | holdout_only       | `real_scene_runner_stealth_interface_starter_snapshot_v1` | `real_scene_corp_manhunt_pressure_bureau_snapshot_v1` |

## Benchmark-Konfiguration

- Funktion: `runMatchProgressionBenchmarkSuite`
- Profile: `basic_corp_ai`, `basic_runner_ai`, `belief_ai_v1_4_2`, `current_candidate`
- Seeds: 9 (`ai-v143-tuning-001` bis `006`, `ai-v143-holdout-001` bis `003`)
- `maxActions`: 160
- Real-Scene-Harness: temporäre Vitest-Datei, nach Lauf gelöscht

## Candidate vs Baseline

| Slot              | ActionLimit B/C | Runner Steals B/C | Corp Scores B/C | Score/Steal B/C | Longest NoProgress B/C | Same Plan Repeat B/C |
| ----------------- | --------------: | ----------------: | --------------: | --------------: | ---------------------: | -------------------: |
| Smoke             |   0.889 / 0.778 |           18 / 14 |          7 / 10 |   2.778 / 2.667 |                32 / 32 |              67 / 53 |
| Snapshot Rig      |   0.333 / 0.333 |           25 / 26 |         15 / 13 |   4.444 / 4.333 |                34 / 17 |              56 / 48 |
| Snapshot Pressure |   0.333 / 0.111 |           27 / 28 |          12 / 9 |   4.333 / 4.111 |                39 / 21 |              53 / 46 |
| Snapshot Holdout  |   0.222 / 0.444 |           31 / 29 |           3 / 3 |   3.778 / 3.556 |                21 / 25 |              66 / 75 |
| Local Pair 1      |   0.111 / 0.222 |           12 / 11 |           4 / 4 |   1.778 / 1.667 |                30 / 29 |              53 / 50 |
| Local Pair 2      |   0.556 / 0.444 |           21 / 24 |           8 / 7 |   3.222 / 3.444 |                24 / 24 |            111 / 101 |
| Real Scene Pair 1 |   0.556 / 0.556 |           16 / 17 |           6 / 7 |   2.444 / 2.667 |                13 / 11 |              44 / 53 |
| Real Scene Pair 2 |   1.000 / 0.889 |             8 / 8 |           7 / 8 |   1.667 / 1.778 |                15 / 14 |            137 / 122 |

## Neue Real-Scene-Slots

| Slot              | Profile             | ActionLimit | Runner Steals | Corp Scores | Score/Steal | Remote Advances | Remote Trash | Central Runs | HQ Runs | R&D Runs | Central Steals/Run | Illegal | Replay | Timeout |
| ----------------- | ------------------- | ----------: | ------------: | ----------: | ----------: | --------------: | -----------: | -----------: | ------: | -------: | -----------------: | ------: | -----: | ------: |
| Real Scene Pair 1 | `belief_ai_v1_4_2`  |       0.556 |            16 |           6 |       2.444 |              49 |            6 |           82 |      57 |       25 |              0.061 |       0 |      0 |       0 |
| Real Scene Pair 1 | `current_candidate` |       0.556 |            17 |           7 |       2.667 |              49 |            7 |           75 |      46 |       29 |              0.107 |       0 |      0 |       0 |
| Real Scene Pair 2 | `belief_ai_v1_4_2`  |       1.000 |             8 |           7 |       1.667 |              19 |            0 |           93 |      43 |       49 |              0.054 |       0 |      0 |       0 |
| Real Scene Pair 2 | `current_candidate` |       0.889 |             8 |           8 |       1.778 |              22 |            1 |           93 |      48 |       44 |              0.075 |       0 |      0 |       0 |

## Bewertung

- Pair 1 ist ein plausibler Glacier-/Rig-Holdout: Candidate erzielt leicht mehr Steals/Scores und bessere Central-Steal-Effizienz, senkt aber `sameStrategicPlanRepeatedWithoutProgress` nicht.
- Pair 2 ist ein harter Tag-/Punish-Holdout: Candidate verbessert ActionLimit leicht und Corp Scores, bleibt aber stark limitgefährdet.
- Die neuen Slots bestätigen den bisherigen Befund: `current_candidate` ist erklärbarer und safety-stabil, aber nicht klar genug, um `belief_ai_v1_4_2` als Default zu ersetzen.

## Risiken und Limitierungen

- Die Decks stammen aus lokal gespeicherten Constructed-/Scene-Listen und sind als Repo-Snapshots frozen; sie sind kein Live-AppData-Pfad.
- Die Auswahl ist bewusst holdout-only. Kein Tuning gegen diese Paare.
- Real Scene Pair 2 hat nur 9 Agenda Points in 43 Corp-Karten; das ist validiert, aber als hoher ActionLimit-Druck zu interpretieren.
- Die neuen Slots erhöhen Suite-Laufzeit spürbar: der temporäre 8-Slot-Full-Suite-Lauf dauerte lokal ca. 205 Sekunden.

## Empfehlung

Die Real-Scene-Paare bleiben `holdout_only`. Sie sollten als zusätzliche Diagnose- und Release-Review-Gates genutzt werden, nicht als direkte Optimierungsziele. Der nächste KI-Block sollte weiterhin auf Strategic-Line-Variance oder Macro-Commitment zielen, nicht auf deckpaar-spezifische Heuristiken.
