# AI018 Complete Icebreaker Semantics and TargetProfile Sweep

Aufgabe-ID: AI018

## Kurzfazit

AI018 schließt den vollständigen aktiven Icebreaker- und Breaker-Support-Sweep ab. Geprüft wurden 85 aktive/compiled Runner-Zuordnungen plus 7 inaktive Classic-Kandidaten außerhalb des aktiven AI-Hint-Scopes. 34 aktive Karten/Fälle wurden geändert, 51 aktive Fälle bleiben nach Prüfung bewusst unverändert.

Die kontrollierte Strategy-ID-Umstellung ist umgesetzt: `runner.breaker_search` wurde in aktiven Daten, Overlays, Tests und generierten Artefakten zu `runner.search.breaker`. Normale Breaker bleiben reine Coverage-/Spezialsignale ohne pauschalen Strategieanker. Breaker-Credits werden nicht mehr als Trash-Credit-Ökonomie gelesen, sondern als `economy.recurring_breaker_credit`.

Keine Plannerwirkung, keine Action-Score-Änderung, keine PlanWeight-Änderung, keine Engine-Regeländerung, keine neue Legalität, keine Profil-/Default-Umschaltung, keine Targeting-KI und keine UI-Derivationslogik wurden eingeführt. `anti.ice.*` bleibt nicht vorhanden.

## Geänderte Verträge

- `data/ai/strategy-goals-v1.json`: Strategy-ID `runner.search.breaker` als kontrollierte Umbenennung der Breaker-Suche.
- `data/ai/tactic-signals-v1.json`: Katalogumfang jetzt 69 Signale in 29 Gruppen; neues support-only Signal `economy.recurring_breaker_credit`.
- `data/ai/function-signal-derivation-v1.json`: generische support-only Ableitung für recurring Breaker-/Killer-Credits und Runner-seitige Breaker-Strength-/Breakkosten-Unterstützung.
- `data/ai/ai-card-hints-active.json`: gezielte Hint-Korrekturen für Breaker-Credits, Strength-Support, Testset-BreakerProfile und Search-Strategy-ID.

## Kategorien

| Kategorie | geprüft | geändert |
| --- | ---: | ---: |
| `breaker_search_or_recovery_support` | 10 | 10 |
| `breaker_strength_or_break_cost_support` | 4 | 4 |
| `checked_related_no_breaker_change` | 8 | 0 |
| `icebreaker_coverage_or_breaker_special` | 50 | 7 |
| `recurring_breaker_credit_support` | 13 | 13 |

## TargetProfile-Befund

Bestehende Runtime-Struktur wurde nur dort genutzt, wo das vorhandene Schema passt: Stack-/Top-of-Stack-Programmsuche mit optionaler Installation. Das betrifft vor allem `Airport Locker`, `Mystery Box` und `Self-Modifying Code`.

Für installierte ICE-Zielwahl, installierte Icebreaker-Zielwahl, Mode-Choice und Hosting-Ziele erzwingt AI018 keine neue Runtime-Struktur. Diese Fälle bleiben als Vorschläge dokumentiert: `Black Widow`, `Morphing Tool`, `Pattel's Virus`, `Lockjaw`, `Personal Touch, The` sowie Hosting-/Daemon-Fälle wie `Afreet`, `Bakdoor`, `Imp` und `Succubus`.

## Vollständige geprüfte Zuordnungsliste

