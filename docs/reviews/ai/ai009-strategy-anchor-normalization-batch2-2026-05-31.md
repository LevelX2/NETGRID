# AI009 Strategy Anchor Normalization Batch 2

Aufgabe-ID: AI009

## Kurzfazit

AI009 normalisiert 47 Karten mit echter strategischer Bedeutung auf gültige Strategy-IDs in `lineSupport` und ergänzt eindeutige `strategicRole`-Werte. Der Batch bleibt read-only: keine Plannerwirkung, keine Action-Score- oder PlanWeight-Änderung, keine Engine-/Legalitätsänderung und keine Profil-/Default-Umschaltung. Normale Economy, normale Draw-Karten, normale Breaker und normale ICE wurden nicht pauschal migriert.

## Warum weitere Karten umgestellt wurden

Nach AI003/AI003-1/AI004 ist `lineSupport` kein allgemeines Nützlichkeitslabel mehr, sondern ein enger Strategieanker für echte Payoffs, Engines und klare Strategiebelege. AI009 nutzt vorhandene strukturierte Evidenz aus `effects`, `conditions`, `remoteRole`, `targetProfiles`, Kartentyp/Side und dem AI Hint Inspector Index. `roles` oder `planRoles` wurden nicht allein als Grundlage verwendet.

## Batch-Scope

- Geänderte Karten: 47
- Neue/normierte `lineSupport`-IDs: `corp.asset_economy`, `corp.damage_kill`, `corp.fast_advance`, `corp.ice_tax_glacier`, `corp.remote_scoring`, `corp.tag_trace_punish`, `runner.breaker_search`, `runner.rnd_pressure`, `runner.survival_defense`
- Ergänzte `strategicRole`-Werte: `defensive_tool`, `emergency_tool`, `enabler`, `engine_anchor`, `payoff_anchor`, `punish_payoff`, `scoring_tool`, `support_tool`, `tax_tool`, `win_condition`
- Monolith und Overlays wurden konsistent gehalten, damit compiled Hints und Inspector Index denselben aktiven Stand zeigen.

## Kandidatengruppen

| Gruppe | Karten | cardIds |
| --- | ---: | --- |
| Runner R&D-/Interface-Druck | 2 | onr_v1_017_deep-thought, onr_v1_096_kilroy-was-here |
| Runner Survival/Defense | 5 | onr_v1_022_emergency-self-construct, onr_v1_078_arasaka-owns-you, onr_v1_116_total-genetic-retrofit, onr_v1_167_leland-corporate-bodyguard, onr_v1_185_trauma-team |
| Runner Toolbox-/Search-Engine | 8 | onr_v1_043_mystery-box, onr_v1_059_self-modifying-code, onr_v1_087_forgotten-backup-chip, onr_v1_089_gideons-pawnshop, onr_v1_093_if-you-want-it-done-right, onr_v1_099_mantis-fixer-at-large, onr_v1_110_sneak-preview, onr_v1_114_temple-microcode-outlet |
| Corp Fast-Advance/Score-Beschleunigung | 6 | onr_v1_192_corporate-boon, onr_v1_214_project-babylon, onr_v1_292_management-shake-up, onr_v1_300_project-consultants, onr_v1_304_systematic-layoffs, onr_v1_305_team-restructuring |
| Corp Tag-/Damage-Payoff | 5 | onr_v1_208_on-call-solo-team, onr_v1_217_strike-force-kali, onr_v1_301_punitive-counterstrike, onr_v1_302_scorched-earth, onr_v1_307_urban-renewal |
| Corp Tag-/Trace-/Punish | 3 | onr_v1_285_closed-accounts, onr_v1_286_corporate-detective-agency, onr_v1_299_power-grid-overload |
| Corp Asset-Economy/Horizontal Engine | 8 | onr_v1_308_acme-savings-and-loan, onr_v1_309_bbs-whispering-campaign, onr_v1_311_braindance-campaign, onr_v1_314_corporate-negotiating-center, onr_v1_326_holovid-campaign, onr_v1_329_investment-firm, onr_v1_334_pacifica-regional-ai, onr_v1_344_spinn-public-relations |
| Corp Fast-Advance/Remote-Scoring | 1 | onr_v1_312_chicago-branch |
| Corp Remote-Scoring/ICE-Tax-Engine | 4 | onr_v1_317_data-masons, onr_v1_350_antiquated-interface-routines, onr_v1_355_crystal-palace-station-grid, onr_v1_370_tesseract-fort-construction |
| Corp Remote-Scoring-Protection | 5 | onr_v1_359_jenny-jett, onr_v1_361_namatoki-plaza, onr_v1_363_olivia-salazar, onr_v1_366_red-herrings, onr_v1_367_rio-de-janeiro-city-grid |

