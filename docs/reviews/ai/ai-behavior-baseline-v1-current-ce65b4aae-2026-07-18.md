# AI Behavior Baseline v1

Status: attention_required
Git head: ce65b4aae
Generated: 2026-07-18T10:31:02.092Z

## Contract

- Slots: progression_tuning_origin_rig_vs_tax, progression_tuning_origin_pressure_vs_tax, snapshot_holdout_origin_pressure_vs_tag_ops, strategy_panel_fast_advance_chrome_rush, strategy_panel_net_damage_black_ice, strategy_panel_hybrid_score_punish_cheap_bag
- Seeds: ai-behavior-baseline-v1-01, ai-behavior-baseline-v1-02, ai-behavior-baseline-v1-03, ai-behavior-baseline-v1-04, ai-behavior-baseline-v1-05, ai-behavior-baseline-v1-06, ai-behavior-baseline-v1-07, ai-behavior-baseline-v1-08, ai-behavior-baseline-v1-09, ai-behavior-baseline-v1-10
- Games: 60
- Max actions: 480
- Controllers: Runner and Corp both current_candidate.
- This report is diagnostic-only. Hard technical failures are automatic gates; behavioural deltas remain review evidence until thresholds are calibrated from repeated runs.

## Hard gates

Accepted: no
Hard failures: action_limit_games:3

| Metric | Value |
| --- | ---: |
| illegalActions | 0 |
| replayFailures | 0 |
| actionLimitGames | 3 |
| fallbackActions | 0 |
| timeoutActions | 0 |
| runtimeErrors | 0 |
| hiddenInfoFindings | 0 |
| noLegalActionFailures | 0 |
| redactionSafe | yes |

## Behavioural metrics

| Metric | Value |
| --- | ---: |
| Missed score window rate | 0.000 |
| Advanced remote contest skip rate | 0.888 |
| Plan conversion rate | 0.730 |
| Strategic no-progress repeats / 100 decisions | 2.566 |
| Clearly dominated plan choices / 100 decisions | 0 |
| Trace findings / 100 decisions | 7.202 |

## Deck slots

| Slot | Runner | Corp | Games | Decisions | Missed score rate | Remote contest skip rate | Plan conversion rate | No-progress / 100 | Dominated / 100 | Limits |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| progression_tuning_origin_rig_vs_tax | rig_economy_pressure | remote_scoring | 10 | 1520 | 0.000 | 0.867 | 0.858 | 0.987 | 0 | 0 |
| progression_tuning_origin_pressure_vs_tax | event_pressure | remote_scoring | 10 | 1550 | 0.000 | 0.850 | 0.872 | 0.452 | 0 | 0 |
| snapshot_holdout_origin_pressure_vs_tag_ops | event_pressure | tag_punish | 10 | 1402 | 0.000 | 0.833 | 0.833 | 1.07 | 0 | 0 |
| strategy_panel_fast_advance_chrome_rush | rig_economy_pressure | fast_advance | 10 | 2819 | 0.000 | 0.667 | 0.610 | 4.576 | 0 | 0 |
| strategy_panel_net_damage_black_ice | central_multiaccess | net_damage | 10 | 2856 | 0.000 | 0.949 | 0.732 | 2.871 | 0 | 2 |
| strategy_panel_hybrid_score_punish_cheap_bag | rig_economy_pressure | hybrid_score_punish | 10 | 2753 | 0.000 | 0.892 | 0.632 | 3.015 | 0 | 1 |

## Outcome context

- Runner agenda points: 176
- Corp agenda points: 151
- Runner steals: 88
- Corp scores: 104
- Score or steal actions: 192
- Average actions: 215
- Average turns: 28.717

## Comparison

Comparable: yes
Baseline git head: 4a9e347f4
Candidate git head: ce65b4aae
Incompatibilities: none

| Metric | Candidate minus baseline |
| --- | ---: |
| missedScoreWindowRate | 0 |
| advancedRemoteContestSkipRate | +0.011 |
| planConversionRate | -0.057 |
| strategicNoProgressRatePer100Decisions | +0.323 |
| clearlyDominatedPlanChoiceRatePer100Decisions | 0 |
| findingRatePer100Decisions | +3.227 |
| averageActions | +29.267 |

## Metric interpretation

- Missed score windows are direct Corp conversion misses.
- Remote contest skips are normalised by detected affordable advanced-remote opportunities and remain a diagnostic signal, not a standalone failure.
- Plan conversion uses plans settled by conversion, expiry, or abandonment; no-progress and dominated-choice rates are independent review signals.
- Win rate is deliberately outcome context rather than the acceptance criterion.

## Review-Urteil

Der commit-reine Standardlauf auf `ce65b4aae707` bestätigt den bereits im
Kandidaten `637c62a09` sichtbaren Fehler in `runner.survival_defense`. Der
Fehler ist in Net-Damage-Seed 09 nicht abgeschwächt, sondern ausgeprägter:

