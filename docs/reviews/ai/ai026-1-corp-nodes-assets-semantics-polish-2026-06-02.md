# AI026-1 Corp Nodes/Assets Semantics Polish

## Kurzfazit

AI026-1 richtet die AI026-Corp-Nodes-/Assets-Semantik gezielt an Guide V3 aus. Die 54 aktiven/compiled Corp-Nodes/Assets bleiben abgedeckt; davon sind 41 Originalset-, 11 Proteus- und 2 aktive Test-/V08-Assets. Es gibt keine neue Strategy-ID und keine Planner-, ActionScore-, PlanWeight-, Targeting-, Engine-, Legalitäts-, Profil-/Default-, UI- oder Hidden-Info-Wirkung.

## Scope / Out-of-Scope

Scope sind die im Prompt genannten Access-Ambush-, Damage-, Tag-, Economy-, Draw-/Handsize-, TargetProfile- und Counter-Punish-Korrekturen. Out-of-Scope bleiben Engine, LegalActions, Planner, ActionScore, PlanWeight, Targeting-KI, UI, Profile/Defaults, Runtime-Feature-Flags und neue Legalität.

## Verwendete Quellen

- Repo-Wahrheit aus aktuellen CardDefinitions/CardImplementations und aktiven/compiled Hints.
- Guide V3: `docs/architecture/ai/taktiksignale-strategieanker-guide-2026-06-02-v3.md`.
- AI026 Review und JSON-Report vom 2026-06-02.
- AI024-1/AI025-1 als bereits vorhandene Korrekturbatches.

## Guide-V3-Abgleich

Kartentext schlägt Cluster, Subtyp und frühere Hints. Access-Ambush bekommt konkrete Access-Wirkung, Damage-Typen werden nicht vermischt, Tag-Rollen trennen initiale Quelle, Access-Tag und Snowball, Draw ist keine Economy, Hand Size ist kein Score-Kontext und statische Subtyp-Scope-Regeln werden als Constraints statt TargetProfiles reportet.

## Ausgangsbefund

AI026 war als read-only Foundation korrekt, enthielt aber die bekannten V3-Auffälligkeiten: generisches `damage.payoff` ohne präzisen Damage-Typ, `meat_damage_payoff` bei Brain-/Net-Damage-Ambushes, `persistent_tag_source` bei TRAP!, `trace_credit_enabler` bei Blood Cat, zu grobe HQ-/R&D-/Economy-Signale und TargetProfile-Kandidaten für statische ICE-Scope-Assets.

## Geänderte Karten

