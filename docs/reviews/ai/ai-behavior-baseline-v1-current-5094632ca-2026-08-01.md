# AI Behavior Baseline v1

Status: attention_required
Git head: 5094632ca
Generated: 2026-08-01T06:46:23.444Z

## Contract

- Slots: progression_tuning_origin_rig_vs_tax, progression_tuning_origin_pressure_vs_tax, snapshot_holdout_origin_pressure_vs_tag_ops, strategy_panel_fast_advance_chrome_rush, strategy_panel_net_damage_black_ice, strategy_panel_hybrid_score_punish_cheap_bag
- Seeds: ai-behavior-baseline-v1-01, ai-behavior-baseline-v1-02, ai-behavior-baseline-v1-03, ai-behavior-baseline-v1-04, ai-behavior-baseline-v1-05, ai-behavior-baseline-v1-06, ai-behavior-baseline-v1-07, ai-behavior-baseline-v1-08, ai-behavior-baseline-v1-09, ai-behavior-baseline-v1-10
- Games: 60
- Max actions: 480
- Controllers: Runner and Corp both current_candidate.
- This report is diagnostic-only. Hard technical failures are automatic gates; behavioural deltas remain review evidence until thresholds are calibrated from repeated runs.

## Hard gates

Accepted: no
Hard failures: action_limit_games:1

| Metric                       | Value |
| ---------------------------- | ----: |
| illegalActions               |     0 |
| replayFailures               |     0 |
| actionLimitGames             |     1 |
| fallbackActions              |     0 |
| timeoutActions               |     0 |
| runtimeErrors                |     0 |
| classifiedRuntimeFailures    |     0 |
| unclassifiedRuntimeFailures  |     0 |
| classifiedActionLimitGames   |     1 |
| unclassifiedActionLimitGames |     0 |
| hiddenInfoFindings           |     0 |
| noLegalActionFailures        |     0 |
| redactionSafe                |   yes |

### Runtime failure classifications

| Code | Count |
| ---- | ----: |
| none |     0 |

| Owner | Count |
| ----- | ----: |
| none  |     0 |

### Action-limit classifications

| Slot                                | Seed                       | Classified | Last owner  | Last plan                                                                              | Last step                                                                                    | No-progress cluster           | No-progress subcluster               |
| ----------------------------------- | -------------------------- | ---------- | ----------- | -------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- | ----------------------------- | ------------------------------------ |
| strategy_panel_net_damage_black_ice | ai-behavior-baseline-v1-06 | yes        | plan_module | plan:corp.ambush_and_bluff:ambush%3Acorp_onr_v1_357_dieter-esslin_1%3Asetup%3Aremote_2 | plan:corp.ambush_and_bluff:ambush%3Acorp_onr_v1_357_dieter-esslin_1%3Asetup%3Aremote_2:setup | action_limit_low_value_repeat | runner_late_gain_credit_real_reserve |

## Behavioural metrics

| Metric                                             | Value |
| -------------------------------------------------- | ----: |
| Missed score window rate                           | 0.078 |
| Advanced remote contest skip rate                  | 0.824 |
| Plan conversion rate                               | 0.695 |
| Strategic no-progress repeats / 100 decisions      | 3.262 |
| Clearly dominated plan choices / 100 decisions     |     0 |
| Trace findings / 100 decisions                     |  0.75 |
| Action-capacity use rate                           |   n/a |
| Action-capacity plan conversion rate               |   n/a |
| Action-capacity expiration rate                    |   n/a |
| Action-capacity misconversion rate                 |   n/a |
| Premature Runner end turns / 100 decisions         |     0 |
| Redundant low-value Runner persistent install rate |   n/a |

## Deck slots