| Karte | Titel | Kategorie | Taktiksignale | Strategieanker | strategicRole | TargetProfile | geändert |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `efficient_fracter` | Efficient Fracter | `icebreaker_coverage_or_breaker_special` | `breaker.wall` | - | - | `not_required` | ja |
| `onr_proteus_079_big-frackin-gun` | Big Frackin' Gun | `icebreaker_coverage_or_breaker_special` | `breaker.sentry` | - | - | `not_required` | nein |
| `onr_proteus_080_black-widow` | Black Widow | `icebreaker_coverage_or_breaker_special` | `breaker.sentry`, `breaker.strength_bonus_vs_chosen_ice`, `breaker.targeted_ice_bonus` | - | - | `proposal_only_installed_ice_target` | nein |
| `onr_proteus_081_boring-bit` | Boring Bit | `icebreaker_coverage_or_breaker_special` | `breaker.wall` | - | - | `not_required` | nein |
| `onr_proteus_082_bulldozer` | Bulldozer | `icebreaker_coverage_or_breaker_special` | `breaker.wall` | - | - | `not_required` | nein |
| `onr_proteus_083_corrosion` | Corrosion | `icebreaker_coverage_or_breaker_special` | `breaker.wall` | - | - | `not_required` | nein |
| `onr_proteus_087_forwards-legacy` | Forward's Legacy | `icebreaker_coverage_or_breaker_special` | `breaker.risky`, `breaker.sentry` | - | - | `not_required` | nein |
| `onr_proteus_088_fubar` | Fubar | `icebreaker_coverage_or_breaker_special` | `breaker.unknown_special` | - | - | `not_required` | nein |
| `onr_proteus_091_lockjaw` | Lockjaw | `breaker_strength_or_break_cost_support` | `breaker.support`, `run.break_cost_support` | - | `support_tool` | `proposal_only_installed_icebreaker_target` | ja |
| `onr_proteus_092_morphing-tool` | Morphing Tool | `icebreaker_coverage_or_breaker_special` | `breaker.configurable_coverage`, `breaker.reconfigurable_type`, `breaker.unknown_special` | - | - | `proposal_only_mode_choice` | nein |
| `onr_proteus_093_redecorator` | Redecorator | `icebreaker_coverage_or_breaker_special` | `breaker.sentry` | - | - | `not_required` | nein |
| `onr_proteus_095_skeleton-passkeys` | Skeleton Passkeys | `icebreaker_coverage_or_breaker_special` | `breaker.code_gate` | - | - | `not_required` | nein |
| `onr_proteus_100_wrecking-ball` | Wrecking Ball | `icebreaker_coverage_or_breaker_special` | `breaker.wall` | - | - | `not_required` | nein |
| `onr_proteus_101_all-hands` | All-Hands | `checked_related_no_breaker_change` | `access.hq_multiaccess` | `runner.hq_pressure`, `runner.interface_closeout` | `payoff_anchor` | `not_required` | nein |
| `onr_proteus_115_personal-touch-the` | Personal Touch, The | `breaker_strength_or_break_cost_support` | `breaker.support`, `run.break_cost_support` | - | `support_tool` | `proposal_only_installed_icebreaker_target` | ja |
| `onr_proteus_122_rush-hour` | Rush Hour | `checked_related_no_breaker_change` | `access.rnd_multiaccess` | `runner.interface_closeout`, `runner.rnd_pressure` | `payoff_anchor` | `not_required` | nein |
| `onr_proteus_128_airport-locker` | Airport Locker | `breaker_search_or_recovery_support` | `breaker.emergency_search`, `breaker.search_during_encounter`, `setup.install_support`, `setup.search` | `runner.search.breaker` | `engine_anchor` | `existing_schema` | ja |
| `onr_proteus_134_cortical-cybermodem` | Cortical Cybermodem | `recurring_breaker_credit_support` | `economy.recurring`, `economy.recurring_breaker_credit` | - | `support_tool` | `not_required` | ja |
| `onr_proteus_139_eurocorpse-tm-spin-chip` | Eurocorpse (TM) Spin Chip | `recurring_breaker_credit_support` | `economy.recurring`, `economy.recurring_breaker_credit` | - | `support_tool` | `not_required` | ja |
| `onr_proteus_151_sunburst-cranial-interface` | Sunburst Cranial Interface | `recurring_breaker_credit_support` | `economy.recurring`, `economy.recurring_breaker_credit` | - | `support_tool` | `not_required` | ja |
| `onr_v1_001_afreet` | Afreet | `checked_related_no_breaker_change` | - | - | - | `schema_gap_hosted_program_target` | nein |
| `onr_v1_002_ai-boon` | AI Boon | `icebreaker_coverage_or_breaker_special` | `breaker.risky`, `breaker.sentry` | - | - | `not_required` | nein |
| `onr_v1_004_bakdoor` | Bakdoor™ | `checked_related_no_breaker_change` | `defense.trace_defense` | `runner.survival_defense` | `defensive_tool` | `schema_gap_hosted_program_target` | nein |
| `onr_v1_005_bartmoss-memorial-icebreaker` | Bartmoss Memorial Icebreaker | `icebreaker_coverage_or_breaker_special` | `breaker.risky`, `breaker.self_trash_risk`, `breaker.universal` | - | `emergency_tool` | `not_required` | nein |
| `onr_v1_006_black-dahlia` | Black Dahlia | `icebreaker_coverage_or_breaker_special` | `breaker.sentry` | - | - | `not_required` | nein |
| `onr_v1_007_blink` | Blink | `icebreaker_coverage_or_breaker_special` | `breaker.risky`, `breaker.universal` | - | - | `not_required` | nein |
| `onr_v1_011_cloak` | Cloak | `recurring_breaker_credit_support` | `economy.recurring`, `economy.recurring_breaker_credit` | - | `support_tool` | `not_required` | ja |
| `onr_v1_012_clown` | Clown | `icebreaker_coverage_or_breaker_special` | `breaker.support`, `ice.strength_reduction`, `run.break_cost_support` | - | `support_tool` | `not_required` | nein |
| `onr_v1_013_cockroach` | Cockroach | `checked_related_no_breaker_change` | - | - | - | `not_required` | nein |
| `onr_v1_014_codecracker` | Codecracker | `icebreaker_coverage_or_breaker_special` | `breaker.code_gate` | - | - | `not_required` | nein |
| `onr_v1_015_codeslinger` | Codeslinger | `icebreaker_coverage_or_breaker_special` | `breaker.sentry` | - | - | `not_required` | nein |
| `onr_v1_016_cyfermaster` | Cyfermaster™ | `icebreaker_coverage_or_breaker_special` | `breaker.code_gate` | - | - | `not_required` | nein |
| `onr_v1_018_dogcatcher` | Dogcatcher | `icebreaker_coverage_or_breaker_special` | `breaker.watchdog` | - | - | `not_required` | nein |
| `onr_v1_019_dropp` | Dropp™ | `icebreaker_coverage_or_breaker_special` | `breaker.universal` | - | - | `not_required` | nein |
| `onr_v1_020_dupre` | Dupré | `icebreaker_coverage_or_breaker_special` | `breaker.code_gate` | - | - | `not_required` | nein |
| `onr_v1_021_dwarf` | Dwarf | `icebreaker_coverage_or_breaker_special` | `breaker.wall` | - | - | `not_required` | nein |
| `onr_v1_023_evil-twin` | Evil Twin | `icebreaker_coverage_or_breaker_special` | `breaker.sentry`, `defense.damage_prevention` | `runner.survival_defense` | `defensive_tool` | `not_required` | nein |
| `onr_v1_027_flak` | Flak | `icebreaker_coverage_or_breaker_special` | `breaker.ap` | - | - | `not_required` | nein |
| `onr_v1_030_grubb` | Grubb | `icebreaker_coverage_or_breaker_special` | `breaker.wall` | - | - | `not_required` | nein |
| `onr_v1_031_hammer` | Hammer | `icebreaker_coverage_or_breaker_special` | `breaker.wall` | - | - | `not_required` | nein |
| `onr_v1_033_imp` | Imp | `checked_related_no_breaker_change` | - | - | - | `schema_gap_hosted_program_target` | nein |
| `onr_v1_035_invisibility` | Invisibility | `recurring_breaker_credit_support` | `economy.recurring`, `economy.recurring_breaker_credit` | - | `support_tool` | `not_required` | ja |
| `onr_v1_036_jackhammer` | Jackhammer | `icebreaker_coverage_or_breaker_special` | `breaker.wall` | - | - | `not_required` | nein |
| `onr_v1_037_japanese-water-torture` | Japanese Water Torture | `icebreaker_coverage_or_breaker_special` | `breaker.wall` | - | - | `not_required` | nein |
| `onr_v1_039_krash` | Krash | `icebreaker_coverage_or_breaker_special` | `breaker.universal` | - | - | `not_required` | nein |
| `onr_v1_040_loony-goon` | Loony Goon | `icebreaker_coverage_or_breaker_special` | `breaker.sentry` | - | - | `not_required` | nein |
| `onr_v1_043_mystery-box` | Mystery Box | `breaker_search_or_recovery_support` | `setup.install_discount`, `setup.search` | `runner.search.breaker` | `engine_anchor` | `existing_schema` | ja |
| `onr_v1_046_pattels-virus` | Pattel’s Virus | `breaker_strength_or_break_cost_support` | `breaker.support`, `ice.strength_reduction`, `run.break_cost_support` | - | `support_tool` | `proposal_only_installed_ice_target` | ja |
| `onr_v1_047_pile-driver` | Pile Driver | `icebreaker_coverage_or_breaker_special` | `breaker.wall` | - | - | `not_required` | nein |
| `onr_v1_052_raffles` | Raffles | `icebreaker_coverage_or_breaker_special` | `breaker.code_gate` | - | - | `not_required` | nein |
| `onr_v1_053_ramming-piston` | Ramming Piston | `icebreaker_coverage_or_breaker_special` | `breaker.wall` | - | - | `not_required` | nein |
| `onr_v1_054_raptor` | Raptor | `icebreaker_coverage_or_breaker_special` | `breaker.sentry` | - | - | `not_required` | nein |
| `onr_v1_055_reflector` | Reflector | `icebreaker_coverage_or_breaker_special` | `breaker.ap` | - | - | `not_required` | nein |
| `onr_v1_056_replicator` | Replicator | `icebreaker_coverage_or_breaker_special` | `breaker.trace` | - | - | `not_required` | nein |
| `onr_v1_059_self-modifying-code` | Self-Modifying Code | `breaker_search_or_recovery_support` | `setup.search` | `runner.search.breaker` | `engine_anchor` | `existing_schema` | ja |
| `onr_v1_060_shaka` | Shaka | `icebreaker_coverage_or_breaker_special` | `breaker.sentry` | - | - | `not_required` | nein |
| `onr_v1_066_snowball` | Snowball | `icebreaker_coverage_or_breaker_special` | `breaker.sentry` | - | - | `not_required` | nein |
| `onr_v1_069_succubus` | Succubus | `checked_related_no_breaker_change` | - | - | - | `schema_gap_hosted_program_target` | nein |
| `onr_v1_070_tinweasel` | Tinweasel | `icebreaker_coverage_or_breaker_special` | `breaker.code_gate` | - | - | `not_required` | nein |
| `onr_v1_071_vewy-vewy-quiet` | Vewy Vewy Quiet | `recurring_breaker_credit_support` | `economy.recurring`, `economy.recurring_breaker_credit` | - | `support_tool` | `not_required` | ja |
| `onr_v1_072_wild-card` | Wild Card | `icebreaker_coverage_or_breaker_special` | `breaker.sentry` | - | - | `not_required` | nein |
| `onr_v1_073_wizards-book` | Wizard’s Book | `icebreaker_coverage_or_breaker_special` | `breaker.code_gate` | - | - | `not_required` | nein |
| `onr_v1_074_worm` | Worm | `icebreaker_coverage_or_breaker_special` | `breaker.wall` | - | - | `not_required` | nein |
| `onr_v1_082_deal-with-militech` | Deal with Militech | `breaker_strength_or_break_cost_support` | `breaker.support`, `run.break_cost_support` | - | `support_tool` | `not_required` | ja |
| `onr_v1_087_forgotten-backup-chip` | Forgotten Backup Chip | `breaker_search_or_recovery_support` | `setup.recovery`, `setup.search` | `runner.search.breaker` | `enabler` | `not_required` | ja |
| `onr_v1_089_gideons-pawnshop` | Gideon’s Pawnshop | `breaker_search_or_recovery_support` | `setup.recovery`, `setup.search` | `runner.search.breaker` | `enabler` | `not_required` | ja |
| `onr_v1_093_if-you-want-it-done-right` | If You Want It Done Right... | `breaker_search_or_recovery_support` | `setup.search` | `runner.search.breaker` | `enabler` | `not_required` | ja |
| `onr_v1_099_mantis-fixer-at-large` | Mantis, Fixer-at-Large | `breaker_search_or_recovery_support` | `setup.draw`, `setup.search` | `runner.search.breaker` | `enabler` | `not_required` | ja |
| `onr_v1_110_sneak-preview` | Sneak Preview | `breaker_search_or_recovery_support` | `setup.install_discount`, `setup.search` | `runner.search.breaker` | `enabler` | `not_required` | ja |
| `onr_v1_114_temple-microcode-outlet` | Temple Microcode Outlet | `breaker_search_or_recovery_support` | `setup.draw`, `setup.search` | `runner.search.breaker` | `enabler` | `not_required` | ja |
| `onr_v1_119_arasaka-portable-prototype` | Arasaka Portable Prototype | `recurring_breaker_credit_support` | `economy.recurring`, `economy.recurring_breaker_credit` | - | `support_tool` | `not_required` | ja |
| `onr_v1_122_artemis-2020` | Artemis 2020 | `recurring_breaker_credit_support` | `economy.recurring`, `economy.recurring_breaker_credit` | - | `support_tool` | `not_required` | ja |
| `onr_v1_124_corolla-speed-chip` | Corolla Speed Chip | `recurring_breaker_credit_support` | `economy.recurring`, `economy.recurring_breaker_credit` | - | `support_tool` | `not_required` | ja |
| `onr_v1_131_microtech-backup-drive` | Microtech Backup Drive | `breaker_search_or_recovery_support` | `setup.recovery` | `runner.search.breaker` | `emergency_tool` | `not_required` | ja |
| `onr_v1_137_parraline-5750` | Parraline 5750 | `recurring_breaker_credit_support` | `economy.recurring`, `economy.recurring_breaker_credit` | - | `support_tool` | `not_required` | ja |
| `onr_v1_140_raven-microcyb-eagle` | Raven Microcyb Eagle | `recurring_breaker_credit_support` | `defense.damage_prevention`, `economy.recurring`, `economy.recurring_breaker_credit` | `runner.survival_defense` | `defensive_tool`, `support_tool` | `not_required` | ja |
| `onr_v1_141_raven-microcyb-owl` | Raven Microcyb Owl | `recurring_breaker_credit_support` | `economy.recurring`, `economy.recurring_breaker_credit` | - | `support_tool` | `not_required` | ja |
| `onr_v1_147_zz22-speed-chip` | ZZ22 Speed Chip | `recurring_breaker_credit_support` | `economy.recurring`, `economy.recurring_breaker_credit` | - | `support_tool` | `not_required` | ja |
| `onr_v1_187_wilson-weeflerunner-apprentice` | Wilson, Weeflerunner Apprentice | `checked_related_no_breaker_change` | `defense.damage_prevention`, `defense.tag_prevention` | `runner.survival_defense` | `defensive_tool` | `not_required` | nein |
| `simple_decoder` | Simple Decoder | `icebreaker_coverage_or_breaker_special` | `breaker.code_gate` | - | - | `not_required` | ja |
| `simple_fracter` | Simple Fracter | `icebreaker_coverage_or_breaker_special` | `breaker.wall` | - | - | `not_required` | ja |
| `simple_killer` | Simple Killer | `icebreaker_coverage_or_breaker_special` | `breaker.sentry` | - | - | `not_required` | ja |
| `v08_adaptive_killer` | Adaptive Killer | `icebreaker_coverage_or_breaker_special` | `breaker.sentry` | - | - | `not_required` | ja |
| `v08_precise_decoder` | Precise Decoder | `icebreaker_coverage_or_breaker_special` | `breaker.code_gate` | - | - | `not_required` | ja |
| `v08_steady_fracter` | Steady Fracter | `icebreaker_coverage_or_breaker_special` | `breaker.wall` | - | - | `not_required` | ja |

