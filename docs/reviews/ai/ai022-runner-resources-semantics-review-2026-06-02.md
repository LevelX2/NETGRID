# AI022 Runner Resources Semantics Review

## Kurzfazit

AI022 prüft alle 61 aktiven/compiled Runner-Resources aus Originalset und Proteus sowie 4 bekannte, aber nicht aktive Classic-Resources. Alle aktiven Resources erhalten kontrollierte Taktiksignale. Neue Strategy IDs wurden nicht eingeführt. Strategieanker bleiben auf echte Search-/Breaker-Engine, HQ-/R&D-Multiaccess, Remote-Sabotage/-Lock und starke Survival-Resources begrenzt; einfache Economy-, Trace-/Link-, Tag-, BBS- und Hidden-Resource-Supportkarten bleiben support-only.

## Scope und Out-of-Scope

- Scope: aktive/compiled Runner Resources aus Originalset und Proteus; bekannte inaktive Classic-Resources als Count-/Abweichungscheck.
- Out-of-Scope: Runner-Programme, Runner-Hardware, Runner-Preps, Corp-Karten, Plannerverbrauch, ActionScore-/PlanWeight-Änderung, Engine-/Legalitätsänderung, Targeting-KI und Profil-/Default-Umschaltung.
- AI018/AI018c, AI019/AI019a, AI020/AI020-1 und AI021 bleiben getrennt; Airport Locker behält die bestehende Search-/Install-Entscheidung aus AI018.

## Hidden-Info-Grenzen

Hidden-Resource-Semantik ist nur Katalog-/Report-/Runner-side-safe. Die Corp-KI darf aus verdeckten Runner-Resource-Slots keine Kartentitel, Taktiksignale, Strategieanker oder TargetProfiles ableiten. AI022 ändert keine Runtime-Visibility, keine LegalActions, keine Inspector-Visibility-Regeln und keine Debugdaten.

## Inventarcounts

| Kategorie | Anzahl |
| --- | ---: |
| Aktive/compiled Runner-Resources | 61 |
| Originalset aktiv/compiled | 40 |
| Proteus aktiv/compiled | 21 |
| Inaktive/known Classic-Resources | 4 |
| Hidden Resources | 16 |
| Geänderte Resource-Karten | 55 |
| Neue Taktiksignale | 67 |
| Geänderte bestehende Signale | 0 |
| Neue Strategy IDs | 0 |
| Strategy-Support-Paare | 14 |

## Clusterübersicht

| Cluster | Karten | Hidden | Strategy-Anker |
| --- | ---: | ---: | ---: |
| access_hq_rnd_payoff | 3 | 2 | 2 |
| action_engine_or_random_action | 3 | 0 | 0 |
| base_link_or_trace_defense | 10 | 0 | 0 |
| bbs_search_or_recovery | 5 | 0 | 1 |
| burst_or_deferred_economy | 5 | 0 | 0 |
| damage_or_tag_survival | 7 | 0 | 2 |
| economy_engine | 5 | 0 | 0 |
| hidden_access_payoff | 2 | 2 | 1 |
| hidden_economy | 3 | 3 | 0 |
| hidden_prevention_damage_tag_resources | 2 | 2 | 0 |
| hidden_remote_sabotage | 2 | 2 | 1 |
| hidden_resource | 1 | 1 | 1 |
| hidden_trace_or_tag_defense | 3 | 3 | 0 |
| install_or_setup_support | 2 | 0 | 0 |
| other_resource_utility | 2 | 1 | 0 |
| program_hardware_resource_protection | 1 | 0 | 0 |
| remote_tax_or_remote_lock | 3 | 0 | 3 |
| risky_resource_or_drawback | 1 | 0 | 0 |
| virus_support | 1 | 0 | 0 |

## Neue und wiederverwendete Taktiksignale

