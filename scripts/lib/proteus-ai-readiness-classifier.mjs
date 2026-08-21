export function classifyProteusAiReadiness(cardHint) {
  const tokens = new Set(typedSemanticTokens(cardHint));
  const roles = new Set([
    ...(cardHint.roles ?? []),
    ...(cardHint.riskTags ?? []),
  ]);
  const effects = cardHint.effects ?? [];
  const targetProfiles = cardHint.targetProfiles ?? [];
  const actionCapacityProfiles = cardHint.actionCapacityProfiles ?? [];
  const strategyEvidence = (cardHint.strategySupportPairs ?? []).flatMap(
    (pair) => pair.evidence ?? [],
  );
  const hasAccessOwner =
    effects.some(
      (effect) => effect.kind === "ambush" || effect.timing === "on_access",
    ) ||
    strategyEvidence.some(
      (token) =>
        token.startsWith("access.") ||
        token === "advance.access_window_counter_support",
    );
  const variableModeTarget = targetProfiles.some(
    (profile) => profile.kind === "mode_choice",
  );
  const hasVirusActionCost = actionCapacityProfiles.some(
    (profile) =>
      profile.class === "action_cost" &&
      profile.restriction === "purge_only" &&
      profile.sourceResource === "virus_state",
  );
  const hasVirusActionLoss = actionCapacityProfiles.some(
    (profile) =>
      profile.class === "action_loss" &&
      profile.sourceResource === "virus_state",
  );

  if (hasVirusActionCost && !hasVirusActionLoss)
    return result("virus_counter", "virus_or_antibody_semantics");
  if (
    hasAny(tokens, [
      "add_bad_publicity",
      "add_bad_publicity_from_frame_up_history",
      "bad_publicity",
      "corp_choice_derez_last_rezzed_black_ice_or_bad_publicity",
      "subtype_bad_publicity",
    ])
  )
    return result("bad_publicity", "bad_publicity_semantics");
  if (variableModeTarget)
    return result("target_choice", "target_profile_present");
  if (
    hasAny(tokens, [
      "add_current_encounter_additional_subroutine",
      "bounded_x_by_rez_cost_min_one",
      "corp_ice.rez_paid_scaling",
      "credits_x",
    ])
  )
    return result("x_cost", "variable_x_semantics");
  if (
    actionCapacityProfiles.some((profile) =>
      [
        "action_loss",
        "finite_bank",
        "future_recurring_gain",
        "random_gain",
        "recurring_gain",
      ].includes(profile.class),
    ) ||
    (cardHint.strategySupportPairs ?? []).some(
      (pair) => pair.roleDetail === "position_scaling_strength_tax_ice",
    ) ||
    hasAny(tokens, [
      "corp_damage_replacement_pdca_action_counter",
      "corp_start_turn_random_restricted_optional_action",
      "economy.temporary_resource_bank",
      "gain_temporary_corp_credits",
      "gain_temporary_trace_credits",
      "make_run_each_data_fort_sequence",
      "overadvance_start_of_corp_turn_actions",
      "remove_same_fort_advancement_counters_for_run_credits",
      "temporary_program_install_run",
      "temporary_strength_bonus",
    ])
  )
    return result("temporary_action", "temporary_or_delayed_semantics");
  if (
    actionCapacityProfiles.some(
      (profile) =>
        profile.class === "mandatory_gain" || profile.reliability === "random",
    ) ||
    hasAny(tokens, ["corp_random_discard_hq", "subtype_random"])
  )
    return result("random_outcome", "random_outcome_semantics");
  if (
    targetProfiles.some(
      (profile) => profile.purpose === "derez_fully_broken_ice",
    )
  )
    return result("target_choice", "target_profile_present");
  if (
    hasAny(tokens, [
      "one_base_link_card_per_trace_attempt",
      "run_pressure",
      "start_run",
      "start_run_redirect_to_source_fort",
      "successful_run_access_replacement",
      "trash_rezzed_ice_on_last_successful_run_fort_and_add_tags",
    ]) ||
    roles.has("rd_pressure") ||
    roles.has("agenda_pressure")
  )
    return result("run_modification", "run_modification_semantics");
  if (hasAccessOwner)
    return result("access_ambush", "access_or_ambush_semantics");
  if (
    roles.has("hidden_zone_tool") ||
    roles.has("hidden_zone_barrier") ||
    tokens.has("subtype_hidden") ||
    effects.some(
      (effect) =>
        typeof effect.target === "string" &&
        effect.target.startsWith("hidden."),
    )
  )
    return result("hidden_resource", "hidden_resource_semantics");
  if (
    cardHint.cardType === "resource" &&
    !targetProfiles.some(
      (profile) =>
        profile.purpose === "lock_fort_creation_with_near_term_value",
    )
  )
    return result("hidden_resource", "hidden_resource_semantics");
  if (targetProfiles.length > 0)
    return result("target_choice", "target_profile_present");
  if (
    (effects.length >= 4 && cardHint.cardType !== "ice") ||
    targetProfiles.length > 1 ||
    (cardHint.strategySupportPairs ?? []).length > 2 ||
    hasAny(tokens, ["agenda_difficulty", "trash_program_unless_runner_pays"]) ||
    (tokens.has("trace") && tokens.has("trash_runner_resource_and_add_tag")) ||
    (tokens.has("deck_unique_replacement") && tokens.has("activated_ability"))
  )
    return result("complex_multi_ability", "multiple_semantic_surfaces");
  return result("baseline", "no_specialized_readiness_model_required");
}

function typedSemanticTokens(cardHint) {
  return [
    cardHint.roles,
    cardHint.planRoles,
    cardHint.requiredMechanics,
    cardHint.riskTags,
    cardHint.tacticSignals,
    cardHint.effects,
    cardHint.conditions,
    cardHint.targetProfiles,
    cardHint.actionCapacityProfiles,
    cardHint.functionSignals,
  ].flatMap(flattenTypedSemanticValue);
}

function hasAny(tokens, values) {
  return values.some((value) => tokens.has(value));
}

function flattenTypedSemanticValue(value) {
  if (value === undefined || value === null) return [];
  if (Array.isArray(value)) return value.flatMap(flattenTypedSemanticValue);
  if (typeof value === "object")
    return Object.entries(value).flatMap(([key, nested]) => [
      key,
      ...flattenTypedSemanticValue(nested),
    ]);
  return [String(value)];
}

function result(family, reason) {
  return { family, reasons: [reason] };
}