## Inaktive Classic-Kandidaten außerhalb des aktiven AI-Hint-Scopes

| Karte | Titel | Entscheidung |
| --- | --- | --- |
| `onr_classic_027_early-worm` | Early Worm | Geprüft, aber nicht in aktiven/compiled AI-Hints enthalten; keine AI018-Hintänderung. |
| `onr_classic_028_matador` | Matador | Geprüft, aber nicht in aktiven/compiled AI-Hints enthalten; keine AI018-Hintänderung. |
| `onr_classic_029_ms-todon` | MS-todon | Geprüft, aber nicht in aktiven/compiled AI-Hints enthalten; keine AI018-Hintänderung. |
| `onr_classic_030_psychic-friend` | Psychic Friend | Geprüft, aber nicht in aktiven/compiled AI-Hints enthalten; keine AI018-Hintänderung. |
| `onr_classic_031_rent-i-con` | Rent-I-Con | Geprüft, aber nicht in aktiven/compiled AI-Hints enthalten; keine AI018-Hintänderung. |
| `onr_classic_039_library-search` | Library Search | Geprüft, aber nicht in aktiven/compiled AI-Hints enthalten; keine AI018-Hintänderung. |
| `onr_classic_048_omnitech-spinal-tap-cybermodem` | Omnitech "Spinal Tap" Cybermodem | Geprüft, aber nicht in aktiven/compiled AI-Hints enthalten; keine AI018-Hintänderung. |

