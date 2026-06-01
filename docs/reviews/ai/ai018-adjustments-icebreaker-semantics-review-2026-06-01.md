# AI018 Anpassungen: Icebreaker Semantik Review

Datum: 2026-06-01
Aufgabe: AI018 Anpassungen
Auslöser: `AI018_Icebreaker_Semantics_Review_Instructions_2026-06-01.md`

## Kurzfazit

Die AI018-Review-Anpassungen sind umgesetzt. TargetProfile V1 ist jetzt als gültige, rein diagnostische Hint-Struktur erlaubt. Die Icebreaker-Spezialfälle wurden enger beschrieben, `breaker.unknown_special` bei Morphing Tool und Fubar abgebaut, und generische Search-/Recovery-Karten erzeugen keinen pauschalen `runner.search.breaker`-Derived-Anchor mehr.

Keine Änderung erzeugt Plannerwirkung, Action Scores, PlanWeights, Targeting-KI, Engine-Regeln, Legalität, Profile/Defaults, UI-Derivationslogik oder Kartenpool-/Proteus-Baseline-Korrekturen.

## Schema- und Katalogänderungen

- TargetProfile V1 ist in der Hint-Ontologie valide:
  - `schemaVersion=target-profile-v1`
  - `kind`: `install_target`, `mode_choice`, `search_install_target`, `hosted_install_target`, `use_target`, `replacement_target`
  - `timing`: unter anderem `on_install`, `on_play`, `paid_action`, `during_ice_encounter`, `after_successful_run`, `replacement_window`
  - `targetType`: `installed_ice`, `ice_type`, `program`, `icebreaker`, `hosted_program`, `server`, `card`
  - kontrollierte `preferences`, `avoid` und `hiddenInfoPolicy`
- Der Taktiksignal-Katalog enthält jetzt 79 Signale.
- Neue support-only Signale:
  - `breaker.delayed_action_cost`
  - `breaker.ends_run_after_use`
  - `breaker.hosted_strength_penalty`
  - `breaker.multi_subroutine_break`
  - `breaker.one_time_mode_choice`
  - `breaker.scaling_strength`
  - `breaker.stealth_payment_loss`
  - `setup.hand_size`
  - `setup.memory`
  - `setup.program_host`
- `setup.recovery` ist jetzt support-only. `setup.search` ankert `runner.search.breaker` nur noch in der engeren Programmsuche mit strukturiertem `target=program`.

## Kartenentscheidungen

| Karte | Anpassung |
| --- | --- |
| Black Widow | TargetProfile V1 `install_target` für gewähltes installed ICE ergänzt. |
| Morphing Tool | `breaker.unknown_special` entfernt; `configurableCoverage`, `reconfigurableType`, `coverageCandidates` und zwei `mode_choice`-TargetProfiles ergänzt. |
| Fubar | `breaker.unknown_special` vermieden; `configurableCoverage`, `oneTimeModeChoice`, `stealth_loss` und `mode_choice`-TargetProfile ergänzt. |
| Airport Locker | V1-TargetProfile `search_install_target` für Programmauswahl während ICE-Encounter ergänzt; Breaker-Suche bleibt echter Anchor. |
| Lockjaw | V1-TargetProfile `use_target` für temporären Icebreaker-Strength-Bonus ergänzt. |
| Personal Touch, The | V1-TargetProfile `use_target` für permanenten Icebreaker-Strength-Counter ergänzt. |
| Pattel's Virus | V1-TargetProfile `use_target` für Strength-Reduction-Counter auf installed ICE ergänzt. |
| Dropp | `breaker.ends_run_after_use` wird aus `ends_run_after_use` abgeleitet. |
| Japanese Water Torture | `breaker.delayed_action_cost` wird aus `forgo_actions` abgeleitet. |
| Big Frackin' Gun, Redecorator, Pile Driver | `breaker.multi_subroutine_break` mit `maxSubroutinesPerBreak` abgeleitet. |
| Skeleton Passkeys | `pumpStrengthAmount=4` wird als echter Mehrwert-Pump erfasst. |
| Bulldozer, Wrecking Ball, Hammer, Jackhammer, Pile Driver, Ramming Piston, Fubar | `breaker.stealth_payment_loss` wird aus `stealth_loss` abgeleitet. |
| Dupré, Snowball | `breaker.scaling_strength` wird aus Scaling-/Temporary-Strength-Mechanik abgeleitet. |
| Afreet, Imp | `setup.program_host` und `breaker.hosted_strength_penalty` werden abgeleitet; V1-Hosting-TargetProfile bleibt diagnostisch und Human-Review-pflichtig. |
| Succubus | `setup.program_host` und V1-Hosting-TargetProfile werden abgeleitet. |
| Eurocorpse (TM) Spin Chip | Hosting-TargetProfile für hosted Icebreaker ergänzt; Recurring-Breaker-Credit bleibt bestehen. |
| Cortical Cybermodem, Sunburst Cranial Interface | `setup.memory` und `setup.hand_size` werden sichtbar. |
| Arasaka Portable Prototype, Artemis 2020, Parraline 5750, Raven Microcyb Eagle, Raven Microcyb Owl | `setup.memory` ergänzt; Arasaka erhält diagnostisches `costProfile.agendaPoints=1`. |
| Microtech Backup Drive | `runner.search.breaker`-Anchor entfernt; V1-`replacement_target` für Program-Trash-Replacement ergänzt. |
| Gideon's Pawnshop, If You Want It Done Right..., Mantis, Fixer-at-Large | Zu breiter generischer Search-/Recovery-Anchor entfernt; bleibt support-only bis eigene generische Search-/Recovery-Strategie existiert. |

