# AI031-033 Tactic Signal Taxonomy Finalization

Stand: 2026-06-03
Guide: V3
Source Commit: ebf6455ad8e8e4af9a583cfebb88ca1a6dd0bd6f

## Kurzfazit

AI031-033 schließt die Taktiksignal-Taxonomie konservativ als Release Candidate ab. Es wurden keine Taktiksignale, Derivationsregeln, Hints, Inspector-Logik, Planner-Pfade, Engine-Regeln, Legalitätsregeln, Targeting-KI oder UI-Flächen geändert. Ergebnis ist ein datenbasierter Review mit Descriptor-Schema-Vorschlag und Guard-Skript.

Die drei Breaker-Signale bleiben als funktionale Coverage-Signale erhalten. `damage.payoff` bleibt Legacy-/Aggregation-/supporting-only Evidenz. `action.corp_repeatable_extra_action` bleibt support/deferred und erzeugt keine automatische Fast-Advance- oder Remote-Scoring-Evidenz. Die 61 Descriptor-Warnings werden vollständig inventarisiert und als Schemaarbeit klassifiziert, nicht blind umgeschrieben.

## Scope / Out-of-Scope

In Scope: AI028-R-Warnings F005, F006 und F007, Descriptor-Schema-Design, StrategySupportPair-Rollenmodell-Inventar, explizites Deferred für F008.
Out of Scope: neue Strategy IDs, produktive Strategy-Zuordnung, Planner-Wirkung, ActionScore, PlanWeight, Engine, Legalität, Targeting-KI, UI, Hidden-Info-Projektion, Action-Semantik-Brücke, Chronicle-Dateien und Chronicle-Skripte.

## Verwendete Quellen

- `docs/architecture/ai/taktiksignale-strategieanker-guide-2026-06-02-v3.md`
- `data/ai/tactic-signals-v1.json`
- `data/ai/function-signal-derivation-v1.json`
- `data/ai/ai-card-hints-active.json`
- `data/ai/ai-card-hints-compiled.json`
- `data/ai/ai-hint-inspector-index.json`
- `data/ai/strategy-goals-v1.json`
- `data/ai/strategic-roles-v1.json`
- `docs/reviews/ai/ai028-r-netgrid-semantic-audit-pack-refresh-2026-06-03.json`
- AI023-2, AI024-1, AI025-1, AI026-1, AI027, AI029 und AI030 Reports
- `data/cards/originalset-v1-cards.json`, `data/cards/proteus-cards.json`, `data/cards/classic-cards.json`, `data/cards/testset-cards.json`

## Ausgangsbefund aus AI028-R

| Finding | Entscheidung |
| --- | --- |
| AI028-R-F005 | AI031 Taxonomy Cleanup: Breaker-Coverage bleibt support-only. |
| AI028-R-F006 | AI032 Legacy/Aggregation Review: beide direkt genutzten Signale bleiben kontrolliert support-only. |
| AI028-R-F007 | AI033 Descriptor Schema Design: 61 Karten inventarisiert, Schema vorgeschlagen, kein Bulk-Rewrite. |
| AI028-R-F008 | Deferred bis Action-/Target-Semantik. |
| AI028-R-D005 | StrategySupportPair-Rollenmodell inventarisiert, keine Writeback-Normalisierung. |

Baseline: 618 Card-Inventory-Einträge, 564 Semantic Profiles, 524 Taktiksignale, 621 Derivationsregeln, 61 Descriptor-Warning-Karten.

## AI031: Breaker-Signal-Entscheidung

| Signal | Entscheidung | Inspector-Derivationen | supportOnly | mayAnchorStrategy | Rename |
| --- | --- | ---: | ---: | ---: | --- |
| breaker.code_gate | retain_as_support_only_coverage_signal | 9 | true | false | none |
| breaker.sentry | retain_as_support_only_coverage_signal | 15 | true | false | none |
| breaker.wall | retain_as_support_only_coverage_signal | 15 | true | false | none |

