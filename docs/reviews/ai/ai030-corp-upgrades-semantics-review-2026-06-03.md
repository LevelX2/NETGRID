# AI030 Corp-Upgrades Semantics Review (2026-06-03)

Guide: `docs/architecture/ai/taktiksignale-strategieanker-guide-2026-06-02-v3.md`

## Scope

- Originalset V1 Corp-Upgrades reviewed: 26
- Proteus Corp-Upgrades reviewed: 13
- Test fixture reviewed: 1
- No new strategy IDs introduced.
- No planner, engine, LegalAction, action-score, plan-weight, targeting-AI, profile/default, UI or hidden-info behavior was changed.

## Outcome

Active hints, compiled hints and the Inspector index now expose reviewed Corp-Upgrade function signals. Corp-Upgrade manual `tacticSignals` are visible in the Inspector like Corp-Agenda signals, while strategy support remains separated into card-level `lineSupport` / `reviewedStrategySupportPairs`.

Agenda-difficulty Upgrades use `score.agenda_difficulty_discount` plus `remote.agenda_difficulty_discount` as remote-scoring support evidence. Static fort difficulty discounts no longer derive `score.advance_burst` / `corp.fast_advance` solely because generated facts contain `score_acceleration`.

## Signal-Empty Fixture

- `simple_upgrade`: Vanilla test upgrade has no active ability or tactical semantics.

## Target Profiles

- `onr_v1_349_aardvark`: program/restrict_or_trash_worm_breaker/public_or_controller_known_only
- `onr_v1_350_antiquated-interface-routines`: server/buff_all_ice_on_fort/public_or_controller_known_only
- `onr_v1_352_chester-mix`: installed_ice/discount_ice_install_on_fort/public_or_controller_known_only
- `onr_v1_353_chimera`: program/trash_daemon/public_or_controller_known_only
- `onr_v1_358_dr-dreff`: card/choose_hq_ice_for_temporary_encounter/public_or_controller_known_only
- `onr_v1_359_jenny-jett`: card/install_hq_ice_innermost_on_fort/public_or_controller_known_only
- `onr_v1_360_jerusalem-city-grid`: installed_ice/discount_and_buff_wall_ice_on_fort/public_or_controller_known_only
- `onr_v1_363_olivia-salazar`: installed_ice/temporarily_rez_ice_on_fort/public_or_controller_known_only
- `onr_v1_364_omni-kismet-ph-d`: card/swap_unrezzed_fort_ice_with_hq_ice/public_or_controller_known_only
- `onr_v1_369_singapore-city-grid`: card/swap_unrezzed_fort_ice_with_hq_ice/public_or_controller_known_only
- `onr_v1_370_tesseract-fort-construction`: installed_ice/add_etr_subroutine_to_fort_ice/public_or_controller_known_only
- `onr_proteus_060_herman-revista`: server/rearrange_fort_ice/public_or_controller_known_only
- `onr_proteus_062_lesley-major`: card/place_advancement_counters_in_fort/public_or_controller_known_only
- `onr_proteus_063_lisa-blight`: installed_ice/repeat_subroutine_on_fort_ice/public_or_controller_known_only
- `onr_proteus_064_marcel-desoleil`: installed_ice/repeat_subroutine_on_fort_ice/public_or_controller_known_only
- `onr_proteus_069_pavit-bharat`: card/replace_installed_fort_cards_from_hq/public_or_controller_known_only
- `onr_proteus_071_raymond-ellison`: card/remove_advancement_counters_for_temporary_credits/public_or_controller_known_only

## Strategy Support Pairs