- Setup!: Net-Damage-Access-Ambush; `damage.payoff` bleibt nur Oberklasse, kein Damage-Kill-Anker.
- TRAP!: Access-Net-Damage plus Access-Tag-Ambush; die Tag-Rolle ist nicht persistent.
- Vacant Soulkiller: Brain-Damage-Ambush nach Advancement Countern; keine Meat-Damage-Rolle.
- Virus Test Site: Net-Damage-Ambush skaliert mit Advancement Countern; keine Meat-Damage-Rolle.
- Bel-Digmo Antibody: R&D-Access-Net-Damage plus Reveal/Self-Shuffle.
- Stereogram Antibody: Archives selbst ist der Trigger; keine Archives-safe-exception.
- Blood Cat: Trace 5 in Tag; kein Trace-Credit-Enabler.
- Corprunner's Shattered Remains: Hardware-Trash-Access-Ambush ohne Tag-/Tagged-Logik.
- Omniscience Foundation: Conditional additional-tag follow-up; not an initial or persistent tag source.
- Corporate Negotiating Center: HQ-Agenda-Reveal-Economy with explicit reveal risk; no high-difficulty agenda risk.
- Cowboy Sysop: Uninstall eigener installierter Karte nach HQ; keine Archives-Recovery.
- Rescheduler: HQ in R&D mischen und gleich viele Karten ziehen ist Hand-Refresh, kein kontrolliertes Topdeck-Setup.
- Syd Meyer Superstores: Cashout durch Trash eigener rezzed ICE; kein Install-Discount und keine Temporary-Rez-Liability.
- ESA Contract: Corp Draw, nicht Credit-Economy.
- Euromarket Consortium: Draw und Corp-Handsize, kein Score-Kontext.
- Rustbelt HQ Branch: Corp-Handsize, kein Score-Kontext.
- Information Laundering: Advanceable counter cashout, nicht generischer Installed-Drip.
- Department of Truth Enhancement: Action-charged bank, nicht normaler Installed-Drip.
- South African Mining Corp: Drei Aktionen fuer 6 Credits; keine normale Drip-Economy.
- Remote Facility: Repeatable extra action remains a tactic signal; Fast-Advance/Remote-Scoring anchor deferred because no direct score conversion is encoded.
- Nevinyrral: Repeatable extra action with lose-game risk; no automatic Fast-Advance/Remote-Scoring anchor.
- Pacifica Regional AI: Advancement-counter-to-action conversion remains a plausible Fast-Advance anchor.
- Data Masons: Static Wall scope is a constraint, not a TargetProfile.
- Encoder, Inc.: Static Code-Gate scope is a constraint, not a TargetProfile.
- Skälderviken SA Beta Test Site: Static Black-ICE scope is a constraint, not a TargetProfile.
- Fortress Architects: Static ICE-install discount has no target choice in current hint layer.
- Doppelganger Antibody: Counter-Punish konkret als Runner-Credit-Loss-Counter.
- Pattel Antibody: Counter-Punish konkret als Icebreaker-Strength-Counter.

## Geänderte Signale

Neue präzise Signale:

- `access.corp_net_damage_ambush`
- `access.corp_brain_damage_ambush`
- `access.corp_tag_ambush`
- `access.corp_rnd_net_damage_ambush`
- `access.corp_archives_net_damage_ambush`
- `access.corp_credit_loss_counter`
- `access.corp_icebreaker_strength_counter`
- `risk.reveal_hq_agendas`
- `info.hq_agenda_reveal`
- `economy.corp_hq_agenda_reveal_credit`
- `hq.corp_installed_card_bounce`
- `install.corp_uninstall_to_hq`
- `hq.corp_hand_refresh`
- `rnd.corp_shuffle_hq_into_rnd`
- `draw.corp_draw`
- `setup.corp_hand_size`
- `economy.corp_counter_cashout`
- `economy.corp_advanceable_cashout`
- `economy.corp_charge_bank`
- `economy.corp_action_charged_bank`
- `economy.corp_multi_action_credit`
- `risk.trash_own_rezzed_ice`
- `ice.corp_self_trash_cost`

## Entfernte falsche Signale

Siehe JSON-Report `removedSignals`. Entfernt oder ersetzt wurden unter anderem `risk.high_difficulty_agenda`, `archives.corp_recovery`, `rnd.corp_topdeck_setup`, `ice.corp_install_discount`, `risk.temporary_rez_liability`, `economy.corp_draw`, `score.hand_size`, `economy.corp_installed_credit_drip`, `tag.corp_persistent_source` und falsche Strategy-Rollen.

## Neu ergänzte Signale

Die neuen Signale bleiben read-only und erzeugen keine Planner- oder Runtime-Wirkung. `damage.payoff`, `access.corp_counter_punish` und `economy.corp_draw` werden nur als Legacy-/Aggregation-Kontext retained, nicht als präzise Primärevidenz.

## Geänderte StrategySupportPairs

