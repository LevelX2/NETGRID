# AI Match Progression Benchmark Suite Report

Version: ai-match-progression-suite-v1
Baseline: current_candidate
Candidate: current_candidate
Comparison profiles: current_candidate
Seeds: 5
Gate: diagnostic_only

## Slot Status

| Slot | Type | Status | Use | Runner Archetype | Corp Archetype | Runner | Corp | Reason |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| strategy_panel_fast_advance_chrome_rush | local_realistic_holdout | runnable | holdout_only | rig_economy_pressure | fast_advance | local_realistic_runner_blink_pressure_rig_snapshot_v1 | local_realistic_corp_chrome_rush_bureau_snapshot_v1 | ok |
| strategy_panel_net_damage_black_ice | local_realistic_holdout | runnable | holdout_only | central_multiaccess | net_damage | local_realistic_runner_rnd_interface_dig_snapshot_v1 | local_realistic_corp_black_ice_ambush_lab_snapshot_v1 | ok |
| strategy_panel_hybrid_score_punish_cheap_bag | local_realistic_holdout | runnable | holdout_only | rig_economy_pressure | hybrid_score_punish | local_realistic_runner_blink_pressure_rig_snapshot_v1 | local_realistic_corp_cheap_bag_tricks_snapshot_v1 | ok |

## Strategy Panel Coverage

Target Corp archetypes: remote_scoring, fast_advance, tag_punish, net_damage, hybrid_score_punish, virus_damage
Missing runnable Corp archetypes: remote_scoring, tag_punish, virus_damage

| Corp Archetype | Runnable Slots | Holdout Slots | Slots |
| --- | ---: | ---: | --- |
| fast_advance | 1 | 1 | strategy_panel_fast_advance_chrome_rush |
| hybrid_score_punish | 1 | 1 | strategy_panel_hybrid_score_punish_cheap_bag |
| net_damage | 1 | 1 | strategy_panel_net_damage_black_ice |
| remote_scoring | 0 | 0 | - |
| tag_punish | 0 | 0 | - |
| virus_damage | 0 | 0 | - |

## Strategy Panel Gaps

Pending slots are explicit placeholders for Corp archetypes that need stable benchmark decks before they can be used as evidence.

| Slot | Corp Archetype | Status | Reason |
| --- | --- | --- | --- |
| none | none | runnable | none |

## Demo Smoke

Demo-Smoke-Decks bleiben Safety-/Regression-Material und sind keine Spielstaerke-Basis.

| Slot | Type | Use | Runner Archetype | Corp Archetype | Profile | Runner | Corp | Illegal | Replay Failures | Timeout Rate | Action Limit Rate | Avg Turns | Corp Scores | Score Available | Score Taken | Missed Score | Score Take Rate | Runner Steals | Advanced Steals | Adv Steal Remote | Adv Steal Central | Final Advances | Unsafe Final | Protected Final | Protect Before | Score/Steal per Match | Remote Build | Remote Advances | Remote Trash | Successful Remote Access | Remote Access Trashable | Affordable Relevant Trash Opp | Relevant Trash Taken | Relevant Trash Take Rate | Skipped Relevant Trash | Remote Runs vs Advanced | Skipped Advanced Remote | Central While Remote Threat | Runner Draw | Draw Share | Draw+Discard | Duplicate Installs | Low-Value Dup | Junkyard Dup | Economy Taken | Rig Installs | Remote Trash Opp | Remote Trash Taken | Hand Use Rate | Runner Avg Credits | Runner End Credits | End Below Reserve | Turns Below Reserve | Runs Below Reserve | Contest Blocked Credits | Spend Below Reserve | Known Unaffordable Runs | Avg Missing Path Credits | Low-Value Unaffordable Runs | Unique Advanced Threats | Contestable Threats | Threats Contested | Threat Contest Rate | Skipped Contestable Threats | Central Instead Contestable | Central Justified | Central Burned Reserve | Remote Contest Credit Block | Remote Contest Post-Run Block | Remote Runs Insufficient Reserve | Repeated Central Same Threat | Successful Central | Successful Remote | Run-window Rez |
| --- | --- | --- | --- | --- | --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |

## Snapshot Progression

Snapshot-Decks sind die interne Progression-Messung fuer Tuning- und Holdout-Signale.

| Slot | Type | Use | Runner Archetype | Corp Archetype | Profile | Runner | Corp | Illegal | Replay Failures | Timeout Rate | Action Limit Rate | Avg Turns | Corp Scores | Score Available | Score Taken | Missed Score | Score Take Rate | Runner Steals | Advanced Steals | Adv Steal Remote | Adv Steal Central | Final Advances | Unsafe Final | Protected Final | Protect Before | Score/Steal per Match | Remote Build | Remote Advances | Remote Trash | Successful Remote Access | Remote Access Trashable | Affordable Relevant Trash Opp | Relevant Trash Taken | Relevant Trash Take Rate | Skipped Relevant Trash | Remote Runs vs Advanced | Skipped Advanced Remote | Central While Remote Threat | Runner Draw | Draw Share | Draw+Discard | Duplicate Installs | Low-Value Dup | Junkyard Dup | Economy Taken | Rig Installs | Remote Trash Opp | Remote Trash Taken | Hand Use Rate | Runner Avg Credits | Runner End Credits | End Below Reserve | Turns Below Reserve | Runs Below Reserve | Contest Blocked Credits | Spend Below Reserve | Known Unaffordable Runs | Avg Missing Path Credits | Low-Value Unaffordable Runs | Unique Advanced Threats | Contestable Threats | Threats Contested | Threat Contest Rate | Skipped Contestable Threats | Central Instead Contestable | Central Justified | Central Burned Reserve | Remote Contest Credit Block | Remote Contest Post-Run Block | Remote Runs Insufficient Reserve | Repeated Central Same Threat | Successful Central | Successful Remote | Run-window Rez |
| --- | --- | --- | --- | --- | --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |

