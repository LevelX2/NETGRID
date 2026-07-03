# Upgrades AI-Hints Critical Review v2

Stand: 2026-07-02

## Kurzfazit

Der Upload-Report ist als Basis brauchbar, aber an mehreren Stellen zu breit: vor allem `remote_scoring` und `ice_tax_glacier` werden teilweise durch reine Matchup-Hate-, Economy-Rewards oder generische Remote-Utility ausgelöst. Diese v2 reduziert die Ankerdichte von **41** auf **38** Karten und die StrategySupportPairs von **55** auf **47**.

## Zahlen

| Kennzahl | Upload v1 | Vorschlag v2 | Delta |
|---|---:|---:|---:|
| Karten mit Strategieanker | 41 | 38 | -3 |
| Support-only Karten | 4 | 7 | 3 |
| StrategySupportPairs | 55 | 47 | -8 |
| Karten mit Override | – | 13 | – |

## Finale Strategieanker-Verteilung v2

- `corp.ambush_bluff`: 6
- `corp.central_stabilize`: 1
- `corp.damage_kill`: 2
- `corp.economy_rez_reserve`: 1
- `corp.ice_tax_glacier`: 16
- `corp.remote_scoring`: 15
- `corp.tag_trace_punish`: 6

## Wichtigste Taxonomie-Entscheidungen

- Behalte/akzeptiere `ice.corp_ice_swap`: Reusable for Omni Kismet and Singapore City Grid; HQ source belongs in constraints, not in the signal name.
- Ersetze `ice.corp_hq_runpath_insert` durch `ice.corp_temporary_encounter` für Dr. Dreff: Dr. Dreff does not install or swap ICE; it forces a temporary encounter with HQ ICE.
- Ersetze `ice.corp_hq_runpath_insert` durch `ice.corp_ice_swap` für Omni Kismet, Ph.D.; Singapore City Grid: These cards swap an unrezzed ICE with HQ ICE; they do not insert an additional run-path ICE.
- Ersetze `risk.temporary_ice_liability` durch `risk.temporary_ice_trash` für Dr. Dreff: The actual drawback is that the temporary HQ ICE is trashed after the encounter.
- Ersetze `condition.corp_installed_or_advanced_last_turn` durch `condition.corp_installed_or_advanced_this_fort_last_turn` für Roving Submarine: The text requires install/advance inside or on this specific fort, not anywhere.
- Ersetze `condition.hq_run` durch `condition.during_hq_run` für Panic Button: More precise timing condition for an ability usable only during an HQ run.
- Ersetze `ice.strength_modifier` durch `ice.corp_targeted_strength_boost` für Sterdroid: The effect is a Corp-side targeted temporary ICE-strength boost, not a generic modifier.
- Ersetze `condition.requires_tagged_runner` durch `condition.runner_has_one_or_more_tags` für Street Enforcer: Street Enforcer has a tag-count scaling effect, not a strict rules text “ignore unless tagged” condition.
- Ergänze `tag.runner_credit_loss_payoff` für Street Enforcer: Separates automatic Runner credit loss from ordinary pay-to-continue tax.
- Ergänze `advance.access_window_counter_support` für Lesley Major: Captures reactive advancement-counter placement after the Runner has passed the last ICE; this is not normal score-window acceleration.
- Kein Strategieanker nur aus `run.corp_worm_lockout`, `run.corp_stealth_credit_lockout`, `run.break_cost_penalty with noisy-only constraint`: Subtype-/matchup-specific breaker hate remains tactical support unless a separate breaker-hate strategy is explicitly introduced.
- Kein Strategieanker nur aus `economy.corp_unsuccessful_run_credit` für Tokyo-Chiba Infighting: Rewarding an already unsuccessful run is economy support, not a tax/glacier anchor by itself.

## Card-Overrides gegen den Upload-Report