- Setup!: `corp.ambush_bluff` -> `access_net_damage_payoff`
- TRAP!: `corp.ambush_bluff` -> `access_net_damage_payoff`, `corp.tag_trace_punish` -> `access_tag_source`
- Vacant Soulkiller: `corp.ambush_bluff` -> `access_brain_damage_payoff`, `corp.damage_kill` -> `access_brain_damage_payoff`
- Virus Test Site: `corp.ambush_bluff` -> `access_net_damage_payoff`, `corp.damage_kill` -> `access_net_damage_payoff`
- Bel-Digmo Antibody: `corp.ambush_bluff` -> `access_net_damage_payoff`
- Stereogram Antibody: `corp.ambush_bluff` -> `access_net_damage_payoff`
- Blood Cat: `corp.tag_trace_punish` -> `trace_tag_source`
- Corprunner's Shattered Remains: `corp.ambush_bluff` -> `access_hardware_trash`
- Omniscience Foundation: `corp.tag_trace_punish` -> `tag_snowball_followup`
- Corporate Negotiating Center: support-only
- Cowboy Sysop: support-only
- Rescheduler: support-only
- Syd Meyer Superstores: `corp.asset_economy` -> `high_risk_economy_payoff`
- ESA Contract: support-only
- Euromarket Consortium: support-only
- Rustbelt HQ Branch: support-only
- Information Laundering: `corp.asset_economy` -> `installed_economy_engine`
- Department of Truth Enhancement: `corp.asset_economy` -> `installed_economy_engine`
- South African Mining Corp: `corp.asset_economy` -> `high_risk_economy_payoff`
- Remote Facility: support-only
- Nevinyrral: support-only
- Pacifica Regional AI: `corp.fast_advance` -> `fast_advance_action_engine`
- Doppelganger Antibody: `corp.ambush_bluff` -> `access_counter_credit_loss`
- Pattel Antibody: `corp.ambush_bluff` -> `access_counter_icebreaker_strength`

## Geänderte TargetProfiles

- Data Masons: candidate -> not_required
- Encoder, Inc.: candidate -> not_required
- Skälderviken SA Beta Test Site: candidate -> not_required
- Fortress Architects: candidate -> not_required

## Conditions-/Risiko-/Constraint-Korrekturen

- Data Masons: only_walls
- Encoder, Inc.: only_code_gates
- Skälderviken SA Beta Test Site: only_black_ice
- Fortress Architects: static_ice_install_discount

Syd Meyer Superstores trägt jetzt `risk.trash_own_rezzed_ice`; Corporate Negotiating Center trägt `risk.reveal_hq_agendas`; Nevinyrral behält `risk.leaves_play_loss` und `risk.loss_condition` ohne automatischen Score-Strategieanker.

## Hidden-Info-Bestätigung

Korp-Node-/Asset-Semantik bleibt `corp_side_only_until_rezzed_or_accessed`, bis eine Karte rezzed, accessed, exposed oder anderweitig legal bekannt ist. Es gibt keine neue WebSocket-, Reconnect-, Undo-, Replay-, PublicEvents-, Log-, Client-Error-, Planner- oder Targeting-KI-Projektion.

## Test-/V08-Abgrenzung

Die aktiven Test-/V08-Assets bleiben getrennt reportet: `simple_economy_asset`, `v08_cashout_asset`. Test-StrategySupportPairs bleiben aus Produktionsaggregation ausgeschlossen.

## Deferred Items

- target_profile_v1_for_private_node_asset_choices: deferred_schema_gap. Cowboy Sysop, Rescheduler, Syd Meyer Superstores and hidden/private access-triggered choices remain report-only until a side-safe TargetProfile consumer exists.
- extra_action_strategy_taxonomy: deferred. Remote Facility and Nevinyrral keep extra-action tactic semantics, but no new Corp tempo strategy ID or automatic Fast-Advance/Remote-Scoring anchor is introduced.

## Verifikation

Alle AI026-/AI026-1-Paketchecks, breiten AI-Gates, `@netgrid/ai`-Tests, AI-/Web-Typechecks und `git diff --check` sind erfolgreich gelaufen. Details stehen im JSON-Report unter `verification`.

## Risiken / Folgeempfehlungen

Die neuen Signale erhöhen Foundation-Datenqualität, bleiben aber ohne produktive KI-Wirkung, bis LegalActions semantisch sicher verstanden und side-safe TargetProfiles konsumiert werden.