## Local Realistic Holdout

Lokale Deck-Editor-Decks sind Holdout-/Reality-Check-Slots und werden nicht als Tuningbasis behandelt.

| Slot | Type | Use | Runner Archetype | Corp Archetype | Profile | Runner | Corp | Illegal | Replay Failures | Timeout Rate | Action Limit Rate | Avg Turns | Corp Scores | Score Available | Score Taken | Missed Score | Score Take Rate | Runner Steals | Advanced Steals | Adv Steal Remote | Adv Steal Central | Final Advances | Unsafe Final | Protected Final | Protect Before | Score/Steal per Match | Remote Build | Remote Advances | Remote Trash | Successful Remote Access | Remote Access Trashable | Affordable Relevant Trash Opp | Relevant Trash Taken | Relevant Trash Take Rate | Skipped Relevant Trash | Remote Runs vs Advanced | Skipped Advanced Remote | Central While Remote Threat | Runner Draw | Draw Share | Draw+Discard | Duplicate Installs | Low-Value Dup | Junkyard Dup | Economy Taken | Rig Installs | Remote Trash Opp | Remote Trash Taken | Hand Use Rate | Runner Avg Credits | Runner End Credits | End Below Reserve | Turns Below Reserve | Runs Below Reserve | Contest Blocked Credits | Spend Below Reserve | Known Unaffordable Runs | Avg Missing Path Credits | Low-Value Unaffordable Runs | Unique Advanced Threats | Contestable Threats | Threats Contested | Threat Contest Rate | Skipped Contestable Threats | Central Instead Contestable | Central Justified | Central Burned Reserve | Remote Contest Credit Block | Remote Contest Post-Run Block | Remote Runs Insufficient Reserve | Repeated Central Same Threat | Successful Central | Successful Remote | Run-window Rez |
| --- | --- | --- | --- | --- | --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| strategy_panel_fast_advance_chrome_rush | local_realistic_holdout | holdout_only | rig_economy_pressure | fast_advance | current_candidate | local_realistic_runner_blink_pressure_rig_snapshot_v1 | local_realistic_corp_chrome_rush_bureau_snapshot_v1 | 0 | 0 | 0 | 0 | 37 | 18 | 18 | 18 | 0 | 1 | 11 | 1 | 1 | 0 | 27 | 1 | 26 | 0 | 5.8 | 61 | 45 | 4 | 10 | 12 | 12 | 12 | 1 | 0 | 6 | 27 | 5 | 145 | 0.191 | 0 | 3 | 2 | 0 | 128 | 13 | 4 | 4 | 0.651 | 5.067 | 5.626 | 24 | 203 | 28 | 5 | 28 | 0 | 0 | 0 | 9 | 4 | 5 | 1.25 | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 65 | 10 | 23 |
| strategy_panel_net_damage_black_ice | local_realistic_holdout | holdout_only | central_multiaccess | net_damage | current_candidate | local_realistic_runner_rnd_interface_dig_snapshot_v1 | local_realistic_corp_black_ice_ambush_lab_snapshot_v1 | 0 | 0 | 0 | 0 | 27 | 3 | 3 | 3 | 0 | 1 | 6 | 1 | 1 | 0 | 7 | 2 | 5 | 0 | 1.8 | 31 | 15 | 1 | 4 | 17 | 8 | 4 | 0.5 | 4 | 3 | 11 | 1 | 100 | 0.201 | 0 | 0 | 0 | 0 | 99 | 24 | 1 | 1 | 0.631 | 5.311 | 4.969 | 23 | 181 | 17 | 13 | 22 | 0 | 0 | 0 | 5 | 3 | 3 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 57 | 4 | 17 |
| strategy_panel_hybrid_score_punish_cheap_bag | local_realistic_holdout | holdout_only | rig_economy_pressure | hybrid_score_punish | current_candidate | local_realistic_runner_blink_pressure_rig_snapshot_v1 | local_realistic_corp_cheap_bag_tricks_snapshot_v1 | 0 | 0 | 0 | 0.2 | 38.6 | 9 | 9 | 9 | 0 | 1 | 8 | 1 | 1 | 0 | 15 | 2 | 13 | 0 | 3.4 | 67 | 36 | 3 | 8 | 6 | 5 | 5 | 1 | 0 | 12 | 40 | 2 | 131 | 0.171 | 0 | 2 | 0 | 0 | 169 | 12 | 3 | 3 | 0.675 | 3.492 | 3.611 | 63 | 509 | 43 | 0 | 61 | 0 | 0 | 0 | 14 | 8 | 9 | 1.125 | 0 | 0 | 0 | 0 | 0 | 0 | 2 | 0 | 38 | 8 | 30 |

