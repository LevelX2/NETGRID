# Assets AI-Hints Änderungsliste v2
Stand: 2026-07-01
Basis: Uploaded `assets-semantic-review-v1-2026-07-01`; diese Liste übernimmt die dortigen Empfehlungen grundsätzlich, korrigiert aber mehrere überzogene Strategieanker und konsolidiert Signale.
## Ergebniszählung
- Assets gesamt: 55
- Finale Karten mit Strategieanker: 42 (Report: 45, Delta -3)
- Finale support-only Karten: 13 (Report: 10, Delta +3)
- Finale StrategySupportPairs: 49 (Report: 53, Delta -4)

### Finale Strategieanker-Verteilung
- `corp.ambush_bluff`: 10
- `corp.asset_economy`: 8
- `corp.central_stabilize`: 1
- `corp.damage_kill`: 6
- `corp.draw_engine`: 1
- `corp.economy_rez_reserve`: 2
- `corp.fast_advance`: 3
- `corp.ice_tax_glacier`: 5
- `corp.remote_scoring`: 2
- `corp.tag_trace_punish`: 11

## Globale Signal-Konsolidierungen
| Aktion | Von | Nach/Keep | Begründung |
|---|---|---|---|
| replace | `condition.multiple_runs_last_turn` | `condition.runner_attempted_run_last_turn` | Zu eng und nicht kanonisch; Satellite Monitors funktioniert ab einem Run und skaliert mit Run-Anzahl. |
| replace | `risk.requires_tagged_runner` | `condition.requires_tagged_runner` | Tagged requirement is a condition, not a risk. Use more specific condition.runner_has_two_or_more_tags when the card requires two tags. |
| replace | `risk.random_action` | `risk.random_outcome` | Die Aktion selbst ist nicht zufällig; das Ergebnis des Wurfs ist zufällig. |
| deduplicate | `economy.corp_trace_credit_support`, `trace.corp_credit_support` | `trace.corp_credit_support` | Trace-credit support is trace-specific; one precise signal prevents economy/trace double counting. |
| replace | `economy.rez_discount` | `ice.corp_install_discount` | Fortress Architects discounts ICE installation, not rezzing. |
| replace | `economy.advanceable` | `economy.corp_counter_cashout` | Generic and side-unclear; counter-cashout describes the function. |
| replace | `economy.corp_asset_cashout` | `economy.corp_rezzed_ice_cashout` | Syd Meyer Superstores trashes own rezzed ICE, not an asset. |
| replace_for_action_withdrawal_campaigns | `economy.corp_installed_credit_drip` | `economy.corp_installed_credit_pool` | BBS Whispering Campaign and Rockerboy Promotion are preloaded action-withdrawal pools, not automatic drip. |
| remove_when_counter_context_already_present | `economy.corp_advanceable_cashout` | `economy.corp_counter_cashout` | advance.corp_counter_bank already carries the advancement-counter context. |
| remove_redundant | `economy.corp_charge_bank` | `economy.corp_action_charged_bank`, `economy.corp_counter_bank` | Department of Truth Enhancement needs action-charged bank plus counter bank, not a third synonym. |

## Karten-Overrides gegenüber dem Upload-Report
Diese Karten sollten gegenüber der hochgeladenen Reportempfehlung anders oder präziser umgesetzt werden. Für alle nicht genannten Karten kann die Empfehlung aus dem Upload-Report übernommen werden.