AI022 ergänzt katalogisierte Resource-, Hidden-, Economy-, Trace-/Link-, Search-/Recovery-/Install-, Access-, Remote-/Fort-, Action-/Risk-, Survival- und Virus-Signale. Bestehende Signale aus AI018 bis AI021 werden weiterverwendet, darunter `setup.search`, `setup.program_search`, `setup.program_install`, `economy.action_credit`, `economy.burst_credit`, `defense.trace_defense`, `defense.base_link`, `access.hq_multiaccess`, `access.rnd_multiaccess`, `corp.bad_publicity_pressure` und `cost.agenda_point_penalty`.

| Signal | Einstufung | Erlaubte Strategy-Anker |
| --- | --- | --- |
| access.current_access_trash | support-only | - |
| access.hq_hidden_multiaccess | may-anchor | runner.hq_pressure, runner.interface_closeout |
| access.hq_random_discard_retaliation | support-only | - |
| access.hq_sabotage_credit_loss | may-anchor | runner.hq_pressure |
| access.remote_full_trash | may-anchor | runner.remote_contest, runner.remote_trash |
| access.remote_sabotage_payoff | may-anchor | runner.remote_contest, runner.remote_trash |
| access.rnd_hidden_multiaccess | may-anchor | runner.rnd_pressure, runner.interface_closeout |
| action.delayed_extra_action_engine | support-only | - |
| action.extra_action | support-only | - |
| action.extra_run_action | support-only | - |
| action.mandatory_extra_action | support-only | - |
| action.random_extra_action | support-only | - |
| corp.bad_publicity_on_trace_cancel | support-only | - |
| corp.trace_effect_bad_publicity | support-only | - |
| defense.all_meat_damage_prevention | may-anchor | runner.survival_defense |
| defense.ap_ice_bypass | support-only | - |
| defense.damage_retaliation | support-only | - |
| defense.installed_card_trash_prevention | support-only | - |
| defense.resource_trash_prevention | support-only | - |
| defense.trace_cancel | support-only | - |
| defense.trace_cancel_bad_publicity | support-only | - |
| economy.cost_window_credit | support-only | - |
| economy.hidden_burst_credit | support-only | - |
| economy.installment_credit | support-only | - |
| economy.successful_run_credit | support-only | - |
| economy.temporary_resource_bank | support-only | - |
| economy.trace_success_credit | support-only | - |
| economy.turn_start_credit | support-only | - |
| fort.creation_lock | may-anchor | runner.remote_contest |
| fort.install_ice_tax | may-anchor | runner.remote_contest |
| hidden.one_shot_resource | support-only | - |
| hidden.reveals_on_trash | support-only | - |
| hidden.reveals_on_use | support-only | - |
| hidden.runner_resource | support-only | - |
| remote.full_fort_trash | may-anchor | runner.remote_contest, runner.remote_trash |
| remote.install_ice_tax | may-anchor | runner.remote_contest |
| resource.base_link | support-only | - |
| resource.bbs | support-only | - |
| resource.connection | support-only | - |
| resource.hidden | support-only | - |
| resource.hidden_one_shot | support-only | - |
| resource.position | support-only | - |
| resource.random | support-only | - |
| resource.sabotage | support-only | - |
| resource.unique | support-only | - |
| risk.debt_loss_condition | support-only | - |
| risk.delayed_failure | support-only | - |
| risk.ends_on_run | support-only | - |
| risk.lose_game_debt | support-only | - |
| risk.mandatory_action | support-only | - |
| risk.random_action | support-only | - |
| risk.random_hand_reveal | support-only | - |
| risk.run_spend_limit | support-only | - |
| risk.unpreventable_brain_damage | support-only | - |
| run.bypass_ap_ice | support-only | - |
| run.encounter_escape | support-only | - |
| setup.delayed_install | support-only | - |
| setup.hardware_search | support-only | - |
| setup.install_countdown | support-only | - |
| setup.install_from_hand_staged | support-only | - |
| setup.prep_resource_search | support-only | - |
| setup.search_reveals_to_corp | support-only | - |
| setup.top_trash_recovery | support-only | - |
| virus.counter_protection | support-only | - |
| virus.counter_retention | support-only | - |
| virus.purge_resistance | support-only | - |
| virus.support | support-only | - |