## Gate-Stand final

Neu gebaut und geprüft:

- `node scripts/check-ai-derived-facts.mjs --write`
- `node scripts/check-ai-derived-facts-full.mjs --write`
- `corepack pnpm build:ai-compiled-hints`
- `corepack pnpm build:ai-hint-inspector-index`
- `node scripts/check-ai-hint-compiled-index.mjs --write`
- `node scripts/check-ai-generated-fact-batch2-diff-review.mjs --write`
- `node scripts/check-ai-generated-fact-batch2-normalization-dry-run.mjs --write`
- `node scripts/check-ai-generated-fact-batch2-rollup.mjs --write`
- `corepack pnpm check:ai-strategy-taxonomy`
- `corepack pnpm check:ai-compiled-hints`
- `corepack pnpm check:ai-hint-inspector-index`
- `corepack pnpm check:ai-hint-compiled-index`
- `corepack pnpm check:ai-derived-facts`
- `corepack pnpm check:ai-derived-facts-full`
- `corepack pnpm check:ai-manual-overlays`
- `corepack pnpm check:ai-hint-quality`
- `corepack pnpm check:ai-approval-consistency`
- `corepack pnpm check:ai-deck-doctrine-strategy`
- `corepack pnpm --filter @netgrid/ai test`
- `corepack pnpm --filter @netgrid/ai exec tsc -p tsconfig.json --noEmit`
- `corepack pnpm --filter @netgrid/web exec tsc -p tsconfig.json --noEmit`
- `git diff --check`

## Artefakte

- Maschinenlesbarer Report: `docs/reviews/ai/ai018-complete-icebreaker-semantics-targetprofile-sweep-report-2026-06-01.json`
- Compiled Hints: `data/ai/ai-card-hints-compiled.json`
- Inspector Index: `data/ai/ai-hint-inspector-index.json`