| Karte | Änderung | Finale Taktiksignale | Finale Strategieanker/Pairs |
|---|---|---|---|
| Satellite Monitors (`onr_classic_021_satellite-monitors`) | `tacticSignals`, `strategySupportPairs`. `condition.multiple_runs_last_turn` ist zu eng und nicht kanonisch; der Effekt funktioniert ab einem Run und skaliert mit Run-Anzahl. Der Würfelwurf gehört als Risiko/Outcome sichtbar dazu. | `condition.runner_attempted_run_last_turn`, `risk.random_outcome`, `tag.source` | `corp.tag_trace_punish → enabler/run_count_start_turn_tag_source` (medium) |
| Strategic Planning Group (`onr_classic_025_strategic-planning-group`) | `strategySupportPairs`. Anker `corp.draw_engine` bleibt richtig; roleDetail sollte nicht `start_turn_*` heißen, weil der Effekt bei jedem Corp-Draw triggert. | `draw.corp_draw`, `draw.corp_recurring`, `hq.corp_hand_filter` | `corp.draw_engine → engine_anchor/recurring_draw_filter_engine` (high) |
| ACME Savings and Loan (`onr_v1_308_acme-savings-and-loan`) | `tacticSignals`, `lineSupport`, `strategicRole`, `strategySupportPairs`. Starker, aber selbst-trashender One-shot-Burst mit Agenda-Kosten und Lose-Game-Liability; das ist keine Asset-Economy-Engine und sollte keine Decklinie allein ankern. | `economy.corp_credit_burst`, `risk.agenda_point_cost`, `risk.loss_condition`, `risk.ongoing_payment_liability` | _support-only_ |
| BBS Whispering Campaign (`onr_v1_309_bbs-whispering-campaign`) | `tacticSignals`, `strategySupportPairs`. Preloaded action-withdrawal pool, kein Drip. `corp.asset_economy` bleibt als installed economy engine. | `economy.corp_installed_credit_pool`, `remote.asset_economy` | `corp.asset_economy → engine_anchor/installed_economy_engine` (medium) |
| Chicago Branch (`onr_v1_312_chicago-branch`) | `tacticSignals`, `strategySupportPairs`. `remote.scoring_protection` ist für Chicago Branch ungenau; die Karte schützt nicht, sie beschleunigt Advancement/Scorefenster. | `advance.corp_counter_placement`, `advance.score_window_support` | `corp.fast_advance → scoring_tool/advancement_enabler` (high), `corp.remote_scoring → scoring_tool/advancement_enabler` (medium) |
| Department of Truth Enhancement (`onr_v1_318_department-of-truth-enhancement`) | `tacticSignals`, `strategySupportPairs`. `economy.corp_charge_bank` ist redundant; action-charged bank plus counter bank genügt. | `economy.corp_action_charged_bank`, `economy.corp_counter_bank`, `remote.asset_economy` | `corp.asset_economy → engine_anchor/installed_economy_engine` (medium) |
| Fortress Architects (`onr_v1_324_fortress-architects`) | `tacticSignals`, `lineSupport`, `strategicRole`, `strategySupportPairs`. `economy.rez_discount` ist fachlich falsch, weil die Karte Installationskosten senkt. Der zweite Economy-Reserve-Anker ist zu stark. | `ice.corp_install_discount`, `tax.ice` | `corp.ice_tax_glacier → tax_tool/ice_tax_support` (medium) |
| Hacker Tracker Central (`onr_v1_325_hacker-tracker-central`) | `tacticSignals`, `strategySupportPairs`. `economy.corp_trace_credit_support` und `trace.corp_credit_support` sind Synonyme; das trace.*-Signal ist präziser. | `trace.corp_credit_support` | `corp.tag_trace_punish → enabler/trace_credit_enabler` (medium) |
| I Got a Rock (`onr_v1_327_i-got-a-rock`) | `tacticSignals`, `strategySupportPairs`. Die Voraussetzung ist spezifisch „zwei oder mehr Tags“, nicht nur tagged; die Agenda-Punkt-Zahlung muss als Risiko/Kosten sichtbar sein. | `condition.runner_has_two_or_more_tags`, `damage.corp_tagged_meat_payoff`, `damage.payoff`, `risk.agenda_point_cost`, `tag.payoff` | `corp.damage_kill → win_condition/tagged_meat_payoff` (medium), `corp.tag_trace_punish → win_condition/tagged_meat_payoff` (medium) |
| Information Laundering (`onr_v1_328_information-laundering`) | `tacticSignals`, `strategySupportPairs`. `economy.corp_advanceable_cashout` und `economy.corp_counter_cashout` doppeln sich hier; Counter-Cashout reicht zusammen mit `advance.corp_counter_bank`. | `advance.corp_counter_bank`, `economy.corp_counter_cashout`, `remote.asset_economy` | `corp.asset_economy → engine_anchor/installed_economy_engine` (medium) |
| Krumz (`onr_v1_330_krumz`) | `tacticSignals`, `strategySupportPairs`. Trace-credit support nicht doppelt als economy.* und trace.* führen. | `trace.corp_credit_support` | `corp.tag_trace_punish → enabler/trace_credit_enabler` (low) |
| Omniscience Foundation (`onr_v1_333_omniscience-foundation`) | `tacticSignals`, `strategySupportPairs`. Die Bedingung ist „Runner received a tag this turn“, nicht „Runner is tagged“. `tag.payoff` ist hier zu grob. | `condition.runner_received_tag_this_turn`, `tag.additional_tag_followup` | `corp.tag_trace_punish → enabler/tag_snowball_followup` (medium) |
| Rockerboy Promotion (`onr_v1_337_rockerboy-promotion`) | `tacticSignals`, `strategySupportPairs`. Preloaded action-withdrawal pool, kein Drip. `corp.asset_economy` bleibt als installed economy engine. | `economy.corp_installed_credit_pool`, `remote.asset_economy` | `corp.asset_economy → engine_anchor/installed_economy_engine` (medium) |
| Schlaghund (`onr_v1_339_schlaghund`) | `tacticSignals`, `strategySupportPairs`. `risk.random_action` beschreibt die Karte falsch; die Aktion ist gewählt, nur das Ergebnis ist zufällig. | `condition.requires_tagged_runner`, `damage.corp_tagged_meat_payoff`, `damage.payoff`, `risk.random_outcome`, `tag.payoff` | `corp.damage_kill → win_condition/tagged_meat_payoff` (medium), `corp.tag_trace_punish → win_condition/tagged_meat_payoff` (medium) |
| Solo Squad (`onr_v1_342_solo-squad`) | `tacticSignals`, `strategySupportPairs`. `requires_tagged_runner` ist eine Condition, kein Risiko. | `condition.requires_tagged_runner`, `damage.corp_tagged_meat_payoff`, `damage.payoff`, `tag.payoff` | `corp.damage_kill → win_condition/tagged_meat_payoff` (medium), `corp.tag_trace_punish → win_condition/tagged_meat_payoff` (medium) |
| South African Mining Corp (`onr_v1_343_south-african-mining-corp`) | `tacticSignals`, `lineSupport`, `strategicRole`, `strategySupportPairs`. Drei Aktionen für 6 Credits ist generische, action-intensive Economy. Kein Remote-/Asset-Economy-Anker und kein punish_payoff/payoff_anchor. | `economy.corp_multi_action_credit` | _support-only_ |
| Vapor Ops (`onr_v1_347_vapor-ops`) | `tacticSignals`, `strategySupportPairs`. Die Credit-Funktion ist Counter-Cashout, nicht nur ein Economy-Counter-Bank-Signal. | `advance.corp_counter_bank`, `advance.corp_counter_transfer`, `advance.score_window_support`, `economy.corp_counter_cashout` | `corp.fast_advance → scoring_tool/advancement_enabler` (high) |
| Cybertech Think Tank (`onr_proteus_055_cybertech-think-tank`) | `tacticSignals`, `strategySupportPairs`. `damage.payoff` ist für einen reinen Amplifier zu grob; die Karte liefert keinen eigenen Schaden. | `advance.corp_counter_bank`, `damage.corp_damage_amplifier` | `corp.damage_kill → enabler/damage_amplifier` (high) |
| Government Contract (`onr_proteus_059_government-contract`) | `tacticSignals`, `strategySupportPairs`. `economy.advanceable` ist zu generisch; Counter-Cashout plus Install/Rez-Credit beschreibt die Funktion präziser. `requires_during_run` sollte aus den Conditions entfernt werden. | `advance.corp_counter_bank`, `economy.corp_counter_cashout`, `economy.corp_install_rez_credit`, `risk.temporary_credit_drawback` | `corp.economy_rez_reserve → engine_anchor/install_rez_reserve` (high) |
| LDL Traffic Analyzers (`onr_proteus_061_ldl-traffic-analyzers`) | `tacticSignals`, `strategySupportPairs`. Trace-credit support nicht doppelt als economy.* und trace.* führen. | `advance.corp_counter_bank`, `risk.temporary_credit_drawback`, `trace.corp_credit_support` | `corp.tag_trace_punish → enabler/trace_credit_enabler` (medium) |
| Syd Meyer Superstores (`onr_proteus_076_syd-meyer-superstores`) | `tacticSignals`, `lineSupport`, `strategicRole`, `strategySupportPairs`. Die Karte casht eigenes rezzed ICE aus, nicht ein Asset. Das ist Economy/ICE-Sacrifice-Utility mit Drawback, kein Asset-Economy-Anker. | `economy.corp_rezzed_ice_cashout`, `ice.corp_self_trash_cost`, `risk.trash_own_rezzed_ice` | _support-only_ |

## Direkt umsetzbarer Modus
Empfohlene Anwendung: zuerst die normalen `recommendation`-Werte aus `assets-semantic-review-v1-2026-07-01.json` übernehmen, dann die Overrides aus `cardOverridesAgainstUploadedReport` dieser v2-Liste anwenden. Alternativ kann `fullFinalRecommendations` aus der JSON-Datei direkt als Zielzustand verwendet werden.

## Schema-/Condition-Hinweise
- `Government Contract`: in den strukturierten Conditions sollte `requires_during_run` entfernt werden; die Credits sind temporär bis Turn-Ende, aber nicht nur während eines Runs nutzbar.
- `I Got a Rock`: die Bedingung sollte spezifisch als `runner_has_two_or_more_tags` und die Agenda-Punkt-Zahlung als Risiko/Kosten sichtbar sein.
- `Satellite Monitors`: der Trigger ist „Runner attempted/made a run last turn“ und skaliert mit Run-Anzahl; nicht „multiple runs only“.
- `Syd Meyer Superstores`: braucht bei späterer Action-Semantik ein Zielprofil für eigenes rezzed ICE (`own_rezzed_ice`).