## Vollständige Post-Review-Liste

Post-Review-Stand aus aktuellem compiled Hint und Inspector Index. Gezählt werden die 85 aktiven/compiled AI018-Zuordnungen aus dem ursprünglichen Sweep; zusätzlich bleiben 7 inaktive Classic-Kandidaten außerhalb des aktiven AI-Hint-Scopes dokumentiert.

- `breaker_search_or_recovery_support`: 10
- `breaker_strength_or_break_cost_support`: 4
- `checked_related_no_breaker_change`: 8
- `icebreaker_coverage_or_breaker_special`: 50
- `recurring_breaker_credit_support`: 13

| Karte | Kategorie | Post-Review-Taktiksignale | Strategieanker | strategicRole | TargetProfile | Abnahme-Status |
| --- | --- | --- | --- | --- | --- | --- |
| `efficient_fracter`<br>Efficient Fracter | `icebreaker_coverage_or_breaker_special` | breaker.wall | - | - | not_required | `confirmed_after_post_review` |
| `onr_proteus_079_big-frackin-gun`<br>Big Frackin' Gun | `icebreaker_coverage_or_breaker_special` | breaker.multi_subroutine_break<br>breaker.sentry | - | - | not_required | `signals_enriched_after_post_review` |
| `onr_proteus_080_black-widow`<br>Black Widow | `icebreaker_coverage_or_breaker_special` | breaker.sentry<br>breaker.strength_bonus_vs_chosen_ice<br>breaker.targeted_ice_bonus | - | - | v1:install_target:on_install:installed_ice | `target_profile_v1_structured` |
| `onr_proteus_081_boring-bit`<br>Boring Bit | `icebreaker_coverage_or_breaker_special` | breaker.wall | - | - | not_required | `confirmed_after_post_review` |
| `onr_proteus_082_bulldozer`<br>Bulldozer | `icebreaker_coverage_or_breaker_special` | breaker.stealth_payment_loss<br>breaker.wall | - | - | not_required | `signals_enriched_after_post_review` |
| `onr_proteus_083_corrosion`<br>Corrosion | `icebreaker_coverage_or_breaker_special` | breaker.wall | - | - | not_required | `confirmed_after_post_review` |
| `onr_proteus_087_forwards-legacy`<br>Forward's Legacy | `icebreaker_coverage_or_breaker_special` | breaker.risky<br>breaker.sentry | - | - | not_required | `confirmed_after_post_review` |
| `onr_proteus_088_fubar`<br>Fubar | `icebreaker_coverage_or_breaker_special` | breaker.configurable_coverage<br>breaker.one_time_mode_choice<br>breaker.stealth_payment_loss | - | - | v1:mode_choice:paid_action:ice_type | `target_profile_v1_structured` |
| `onr_proteus_091_lockjaw`<br>Lockjaw | `breaker_strength_or_break_cost_support` | breaker.support<br>run.break_cost_support | - | support_tool | v1:use_target:during_ice_encounter:icebreaker | `target_profile_v1_structured` |
| `onr_proteus_092_morphing-tool`<br>Morphing Tool | `icebreaker_coverage_or_breaker_special` | breaker.configurable_coverage<br>breaker.reconfigurable_type | - | - | v1:mode_choice:on_install:ice_type<br>v1:mode_choice:paid_action:ice_type | `target_profile_v1_structured` |
| `onr_proteus_093_redecorator`<br>Redecorator | `icebreaker_coverage_or_breaker_special` | breaker.multi_subroutine_break<br>breaker.sentry | - | - | not_required | `signals_enriched_after_post_review` |
| `onr_proteus_095_skeleton-passkeys`<br>Skeleton Passkeys | `icebreaker_coverage_or_breaker_special` | breaker.code_gate | - | - | not_required | `confirmed_after_post_review` |
| `onr_proteus_100_wrecking-ball`<br>Wrecking Ball | `icebreaker_coverage_or_breaker_special` | breaker.stealth_payment_loss<br>breaker.wall | - | - | not_required | `signals_enriched_after_post_review` |
| `onr_proteus_101_all-hands`<br>All-Hands | `checked_related_no_breaker_change` | access.hq_multiaccess | runner.hq_pressure<br>runner.interface_closeout | payoff_anchor | not_required | `confirmed_after_post_review` |
| `onr_proteus_115_personal-touch-the`<br>Personal Touch, The | `breaker_strength_or_break_cost_support` | breaker.support<br>run.break_cost_support | - | support_tool | v1:use_target:on_play:icebreaker | `target_profile_v1_structured` |
| `onr_proteus_122_rush-hour`<br>Rush Hour | `checked_related_no_breaker_change` | access.rnd_multiaccess | runner.interface_closeout<br>runner.rnd_pressure | payoff_anchor | not_required | `confirmed_after_post_review` |
| `onr_proteus_128_airport-locker`<br>Airport Locker | `breaker_search_or_recovery_support` | breaker.emergency_search<br>breaker.search_during_encounter<br>setup.install_support<br>setup.search | runner.search.breaker | engine_anchor | legacy:stack:program:install<br>v1:search_install_target:during_ice_encounter:program | `target_profile_v1_structured` |
| `onr_proteus_134_cortical-cybermodem`<br>Cortical Cybermodem | `recurring_breaker_credit_support` | economy.recurring<br>economy.recurring_breaker_credit<br>setup.hand_size<br>setup.memory | - | support_tool | not_required | `signals_enriched_after_post_review` |
| `onr_proteus_139_eurocorpse-tm-spin-chip`<br>Eurocorpse (TM) Spin Chip | `recurring_breaker_credit_support` | economy.recurring<br>economy.recurring_breaker_credit<br>setup.program_host | - | support_tool | v1:hosted_install_target:on_install:icebreaker | `target_profile_v1_structured` |
| `onr_proteus_151_sunburst-cranial-interface`<br>Sunburst Cranial Interface | `recurring_breaker_credit_support` | economy.recurring<br>economy.recurring_breaker_credit<br>setup.hand_size<br>setup.memory | - | support_tool | not_required | `signals_enriched_after_post_review` |
| `onr_v1_001_afreet`<br>Afreet | `checked_related_no_breaker_change` | breaker.hosted_strength_penalty<br>setup.program_host | - | - | v1:hosted_install_target:on_install:program | `target_profile_v1_structured` |
| `onr_v1_002_ai-boon`<br>AI Boon | `icebreaker_coverage_or_breaker_special` | breaker.risky<br>breaker.sentry | - | - | not_required | `confirmed_after_post_review` |
| `onr_v1_004_bakdoor`<br>Bakdoor™ | `checked_related_no_breaker_change` | defense.trace_defense | runner.survival_defense | defensive_tool | schema_gap_hosted_program_target | `confirmed_after_post_review` |
| `onr_v1_005_bartmoss-memorial-icebreaker`<br>Bartmoss Memorial Icebreaker | `icebreaker_coverage_or_breaker_special` | breaker.risky<br>breaker.self_trash_risk<br>breaker.universal | - | emergency_tool | not_required | `confirmed_after_post_review` |
| `onr_v1_006_black-dahlia`<br>Black Dahlia | `icebreaker_coverage_or_breaker_special` | breaker.sentry | - | - | not_required | `confirmed_after_post_review` |
| `onr_v1_007_blink`<br>Blink | `icebreaker_coverage_or_breaker_special` | breaker.risky<br>breaker.universal | - | - | not_required | `confirmed_after_post_review` |
| `onr_v1_011_cloak`<br>Cloak | `recurring_breaker_credit_support` | economy.recurring<br>economy.recurring_breaker_credit | - | support_tool | not_required | `confirmed_after_post_review` |
| `onr_v1_012_clown`<br>Clown | `icebreaker_coverage_or_breaker_special` | breaker.support<br>ice.strength_reduction<br>run.break_cost_support | - | support_tool | not_required | `confirmed_after_post_review` |
| `onr_v1_013_cockroach`<br>Cockroach | `checked_related_no_breaker_change` | - | - | - | not_required | `confirmed_after_post_review` |
| `onr_v1_014_codecracker`<br>Codecracker | `icebreaker_coverage_or_breaker_special` | breaker.code_gate | - | - | not_required | `confirmed_after_post_review` |
| `onr_v1_015_codeslinger`<br>Codeslinger | `icebreaker_coverage_or_breaker_special` | breaker.sentry | - | - | not_required | `confirmed_after_post_review` |
| `onr_v1_016_cyfermaster`<br>Cyfermaster™ | `icebreaker_coverage_or_breaker_special` | breaker.code_gate | - | - | not_required | `confirmed_after_post_review` |
| `onr_v1_018_dogcatcher`<br>Dogcatcher | `icebreaker_coverage_or_breaker_special` | breaker.watchdog | - | - | not_required | `confirmed_after_post_review` |
| `onr_v1_019_dropp`<br>Dropp™ | `icebreaker_coverage_or_breaker_special` | breaker.ends_run_after_use<br>breaker.universal | - | - | not_required | `signals_enriched_after_post_review` |
| `onr_v1_020_dupre`<br>Dupré | `icebreaker_coverage_or_breaker_special` | breaker.code_gate<br>breaker.scaling_strength | - | - | not_required | `signals_enriched_after_post_review` |
| `onr_v1_021_dwarf`<br>Dwarf | `icebreaker_coverage_or_breaker_special` | breaker.wall | - | - | not_required | `confirmed_after_post_review` |
| `onr_v1_023_evil-twin`<br>Evil Twin | `icebreaker_coverage_or_breaker_special` | breaker.sentry<br>defense.damage_prevention | runner.survival_defense | defensive_tool | not_required | `confirmed_after_post_review` |
| `onr_v1_027_flak`<br>Flak | `icebreaker_coverage_or_breaker_special` | breaker.ap | - | - | not_required | `confirmed_after_post_review` |
| `onr_v1_030_grubb`<br>Grubb | `icebreaker_coverage_or_breaker_special` | breaker.wall | - | - | not_required | `confirmed_after_post_review` |
| `onr_v1_031_hammer`<br>Hammer | `icebreaker_coverage_or_breaker_special` | breaker.stealth_payment_loss<br>breaker.wall | - | - | not_required | `signals_enriched_after_post_review` |
| `onr_v1_033_imp`<br>Imp | `checked_related_no_breaker_change` | breaker.hosted_strength_penalty<br>setup.program_host | - | - | v1:hosted_install_target:on_install:program | `target_profile_v1_structured` |
| `onr_v1_035_invisibility`<br>Invisibility | `recurring_breaker_credit_support` | economy.recurring<br>economy.recurring_breaker_credit | - | support_tool | not_required | `confirmed_after_post_review` |
| `onr_v1_036_jackhammer`<br>Jackhammer | `icebreaker_coverage_or_breaker_special` | breaker.stealth_payment_loss<br>breaker.wall | - | - | not_required | `signals_enriched_after_post_review` |
| `onr_v1_037_japanese-water-torture`<br>Japanese Water Torture | `icebreaker_coverage_or_breaker_special` | breaker.delayed_action_cost<br>breaker.wall | - | - | not_required | `signals_enriched_after_post_review` |
| `onr_v1_039_krash`<br>Krash | `icebreaker_coverage_or_breaker_special` | breaker.universal | - | - | not_required | `confirmed_after_post_review` |
| `onr_v1_040_loony-goon`<br>Loony Goon | `icebreaker_coverage_or_breaker_special` | breaker.sentry | - | - | not_required | `confirmed_after_post_review` |
| `onr_v1_043_mystery-box`<br>Mystery Box | `breaker_search_or_recovery_support` | setup.install_discount<br>setup.search | runner.search.breaker | engine_anchor | legacy:stack_top:program:install | `confirmed_after_post_review` |
| `onr_v1_046_pattels-virus`<br>Pattel’s Virus | `breaker_strength_or_break_cost_support` | breaker.support<br>ice.strength_reduction<br>run.break_cost_support | - | support_tool | v1:use_target:after_successful_run:installed_ice | `target_profile_v1_structured` |
| `onr_v1_047_pile-driver`<br>Pile Driver | `icebreaker_coverage_or_breaker_special` | breaker.multi_subroutine_break<br>breaker.stealth_payment_loss<br>breaker.wall | - | - | not_required | `signals_enriched_after_post_review` |
| `onr_v1_052_raffles`<br>Raffles | `icebreaker_coverage_or_breaker_special` | breaker.code_gate | - | - | not_required | `confirmed_after_post_review` |
| `onr_v1_053_ramming-piston`<br>Ramming Piston | `icebreaker_coverage_or_breaker_special` | breaker.stealth_payment_loss<br>breaker.wall | - | - | not_required | `signals_enriched_after_post_review` |
| `onr_v1_054_raptor`<br>Raptor | `icebreaker_coverage_or_breaker_special` | breaker.sentry | - | - | not_required | `confirmed_after_post_review` |
| `onr_v1_055_reflector`<br>Reflector | `icebreaker_coverage_or_breaker_special` | breaker.ap | - | - | not_required | `confirmed_after_post_review` |
| `onr_v1_056_replicator`<br>Replicator | `icebreaker_coverage_or_breaker_special` | breaker.trace | - | - | not_required | `confirmed_after_post_review` |
| `onr_v1_059_self-modifying-code`<br>Self-Modifying Code | `breaker_search_or_recovery_support` | setup.search | runner.search.breaker | engine_anchor | legacy:stack:program:install | `confirmed_after_post_review` |
| `onr_v1_060_shaka`<br>Shaka | `icebreaker_coverage_or_breaker_special` | breaker.sentry | - | - | not_required | `confirmed_after_post_review` |
| `onr_v1_066_snowball`<br>Snowball | `icebreaker_coverage_or_breaker_special` | breaker.scaling_strength<br>breaker.sentry | - | - | not_required | `signals_enriched_after_post_review` |
| `onr_v1_069_succubus`<br>Succubus | `checked_related_no_breaker_change` | setup.program_host | - | - | v1:hosted_install_target:on_install:program | `target_profile_v1_structured` |
| `onr_v1_070_tinweasel`<br>Tinweasel | `icebreaker_coverage_or_breaker_special` | breaker.code_gate | - | - | not_required | `confirmed_after_post_review` |
| `onr_v1_071_vewy-vewy-quiet`<br>Vewy Vewy Quiet | `recurring_breaker_credit_support` | economy.recurring<br>economy.recurring_breaker_credit | - | support_tool | not_required | `confirmed_after_post_review` |
| `onr_v1_072_wild-card`<br>Wild Card | `icebreaker_coverage_or_breaker_special` | breaker.sentry | - | - | not_required | `confirmed_after_post_review` |
| `onr_v1_073_wizards-book`<br>Wizard’s Book | `icebreaker_coverage_or_breaker_special` | breaker.code_gate | - | - | not_required | `confirmed_after_post_review` |
| `onr_v1_074_worm`<br>Worm | `icebreaker_coverage_or_breaker_special` | breaker.wall | - | - | not_required | `confirmed_after_post_review` |
| `onr_v1_082_deal-with-militech`<br>Deal with Militech | `breaker_strength_or_break_cost_support` | breaker.support<br>run.break_cost_support | - | support_tool | not_required | `confirmed_after_post_review` |
| `onr_v1_087_forgotten-backup-chip`<br>Forgotten Backup Chip | `breaker_search_or_recovery_support` | setup.recovery<br>setup.search | runner.search.breaker | enabler | not_required | `confirmed_after_post_review` |
| `onr_v1_089_gideons-pawnshop`<br>Gideon’s Pawnshop | `breaker_search_or_recovery_support` | setup.recovery<br>setup.search | - | enabler | not_required | `generic_search_recovery_anchor_removed_deferred` |
| `onr_v1_093_if-you-want-it-done-right`<br>If You Want It Done Right... | `breaker_search_or_recovery_support` | setup.search | - | enabler | not_required | `generic_search_recovery_anchor_removed_deferred` |
| `onr_v1_099_mantis-fixer-at-large`<br>Mantis, Fixer-at-Large | `breaker_search_or_recovery_support` | setup.draw<br>setup.search | - | enabler | not_required | `generic_search_recovery_anchor_removed_deferred` |
| `onr_v1_110_sneak-preview`<br>Sneak Preview | `breaker_search_or_recovery_support` | setup.install_discount<br>setup.search | runner.search.breaker | enabler | not_required | `confirmed_after_post_review` |
| `onr_v1_114_temple-microcode-outlet`<br>Temple Microcode Outlet | `breaker_search_or_recovery_support` | setup.draw<br>setup.search | runner.search.breaker | enabler | not_required | `confirmed_after_post_review` |
| `onr_v1_119_arasaka-portable-prototype`<br>Arasaka Portable Prototype | `recurring_breaker_credit_support` | economy.recurring<br>economy.recurring_breaker_credit<br>setup.memory | - | support_tool | not_required | `signals_enriched_after_post_review` |
| `onr_v1_122_artemis-2020`<br>Artemis 2020 | `recurring_breaker_credit_support` | economy.recurring<br>economy.recurring_breaker_credit<br>setup.memory | - | support_tool | not_required | `signals_enriched_after_post_review` |
| `onr_v1_124_corolla-speed-chip`<br>Corolla Speed Chip | `recurring_breaker_credit_support` | economy.recurring<br>economy.recurring_breaker_credit | - | support_tool | not_required | `confirmed_after_post_review` |
| `onr_v1_131_microtech-backup-drive`<br>Microtech Backup Drive | `breaker_search_or_recovery_support` | setup.recovery | - | emergency_tool | v1:replacement_target:replacement_window:program | `generic_search_recovery_anchor_removed_deferred` |
| `onr_v1_137_parraline-5750`<br>Parraline 5750 | `recurring_breaker_credit_support` | economy.recurring<br>economy.recurring_breaker_credit<br>setup.memory | - | support_tool | not_required | `signals_enriched_after_post_review` |
| `onr_v1_140_raven-microcyb-eagle`<br>Raven Microcyb Eagle | `recurring_breaker_credit_support` | defense.damage_prevention<br>economy.recurring<br>economy.recurring_breaker_credit<br>setup.memory | runner.survival_defense | defensive_tool<br>support_tool | not_required | `signals_enriched_after_post_review` |
| `onr_v1_141_raven-microcyb-owl`<br>Raven Microcyb Owl | `recurring_breaker_credit_support` | economy.recurring<br>economy.recurring_breaker_credit<br>setup.memory | - | support_tool | not_required | `signals_enriched_after_post_review` |
| `onr_v1_147_zz22-speed-chip`<br>ZZ22 Speed Chip | `recurring_breaker_credit_support` | economy.recurring<br>economy.recurring_breaker_credit | - | support_tool | not_required | `confirmed_after_post_review` |
| `onr_v1_187_wilson-weeflerunner-apprentice`<br>Wilson, Weeflerunner Apprentice | `checked_related_no_breaker_change` | defense.damage_prevention<br>defense.tag_prevention | runner.survival_defense | defensive_tool | not_required | `confirmed_after_post_review` |
| `simple_decoder`<br>Simple Decoder | `icebreaker_coverage_or_breaker_special` | breaker.code_gate | - | - | not_required | `confirmed_after_post_review` |
| `simple_fracter`<br>Simple Fracter | `icebreaker_coverage_or_breaker_special` | breaker.wall | - | - | not_required | `confirmed_after_post_review` |
| `simple_killer`<br>Simple Killer | `icebreaker_coverage_or_breaker_special` | breaker.sentry | - | - | not_required | `confirmed_after_post_review` |
| `v08_adaptive_killer`<br>Adaptive Killer | `icebreaker_coverage_or_breaker_special` | breaker.sentry | - | - | not_required | `confirmed_after_post_review` |
| `v08_precise_decoder`<br>Precise Decoder | `icebreaker_coverage_or_breaker_special` | breaker.code_gate | - | - | not_required | `confirmed_after_post_review` |
| `v08_steady_fracter`<br>Steady Fracter | `icebreaker_coverage_or_breaker_special` | breaker.wall | - | - | not_required | `confirmed_after_post_review` |

