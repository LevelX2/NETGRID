# KI-Replay-Decision-Repro

Stand: 2026-06-23  
Paket: `REPLAY-AI-3`

## Ergebnis

Der Top-Kandidatencluster aus `REPLAY-AI-2` ist auf einem echten lokalen Same-State-Snapshot reproduzierbar genug, um einen minimalen Fix zu rechtfertigen.

Ausgewählter Cluster:

| Feld | Wert |
| --- | --- |
| Cluster | `replay-cluster-12029aa33f19` |
| Cluster-Key | `runner|draw_card|runner.obtain_breaker_coverage|to|start_run|simple_hq_or_rnd_pressure` |
| Kandidaten | 15 |
| Fehlerklassen | `missed_safe_access`, `plan_step_mismatch` |

## Same-State-Probe

Probe-Case:

| Feld | Wert |
| --- | --- |
| Case | `replay-case-509c7f2d5d6a49c2` |
| Match | `match_fd1266b1e2949d3a` |
| StateVersion | 13 |
| DecisionIndex | 5 |
| Historische Aktion | `draw_card` |
| Historischer Plan | `runner.obtain_breaker_coverage` |
| Bester redigierter Challenger | `start_run` |
| Challenger-Plan | `simple_hq_or_rnd_pressure` |
| Score-Gap im Case | 1780 |

Die Same-State-Probe wurde lokal aus `state_snapshots.game_state_json` gelesen, dann wurden mit aktueller Engine `getPlayerView(state, "runner")` und `getLegalActions(state, "runner")` erzeugt. Die KI erhielt nur diese sichtbare PlayerView plus LegalActions.

Vor dem Fix entschied der aktuelle Stand im selben State nicht mehr `draw_card`, aber weiterhin gegen den besten Run:

| Rang | Aktion | Raw Semantic Score | Final Plan Score | Ursache |
| ---: | --- | ---: | ---: | --- |
| 1 | `gain_credit` | 7025 | 7275 | Coverage-Plan-Mapping +250 |
| 2 | `start_run` auf `rd` | 7645 | 7225 | Coverage-Plan-Mismatch -420 |
| 3 | `start_run` auf `hq` | 5955 | 5955 | niedrigerer Raw Score |
| 4 | `draw_card` | 5475 | 5475 | niedrigerer Raw Score |

Damit ist der gespeicherte `draw_card`-Fehler durch spätere Änderungen teilweise verbessert, aber der Kernfehler bleibt: `runner.obtain_breaker_coverage` darf eine deutlich bessere legale Run-Entscheidung noch immer überstimmen.

## Früheste Ursache

Die früheste vermeidbare Ursache liegt in `packages/ai/src/runtime/semantic-choice-ranking.ts`:

- `tacticalPlanMappedChoice` berechnet den Score-Gap zwischen bestem Semantic-Choice und gemappter Planaktion.
- `runner.obtain_breaker_coverage` blockiert `start_run`-Overrides aber vor der Score-Gap-Freigabe, wenn der Run nicht Teil der Coverage-Mapping-Aktionen ist.
- Dadurch kann eine Coverage-Aktion mit niedrigerem Raw Score durch Plan-Boost und Run-Mismatch-Penalty gewinnen.

## Fix-Ziel für `REPLAY-AI-4`

Minimaler Fix:

- Coverage-Plan-Mapping darf `start_run` nur bei engem Score-Abstand blockieren.
- Bei einem klaren Semantic-Gap oberhalb des vorhandenen `PLAN_MAPPED_CHOICE_MAX_SCORE_GAP` muss der bessere legale Run übernehmen dürfen.
- Keine Änderung an Engine, LegalActions, `applyAction`, Replay, StateHash, Randomness oder Hidden-Info-Grenzen.

## Kontrollen

Geplante Regressionen:

- Unit-Test für `tacticalPlanMappedChoice`: Coverage-Mapping mit `gain_credit` muss bei Score-Gap 620 einem `start_run` weichen.
- Gegenkontrolle: Bei engem Score-Gap bleibt Coverage-Mapping erhalten.
- End-to-End-Cutover-Kontrolle: Die sichtbare Run-Pfad-Clusterform bleibt auf `start_run`.