Die Signale beschreiben Breaker-Coverage gegen ICE-Typen aus `breakerProfile.coverage`, nicht den Subtyp der eigenen Karte. Ein Rename zu `breaker.coverage.*` wäre sprechender, wird aber in diesem Batch nicht durchgeführt, weil kein Verhalten geändert werden soll und spätere Migration einen Alias-/Kompatibilitätscheck braucht.

## AI032: Legacy-/Aggregation-Entscheidung

| Signal | Entscheidung | direkte Nutzung | supportOnly | mayAnchorStrategy | strategyAnchorFor |
| --- | --- | ---: | ---: | ---: | --- |
| damage.payoff | retain_as_legacy_aggregation_supporting_only | 42 | true | false | none |
| action.corp_repeatable_extra_action | retain_as_support_deferred_extra_action_signal | 2 | true | false | none |

`damage.payoff` hat 42 direkte Karten. Alle direkten Nutzungen haben zusätzlich präzisere Damage-/Access-/ICE-/Amplifier-Evidence; Karten ohne präzises Zusatzsignal: 0.
`action.corp_repeatable_extra_action` wird direkt von Nevinyrral (onr_v1_331_nevinyrral) und Remote Facility (onr_v1_335_remote-facility) genutzt. Beide Karten haben keine reviewed StrategySupportPairs und keine derived possible StrategyAnchors.

## AI033: Descriptor-Schema-Design

Das Descriptor-Schema bleibt proposed-only. Descriptoren sind eine erklärende Semantikschicht und dürfen keine Taktiksignale, StrategyAnchors, LegalActions oder TargetProfiles ersetzen.

Vorgeschlagene Kernform: `descriptorId`, `layer`, `subjectSide`, `subjectCardType`, `affectedSide`, `affectedZone`, `affectedCardType`, `affectedSubtype`, `effectKind`, `amountKind`, `repeatability`, `hiddenInfoPolicy`, `sourceField`, `confidence`, `status`.

Descriptor-Kategorien:

| Kategorie | Karten |
| --- | ---: |
| agenda_score_descriptor | 10 |
| breaker_cost_or_strength_descriptor | 2 |
| breaker_coverage_descriptor | 3 |
| condition_descriptor | 31 |
| constraint_descriptor | 23 |
| corp_upgrade_server_descriptor | 4 |
| damage_descriptor | 4 |
| draw_descriptor | 1 |
| economy_descriptor | 9 |
| hidden_resource_descriptor | 32 |
| ice_control_descriptor | 11 |
| needs_action_semantics | 3 |
| needs_target_semantics | 28 |
| program_damage_prevention_descriptor | 3 |
| program_search_or_install_descriptor | 9 |
| remote_or_fort_descriptor | 22 |
| resource_economy_descriptor | 5 |
| resource_visibility_descriptor | 17 |
| risk_descriptor | 61 |
| run_access_descriptor | 15 |
| run_modifier_descriptor | 8 |
| tag_descriptor | 5 |
| target_profile_descriptor | 21 |
| virus_counter_descriptor | 4 |

## StrategySupportPair-Rollenmodell-Inventar

Reviewed StrategySupportPairs: 252. Die vorhandenen Einträge enthalten `strategyId` und Rationale, aber noch keine expliziten Felder `role`, `confidence`, `primaryAnchorEvidence` oder `supportingEvidence`. AI031-033 inventarisiert das Rollenmodell nur und schreibt keine Rollen zurück.

Fehlende Felder: `role` 252, `confidence` 252, `primaryAnchorEvidence` 252, `supportingEvidence` 252.

| vorgeschlagene Kategorie | Pairs |
| --- | ---: |
| ambush_payoff | 4 |
| damage_source | 30 |
| defensive_tool | 5 |
| deferred_role_model | 5 |
| economy_engine | 33 |
| enabler | 28 |
| engine_anchor | 29 |
| lock_piece | 5 |
| payoff_anchor | 31 |
| remote_scoring_support | 16 |
| support_tool | 1 |
| tag_payoff | 12 |
| tag_source | 14 |
| tax_piece | 25 |
| win_condition | 14 |

## Explizit deferred: requires_advancement_counter / AI034

`requires_advancement_counter` bleibt mit 11 Nutzungen deferred, bis Action-/Target-Semantik Source und Target trennen kann.