## Geänderte Karten

| cardId | Titel | Gruppe | alte `lineSupport` | neue `lineSupport` | `strategicRole` | Begründung |
| --- | --- | --- | --- | --- | --- | --- |
| onr_v1_017_deep-thought | Deep Thought | Runner R&D-/Interface-Druck | early_rnd_pressure, interface_pressure | runner.rnd_pressure | engine_anchor | Wiederholte R&D-Topdeck-Information ist ein echter R&D-Druckanker; Interface-Closeout bleibt zurückgestellt, weil kein Multiaccess- oder Interface-Dichtebeleg vorliegt. |
| onr_v1_022_emergency-self-construct | Emergency Self-Construct | Runner Survival/Defense | - | runner.survival_defense | emergency_tool | Flatline-/Damage-Prevention mit persistentem Survival-Modifikator ist strategische Notfallverteidigung. |
| onr_v1_043_mystery-box | Mystery Box | Runner Toolbox-/Search-Engine | rig_first, breaker_search_first | runner.breaker_search | engine_anchor | Search plus Install-Discount und Programmtarget macht die Karte zu einem echten Breaker-/Rig-Suchanker. |
| onr_v1_059_self-modifying-code | Self-Modifying Code | Runner Toolbox-/Search-Engine | rig_first, breaker_search_first | runner.breaker_search | engine_anchor | Stack-Suche mit Programminstallation ist ein klarer Suchanker für fehlende Rig-Abdeckung. |
| onr_v1_078_arasaka-owns-you | Arasaka Owns You | Runner Survival/Defense | - | runner.survival_defense | emergency_tool | Flatline-Replacement ist ein klarer Notfallanker gegen Kill-Linien. |
| onr_v1_087_forgotten-backup-chip | Forgotten Backup Chip | Runner Toolbox-/Search-Engine | rig_first, breaker_search_first | runner.breaker_search | enabler | Heap-Recovery plus Search stützt gezielt fehlende Rig-/Breaker-Komponenten. |
| onr_v1_089_gideons-pawnshop | Gideon’s Pawnshop | Runner Toolbox-/Search-Engine | rig_first, breaker_search_first | runner.breaker_search | enabler | Heap-Recovery/Search belegt Rig-Rekonstruktion statt nur generischen Draw. |
| onr_v1_093_if-you-want-it-done-right | If You Want It Done Right... | Runner Toolbox-/Search-Engine | rig_first, breaker_search_first | runner.breaker_search | enabler | Stack-Search mit Stack-Search-Bedingung ist direkte Setup-/Breaker-Suche. |
| onr_v1_096_kilroy-was-here | Kilroy Was Here | Runner R&D-/Interface-Druck | early_rnd_pressure, interface_pressure, closeout_pressure | runner.rnd_pressure | payoff_anchor | R&D-Access-Replacement nach erfolgreichem Run belegt R&D-Druck; Remote-Trash und Interface-Closeout werden nicht geraten. |
| onr_v1_099_mantis-fixer-at-large | Mantis, Fixer-at-Large | Runner Toolbox-/Search-Engine | rig_first, breaker_search_first, economy_first | runner.breaker_search | enabler | Search plus Draw unterstützt gezielte Rig-Zusammenstellung; Economy-Lesart wurde entfernt. |
| onr_v1_110_sneak-preview | Sneak Preview | Runner Toolbox-/Search-Engine | rig_first, breaker_search_first | runner.breaker_search | enabler | Search plus Install-Discount ist ein Setup-Enabler, kein normaler Draw. |
| onr_v1_114_temple-microcode-outlet | Temple Microcode Outlet | Runner Toolbox-/Search-Engine | rig_first, breaker_search_first | runner.breaker_search | enabler | Search plus Draw aus Stack-Kontext belegt gezielte Rig-Suche. |
| onr_v1_116_total-genetic-retrofit | Total Genetic Retrofit | Runner Survival/Defense | - | runner.survival_defense | defensive_tool | Tag-Prevention und Survival-Payoff tragen eine klare defensive Linie. |
| onr_v1_167_leland-corporate-bodyguard | Leland, Corporate Bodyguard | Runner Survival/Defense | - | runner.survival_defense | defensive_tool | Meat-Damage- und Tag-Prevention auf Resource-Ebene ist starke Runner-Verteidigung. |
| onr_v1_185_trauma-team | Trauma Team™ | Runner Survival/Defense | - | runner.survival_defense | defensive_tool | Meat-Damage-Prevention mit Prevention-Window ist ein klarer Defense-Anker. |
| onr_v1_192_corporate-boon | Corporate Boon | Corp Fast-Advance/Score-Beschleunigung | fast_advance_or_counter_ops, score_closeout | corp.fast_advance | scoring_tool | Scored-Agenda-Action und Extra-Action-Effekt belegen Score-Beschleunigung. |
| onr_v1_208_on-call-solo-team | On-Call Solo Team | Corp Tag-/Damage-Payoff | corp.tag_trace_punish | corp.tag_trace_punish, corp.damage_kill | punish_payoff | Tagged-Runner-Damage aus scored Agenda ist Tag-Punish und Damage-Kill-Payoff. |
| onr_v1_214_project-babylon | Project Babylon | Corp Fast-Advance/Score-Beschleunigung | fast_advance_or_counter_ops, score_closeout | corp.fast_advance | scoring_tool | Score-Acceleration auf scored Agenda ist ein eindeutiger Fast-Advance-Anker. |
| onr_v1_217_strike-force-kali | Strike Force Kali | Corp Tag-/Damage-Payoff | corp.tag_trace_punish | corp.tag_trace_punish, corp.damage_kill | punish_payoff | Wiederholbarer tagged Runner Damage macht die Agenda zum Punish-/Kill-Payoff. |
| onr_v1_285_closed-accounts | Closed Accounts | Corp Tag-/Trace-/Punish | corp.tag_trace_punish | corp.tag_trace_punish | punish_payoff | Runner-tagged Condition und Tag-Punish-Payoff auf Credits belegen den Punish-Payoff. |
| onr_v1_286_corporate-detective-agency | Corporate Detective Agency | Corp Tag-/Trace-/Punish | corp.tag_trace_punish | corp.tag_trace_punish | punish_payoff | Resource-Trash gegen tagged Runner ist ein klarer Tag-Punish-Payoff. |
| onr_v1_292_management-shake-up | Management Shake-Up | Corp Fast-Advance/Score-Beschleunigung | - | corp.fast_advance | scoring_tool | Score-Acceleration auf installierter Karte ist ein Score-Tool, keine generische Operation. |
| onr_v1_299_power-grid-overload | Power Grid Overload | Corp Tag-/Trace-/Punish | corp.tag_trace_punish | corp.tag_trace_punish | punish_payoff | Hardware-Trash gegen tagged Runner ist Tag-Punish-Payoff. |
| onr_v1_300_project-consultants | Project Consultants | Corp Fast-Advance/Score-Beschleunigung | - | corp.fast_advance | scoring_tool | Advance-Burst und Score-Acceleration mit Score-Window-Bedingung belegen Fast Advance. |
| onr_v1_301_punitive-counterstrike | Punitive Counterstrike | Corp Damage/Kill | corp.tag_trace_punish | corp.tag_trace_punish, corp.damage_kill | punish_payoff, win_condition | Tagged-Runner-Damage ist Tag-Punish und direkter Kill-Payoff. |
| onr_v1_302_scorched-earth | Scorched Earth | Corp Damage/Kill | corp.tag_trace_punish | corp.tag_trace_punish, corp.damage_kill | punish_payoff, win_condition | Tagged-Runner-Damage ist ein klassischer Kill-Payoff. |
| onr_v1_304_systematic-layoffs | Systematic Layoffs | Corp Fast-Advance/Score-Beschleunigung | - | corp.fast_advance | scoring_tool | Advance-Burst und Score-Acceleration mit Score-Window-Bedingung sind Score-Beschleunigung. |
| onr_v1_305_team-restructuring | Team Restructuring | Corp Fast-Advance/Score-Beschleunigung | - | corp.fast_advance | scoring_tool | Advance-Burst und Score-Acceleration mit Score-Window-Bedingung sind Score-Beschleunigung. |
| onr_v1_307_urban-renewal | Urban Renewal | Corp Damage/Kill | corp.tag_trace_punish | corp.tag_trace_punish, corp.damage_kill | punish_payoff, win_condition | Tagged-Runner-Damage mit hohem Damagebetrag ist Punish- und Kill-Payoff. |
| onr_v1_308_acme-savings-and-loan | ACME Savings and Loan | Corp Asset-Economy/Horizontal Engine | economy_rez_reserve | corp.asset_economy | engine_anchor | RemoteRole asset_economy und wiederholbare Economy-Effekte belegen Asset-Economy. |
| onr_v1_309_bbs-whispering-campaign | BBS Whispering Campaign | Corp Asset-Economy/Horizontal Engine | economy_rez_reserve | corp.asset_economy | engine_anchor | Remote Asset mit finite pool/action economy ist ein echter Asset-Economy-Anker. |
| onr_v1_311_braindance-campaign | Braindance Campaign | Corp Asset-Economy/Horizontal Engine | economy_rez_reserve | corp.asset_economy | engine_anchor | Start-of-turn/recurring/finite Economy im Remote ist ein Asset-Economy-Anker. |
| onr_v1_312_chicago-branch | Chicago Branch | Corp Fast-Advance/Remote-Scoring | fast_advance_or_counter_ops, remote_scoring_build, score_closeout | corp.fast_advance, corp.remote_scoring | scoring_tool | Remote Asset mit Score-Acceleration stützt Fast Advance und Remote-Scoring. |
| onr_v1_314_corporate-negotiating-center | Corporate Negotiating Center | Corp Asset-Economy/Horizontal Engine | economy_rez_reserve | corp.asset_economy | engine_anchor | RemoteRole asset_economy plus Start-of-turn-Economy ist ein Engine-Anker. |
| onr_v1_317_data-masons | Data Masons | Corp Remote-Scoring/ICE-Tax-Engine | remote_scoring_build, ice_tax_glacier | corp.remote_scoring, corp.ice_tax_glacier | engine_anchor | RemoteRole ice_modifier, Rez-Discount und Remote-Protection stützen Remote-Scoring und ICE-Tax. |
| onr_v1_326_holovid-campaign | Holovid Campaign | Corp Asset-Economy/Horizontal Engine | - | corp.asset_economy | engine_anchor | Recurring/start-of-turn/finite remote economy macht die Karte zum Asset-Economy-Anker. |
| onr_v1_329_investment-firm | Investment Firm | Corp Asset-Economy/Horizontal Engine | - | corp.asset_economy | engine_anchor | Remote finite pool und recurring economy sind Asset-Economy-Engine. |
| onr_v1_334_pacifica-regional-ai | Pacifica Regional AI | Corp Asset-Economy/Horizontal Engine | - | corp.asset_economy | engine_anchor | Extra action plus advanceable remote economy belegt horizontalen Engine-Wert. |
| onr_v1_344_spinn-public-relations | Spinn® Public Relations | Corp Asset-Economy/Horizontal Engine | - | corp.asset_economy | engine_anchor | Recurring/start-of-turn/action economy im Remote ist Asset-Economy-Engine. |
| onr_v1_350_antiquated-interface-routines | Antiquated Interface Routines | Corp Remote-Scoring/ICE-Tax-Engine | remote_scoring_build, ice_tax_glacier | corp.remote_scoring, corp.ice_tax_glacier | tax_tool | Remote/Fort-Protection über Stärke ist ein Tax-/Protection-Tool, keine normale ICE. |
| onr_v1_355_crystal-palace-station-grid | Crystal Palace Station Grid | Corp Remote-Scoring/ICE-Tax-Engine | remote_scoring_build, ice_tax_glacier | corp.remote_scoring, corp.ice_tax_glacier | tax_tool | Fort-Run-Tax plus Remote-Protection belegt Tax-Tool für Remote-Scoring. |
| onr_v1_359_jenny-jett | Jenny Jett | Corp Remote-Scoring-Protection | remote_scoring_build, ice_tax_glacier | corp.remote_scoring | scoring_tool | RemoteRole scoring_protection und successful-run remote protection belegen Remote-Scoring-Schutz. |
| onr_v1_361_namatoki-plaza | Namatoki Plaza | Corp Remote-Scoring-Protection | remote_scoring_build | corp.remote_scoring | scoring_tool | Remote capacity plus score acceleration im Remote-Kontext stützt Remote-Scoring. |
| onr_v1_363_olivia-salazar | Olivia Salazar | Corp Remote-Scoring-Protection | remote_scoring_build, ice_tax_glacier | corp.remote_scoring | support_tool | Scoring protection plus Rez-Support im Run ist ein Remote-Scoring-Support-Tool. |
| onr_v1_366_red-herrings | Red Herrings | Corp Remote-Scoring-Protection | remote_scoring_build, ice_tax_glacier, score_closeout | corp.remote_scoring | tax_tool | Agenda-Steal-Tax und Remote-Protection belegen Remote-Scoring-Tax. |
| onr_v1_367_rio-de-janeiro-city-grid | Rio de Janeiro City Grid | Corp Remote-Scoring-Protection | remote_scoring_build, ice_tax_glacier | corp.remote_scoring | scoring_tool | RemoteRole scoring_protection und Fort-Protection belegen Remote-Scoring-Schutz. |
| onr_v1_370_tesseract-fort-construction | Tesseract Fort Construction | Corp Remote-Scoring/ICE-Tax-Engine | remote_scoring_build, ice_tax_glacier | corp.remote_scoring, corp.ice_tax_glacier | engine_anchor | Fort-Protection mit Subroutine-/Future-Encounter-Effekt ist Remote-Scoring-Engine und ICE-Tax-Tool. |