### Inaktive Classic-Kandidaten

| Karte | Titel | Entscheidung |
| --- | --- | --- |
| `onr_classic_027_early-worm` | Early Worm | Geprüft, aber nicht in aktiven/compiled AI-Hints enthalten; keine AI018-Hintänderung. |
| `onr_classic_028_matador` | Matador | Geprüft, aber nicht in aktiven/compiled AI-Hints enthalten; keine AI018-Hintänderung. |
| `onr_classic_029_ms-todon` | MS-todon | Geprüft, aber nicht in aktiven/compiled AI-Hints enthalten; keine AI018-Hintänderung. |
| `onr_classic_030_psychic-friend` | Psychic Friend | Geprüft, aber nicht in aktiven/compiled AI-Hints enthalten; keine AI018-Hintänderung. |
| `onr_classic_031_rent-i-con` | Rent-I-Con | Geprüft, aber nicht in aktiven/compiled AI-Hints enthalten; keine AI018-Hintänderung. |
| `onr_classic_039_library-search` | Library Search | Geprüft, aber nicht in aktiven/compiled AI-Hints enthalten; keine AI018-Hintänderung. |
| `onr_classic_048_omnitech-spinal-tap-cybermodem` | Omnitech "Spinal Tap" Cybermodem | Geprüft, aber nicht in aktiven/compiled AI-Hints enthalten; keine AI018-Hintänderung. |