| Karte | Titel | Typ |
| --- | --- | --- |
| onr_proteus_055_cybertech-think-tank | Cybertech Think Tank | asset |
| onr_proteus_059_government-contract | Government Contract | asset |
| onr_proteus_061_ldl-traffic-analyzers | LDL Traffic Analyzers | asset |
| onr_v1_291_falsified-transactions-expert | Falsified-Transactions Expert | operation |
| onr_v1_315_corprunners-shattered-remains | Corprunner's Shattered Remains | asset |
| onr_v1_323_experimental-ai | Experimental AI | asset |
| onr_v1_328_information-laundering | Information Laundering | asset |
| onr_v1_334_pacifica-regional-ai | Pacifica Regional AI | asset |
| onr_v1_346_vacant-soulkiller | Vacant Soulkiller | asset |
| onr_v1_347_vapor-ops | Vapor Ops | asset |
| onr_v1_348_virus-test-site | Virus Test Site | asset |

Spätere Split-Kandidaten: `requires_source_advancement_counter`, `requires_target_advancement_counter`, `requires_self_advancement_counter`, `requires_advancement_counter_on_scored_agenda`, `requires_advancement_counter_on_accessed_card`.

## Geänderte Signale

Keine.

## Beibehaltene Signale mit Begründung

- `breaker.code_gate`, `breaker.sentry`, `breaker.wall`: funktionale Breaker-Coverage, support-only, keine StrategyAnchors.
- `damage.payoff`: Legacy-/Aggregation-/supporting-only, nicht für direktes Scoring, präzise Damage-Evidence bleibt erforderlich.
- `action.corp_repeatable_extra_action`: Corp-Extra-Action-Support, deferred Strategy Candidate, keine automatische Strategy-Ableitung.

## Retired / Alias / Migration

Keine Retirements und keine aktiven Alias-Mappings. Für spätere Renames der Breaker-Coverage-Signale empfiehlt der Report nur eine Alias-Migration mit Kompatibilitätscheck.

## Descriptor-Warning-Triage