## Zurückgestellte Karten

Zurückgestellt wurden Karten, bei denen der aktuelle Legacy-Wert zu breit ist, nur normale Funktion signalisiert oder eine separate Kartenprüfung braucht.

| Grund | Anzahl | cardIds |
| --- | ---: | --- |
| ambiguous_pressure_or_remote_contest_requires_human_review | 4 | onr_v1_068_startup-immolator, onr_v1_080_core-command-jettison-ice, onr_v1_108_score, onr_v1_173_restrictive-net-zoning |
| broad_score_closeout_requires_card_review | 6 | onr_v1_193_corporate-coup, onr_v1_196_corporate-war, onr_v1_203_hostile-takeover, onr_v1_209_political-coup, onr_v1_210_political-overthrow, onr_v1_212_priority-requisition |
| corp_structure_or_protection_requires_card_review | 2 | onr_v1_191_black-ice-quality-assurance, onr_v1_219_superior-net-barriers |
| generic_economy_or_reserve_support_only | 13 | onr_v1_045_newsgroup-filter, onr_v1_097_livewires-contacts, onr_v1_178_short-term-contract, onr_v1_188_ai-chief-financial-officer, onr_v1_199_employee-empowerment, onr_v1_206_marine-arcology, onr_v1_281_accounts-receivable, onr_v1_282_annual-reviews, onr_v1_288_day-shift, onr_v1_290_efficiency-experts, onr_v1_293_netwatch-credit-voucher, onr_v1_295_night-shift, onr_v1_296_off-site-backups |
| normal_breaker_function_signal_only | 20 | onr_v1_002_ai-boon, onr_v1_005_bartmoss-memorial-icebreaker, onr_v1_006_black-dahlia, onr_v1_007_blink, onr_v1_014_codecracker, onr_v1_016_cyfermaster, onr_v1_019_dropp, onr_v1_037_japanese-water-torture, onr_v1_039_krash, onr_v1_040_loony-goon, onr_v1_047_pile-driver, onr_v1_052_raffles, onr_v1_054_raptor, onr_v1_055_reflector, onr_v1_056_replicator, onr_v1_060_shaka, onr_v1_070_tinweasel, onr_v1_072_wild-card, onr_v1_073_wizards-book, onr_v1_074_worm |
| normal_draw_or_setup_support_only | 3 | onr_v1_075_zetatech-software-installer, onr_v1_079_bodyweight-synthetic-blood, onr_v1_095_jack-n-joe |
| normal_or_ice_specific_review_needed | 20 | onr_v1_222_ball-and-chain, onr_v1_223_banpei, onr_v1_224_bolter-cluster, onr_v1_225_canis-major, onr_v1_226_canis-minor, onr_v1_227_cerberus, onr_v1_228_cinderella, onr_v1_231_cortical-scrub, onr_v1_236_data-raven, onr_v1_237_data-wall, onr_v1_243_fetch-4-0-1, onr_v1_249_hunter, onr_v1_258_neural-blade, onr_v1_267_sentinels-prime, onr_v1_268_shock-r, onr_v1_274_tutor, onr_v1_276_viral-15, onr_v1_277_virizz, onr_v1_278_wall-of-ice, onr_v1_279_wall-of-static |
| rig_support_requires_card_review | 3 | onr_v1_011_cloak, onr_v1_071_vewy-vewy-quiet, onr_v1_168_loan-from-chiba |