## Separate Search-/Recovery-Prüfung

Die Search-/Recovery-Prüfung ist getrennt von der allgemeinen Icebreaker-Liste ausgewiesen. Ergebnis: 10 Fälle geprüft; 6 behalten `runner.search.breaker` als bewussten Program-/Breaker-Such- oder Program-Recovery-Anker, 4 generische Search-/Recovery-Fälle bleiben support-only/deferred ohne `runner.search.breaker`.

| Karte | Search-/Recovery-Signale | Strategieanker nach Review | Entscheidung | Begründung |
| --- | --- | --- | --- | --- |
| `onr_proteus_128_airport-locker`<br>Airport Locker | breaker.emergency_search<br>breaker.search_during_encounter<br>setup.install_support<br>setup.search | runner.search.breaker | `confirmed_breaker_search_anchor` | Encounter-Stack-Programminstallation kann das aktuelle ICE beantworten; V1 search_install_target grenzt die diagnostische Zielwahl ein. |
| `onr_v1_043_mystery-box`<br>Mystery Box | setup.install_discount<br>setup.search | runner.search.breaker | `confirmed_program_install_search_anchor` | Top-five-Programminstallation bleibt ein Breaker-Search-Engine-Anker; lookCount, oncePerRun, showToOpponent und stack_top bleiben im bestehenden Schema sichtbar. |
| `onr_v1_059_self-modifying-code`<br>Self-Modifying Code | setup.search | runner.search.breaker | `confirmed_breaker_search_anchor` | Stack-Programmsuche mit Installation ist ein direkter Breaker-Beschaffungspfad und bleibt engine_anchor. |
| `onr_v1_087_forgotten-backup-chip`<br>Forgotten Backup Chip | setup.recovery<br>setup.search | runner.search.breaker | `retained_program_recovery_anchor` | Program-Recovery auf die Hand kann fehlende Breaker-Coverage wiederherstellen; bewusst behalten, solange runner.search.breaker Breaker-Suche und -Recovery bündelt. |
| `onr_v1_089_gideons-pawnshop`<br>Gideon’s Pawnshop | setup.recovery<br>setup.search | - | `removed_generic_recovery_anchor_deferred` | Any-card-Trash-Recovery ist zu breit für runner.search.breaker; bleibt setup.search/setup.recovery support-only und Human-Review-deferred. |
| `onr_v1_093_if-you-want-it-done-right`<br>If You Want It Done Right... | setup.search | - | `removed_generic_search_anchor_deferred` | Top-five-Any-card-Auswahl ist generische Answer-Suche, kein breaker-spezifischer Suchanker. |
| `onr_v1_099_mantis-fixer-at-large`<br>Mantis, Fixer-at-Large | setup.draw<br>setup.search | - | `removed_generic_search_anchor_deferred` | Any-card-Tutor/Draw-Support ist für runner.search.breaker zu breit, bis eine generische runner.search.answer-Strategie existiert. |
| `onr_v1_110_sneak-preview`<br>Sneak Preview | setup.install_discount<br>setup.search | runner.search.breaker | `confirmed_program_install_search_anchor` | Programmsuche mit Installation bleibt ein Breaker-Beschaffungspfad; End-of-turn return ist Kartennachteil-Kontext und kein neuer Anchor. |
| `onr_v1_114_temple-microcode-outlet`<br>Temple Microcode Outlet | setup.draw<br>setup.search | runner.search.breaker | `confirmed_program_search_anchor` | Programmsuche auf die Hand kann Breaker-Coverage finden und bleibt ein enger Breaker-Search-Enabler. |
| `onr_v1_131_microtech-backup-drive`<br>Microtech Backup Drive | setup.recovery | - | `removed_recovery_resilience_anchor_deferred` | Program-trash-Replacement/Recovery ist Resilienz, keine reine Breaker-Suche; V1 replacement_target dokumentiert die diagnostische Zielwahl. |