| cardId | Titel | Side | Typ | Kategorien | Status |
| --- | --- | --- | --- | --- | --- |
| onr_proteus_128_airport-locker | Airport Locker | runner | resource | breaker_coverage_descriptor, condition_descriptor, constraint_descriptor, hidden_resource_descriptor, program_search_or_install_descriptor, resource_visibility_descriptor, risk_descriptor, target_profile_descriptor, virus_counter_descriptor | needs_schema_design |
| onr_proteus_129_back-door-to-netwatch | Back Door to Netwatch | runner | resource | hidden_resource_descriptor, resource_visibility_descriptor, risk_descriptor, run_access_descriptor | needs_schema_design |
| onr_proteus_132_bolt-hole | Bolt-Hole | runner | resource | condition_descriptor, constraint_descriptor, damage_descriptor, hidden_resource_descriptor, program_damage_prevention_descriptor, resource_visibility_descriptor, risk_descriptor | needs_schema_design |
| onr_proteus_133_chiba-bank-account | Chiba Bank Account | runner | resource | economy_descriptor, hidden_resource_descriptor, resource_economy_descriptor, resource_visibility_descriptor, risk_descriptor | needs_schema_design |
| onr_proteus_136_credit-subversion | Credit Subversion | runner | resource | hidden_resource_descriptor, resource_visibility_descriptor, risk_descriptor, run_access_descriptor, tag_descriptor | needs_schema_design |
| onr_proteus_137_death-from-above | Death from Above | runner | resource | constraint_descriptor, hidden_resource_descriptor, remote_or_fort_descriptor, resource_visibility_descriptor, risk_descriptor, run_access_descriptor, tag_descriptor, target_profile_descriptor | needs_schema_design |
| onr_proteus_140_expendable-family-member | Expendable Family Member | runner | resource | condition_descriptor, hidden_resource_descriptor, program_damage_prevention_descriptor, resource_visibility_descriptor, risk_descriptor, tag_descriptor | needs_schema_design |
| onr_proteus_141_get-ready-to-rumble | Get Ready to Rumble | runner | resource | damage_descriptor, hidden_resource_descriptor, resource_visibility_descriptor, risk_descriptor, run_access_descriptor | needs_schema_design |
| onr_proteus_142_hq-mole | HQ Mole | runner | resource | hidden_resource_descriptor, resource_visibility_descriptor, risk_descriptor, run_access_descriptor | needs_schema_design |
| onr_proteus_143_liberated-savings-account | Liberated Savings Account | runner | resource | economy_descriptor, hidden_resource_descriptor, resource_economy_descriptor, resource_visibility_descriptor, risk_descriptor | needs_schema_design |
| onr_proteus_145_mercenary-subcontract | Mercenary Subcontract | runner | resource | constraint_descriptor, hidden_resource_descriptor, resource_visibility_descriptor, risk_descriptor, run_access_descriptor, tag_descriptor, target_profile_descriptor | needs_schema_design |
| onr_proteus_147_r-and-d-mole | R&D Mole | runner | resource | hidden_resource_descriptor, resource_visibility_descriptor, risk_descriptor, run_access_descriptor | needs_schema_design |
| onr_proteus_149_simulacrum | Simulacrum | runner | resource | hidden_resource_descriptor, ice_control_descriptor, resource_visibility_descriptor, risk_descriptor, run_modifier_descriptor, virus_counter_descriptor | needs_schema_design |
| onr_proteus_152_swiss-bank-account | Swiss Bank Account | runner | resource | economy_descriptor, hidden_resource_descriptor, resource_economy_descriptor, resource_visibility_descriptor, risk_descriptor | needs_schema_design |
| onr_proteus_153_time-to-collect | Time to Collect | runner | resource | condition_descriptor, constraint_descriptor, hidden_resource_descriptor, program_damage_prevention_descriptor, resource_visibility_descriptor, risk_descriptor, target_profile_descriptor | needs_schema_design |
| onr_proteus_154_wired-switchboard | Wired Switchboard | runner | resource | condition_descriptor, hidden_resource_descriptor, resource_visibility_descriptor, risk_descriptor | needs_schema_design |
| onr_v1_017_deep-thought | Deep Thought | runner | program | condition_descriptor, hidden_resource_descriptor, risk_descriptor, run_access_descriptor, virus_counter_descriptor | needs_schema_design |
| onr_v1_018_dogcatcher | Dogcatcher | runner | program | breaker_cost_or_strength_descriptor, breaker_coverage_descriptor, constraint_descriptor, needs_target_semantics, remote_or_fort_descriptor, risk_descriptor | needs_schema_design |
| onr_v1_019_dropp | Dropp™ | runner | program | breaker_cost_or_strength_descriptor, breaker_coverage_descriptor, constraint_descriptor, needs_target_semantics, remote_or_fort_descriptor, risk_descriptor | needs_schema_design |
| onr_v1_032_i-spy | I Spy | runner | program | condition_descriptor, constraint_descriptor, needs_target_semantics, risk_descriptor, target_profile_descriptor | needs_schema_design |
| onr_v1_042_mouse | Mouse | runner | program | constraint_descriptor, hidden_resource_descriptor, needs_target_semantics, remote_or_fort_descriptor, risk_descriptor, target_profile_descriptor | needs_schema_design |
| onr_v1_043_mystery-box | Mystery Box | runner | program | condition_descriptor, constraint_descriptor, hidden_resource_descriptor, needs_target_semantics, program_search_or_install_descriptor, risk_descriptor, target_profile_descriptor | needs_schema_design |
| onr_v1_050_r-and-d-protocol-files | R&D-Protocol Files | runner | program | condition_descriptor, hidden_resource_descriptor, needs_target_semantics, risk_descriptor, run_access_descriptor, run_modifier_descriptor | needs_schema_design |
| onr_v1_058_seeya | SeeYa | runner | program | constraint_descriptor, hidden_resource_descriptor, needs_target_semantics, remote_or_fort_descriptor, risk_descriptor, target_profile_descriptor | needs_schema_design |
| onr_v1_059_self-modifying-code | Self-Modifying Code | runner | program | condition_descriptor, constraint_descriptor, hidden_resource_descriptor, program_search_or_install_descriptor, risk_descriptor, target_profile_descriptor | needs_schema_design |
| onr_v1_065_smarteye | Smarteye | runner | program | condition_descriptor, constraint_descriptor, ice_control_descriptor, needs_target_semantics, risk_descriptor, run_modifier_descriptor, target_profile_descriptor | needs_schema_design |
| onr_v1_076_all-nighter | All-Nighter | runner | event | needs_target_semantics, remote_or_fort_descriptor, risk_descriptor, run_modifier_descriptor | needs_schema_design |
| onr_v1_083_desperate-competitor | Desperate Competitor | runner | event | agenda_score_descriptor, condition_descriptor, needs_target_semantics, remote_or_fort_descriptor, risk_descriptor | deferred_human_review |
| onr_v1_084_edited-shipping-manifests | Edited Shipping Manifests | runner | event | condition_descriptor, economy_descriptor, ice_control_descriptor, needs_target_semantics, remote_or_fort_descriptor, risk_descriptor, run_access_descriptor, tag_descriptor | needs_schema_design |
| onr_v1_087_forgotten-backup-chip | Forgotten Backup Chip | runner | event | condition_descriptor, constraint_descriptor, hidden_resource_descriptor, program_search_or_install_descriptor, risk_descriptor, target_profile_descriptor | needs_schema_design |
| onr_v1_088_fortress-respecification | Fortress Respecification | runner | event | hidden_resource_descriptor, needs_target_semantics, remote_or_fort_descriptor, risk_descriptor, run_modifier_descriptor, target_profile_descriptor | needs_schema_design |
| onr_v1_090_hot-tip-for-wns | Hot Tip for WNS | runner | event | agenda_score_descriptor, condition_descriptor, needs_target_semantics, remote_or_fort_descriptor, risk_descriptor | deferred_human_review |
| onr_v1_091_hunt-club-bbs | Hunt Club BBS | runner | event | hidden_resource_descriptor, risk_descriptor, target_profile_descriptor | needs_schema_design |
| onr_v1_092_ice-and-datas-guide-to-the-net | Ice and Data’s Guide to the Net | runner | event | hidden_resource_descriptor, risk_descriptor, target_profile_descriptor | needs_schema_design |
| onr_v1_094_inside-job | Inside Job | runner | event | needs_target_semantics, remote_or_fort_descriptor, risk_descriptor, run_modifier_descriptor | needs_schema_design |
| onr_v1_096_kilroy-was-here | Kilroy Was Here | runner | event | condition_descriptor, needs_target_semantics, remote_or_fort_descriptor, risk_descriptor, run_access_descriptor | needs_schema_design |
| onr_v1_099_mantis-fixer-at-large | Mantis, Fixer-at-Large | runner | event | condition_descriptor, constraint_descriptor, hidden_resource_descriptor, program_search_or_install_descriptor, risk_descriptor, target_profile_descriptor | needs_schema_design |
| onr_v1_106_private-ldl-access | Private LDL Access | runner | event | condition_descriptor, risk_descriptor, run_access_descriptor | needs_schema_design |
| onr_v1_107_romp-through-hq | Romp through HQ | runner | event | condition_descriptor, needs_target_semantics, remote_or_fort_descriptor, risk_descriptor, run_access_descriptor | needs_schema_design |
| onr_v1_110_sneak-preview | Sneak Preview | runner | event | constraint_descriptor, hidden_resource_descriptor, program_search_or_install_descriptor, risk_descriptor, target_profile_descriptor | needs_schema_design |
| onr_v1_114_temple-microcode-outlet | Temple Microcode Outlet | runner | event | condition_descriptor, constraint_descriptor, hidden_resource_descriptor, program_search_or_install_descriptor, risk_descriptor, target_profile_descriptor | needs_schema_design |
| onr_v1_115_terrorist-reprisal | Terrorist Reprisal | runner | event | condition_descriptor, needs_target_semantics, remote_or_fort_descriptor, risk_descriptor, run_modifier_descriptor | needs_schema_design |
| onr_v1_156_corporate-ally | Corporate Ally | runner | resource | agenda_score_descriptor, needs_target_semantics, remote_or_fort_descriptor, risk_descriptor | needs_schema_design |
| onr_v1_162_field-reporter-for-ice-and-data | Field Reporter for Ice and Data | runner | resource | economy_descriptor, needs_target_semantics, resource_economy_descriptor, risk_descriptor | needs_schema_design |
| onr_v1_173_restrictive-net-zoning | Restrictive Net Zoning | runner | resource | constraint_descriptor, ice_control_descriptor, needs_target_semantics, program_search_or_install_descriptor, remote_or_fort_descriptor, resource_visibility_descriptor, risk_descriptor, target_profile_descriptor | needs_schema_design |
| onr_v1_183_technician-lover | Technician Lover | runner | resource | needs_target_semantics, risk_descriptor | needs_schema_design |
| onr_v1_184_top-runners-conference | Top Runners' Conference | runner | resource | economy_descriptor, needs_target_semantics, remote_or_fort_descriptor, resource_economy_descriptor, risk_descriptor | needs_schema_design |
| onr_v1_189_artificial-security-directors | Artificial Security Directors | corp | agenda | agenda_score_descriptor, risk_descriptor | needs_schema_design |
| onr_v1_190_bioweapons-engineering | Bioweapons Engineering | corp | agenda | agenda_score_descriptor, condition_descriptor, damage_descriptor, risk_descriptor | needs_schema_design |
| onr_v1_194_corporate-downsizing | Corporate Downsizing | corp | agenda | agenda_score_descriptor, condition_descriptor, economy_descriptor, hidden_resource_descriptor, risk_descriptor | needs_schema_design |
| onr_v1_200_encryption-breakthrough | Encryption Breakthrough | corp | agenda | agenda_score_descriptor, condition_descriptor, economy_descriptor, ice_control_descriptor, risk_descriptor | needs_schema_design |
| onr_v1_202_genetics-visionary-acquisition | Genetics-Visionary Acquisition | corp | agenda | agenda_score_descriptor, risk_descriptor | needs_schema_design |
| onr_v1_250_ice-pick-willie | Ice Pick Willie | corp | ice | condition_descriptor, hidden_resource_descriptor, ice_control_descriptor, risk_descriptor | needs_schema_design |
| onr_v1_272_too-many-doors | Too Many Doors | corp | ice | condition_descriptor, hidden_resource_descriptor, ice_control_descriptor, risk_descriptor | needs_schema_design |
| onr_v1_314_corporate-negotiating-center | Corporate Negotiating Center | corp | asset | agenda_score_descriptor, condition_descriptor, constraint_descriptor, economy_descriptor, needs_target_semantics, remote_or_fort_descriptor, risk_descriptor | needs_schema_design |
| onr_v1_336_rescheduler | Rescheduler | corp | asset | draw_descriptor, needs_target_semantics, risk_descriptor | needs_schema_design |
| onr_v1_348_virus-test-site | Virus Test Site | corp | asset | condition_descriptor, damage_descriptor, remote_or_fort_descriptor, risk_descriptor, run_access_descriptor, virus_counter_descriptor | needs_schema_design |
| onr_v1_349_aardvark | Aardvark | corp | upgrade | condition_descriptor, constraint_descriptor, corp_upgrade_server_descriptor, ice_control_descriptor, needs_action_semantics, needs_target_semantics, risk_descriptor, run_modifier_descriptor, target_profile_descriptor | needs_schema_design |
| onr_v1_351_bizarre-encryption-scheme | Bizarre Encryption Scheme | corp | upgrade | agenda_score_descriptor, condition_descriptor, constraint_descriptor, corp_upgrade_server_descriptor, ice_control_descriptor, needs_action_semantics, needs_target_semantics, remote_or_fort_descriptor, risk_descriptor, run_access_descriptor | needs_schema_design |
| onr_v1_352_chester-mix | Chester Mix | corp | upgrade | condition_descriptor, constraint_descriptor, corp_upgrade_server_descriptor, ice_control_descriptor, needs_target_semantics, program_search_or_install_descriptor, remote_or_fort_descriptor, risk_descriptor, target_profile_descriptor | needs_schema_design |
| onr_v1_370_tesseract-fort-construction | Tesseract Fort Construction | corp | upgrade | constraint_descriptor, corp_upgrade_server_descriptor, ice_control_descriptor, needs_action_semantics, needs_target_semantics, remote_or_fort_descriptor, risk_descriptor, target_profile_descriptor | needs_schema_design |