## Warning-Delta

| Messpunkt | Vor AI009 | Nach AI009 |
| --- | ---: | ---: |
| Taxonomy-Warnings | 69 | 66 |
| Legacy-`lineSupport` distinct | 14 | 11 |
| Legacy-`lineSupport` occurrences | 161 | 110 |
| Normalisierte `lineSupport` occurrences | 31 | 80 |
| Inspector-Karten mit Warnings | 423 | 411 |
| Inspector `legacy_lineSupport` Karten | 97 | 71 |

## DeckDoctrine-Diagnostik

Die Änderungen sind diagnostisch sichtbar, bleiben aber ohne Plannerwirkung.

| Deck | Strategie | vorher final | nachher final | Delta final | vorher anchor | nachher anchor |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| onr_origin_corp_ai_snapshot_v1 | corp.damage_kill | 56 | 78 | +22 | 64 | 100 |
| onr_origin_corp_ai_snapshot_v1 | corp.economy_rez_reserve | 64 | 69 | +5 | 32 | 44 |
| onr_origin_corp_ai_snapshot_v1 | corp.fast_advance | 41 | 48 | +7 | 28 | 40 |
| onr_origin_corp_ai_snapshot_v1 | corp.remote_scoring | 74 | 88 | +14 | 56 | 80 |
| onr_origin_corp_ai_tag_ops_snapshot_v1 | corp.damage_kill | 76 | 78 | +2 | 96 | 100 |
| onr_origin_corp_ai_tag_ops_snapshot_v1 | corp.economy_rez_reserve | 64 | 69 | +5 | 32 | 44 |
| onr_origin_corp_ai_tag_ops_snapshot_v1 | corp.remote_scoring | 74 | 88 | +14 | 56 | 80 |