Geänderte bestehende Signale: keine.

## Strategieanker und strategySupportPairs

Neue Strategy IDs: keine.

| Karte | Strategieanker | Rolle | Confidence | Evidence |
| --- | --- | --- | --- | --- |
| Corporate Ally | runner.remote_contest | score_denial | medium | remote.agenda_difficulty_tax, cost.agenda_point_penalty |
| Diplomatic Immunity | runner.survival_defense | defensive_tool | high | defense.all_meat_damage_prevention |
| Restrictive Net Zoning | runner.remote_contest | tax_enabler | medium | remote.install_ice_tax, fort.install_ice_tax |
| The Short Circuit | runner.search.breaker | enabler | medium | setup.program_search, setup.card_search, setup.search_reveals_to_corp |
| Wilson, Weeflerunner Apprentice | runner.survival_defense | defensive_tool | medium | defense.meat_damage_prevention, defense.tag_prevention, action.extra_run_action |
| Airport Locker | runner.search.breaker | engine_anchor | high | setup.search, setup.program_search, setup.program_install, setup.install_during_run, resource.hidden |
| Credit Subversion | runner.hq_pressure | sabotage_payoff | medium | corp.economy_pressure, access.hq_sabotage_credit_loss, resource.hidden |
| Death from Above | runner.remote_contest | sabotage_payoff | high | access.remote_full_trash, remote.full_fort_trash, access.trash_untrashable, resource.hidden |
| Death from Above | runner.remote_trash | sabotage_payoff | medium | access.remote_full_trash, access.trash_untrashable |
| HQ Mole | runner.hq_pressure | payoff_anchor | high | access.hq_multiaccess, access.hq_hidden_multiaccess, resource.hidden |
| HQ Mole | runner.interface_closeout | payoff_anchor | medium | access.hq_multiaccess, access.hq_hidden_multiaccess |
| Precision Bribery | runner.remote_contest | lock_piece | high | fort.creation_lock, resource.unique |
| R&D Mole | runner.rnd_pressure | payoff_anchor | high | access.rnd_multiaccess, access.rnd_hidden_multiaccess, resource.hidden |
| R&D Mole | runner.interface_closeout | payoff_anchor | medium | access.rnd_multiaccess, access.rnd_hidden_multiaccess |

Karten ohne Strategieanker tragen keine kanonische strategische Rolle. Jedes gesetzte `lineSupport` hat im JSON-Report ein eindeutiges `strategySupportPairs`-Objekt mit Rolle, Evidence und Confidence.

## TargetProfile-Kandidaten

TargetProfile V1 bleibt diagnostisch/read-only. Schema-Gaps sind vor allem Top-N-Search mit mehreren Picks, current-access trash, successful-run-before-access Serverfenster und Resource-trash-Replacement während des Corp-Turns. Es gibt keine Targeting-KI und keine Hidden-Info-Zielableitung.

## Deferred Items

- `runner.bad_publicity_pressure`: deferred; Back Door to Netwatch nutzt Bad-Publicity-Signale, aber AI021 hat keine Strategy-ID freigegeben.
- Action-/Random-Engine: deferred; Preying Mantis, Quest for Cattekin und Bargain with Viacox bleiben candidate-only.
- Current-access trash: schema_gap; Mercenary Subcontract passt nicht sauber in TargetProfile V1.

## Post-Review-Liste

Die vollständige Kartenliste mit Taktiksignalen, Strategieankern, `strategySupportPairs`, TargetProfile-Status, Hidden-Info-Policy und Rationale steht im JSON-Report `ai022-runner-resources-semantics-review-report-2026-06-02.json`.

## Count-Abweichungen

- Classic/Originalset: 40 aktive Originalset-Resources plus 4 bekannte inaktive Classic-Resources.
- Proteus: 21 aktive/compiled Resources; keine Abweichung zur Prompt-Zahl.