## Real Scene Holdout

Echte Szenedecks sind externe Reality-Check-Slots und bleiben von der Progression-Tuningbasis getrennt.

| Slot | Status | Runner Archetype | Corp Archetype | Runner | Corp | Reason |
| --- | --- | --- | --- | --- | --- | --- |

## Breaker Ontology Metrics

| Slot | Use | Profile | Runner Profiles Seen | Runner Coverage Used | Runner Fallback | Runner Install Ranked | Runner Search Ranked | Corp Visible Profiles | Corp Remote Safety Used | Corp Cheap Contest | Quote Conflict/Override | Coverage Signals | Fallback Evidence | Effective Quote Override |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| strategy_panel_fast_advance_chrome_rush | holdout_only | current_candidate | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| strategy_panel_net_damage_black_ice | holdout_only | current_candidate | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| strategy_panel_hybrid_score_punish_cheap_bag | holdout_only | current_candidate | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |

## RemoteRole Ontology Metrics

| Slot | Use | Profile | Corp Profiles Seen | Corp Safety Used | Corp Scoring Used | Raised Safety | Inactive | Cheap Contest Blocked | Legacy Conflict | Bait Not Protection | Asset Not Protection | Runner Profiles Seen | Runner Trash Value | Kinds | Scopes |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| strategy_panel_fast_advance_chrome_rush | holdout_only | current_candidate | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 11 | 11 | 11 | 11 |
| strategy_panel_net_damage_black_ice | holdout_only | current_candidate | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 9 | 9 | 9 | 9 |
| strategy_panel_hybrid_score_punish_cheap_bag | holdout_only | current_candidate | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 4 | 4 | 4 | 4 |

## Tag/Punish Ontology Metrics

| Slot | Use | Profile | Profiles Seen | Tag Source Used | Payoff Used | Confirmed Punish Opp | Skipped Confirmed Opp | Converted | Expired | Tag Source With Payoff | Tag Source Without Payoff | Conflict | Kinds | Conditions |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| strategy_panel_fast_advance_chrome_rush | holdout_only | current_candidate | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| strategy_panel_net_damage_black_ice | holdout_only | current_candidate | 92 | 25 | 91 | 91 | 77 | 14 | 1 | 5 | 0 | 3 | 116 | 4 |
| strategy_panel_hybrid_score_punish_cheap_bag | holdout_only | current_candidate | 48 | 42 | 6 | 6 | 0 | 6 | 7 | 18 | 1 | 0 | 121 | 42 |

## Metric Notes

`scoreActionsAvailable` zaehlt Corp-Entscheidungsfenster mit mindestens einer legalen Score-Action. `missedScoreWindows` zaehlt diese Fenster, wenn die Corp nicht scored. `finalAdvanceActions` zaehlt Remote-Agenda-Advances, die eine Agenda auf 0 oder 1 verbleibende Advances bringen. `unsafeFinalAdvanceActions` markiert diese Fenster bei hoher sichtbarer Runner-Contest-Gefahr oder schwachem Schutz. `protectBeforeAdvanceActions` zaehlt Remote-Schutzaktionen vor einer near-final Agenda. `relevantRemoteTrashTakeRate` misst genommene relevante und bezahlbare Remote-Trash-Gelegenheiten. `skippedAdvancedRemoteContest` zaehlt Runner-Fenster mit legaler Advanced-Remote-Run-Gelegenheit, in denen kein solcher Remote-Run gewaehlt wurde. Die `uniqueAdvancedRemoteThreats`-/`contestableAdvancedRemoteThreats`-Metriken deduplizieren diese Bedrohungen pro Match, Turn und Server und trennen echte Contest-Targets von Reserve-/Coverage-Blockern. `runnerDrawActions` zaehlt Click-Draw sowie Draw-/Setup-/Search-Karteneffekte. `drawThenDiscardSameTurn` zaehlt Runner-Draws, denen im selben Runner-Turn ein Discard-Choice folgt. `runnerLowValueDuplicateInstallActions` markiert installierte Zweitkopien mit niedrigem Grenznutzen wie Junkyard BBS. `handUseRate` misst, wie oft der Runner bei sichtbarer Economy-/Breaker-/Pressure-/Remote-Trash-Gelegenheit eine solche Hand-/Board-Aktion statt Draw/Filler nimmt. `runnerEndTurnCreditsBelowReserve`, `runnerRunsStartedBelowReserve` und `runsStartedAgainstKnownUnaffordablePath` messen Cashpool-/Spend-Discipline und bekannte ICE-Pfad-Bezahlbarkeit auf sichtbarer Information. `remoteBuildActions` zaehlt Remote-Installationen plus Run-Fenster-Rez-Aktionen. `remoteAdvanceActions` zaehlt Advances und explizite Advancement-Counter-Zuwaechse auf Remotes.