## Bewusst nicht geändert

- keine Plannerwirkung
- keine Action-Score-Änderung
- keine PlanWeight-Änderung
- keine Engine-/Legalitätsänderung
- keine Profil-/Default-Umschaltung
- keine Massenmigration
- keine Ableitung allein aus `roles` oder `planRoles`
- keine Hidden-Info-Nutzung
- keine Catalog-/Proteus-Baseline-Korrektur

## Checks

| Befehl | Status |
| --- | --- |
| corepack pnpm build:ai-compiled-hints | pass |
| corepack pnpm build:ai-hint-inspector-index | pass |
| node scripts/check-ai-manual-overlays.mjs --write | pass |
| node scripts/check-ai-derived-facts.mjs --write | pass |
| node scripts/check-ai-hint-compiled-index.mjs --write | pass |
| node scripts/check-ai-generated-fact-batch2-diff-review.mjs --write | pass |
| node scripts/check-ai-generated-fact-batch2-normalization-dry-run.mjs --write | pass |
| corepack pnpm check:ai-strategy-taxonomy | pass |
| corepack pnpm check:ai-compiled-hints | pass |
| corepack pnpm check:ai-hint-inspector-index | pass |
| corepack pnpm check:ai-hint-quality | pass |
| corepack pnpm check:ai-approval-consistency | pass |
| corepack pnpm check:ai-deck-doctrine-strategy | pass |
| corepack pnpm --filter @netgrid/ai test | pass |
| corepack pnpm --filter @netgrid/ai exec tsc -p tsconfig.json --noEmit | pass |
| corepack pnpm --filter @netgrid/web exec tsc -p tsconfig.json --noEmit | pass |

| git diff --check | pass |

| git diff --cached --check | pass |

## Detailreport

Maschinenlesbare Pro-Karte-Evidenz: `docs/reviews/ai/ai009-strategy-anchor-normalization-batch2-report-2026-05-31.json`.