## Tactic Signal Taxonomy Release Candidate

- Gesamtzahl Taktiksignale: 524
- Aktive Signalgruppen: 123
- Legacy-/Aggregation-Signale: action.corp_repeatable_extra_action, damage.payoff, economy.corp_draw
- SupportingEvidenceOnly-Signalanzahl: 358
- SupportOnly-Signalanzahl: 369
- MayAnchorStrategy-Signalanzahl: 155
- Deferred Signale: action.corp_repeatable_extra_action, requires_advancement_counter
- Descriptor-Schema: proposed_only

Nicht mehr als Taktiksignal gelten: Typ, Subtyp der eigenen Karte, Name, Thema, reine UI-/Report-Labels, TargetProfile, Condition, Constraint und Risk ohne funktionalen Auswertungszweck.

## No-Effect-Bestätigung

Alle No-Effect-Flags stehen auf `false`: Planner, ActionScore, PlanWeight, Targeting-KI, Engine, Legalität, Profile/Default Switch, UI-Derivation und Hidden-Info-Leak.

## Verifikation

| Befehl | Status | Exit-Code | Sekunden |
| --- | --- | ---: | ---: |
| `node scripts/check-ai023-2-corp-agendas-active-hint-sync.mjs` | passed | 0 | 0.08 |
| `node scripts/check-ai024-1-corp-ice-semantics-polish.mjs` | passed | 0 | 0.07 |
| `node scripts/check-ai025-1-corp-operations-semantics-polish.mjs` | passed | 0 | 0.06 |
| `node scripts/check-ai026-1-corp-nodes-assets-semantics-polish.mjs` | passed | 0 | 0.07 |
| `node scripts/check-ai027-derivation-inspector-guide-v3-alignment.mjs` | passed | 0 | 0.08 |
| `node scripts/check-ai028-r-netgrid-semantic-audit-pack-refresh.mjs` | passed | 0 | 0.08 |
| `node scripts/check-ai029-target-condition-constraint-schema-sweep.mjs` | passed | 0 | 0.1 |
| `node scripts/check-ai030-corp-upgrades-semantics.mjs` | passed | 0 | 0.08 |
| `node scripts/check-ai031-033-tactic-signal-taxonomy-finalization.mjs` | passed | 0 | 0.12 |
| `corepack pnpm check:ai-strategy-taxonomy` | passed | 0 | 0.55 |
| `corepack pnpm check:ai-hint-quality` | passed | 0 | 0.34 |
| `corepack pnpm check:ai-hint-compiled-index` | passed | 0 | 0.68 |
| `corepack pnpm check:ai-approval-consistency` | passed | 0 | 0.33 |
| `corepack pnpm check:ai-deck-doctrine-strategy` | passed | 0 | 0.93 |
| `corepack pnpm check:ai-compiled-hints` | passed | 0 | 0.39 |
| `corepack pnpm check:ai-hint-inspector-index` | passed | 0 | 0.66 |
| `corepack pnpm --filter @netgrid/ai test` | passed | 0 | 52.25 |
| `corepack pnpm --filter @netgrid/ai typecheck` | passed | 0 | 9.18 |
| `corepack pnpm --filter @netgrid/web typecheck` | passed | 0 | 2.28 |
| `git diff --check` | passed | 0 | 0.06 |

Alle geforderten Checks sind grün. Bestehende warn-only Ausgaben in AI-Taxonomy-/Hint-Checks bleiben unverändert und erzeugen keinen Exit-Code.

## Risiken / nächste Schritte

- Descriptoren brauchen ein echtes Schema-/Datenmodell, bevor 61 Karten umgeschrieben werden.
- StrategySupportPairs brauchen später ein explizites Role-/Evidence-Schema für DeckDoctrine v2.
- `requires_advancement_counter` bleibt absichtlich bei AI034, weil der sichere Split Action-/Target-Semantik braucht.