## Verifikation

Der AI022-Invariant-Check prüft vollständige Post-Review-Abdeckung, katalogisierte Signale, Hidden-Resource-Markierung, `strategySupportPairs`-Konsistenz, keine generische Resource-/Hidden-/Connection-Strategie, keine einfachen Economy-/Trace-/BBS-/Tag-Prevention-Anker, Airport-Locker-Regression, HQ-/R&D-Mole-Multiaccess, Simulacrum ohne Breaker-Coverage und No-Effect-Flags.

| Kommando | Status | Ergebnis |
| --- | --- | --- |
| `node scripts/check-ai-derived-facts.mjs --write` | passed | AI_DERIVED_FACTS OK pilotCards=193 implementations=193 derivedFacts=193 overlaps=124 manualOverlay=130 errors=0 warnings=1009 |
| `node scripts/check-ai-derived-facts-full.mjs --write` | passed | AI_DERIVED_FACTS_FULL OK active=564 implementations=527 generated=391 overlays=6 fallback=136 errors=0 warnings=2038 |
| `corepack pnpm build:ai-compiled-hints` | passed | AI_COMPILED_HINTS OK cards=564 generated=391 overlays=6 fallback=136 errors=0 warnings=2038 |
| `corepack pnpm build:ai-hint-inspector-index` | passed | AI_HINT_INSPECTOR_INDEX OK cards=564 mechanical=493 generated=325 overlays=6 signals=458 anchors=215 warnings=231 |
| `node scripts/check-ai-hint-compiled-index.mjs --write` | passed | AI_HINT_COMPILED_INDEX OK cards=193 errors=0 warnings=673 |
| `corepack pnpm check:ai-strategy-taxonomy` | passed | AI_STRATEGY_TAXONOMY OK task=AI004 strategies=20 strategicRoles=11 functionSignals=318 roles=235 planRoles=102 lineSupport=15 errors=0 warnings=72 |
| `corepack pnpm check:ai-compiled-hints` | passed | AI_COMPILED_HINTS OK cards=564 generated=391 overlays=6 fallback=136 errors=0 warnings=2038 |
| `corepack pnpm check:ai-hint-inspector-index` | passed | AI_HINT_INSPECTOR_INDEX OK cards=564 mechanical=493 generated=325 overlays=6 signals=458 anchors=215 warnings=231 |
| `corepack pnpm check:ai-hint-compiled-index` | passed | AI_HINT_COMPILED_INDEX OK cards=193 errors=0 warnings=673 |
| `corepack pnpm check:ai-manual-overlays` | passed | AI_MANUAL_OVERLAYS OK overlayFiles=2 overlayCards=6 errors=0 warnings=24 |
| `corepack pnpm check:ai-hint-quality` | passed | AI_HINT_QUALITY OK hints=564 roles=251 planRoles=102 errors=0 warnings=150 benchmarkCards=308 |
| `corepack pnpm check:ai-approval-consistency` | passed | CONSISTENCY_OK 564 ai_supported cards |
| `corepack pnpm check:ai-deck-doctrine-strategy` | passed | AI006 DeckDoctrine strategy aggregation check passed: 5 deck profiles |
| `corepack pnpm --filter @netgrid/ai test` | passed | vitest run: 32 test files passed, 625 tests passed |
| `corepack pnpm --filter @netgrid/ai exec tsc -p tsconfig.json --noEmit` | passed | TypeScript noEmit completed with exit code 0 |
| `corepack pnpm --filter @netgrid/web exec tsc -p tsconfig.json --noEmit` | passed | TypeScript noEmit completed with exit code 0 |
| `git diff --check` | passed | No whitespace errors |
| `node scripts/check-ai022-runner-resources-semantics.mjs` | passed | AI022_RUNNER_RESOURCES_SEMANTICS OK active=61 inactive=4 hidden=16 postReview=61 pairs=14 |