| Stand | Ergebnis C-09 | Züge | Runner : Korp | Survival-Credits | höchste Credits |
| --- | --- | ---: | ---: | ---: | ---: |
| Referenz `4a9e347f4` | Korp per Flatline | 49 | 4 : 2 | keine terminale Schleife | 13 |
| Kandidat `637c62a09` | Action-Limit | 58 | 4 : 0 | 14 | 20 |
| Aktuell `ce65b4aae` | Action-Limit | 64 | 0 : 0 | 30 | 34 |

Die drei aktuellen Action-Limit-Spiele sind:

| Slot | Seed | Ergebnis |
| --- | --- | --- |
| Net Damage | `ai-behavior-baseline-v1-07` | 480 Aktionen, 63 Züge, Runner 2 : Korp 5 |
| Net Damage | `ai-behavior-baseline-v1-09` | 480 Aktionen, 64 Züge, Runner 0 : Korp 0 |
| Hybrid Score/Punish | `ai-behavior-baseline-v1-05` | 480 Aktionen, 52 Züge, Runner 6 : Korp 2 |

C-09 wurde zusätzlich als isolierter Ein-Seed-Lauf im detached Worktree auf
demselben Commit reproduziert. Ergebnis, StateHash
`fnv1a:f6563115`, Aktionszahl und Zugzahl stimmen mit dem Standardpanel
überein. Replay und Redaction bleiben fehlerfrei.

## C-09 Trace-Befund

- Ab State 403 wählt der Runner mit einer Handkarte und 14 Credits erneut
  `runner.survival_defense` und nimmt zwei Credits. Nach einem automatischen
  Creditabfluss beginnt die dauerhafte Schleife in State 412 bei 6 Credits.
- Von State 412 bis State 478 werden 28 weitere Basic Credits unter
  `runner.survival_defense` genommen. Die Hand bleibt unverändert bei einer
  Karte; die Credits steigen bis 34.
- In diesen Fenstern stehen 13 bis 14 LegalActions und 12 bis 13
  actionable Alternativen zur Verfügung. Der Runner ist nicht durch die
  Engine zur Credit-Aktion gezwungen.
- Der Trace meldet durchgehend `legal_hand_size_actions:0`,
  `legal_recovery_actions:0`, `legal_search_actions:0`,
  `known_unaffordable_path:false` und ein Reserve-Ziel von 4 Credits.
- Ab 10 Credits bewertet die Semantik den Basic Credit mit `-1121`.
  Positive Alternativen erreichen bis zu `2362`; trotzdem blockiert der
  `runner_plan_controller` sie mit Schwelle `Infinity`.
- Jeder Basic Credit wird weiter als gemappter Survival-Schritt mit
  Memory-Status `progressing` und erneuerter TTL behandelt. Ein beobachtbarer
  Survival-Fortschritt wird nicht verlangt.
- Die Diagnostik markiert den Credit zusätzlich als erfüllte
  Coverage-Reparatur. Die vorhandenen Detektoren
  `repeatable_action_no_progress_loop` und `recovery_low_value_loop` melden
  die Schleife nicht.

Der Fehler ist nicht auf C-09 beschränkt. Im selben Standardlauf treten
vergleichbare Survival-Credit-Folgen außerdem auf:

| Slot / Seed | Survival-Credits | Creditspanne | Spielende |
| --- | ---: | ---: | --- |
| Net Damage / 08 | 45 | 12 bis 57 | regulärer Runner-Sieg |
| Hybrid Score/Punish / 04 | 17 | 14 bis 29 | regulärer Korp-Sieg |
| Hybrid Score/Punish / 07 | 74 | 6 bis 80 | regulärer Runner-Sieg |

Ein reguläres Spielende widerlegt den Fehler daher nicht. Das Action-Limit ist
nur die gröbste sichtbare Folge; die Plan- und Aktionsqualität ist bereits
vorher defekt.

## Technische Ursache

1. `runnerHandBufferPlans` betrachtet bereits jede vorhandene
   `gain_credit`-Aktion als mögliche Survival-Aktion und führt
   `economy.gain_credit` ohne Funding-Bedingung in den gewünschten Semantiken.
2. `survivalAnswerStepMatchesAction` akzeptiert jeden positiven Creditgewinn
   als Treffer für `find_survival_answer`, auch oberhalb der Reserve und ohne
   finanzierbare Prevention- oder Recovery-Folgeaktion.
3. Ein gemappter Survival-Schritt erhält in der Plan-Memory pauschal Status
   `progressing` und TTL 2. Die vorhandene No-Progress-Prüfung gilt nur für
   `corp.apply_punish_pressure`.
4. `runner.survival_defense` verlangt Plan-Dominanz. Der spätere
   Low-Value-Yield nimmt ausgerechnet diesen Plantyp von
   `runner_rich_basic_credit_without_conversion` aus. Deshalb schützt der
   allgemeine Plan-Controller den negativen Credit mit `Infinity`.
5. Die Trace-Diagnostik zählt jeden Credit bei blockierter Coverage als
   erfüllte Coverage-Reparatur; der Repeatable-Action-Detektor betrachtet nur
   aktivierte und getriggerte Fähigkeiten, nicht Basic Credits.