| Karte | Änderung v2 | Finale Strategie/Pairs | Begründung |
|---|---|---|---|
| **Dr. Dreff** | `tacticSignals`, `strategySupportPairs`, `targetOrConstraints`, `reviewStatus`, `rationale`<br>Signale: `ice.corp_temporary_encounter`, `risk.temporary_ice_trash` | `corp.ice_tax_glacier → tax_tool/successful_run_temporary_hq_ice_encounter` (medium); `corp.remote_scoring → defensive_tool/successful_run_temporary_hq_ice_encounter_defense` (high) | `ice.corp_hq_runpath_insert` war zu breit: Dr. Dreff installiert/swappt kein ICE, sondern erzeugt eine temporäre Begegnung. Das Risiko ist präziser `risk.temporary_ice_trash` statt abstrakter Liability. |
| **Namatoki Plaza** | `tacticSignals`, `strategicRole`, `strategySupportPairs`, `targetOrConstraints`, `reviewStatus`, `rationale`<br>Signale: `remote.capacity_support` | `corp.remote_scoring → support_tool/remote_capacity_expansion` (medium) | `remote.scoring_protection` ist hier falsch: Namatoki schützt keine Agenda und erzeugt kein Scorefenster, sondern erweitert nur die Fort-Kapazität. Rolle deshalb `support_tool`, nicht `scoring_tool`. |
| **Olivia Salazar** | `lineSupport`, `strategicRole`, `strategySupportPairs`, `rationale`<br>Signale: `ice.corp_rez_discount`, `ice.corp_temporary_rez`, `risk.temporary_rez_liability` | `corp.ice_tax_glacier → tax_tool/temporary_ice_rez_support` (medium) | `corp.economy_rez_reserve` ist zu groß für eine einmal-pro-Run temporäre Rez-Ermäßigung. Die Karte unterstützt ICE-Tax/Glacier, ist aber keine Rez-Reserve-Engine. |
| **Omni Kismet, Ph.D.** | `tacticSignals`, `strategySupportPairs`, `targetOrConstraints`, `rationale`<br>Signale: `ice.corp_ice_swap` | `corp.ice_tax_glacier → tax_tool/hq_ice_swap_support` (medium) | `ice.corp_hq_runpath_insert` ist hier nicht präzise, weil die Karte kein ICE einfügt, sondern ein unrezzed ICE austauscht. `ice.corp_ice_swap` reicht; HQ-Quelle ist Constraint. |
| **Roving Submarine** | `tacticSignals`, `strategySupportPairs`, `targetOrConstraints`, `reviewStatus`, `rationale`<br>Signale: `run.corp_server_lock`, `condition.corp_installed_or_advanced_this_fort_last_turn` | `corp.remote_scoring → defensive_tool/conditional_server_lock` (medium) | Die Bedingung im Report war zu breit. Es geht nicht um irgendeine Corp-Install-/Advance-Aktion, sondern um diese Fort-Zone. Außerdem ist `high` zu stark, weil aktive Scoring-Entwicklung die Run-Erlaubnis gerade wieder öffnet. |
| **Singapore City Grid** | `tacticSignals`, `strategySupportPairs`, `targetOrConstraints`, `rationale`<br>Signale: `ice.corp_ice_swap` | `corp.ice_tax_glacier → tax_tool/hq_ice_swap_support` (medium) | `ice.corp_hq_runpath_insert` ist auch hier zu breit. Die Karte tauscht ICE aus; sie installiert oder erzwingt keine zusätzliche Begegnung. |
| **Tokyo-Chiba Infighting** | `lineSupport`, `strategicRole`, `strategySupportPairs`, `targetOrConstraints`, `reviewStatus`, `rationale`<br>Signale: `economy.corp_unsuccessful_run_credit` | support-only | Credits nach erfolglosem Run belohnen einen bereits starken Server, erzeugen aber selbst weder Tax noch ETR noch Scoring-Schutz. Der niedrige Glacier-Support aus v1 sollte nicht als Strategieanker zählen. |
| **Twenty-Four-Hour Surveillance** | `tacticSignals`, `lineSupport`, `strategicRole`, `strategySupportPairs`, `targetOrConstraints`, `reviewStatus`, `rationale`<br>Signale: `run.corp_stealth_credit_lockout` | support-only | Stealth-Hate ist wie Worm-Hate ein taktisches Matchup-/Constraint-Signal, aber kein verlässlicher ICE-Tax-/Glacier-Anker. `tax.runner_credit` ist als Zusatzsignal zu breit, weil keine zusätzlichen Credits gezahlt werden, sondern eine Quelle gesperrt wird. |
| **Lesley Major** | `tacticSignals`, `lineSupport`, `strategicRole`, `strategySupportPairs`, `targetOrConstraints`, `rationale`<br>Signale: `advance.corp_counter_placement`, `advance.access_window_counter_support`, `condition.runner_passed_last_ice_this_fort` | `corp.ambush_bluff → enabler/access_window_advancement_enabler` (medium) | Der v1-Anker `corp.remote_scoring` ist fraglich: Das Timing vor Access schützt Agendas nicht zuverlässig und erzeugt kein Score-Closeout. Fachlich stärker ist die Karte als Access-Window-Advancement-Enabler für Ambush/Bluff-Linien. |
| **Panic Button** | `tacticSignals`, `targetOrConstraints`, `reviewStatus`, `rationale`<br>Signale: `draw.corp_draw`, `condition.during_hq_run` | support-only | `condition.hq_run` sollte präziser als Timing-/Nutzungscondition formuliert werden: `condition.during_hq_run`. Support-only bleibt richtig. |
| **London City Grid** | `tacticSignals`, `lineSupport`, `strategicRole`, `strategySupportPairs`, `targetOrConstraints`, `priority`, `rationale`<br>Signale: `run.break_cost_penalty`, `tax.runner_persistent` | support-only | Noisy-Icebreaker-Hate ist subtype-/matchup-spezifisch wie Worm- oder Stealth-Hate. Das ist ein taktisches Tax-/Constraint-Signal, aber kein stabiler `corp.ice_tax_glacier`- oder `corp.remote_scoring`-Anker. |
| **Sterdroid** | `tacticSignals`, `lineSupport`, `strategicRole`, `strategySupportPairs`, `targetOrConstraints`, `reviewStatus`, `rationale`<br>Signale: `ice.corp_targeted_strength_boost`, `ice.corp_strength_support` | `corp.ice_tax_glacier → tax_tool/targeted_ice_strength_burst` (medium) | `ice.strength_modifier` ist zu generisch und nicht Corp-seitig. `remote.scoring_protection` und der Remote-Scoring-Pair sind zu breit, weil Sterdroid ein zielbares ICE-Buff-Werkzeug ist, kein remote-spezifischer Schutz. |
| **Street Enforcer** | `tacticSignals`, `lineSupport`, `strategicRole`, `strategySupportPairs`, `targetOrConstraints`, `rationale`<br>Signale: `condition.runner_has_one_or_more_tags`, `tag.payoff`, `tag.runner_credit_loss_payoff`, `tax.runner_persistent` | `corp.tag_trace_punish → punish_payoff/tag_count_credit_loss_payoff` (high) | Die v1-Zuordnung zu drei Strategien überdehnt die Karte. Fachlich ist Street Enforcer ein Tag-Payoff. ICE-Tax und Remote-Scoring sollten nicht zusätzlich ankern, weil die Tax nur aus bereits vorhandenen Tags entsteht. |

## Direkt übernehmbare Anwendung

Für die Umsetzung: zuerst die Empfehlungen aus `upgrades_semantic_review_v1_2026-07-02.json` übernehmen, dann die Einträge aus `cardOverridesAgainstUploadedReport` dieser v2-Datei darüberlegen. Wenn ein vollständiger Zielzustand einfacher ist, enthält die JSON zusätzlich `fullFinalRecommendations` für alle 45 Upgrades.