| Slot                                         | Runner               | Corp                | Games | Decisions | Missed score rate | Remote contest skip rate | Plan conversion rate | No-progress / 100 | Dominated / 100 | Limits |
| -------------------------------------------- | -------------------- | ------------------- | ----: | --------: | ----------------: | -----------------------: | -------------------: | ----------------: | --------------: | -----: |
| progression_tuning_origin_rig_vs_tax         | rig_economy_pressure | remote_scoring      |    10 |      1642 |             0.063 |                    0.889 |                0.801 |             1.949 |               0 |      0 |
| progression_tuning_origin_pressure_vs_tax    | event_pressure       | remote_scoring      |    10 |      1850 |             0.000 |                    0.889 |                0.648 |             5.135 |               0 |      0 |
| snapshot_holdout_origin_pressure_vs_tag_ops  | event_pressure       | tag_punish          |    10 |      1938 |             0.083 |                    0.900 |                0.729 |             3.148 |               0 |      0 |
| strategy_panel_fast_advance_chrome_rush      | rig_economy_pressure | fast_advance        |    10 |      3035 |             0.070 |                    0.674 |                0.655 |             2.932 |               0 |      0 |
| strategy_panel_net_damage_black_ice          | central_multiaccess  | net_damage          |    10 |      2943 |             0.111 |                    0.930 |                0.704 |             3.024 |               0 |      1 |
| strategy_panel_hybrid_score_punish_cheap_bag | rig_economy_pressure | hybrid_score_punish |    10 |      2050 |             0.200 |                    0.845 |                0.668 |             3.561 |               0 |      0 |

## Outcome context

- Runner agenda points: 220
- Corp agenda points: 152
- Runner steals: 122
- Corp scores: 94
- Score or steal actions: 216
- Action-capacity opportunities: 0
- Action-capacity uses: 0
- Action-capacity plan conversions: 0
- Action-capacity follow-up conversions: 0
- Action-capacity expired uses: 0
- Action-capacity misconversions: 0
- Runner end turns with clicks: 31
- Deterministic Corp-deckout end turns with clicks: 31
- Premature Runner end turns with clicks: 0
- Runner persistent install selections: 0
- Redundant low-value Runner persistent install selections: 0
- Average actions: 224.3
- Average turns: 28.45

## Comparison

Comparable: yes
Baseline git head: c6e1d4d72
Candidate git head: 5094632ca
Incompatibilities: none

| Metric                                        | Candidate minus baseline |
| --------------------------------------------- | -----------------------: |
| missedScoreWindowRate                         |                   +0.078 |
| advancedRemoteContestSkipRate                 |                   -0.014 |
| planConversionRate                            |                   -0.005 |
| strategicNoProgressRatePer100Decisions        |                   +0.237 |
| clearlyDominatedPlanChoiceRatePer100Decisions |                        0 |
| findingRatePer100Decisions                    |                   -5.105 |
| averageActions                                |                  +27.033 |

## Metric interpretation

- Missed score windows are direct Corp conversion misses.
- Remote contest skips are normalised by detected affordable advanced-remote opportunities and remain a diagnostic signal, not a standalone failure.
- Plan conversion uses plans settled by conversion, expiry, or abandonment; no-progress and dominated-choice rates are independent review signals.
- Premature Runner end turns exclude zero-click turns, decisions without an actionable legal alternative, and the explicit deterministic Corp-deckout closeout.
- Redundant low-value persistent installs require structured persistent-install evaluation, `redundant_duplicate` classification, and negative final fit. Useful backups and other positively valued second copies remain permitted.
- Win rate is deliberately outcome context rather than the acceptance criterion.

## Review 2026-08-01 – Ownership-Fixnachweis

### Ergebnis

Die beiden deterministischen Ownership-Abbrüche des Laufs `b87549867` sind
behoben. Der vollständige Standardlauf auf `5094632ca` enthält weder
IllegalActions noch Runtimefehler; auch Replay, Redaction, Hidden-Info,
Fallback, Timeout und No-LegalAction bleiben bei null beziehungsweise sauber.

| Repro                                                 | Vorher                                                                     | Nachher                                                                                                                             |
| ----------------------------------------------------- | -------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `progression_tuning_origin_pressure_vs_tax` / Seed 05 | Abbruch bei StateVersion 189 durch widersprüchliche `Night Shift`-Coverage | reguläres Spielende nach 197 Entscheidungen durch Corp-Deckout; StateVersion 189 wählt die ausführbare Score-/Action-Capacity-Route |
| `strategy_panel_net_damage_black_ice` / Seed 09       | Abbruch bei StateVersion 43 durch doppelte Singapore-City-Grid-Swap-ID     | vollständiger Standardspielpfad ohne LegalAction-, Runtime- oder Ownership-Fehler                                                   |

