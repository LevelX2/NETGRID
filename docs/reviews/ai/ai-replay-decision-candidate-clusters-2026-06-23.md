# KI-Replay-Kandidatencluster

Stand: 2026-06-23

## Ergebnis

| Metrik | Wert |
| --- | ---: |
| Source-Cases | 1494 |
| Discovery-Cases | 1211 |
| Holdout ignoriert | 283 |
| Kandidaten fuer Same-State-Repro | 59 |
| Blockiert als Shadow-only/zu schwach | 88 |
| Blockiert wegen Trace-Qualitaet | 17 |
| Cluster | 15 |

Ausgewaehlter Repro-Cluster: `replay-cluster-12029aa33f19`

## Top-Cluster

| Cluster | Kandidaten | Gewaehlte Aktion | Challenger | Ø Score-Gap | Fehlerklassen |
| --- | ---: | --- | --- | ---: | --- |
| `replay-cluster-12029aa33f19` | 15 | `draw_card` | `start_run` | 2092 | `missed_safe_access`, `plan_step_mismatch` |
| `replay-cluster-9b938adb91c3` | 8 | `gain_credit` | `start_run` | 1153.75 | `economy_starvation`, `missed_safe_access`, `plan_step_mismatch` |
| `replay-cluster-b46b53b498d9` | 6 | `draw_card` | `start_run` | 2800 | `missed_safe_access`, `plan_step_mismatch` |
| `replay-cluster-4ac432417a97` | 5 | `gain_credit` | `start_run` | 1857 | `economy_starvation`, `missed_safe_access`, `plan_step_mismatch` |
| `replay-cluster-2cc3039993ea` | 5 | `gain_credit` | `start_run` | 1240 | `economy_starvation`, `missed_safe_access`, `plan_step_mismatch` |
| `replay-cluster-beabf228d291` | 4 | `activated_card_ability` | `start_run` | 1285 | `missed_safe_access`, `plan_step_mismatch` |
| `replay-cluster-37cfc596e3c0` | 3 | `play_event` | `start_run` | 1566.667 | `missed_safe_access`, `plan_step_mismatch` |
| `replay-cluster-3652e1f3b6bf` | 3 | `play_event` | `start_run` | 1283.333 | `missed_safe_access`, `plan_step_mismatch` |
| `replay-cluster-ffc4cfda711d` | 3 | `install_card` | `start_run` | 1248.333 | `missed_safe_access`, `plan_step_mismatch` |
| `replay-cluster-204a9b90f467` | 2 | `draw_card` | `install_card` | 1725 | `plan_step_mismatch` |
| `replay-cluster-3eab1b924b04` | 1 | `trigger_ability` | `start_run` | 1795 | `missed_safe_access`, `plan_step_mismatch` |
| `replay-cluster-8ed9c7f43529` | 1 | `gain_credit` | `start_run` | 1670 | `economy_starvation`, `missed_safe_access`, `plan_step_mismatch` |
| `replay-cluster-5e98013b089c` | 1 | `draw_card` | `start_run` | 1620 | `missed_safe_access`, `plan_step_mismatch` |
| `replay-cluster-9a603e62b4c9` | 1 | `trigger_ability` | `start_run` | 1425 | `missed_safe_access`, `plan_step_mismatch` |
| `replay-cluster-69655cd4f544` | 1 | `install_card` | `start_run` | 1185 | `missed_safe_access`, `plan_step_mismatch` |

## Adjudikation

Die Cluster sind bewusst noch nicht als behobene oder bestaetigte KI-Fehler markiert. Die Einstufung lautet `candidate_cluster_needs_repro`, weil eine Semantic-/Debug-Rangliste allein nicht beweist, dass die historische Entscheidung aus legaler Same-State-Sicht falsch war. Das naechste Paket muss fuer den ausgewaehlten Cluster mindestens einen Same-State-Repro und Gegenkontrollen liefern.

## Artefakthygiene

Der urspruenglich versionierte vollstaendige Cluster-JSON-Export wurde aus dem aktuellen Repository-Baum entfernt. Die versionierte Ersatzquelle ist `ai-replay-decision-safe-summary-2026-06-23.json`; neue vollstaendige Exports werden nur noch explizit unter `data/local/ai-replay/<run-id>` erzeugt.

## Verifikation

- `corepack pnpm --filter @netgrid/ai exec vitest run src/evaluation/replay-decision-case-clustering.test.ts --maxWorkers=1 --testTimeout=30000`
- `corepack pnpm --filter @netgrid/ai typecheck`