## Vorgeschlagener Remediation-Plan

### Paket 1: Survival-Aktionsvertrag präzisieren

- `gain_credit` aus den pauschalen gewünschten Survival-Semantiken entfernen.
- Einen Credit nur dann als `find_survival_answer` zulassen, wenn ein
  sichtbarer konkreter Reaktionsreserve- oder Prevention-Funding-Bedarf
  besteht und der Credit die berechnete Lücke verkleinert.
- Der Zielwert muss begrenzt sein. Ist er erreicht, darf ein weiterer Credit
  nicht mehr zum Survival-Schritt mappen.
- Planerzeugung und Kandidaten-Mapping müssen dieselbe Hilfsfunktion für
  `isProgressCapableSurvivalAction` verwenden; eine breite Prüfung nur nach
  ActionType reicht nicht.

### Paket 2: Beobachtbaren Planfortschritt einführen

- Für `runner.survival_defense` einen eigenen Progress-Contract ergänzen.
  Fortschritt ist ausschließlich eine höhere Hand, ein reduziertes
  Flatline-Risiko, installierte/aktivierte Damage Prevention oder eine
  verkleinerte konkrete Reserve-Lücke.
- Bleiben diese Werte unverändert, wird die TTL dekrementiert statt auf 2
  erneuert. Nach wiederholtem No-Progress wird der Plan `blocked` oder
  `abandoned`.
- Existiert aktuell keine progressfähige Survival-Aktion, darf der Plan nicht
  als gemappt gelten. Die normale semantische Auswahl entscheidet dann unter
  den verbleibenden LegalActions.

### Paket 3: Plan-Arbitration absichern

- Die Ausnahme entfernen, die `runner.survival_defense` trotz
  `runner_rich_basic_credit_without_conversion` schützt.
- Plan-Dominanz nur gewähren, wenn die gemappte Aktion den neuen
  Progress-Contract erfüllt.
- Eine nichtpositive, nicht progressfähige Survival-Aktion darf keine positive
  Alternative mit `Infinity` blockieren. Das bedeutet nicht automatisch, dass
  ein riskanter Run gewählt werden muss; Damage-Risiko bleibt Bestandteil des
  Semantik-Scores.
- Bestehende Schutzfälle bleiben erhalten: legaler Draw oder echte Damage
  Prevention soll weiterhin einen generischen riskanten Run überstimmen.

### Paket 4: Diagnostik und Gates schließen

- `runnerCoverageRepairIntentSatisfied` nur bei einer nachweisbaren
  Capability-/Affordability-Verbesserung setzen, nicht bei beliebigem Credit.
- Einen Detektor `runner_survival_no_progress_loop` ergänzen: wiederholte
  Survival-Aktionen bei unveränderter Hand, unverändertem Risk-Level und
  fehlender Reserve-Lücke sind ein High-Severity-Fund.
- `repeatable_action_no_progress_loop` auf Basic Credits unter demselben Plan
  erweitern oder den neuen Detektor dafür als einzige Autorität verwenden.

## Verbindliche Regressionstests

1. Kandidaten-Mapping: Basic Credit ohne konkrete Reserve-Lücke mappt nicht
   auf `find_survival_answer`; finanzierbare Prevention unter Zielreserve ist
   ein positiver Gegenfall.
2. Plan-Memory: unveränderter Hand-/Risk-/Reserve-Zustand dekrementiert die
   Survival-TTL und führt deterministisch zu `blocked`/`abandoned`.
3. Ranking: negativer Survival-Credit verliert gegen eine positive legale
   Alternative; echter Draw bleibt vor einem riskanten R&D-Probe geschützt.
4. Ein spielgleicher Checkpoint aus C-09 State 412 oder 423 prüft LegalActions,
   Plan-Mapping, Why/WhyNot und den Folgeentscheid ohne private Kartendaten.
5. Zielpanel: C-09 sowie Net-Damage-08 und Hybrid-07 dürfen keine
   ungebremsten Survival-Credit-Folgen mehr erzeugen.
6. Abschlussgate: AI-Shards, AI-Typecheck, `check:ai`, Replay-/Redaction-Check
   und anschließend das commit-reine Standardpanel. Andere Action-Limit-
   Ursachen in Net-Damage-07 und Hybrid-05 bleiben getrennte Befunde.

## Akzeptanzkriterien für dieses Fehlerpaket

- Kein Basic Credit mappt oberhalb eines konkreten Survival-Reserve-Ziels auf
  `runner.survival_defense`.
- Kein Survival-Plan bleibt `progressing`, wenn sich Hand, Risk-Level,
  Prevention-Zustand und Reserve-Lücke nicht verbessern.
- C-09 endet ohne die bestätigte Survival-Credit-Schleife und ohne dadurch
  verursachtes Action-Limit.
- Die drei weiteren bekannten Survival-Credit-Folgen sind beseitigt oder
  durch einen sichtbaren konkreten Funding-Bedarf begründet.
- Die bestehenden echten Survival-Fälle mit Draw oder Damage Prevention
  bleiben grün.