## Grenzen

- TargetProfile V1 ist Diagnose- und Review-Struktur, keine Targeting-KI.
- Es wurden keine neuen Strategy IDs eingeführt.
- Es wurden keine Action-Auswahl-, Breakkosten-, Planner-, Score- oder PlanWeight-Verbraucher angeschlossen.
- Normale Breaker bleiben Coverage-/Spezialsignale ohne pauschalen Strategieanker.
- Hidden Info bleibt ausgeschlossen: Präferenzen sind nur über sichtbare, bekannte oder LegalAction-bereitgestellte Ziele auswertbar.

## Verifikation

- `node scripts/check-ai-derived-facts.mjs --write`
- `node scripts/check-ai-derived-facts-full.mjs --write`
- `corepack pnpm build:ai-compiled-hints`
- `corepack pnpm build:ai-hint-inspector-index`
- `node scripts/check-ai-hint-compiled-index.mjs --write`
- `corepack pnpm check:ai-strategy-taxonomy`
- `corepack pnpm check:ai-compiled-hints`
- `corepack pnpm check:ai-hint-inspector-index`
- `corepack pnpm check:ai-hint-compiled-index`
- `corepack pnpm check:ai-manual-overlays`
- `corepack pnpm check:ai-hint-quality`
- `corepack pnpm check:ai-approval-consistency`
- `corepack pnpm check:ai-deck-doctrine-strategy`
- `node -e "const j=require('./docs/reviews/ai/ai018-adjustments-icebreaker-semantics-review-report-2026-06-01.json'); if(j.postReviewAssignments.length!==85||j.inactiveClassicChecked.length!==7||j.searchRecoveryReview.length!==10||j.postReviewListSummary.searchRecoveryAnchorsRetained!==6||j.postReviewListSummary.searchRecoveryGenericAnchorsRemoved!==4) process.exit(1)"`
- `corepack pnpm --filter @netgrid/ai test`
- `corepack pnpm --filter @netgrid/ai exec tsc -p tsconfig.json --noEmit`
- `corepack pnpm --filter @netgrid/web exec tsc -p tsconfig.json --noEmit`
- `git diff --check`
