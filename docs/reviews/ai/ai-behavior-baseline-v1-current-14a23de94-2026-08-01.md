# AI Behavior Baseline v1

Status: attention_required
Git head: 14a23de94
Generated: 2026-08-01T07:03:07.252Z

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
| Plan conversion rate                               | 0.696 |
| Strategic no-progress repeats / 100 decisions      | 3.178 |
| Clearly dominated plan choices / 100 decisions     |     0 |
| Trace findings / 100 decisions                     | 0.776 |
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
| progression_tuning_origin_pressure_vs_tax    | event_pressure       | remote_scoring      |    10 |      1808 |             0.000 |                    0.889 |                0.651 |             4.978 |               0 |      0 |
| snapshot_holdout_origin_pressure_vs_tag_ops  | event_pressure       | tag_punish          |    10 |      1904 |             0.083 |                    0.900 |                0.733 |             3.046 |               0 |      0 |
| strategy_panel_fast_advance_chrome_rush      | rig_economy_pressure | fast_advance        |    10 |      3035 |             0.070 |                    0.674 |                0.655 |             2.932 |               0 |      0 |
| strategy_panel_net_damage_black_ice          | central_multiaccess  | net_damage          |    10 |      3345 |             0.100 |                    0.924 |                0.703 |              2.87 |               0 |      1 |
| strategy_panel_hybrid_score_punish_cheap_bag | rig_economy_pressure | hybrid_score_punish |    10 |      2050 |             0.200 |                    0.845 |                0.668 |             3.561 |               0 |      0 |

## Outcome context

- Runner agenda points: 219
- Corp agenda points: 153
- Runner steals: 121
- Corp scores: 95
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
- Average actions: 229.733
- Average turns: 29.25

## Comparison

Comparable: yes
Baseline git head: c6e1d4d72
Candidate git head: 14a23de94
Incompatibilities: none

| Metric                                        | Candidate minus baseline |
| --------------------------------------------- | -----------------------: |
| missedScoreWindowRate                         |                   +0.078 |
| advancedRemoteContestSkipRate                 |                   -0.014 |
| planConversionRate                            |                   -0.004 |
| strategicNoProgressRatePer100Decisions        |                   +0.153 |
| clearlyDominatedPlanChoiceRatePer100Decisions |                        0 |
| findingRatePer100Decisions                    |                   -5.079 |
| averageActions                                |                  +32.466 |

## Metric interpretation

- Missed score windows are direct Corp conversion misses.
- Remote contest skips are normalised by detected affordable advanced-remote opportunities and remain a diagnostic signal, not a standalone failure.
- Plan conversion uses plans settled by conversion, expiry, or abandonment; no-progress and dominated-choice rates are independent review signals.
- Premature Runner end turns exclude zero-click turns, decisions without an actionable legal alternative, and the explicit deterministic Corp-deckout closeout.
- Redundant low-value persistent installs require structured persistent-install evaluation, `redundant_duplicate` classification, and negative final fit. Useful backups and other positively valued second copies remain permitted.
- Win rate is deliberately outcome context rather than the acceptance criterion.

## Review 2026-08-01 – integrierter Ownership-Fixnachweis

### Ergebnis

Dieser Lauf misst die Ownership-Fixes nach der konfliktfreien Integration des
aktuellen lokalen `main` in den Arbeitsbranch. Er ersetzt den
Pre-Integration-Report `5094632ca` als aktuelle Evidence. Die beiden
deterministischen Abbrüche des roten Laufs `b87549867` sind weiterhin behoben:

- Pressure-vs-Tax Seed 05 läuft über die frühere Night-Shift-Abbruchstelle bei
  StateVersion 189 hinaus und endet regulär;
- Net-Damage/Black-Ice Seed 09 passiert die frühere Singapore-City-Grid-
  Dublette bei StateVersion 43 ohne LegalAction- oder Ownershipfehler.

Der vollständige Standardlauf enthält null IllegalActions, null Runtimefehler,
null Replay-, Hidden-Info-, Fallback-, Timeout- und No-LegalAction-Fehler. Der
Status bleibt ausschließlich wegen eines klassifizierten Action-Limits
`attention_required`: Net-Damage/Black-Ice Seed 06 erreicht 480 Aktionen in
der bekannten Klasse `runner_late_gain_credit_real_reserve`. Der isolierte
Kontrolllauf mit `maxActions=650` endet deterministisch nach 485 Aktionen und
62 Zügen durch Corp-Deckout; seine technischen Gates sind vollständig grün.
Das ist kein Ownership- oder Endlosloop, bleibt aber ein separater
Spielstärke-/Tail-Restpunkt.

### Fixgrenzen

- Singapore-City-Grid-HQ-Swaps verwenden die öffentliche Zielposition als
  Variantenidentität. Die zentrale Engine-Invariante verweigert doppelte
  Action-IDs; vollständige Tests führten außerdem `targetServerId`,
  `counterType` und `decision` als fehlende side-sichere Diskriminatoren nach.
  Verdeckte Kartenidentitäten wurden nicht in Action-IDs übernommen.
- Empty-R&D-Draw-Payloads werden über denselben Economy-Vertrag vor Funding-
  und Defense-Zulassung ausgeschlossen. Defense bleibt Root-Owner; die
  ausgewählte Funding-Route bindet exakt die Economy-Supportinstanz, ihren
  Parent-Need und dieselbe LegalAction. Runner-Heads behalten ihren bestehenden
  Root-/Leaf-Vertrag.

### Finale Integrationsgates

- AI: drei serielle Shards, 548 Testdateien und 4.492 Tests grün;
- Engine: 212 Testdateien und 1.844 Tests grün;
- Workspace-Typecheck mit 8-GB-Node-Heap, Package-Boundaries,
  AI-Hint-Metadaten, AI-/Engine-Source-Structure und fokussierte
  Ownership-/LegalAction-Regressions grün;
- Baseline: 60 Spiele, 13.784 Entscheidungen, null IllegalActions, null
  Runtimefehler und ein klassifizierter 480-Aktionen-Tail; der verlängerte
  Einzelrepro endet nach 485 Aktionen regulär.

### Verhaltenswerte und Restpunkte

Gegen den roten Lauf `b87549867` sinkt die Missed-Score-Window-Rate von
`0,150` auf `0,078` und die Remote-Contest-Skiprate von `0,854` auf `0,824`;
Plan-Konversion steigt von `0,687` auf `0,696`. Strategisches No-progress
steigt leicht von `3,086` auf `3,178` je 100 Entscheidungen, die mittlere
Spiellänge von `227,4` auf `229,733` Aktionen. Der Kriterienaudit des roten
Reports bleibt gültig: Messvertrags-Fingerprint, Denominator-/Abdeckungsgates,
detektorspezifische Findings, Tail-Quantile, vertiefte Score-/Run-/Planqualität
und ein gepaartes Referenzgegnerpanel sind weiterhin die wichtigsten
Ausbaurichtungen. Der hier reproduzierte 480/485-Tail bekräftigt insbesondere
p90/p95, Maximum und terminale Endgründe als Baseline-Kriterien.