- `onr_v1_350_antiquated-interface-routines`: corp.ice_tax_glacier (corp.ice_tax_glacier)
- `onr_v1_351_bizarre-encryption-scheme`: corp.remote_scoring (corp.remote_scoring)
- `onr_v1_352_chester-mix`: corp.economy_rez_reserve (corp.economy_rez_reserve), corp.ice_tax_glacier (corp.ice_tax_glacier)
- `onr_v1_353_chimera`: corp.ambush_bluff (corp.ambush_bluff)
- `onr_v1_354_crybaby`: corp.ambush_bluff (corp.ambush_bluff)
- `onr_v1_355_crystal-palace-station-grid`: corp.ice_tax_glacier (corp.ice_tax_glacier), corp.remote_scoring (corp.remote_scoring)
- `onr_v1_356_dedicated-response-team`: corp.damage_kill (corp.damage_kill), corp.tag_trace_punish (corp.tag_trace_punish)
- `onr_v1_357_dieter-esslin`: corp.ambush_bluff (corp.ambush_bluff)
- `onr_v1_358_dr-dreff`: corp.ice_tax_glacier (corp.ice_tax_glacier), corp.remote_scoring (corp.remote_scoring)
- `onr_v1_359_jenny-jett`: corp.ice_tax_glacier (corp.ice_tax_glacier), corp.remote_scoring (corp.remote_scoring)
- `onr_v1_360_jerusalem-city-grid`: corp.economy_rez_reserve (corp.economy_rez_reserve), corp.ice_tax_glacier (corp.ice_tax_glacier)
- `onr_v1_361_namatoki-plaza`: corp.remote_scoring (corp.remote_scoring)
- `onr_v1_363_olivia-salazar`: corp.economy_rez_reserve (corp.economy_rez_reserve), corp.ice_tax_glacier (corp.ice_tax_glacier), corp.remote_scoring (corp.remote_scoring)
- `onr_v1_364_omni-kismet-ph-d`: corp.ice_tax_glacier (corp.ice_tax_glacier)
- `onr_v1_365_paris-city-grid`: corp.tag_trace_punish (corp.tag_trace_punish)
- `onr_v1_366_red-herrings`: corp.remote_scoring (corp.remote_scoring)
- `onr_v1_367_rio-de-janeiro-city-grid`: corp.remote_scoring (corp.remote_scoring)
- `onr_v1_368_roving-submarine`: corp.remote_scoring (corp.remote_scoring)
- `onr_v1_369_singapore-city-grid`: corp.ice_tax_glacier (corp.ice_tax_glacier)
- `onr_v1_370_tesseract-fort-construction`: corp.ice_tax_glacier (corp.ice_tax_glacier), corp.remote_scoring (corp.remote_scoring)
- `onr_v1_372_turbeau-delacroix`: corp.tag_trace_punish (corp.tag_trace_punish)
- `onr_v1_373_twenty-four-hour-surveillance`: corp.ice_tax_glacier (corp.ice_tax_glacier)
- `onr_v1_374_washington-d-c-city-grid`: corp.remote_scoring (corp.remote_scoring)
- `onr_proteus_062_lesley-major`: corp.remote_scoring (corp.remote_scoring)
- `onr_proteus_063_lisa-blight`: corp.ice_tax_glacier (corp.ice_tax_glacier)
- `onr_proteus_064_marcel-desoleil`: corp.ice_tax_glacier (corp.ice_tax_glacier)
- `onr_proteus_065_networked-center`: corp.remote_scoring (corp.remote_scoring)
- `onr_proteus_066_obfuscated-fortress`: corp.ice_tax_glacier (corp.ice_tax_glacier)
- `onr_proteus_070_rasmin-bridger`: corp.ice_tax_glacier (corp.ice_tax_glacier), corp.remote_scoring (corp.remote_scoring)
- `onr_proteus_071_raymond-ellison`: corp.economy_rez_reserve (corp.economy_rez_reserve)
- `onr_proteus_072_research-bunker`: corp.remote_scoring (corp.remote_scoring)
- `onr_proteus_073_simon-francisco`: corp.central_stabilize (corp.central_stabilize)
- `onr_proteus_077_weapons-depot`: corp.remote_scoring (corp.remote_scoring)

## Warnings

- `onr_v1_349_aardvark`: function_signal_descriptor_gap
- `onr_v1_351_bizarre-encryption-scheme`: function_signal_descriptor_gap
- `onr_v1_352_chester-mix`: descriptor_gap, function_signal_descriptor_gap
- `onr_v1_370_tesseract-fort-construction`: function_signal_descriptor_gap
- `simple_upgrade`: legacy_fallback_only

## Verification

- `node scripts/apply-ai030-corp-upgrades-semantics.mjs`: passed
- `node scripts/check-ai030-corp-upgrades-semantics.mjs`: passed (`originalset=26`, `proteus=13`, `test=1`, `signals=17`, `inspectorCards=40`)
- Existing AI gates passed: AI023-2, AI024-1, AI025-1, AI026-1, AI027, strategy taxonomy, hint quality, compiled index, approval consistency, deck doctrine strategy, compiled hints, inspector index and manual overlays.
- `corepack pnpm --filter @netgrid/ai test`: passed (625 tests)
- `corepack pnpm --filter @netgrid/ai typecheck`: passed
- `corepack pnpm --filter @netgrid/web typecheck`: passed
- `git diff --check`: passed with line-ending warnings only for `scripts/build-ai-hint-inspector-index.mjs` and `scripts/check-ai-strategy-taxonomy.mjs`.

Blocked unrelated follow-up checks:

- `node scripts/check-ai028-netgrid-semantic-audit-pack.mjs`
- `node scripts/check-ai029-target-condition-constraint-schema-sweep.mjs`

Both were blocked by the unrelated untracked Chronicle activity `docs/activities/inbox/act-2026-06-03-corporate-war-score-chronicle.md`, which those checks report as a forbidden Chronicle working-tree change. This is outside the AI030 semantics changes.