Der Standardreport bleibt trotzdem `attention_required`: Net-Damage/Black-Ice
Seed 06 erreicht das feste Limit von 480 Aktionen. Der klassifizierte Befund
`runner_late_gain_credit_real_reserve` ist dieselbe bereits vor diesem Fix
dokumentierte Spätspielklasse, nun in einem anderen Slot-/Seed-Pfad. Der
gezielte Kontrolllauf mit `maxActions=650` endet deterministisch bereits nach
485 Aktionen und 62 Zügen durch Corp-Deckout. Replay, Redaction und alle
technischen Gates bleiben dabei grün. Das ist kein Ownership- oder Endlosloop,
aber weiterhin ein gesonderter Spielstärke-/Tail-Restpunkt; weder
Runner-Strategie noch der Baseline-Deckel wurden in diesem Paket verändert.

### Ursachen und Fixgrenzen

- Singapore City Grid erhält für jede HQ-Zielposition eine side-sichere
  `targetIceIndex`-Variante. Eine zentrale Engine-Invariante verweigert
  LegalAction-Mengen mit doppelten IDs deterministisch. Der vollständige
  Engine-Lauf deckte zusätzlich fehlende öffentliche Diskriminatoren für
  Zielserver, Countertypen und `pay`-/`end_run`-Entscheidungen auf; auch diese
  Varianten sind jetzt eindeutig. Verdeckte Kartenidentitäten wurden nicht in
  Action-IDs verschoben.
- Empty-R&D-Draw-Payloads werden über einen gemeinsamen Economy-Vertrag bereits
  vor Funding- und Defense-Zulassung als nicht ausführbar erkannt. Defense
  bleibt Root-Owner; der Funding-Head bindet die exakte Economy-Supportinstanz,
  ihren Parent-Need und dieselbe Action. Der Runner-Vertrag bleibt unverändert,
  weil die neue Support-Origin nur für ausdrücklich gebundene Corp-Heads gilt.

### Verifikation

- AI: drei serielle Shards, 547 Testdateien und 4.481 Tests grün. Der normale
  parallele Lauf bestand 4.480/4.481 Tests; nur eine fokussiert in 2,15 Sekunden
  grüne Simulation überschritt unter Parallel-Last mit 31,24 Sekunden den
  30-Sekunden-Testtimeout. Der vorgesehene serielle Stabilitätspfad war grün.
- Engine: 211 Testdateien und 1.838 Tests grün.
- Workspace-Typecheck mit 8-GB-Node-Heap sowie Package-Boundaries,
  AI-Hint-Metadaten, AI-/Engine-Source-Structure und `git diff --check` grün.
- Standardbaseline: 60 Spiele, 13.458 Entscheidungen, null IllegalActions,
  null Runtimefehler und ein klassifiziertes Action-Limit; verlängerter
  Einzelrepro nach 485 Aktionen sauber terminal.

### Verhaltenswerte

Gegen den roten Lauf `b87549867` sinkt die Missed-Score-Window-Rate von
`0,150` auf `0,078`, die Remote-Contest-Skiprate von `0,854` auf `0,824` und
die mittlere Spiellänge von `227,4` auf `224,3` Aktionen. Plan-Konversion
steigt von `0,687` auf `0,695`; strategisches No-progress steigt leicht von
`3,086` auf `3,262` je 100 Entscheidungen. Gegen die formale Referenz
`c6e1d4d72` bleiben Messvertrags-, Abdeckungs- und Spielstärkevorbehalte des
vorherigen Kriterienaudits bestehen. Insbesondere das hier sichtbare
480-Aktionen-Tail bestätigt die Priorität von p90/p95-/Maximaldauer- und
terminalen Endgrundmetriken.
