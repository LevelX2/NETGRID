export const KNOWN_HINT_EFFECT_KINDS = [
  "economy",
  "draw",
  "damage",
  "tag",
  "trace",
  "run_tax",
  "breaker",
  "search",
  "remote_protection",
  "score_acceleration",
  "trash_credit",
  "multiaccess",
  "topdeck_info",
  "hq_info",
  "expose_info",
  "zone_shuffle",
  "etr",
  "extra_action",
  "counter_economy",
  "action_economy",
  "start_of_turn_economy",
  "recurring_economy",
  "advanceable_economy",
  "scored_agenda_action",
  "advance_burst",
  "shuffle_draw",
  "card_recovery",
  "agenda_reveal_economy",
  "advance",
  "install",
  "rez",
  "remote_build",
  "global_modifier",
  "finite_economy_pool",
  "future_run_effect",
  "future_encounter_effect",
  "access_replacement",
  "install_discount",
  "rez_discount",
  "program_trash",
  "ice_trash",
  "hardware_trash",
  "run_lock",
  "no_jack_out",
  "persistent_counter_effect",
  "trace_credit",
  "resource_trash",
  "link_penalty",
  "tag_punish_payoff",
  "tag_source",
  "remote_tax",
  "access_punish",
  "ambush",
  "damage_prevention",
  "flatline_prevention",
  "program_trash_prevention",
  "hardware_trash_prevention",
  "resource_trash_prevention",
  "tag_prevention",
  "trace_defense",
  "link",
  "base_link",
  "remove_brain_damage",
  "meat_damage_prevention",
  "net_damage_prevention",
  "brain_damage_prevention",
  "hand_size_modifier",
  "hardware_trait",
  "program_host",
  "action_penalty",
  "persistent_survival_modifier",
  "prevention_replacement",
  "survival_payoff",
  "delayed_penalty",
] as const;

export const KNOWN_HINT_EFFECT_TIMINGS = [
  "action",
  "scored_activated",
  "when_scored",
  "start_of_turn",
  "end_of_turn",
  "start_of_run",
  "during_run",
  "during_ice_encounter",
  "on_access",
  "on_rez",
  "persistent",
  "encounter",
  "encounter_resolution",
  "successful_run",
  "after_successful_run",
  "trace_success",
  "corp_turn",
  "runner_turn",
  "prevention_window",
  "damage_window",
  "flatline_replacement",
  "trace_window",
  "install",
  "on_leave_play",
] as const;

export const KNOWN_HINT_EFFECT_SCOPES = [
  "runner",
  "corp",
  "fort",
  "server",
  "ice",
  "hq",
  "rnd",
  "archives",
  "remote",
  "score_area",
  "installed_card",
  "accessed_card",
  "run_path",
  "installed_program",
  "trace",
  "damage",
  "hardware",
  "resource",
  "heap",
  "stack",
] as const;

export const KNOWN_HINT_EFFECT_RESOURCES = [
  "credits",
  "cards",
  "actions",
  "tags",
  "damage",
  "advancement_counters",
  "trash_credits",
  "memory",
  "link",
  "counters",
  "strength",
  "subroutines",
  "net_damage",
  "meat_damage",
  "brain_damage",
  "hand_size",
] as const;

export const KNOWN_HINT_CONDITION_KINDS = [
  "requires_runner_tagged",
  "requires_successful_run",
  "requires_known_ice",
  "requires_agenda_in_remote",
  "requires_trace_success",
  "requires_during_run",
  "requires_scored_agenda",
  "requires_accessed_card",
  "requires_remote_server",
  "requires_hq_pressure",
  "requires_rnd_pressure",
  "requires_installed_program",
  "requires_missing_breaker_coverage",
  "requires_encounter",
  "requires_unbroken_subroutine",
  "requires_later_encounter",
  "requires_remaining_ice",
  "requires_agenda_in_hq",
  "requires_agenda_reveal",
  "requires_hq_agenda",
  "requires_installed_ice",
  "requires_rezzed_ice",
  "requires_score_window",
  "requires_corp_credits_threshold",
  "requires_start_of_turn",
  "requires_stolen_agenda_last_turn",
  "requires_archives_card",
  "requires_rnd_top",
  "requires_advancement_counter",
  "requires_installed_card",
  "requires_rezzed_card",
  "requires_runner_draw",
  "requires_runner_pay_or_take_tag",
  "requires_damage",
  "requires_net_damage",
  "requires_meat_damage",
  "requires_brain_damage",
  "requires_flatline",
  "requires_program_trash",
  "requires_trace_attempt",
  "requires_prevention_window",
  "requires_turn_limit_available",
  "requires_runner_action",
  "requires_installed_resource",
  "requires_installed_hardware",
  "requires_grip_card",
  "requires_stack_search",
  "requires_heap_card",
  "requires_credit_pool",
] as const;

export const KNOWN_HINT_COST_RISKS = ["low", "medium", "high"] as const;

export const KNOWN_HINT_BREAKER_COVERAGES = [
  "wall",
  "sentry",
  "code_gate",
  "ap",
  "trace",
  "watchdog",
  "black_ice",
  "universal",
  "unknown_special",
] as const;

export const KNOWN_HINT_BREAKER_SIDE_EFFECTS = [
  "forgo_actions",
  "stealth_loss",
  "random_failure",
  "ends_run_after_use",
  "credit_intensive_pump",
  "program_trash_risk",
  "temporary_strength",
  "once_per_subroutine",
] as const;

export const KNOWN_HINT_REMOTE_ROLE_KINDS = [
  "scoring_protection",
  "bait",
  "asset_economy",
  "run_tax",
  "remote_capacity",
  "ambush",
  "tax_fort",
  "ice_modifier",
  "agenda_steal_tax",
  "tag_punish_asset",
] as const;

export const KNOWN_HINT_REMOTE_THREAT_LEVELS = [
  "low",
  "medium",
  "high",
] as const;

export const KNOWN_HINT_TARGET_ZONES = ["stack", "stack_top"] as const;

export const KNOWN_HINT_TARGET_CARD_TYPES = [
  "agenda",
  "asset",
  "event",
  "hardware",
  "ice",
  "operation",
  "program",
  "resource",
  "upgrade",
] as const;

export const KNOWN_HINT_TARGET_INSTALL_COSTS = ["free", "normal"] as const;

export const KNOWN_HINT_TARGET_PROFILE_SCHEMA_VERSIONS = [
  "target-profile-v1",
] as const;

export const KNOWN_HINT_TARGET_PROFILE_KINDS = [
  "install_target",
  "mode_choice",
  "search_install_target",
  "hosted_install_target",
  "use_target",
  "replacement_target",
] as const;

export const KNOWN_HINT_TARGET_PROFILE_TIMINGS = [
  "on_install",
  "on_play",
  "on_access",
  "paid_action",
  "paid_or_triggered_reposition",
  "activated_ability",
  "corp_rez_window",
  "start_of_run",
  "during_ice_encounter",
  "encounter_resolution",
  "subroutine_resolution",
  "on_use",
  "after_successful_run",
  "hq_access",
  "rnd_access",
  "prevention_window",
  "replacement_window",
] as const;

export const KNOWN_HINT_TARGET_PROFILE_TARGET_TYPES = [
  "installed_ice",
  "ice_position",
  "ice_type",
  "program",
  "icebreaker",
  "hosted_program",
  "server",
  "card",
  "accessed_card",
  "mode_choice",
  "subroutine",
] as const;

export const KNOWN_HINT_TARGET_PROFILE_PREFERENCES = [
  "known_or_rezzed_ice",
  "known_sentry",
  "known_wall",
  "known_code_gate",
  "current_encounter_ice",
  "blocks_relevant_run_path",
  "high_strength_ice",
  "high_break_cost_without_bonus",
  "multi_subroutine_ice",
  "relevant_server_ice",
  "missing_current_coverage",
  "type_blocking_relevant_run_path",
  "type_with_known_problem_ice",
  "type_missing_in_current_rig",
  "program_breaks_current_ice",
  "program_repairs_missing_coverage",
  "program_affordable_after_install",
  "program_preserves_run_goal",
  "low_mu_program",
  "installed_icebreaker",
  "hosted_icebreaker_eligible",
  "trash_prevention_high_value_program",
  "currently_used_breaker",
  "breaker_matching_current_ice",
  "breaker_matching_common_problem_ice",
  "prevent_high_damage_subroutine",
  "prevent_program_trash_subroutine",
  "prevent_hardware_trash_subroutine",
  "prevent_dangerous_tag_subroutine",
  "prevent_run_lock_subroutine",
  "use_choice_option_with_visible_board_payoff",
  "prefer_option_relevant_to_current_run_path",
  "prefer_option_that_protects_agenda_or_remote_pressure",
  "protects_agenda_remote",
  "protects_central_access_pressure",
  "current_run_path_relevance",
  "high_run_denial_payoff",
  "high_rez_cost_relief",
  "high_value_accessed_card",
  "current_access_only",
  "denies_corp_economy_or_combo_piece",
  "normally_untrashable_payoff",
  "denies_corp_agenda_or_combo_piece",
  "lowest_near_term_value",
  "protect_agenda_density",
  "breaker_covers_current_server",
  "high_install_cost_or_memory",
  "central_or_remote_plan_enabler",
  "reduces_current_run_payoff",
  "adds_relevant_encounter_tax",
] as const;

export const KNOWN_HINT_TARGET_PROFILE_AVOIDS = [
  "unknown_low_information_target",
  "irrelevant_server_ice",
  "already_cheap_to_break",
  "non_matching_ice_type",
  "unaffordable_after_install",
  "hidden_info_dependent_choice",
  "low_value_program",
  "target_would_break_host_limit",
  "pure_end_the_run_subroutine",
  "normal_breaker_available_without_run_end",
  "access_goal_blocked_after_use",
  "option_with_no_visible_current_payoff",
  "low_value_accessed_card",
  "next_turn_required_card",
  "low_impact_ice",
  "no_rezzed_ice_target",
  "no_subsidiary_fort_target",
] as const;

export const KNOWN_HINT_TARGET_PROFILE_HIDDEN_INFO_POLICIES = [
  "visible_or_known_only",
  "legal_targets_only",
  "legal_options_only",
  "current_access_only",
  "public_or_controller_known_only",
] as const;

export const KNOWN_HINT_LINE_SUPPORT = [
  "rig_first",
  "economy_first",
  "breaker_search_first",
  "early_rnd_pressure",
  "early_hq_pressure",
  "remote_contest",
  "interface_pressure",
  "closeout_pressure",
  "central_stabilize",
  "remote_scoring_build",
  "ice_tax_glacier",
  "economy_rez_reserve",
  "fast_advance_or_counter_ops",
  "tag_trace_punish",
  "bait_and_punish",
  "score_closeout",
  "runner.rig_first",
  "runner.economy_first",
  "runner.search.breaker",
  "runner.rnd_pressure",
  "runner.hq_pressure",
  "runner.remote_contest",
  "runner.remote_trash",
  "runner.interface_closeout",
  "runner.survival_defense",
  "runner.run_event_tempo",
  "corp.remote_scoring",
  "corp.fast_advance",
  "corp.ice_tax_glacier",
  "corp.central_stabilize",
  "corp.asset_economy",
  "corp.tag_trace_punish",
  "corp.damage_kill",
  "corp.ambush_bluff",
  "corp.economy_rez_reserve",
  "corp.rush_score",
  "corp.action_tempo",
  "corp.overadvance_value",
  "corp.draw_engine",
  "corp.deck_recycle_engine",
] as const;

export const KNOWN_HINT_OPPONENT_SIGNAL_KINDS = [
  "corp_tag_punish",
  "corp_glacier",
  "corp_fast_advance",
  "corp_asset_economy",
  "corp_remote_scoring",
  "runner_rnd_pressure",
  "runner_hq_pressure",
  "runner_remote_contest",
  "runner_rig_setup",
  "runner_virus_mill",
  "runner_tag_avoidance",
] as const;

export const KNOWN_HINT_QUALITY_CONFIDENCE = ["low", "medium", "high"] as const;

export const KNOWN_HINT_STRATEGY_SUPPORT_PAIR_ROLES = [
  "payoff_anchor",
  "engine_anchor",
  "enabler",
  "support_tool",
  "utility",
  "defensive_tool",
  "emergency_tool",
  "win_condition",
  "tax_tool",
  "punish_payoff",
  "scoring_tool",
] as const;

const HIDDEN_INFO_RISK_FIELDS = [
  "opponentDeckList",
  "corpHiddenRndOrder",
  "runnerHiddenStackOrder",
  "hiddenHqCards",
  "privatePayload",
  "fullGameState",
  "cardInstances",
  "actualDeckOrder",
  "actualStackOrder",
  "actualRndOrder",
] as const;

export type KnownHintEffectKind = (typeof KNOWN_HINT_EFFECT_KINDS)[number];
export type KnownHintEffectTiming = (typeof KNOWN_HINT_EFFECT_TIMINGS)[number];
export type KnownHintEffectScope = (typeof KNOWN_HINT_EFFECT_SCOPES)[number];
export type KnownHintEffectResource =
  (typeof KNOWN_HINT_EFFECT_RESOURCES)[number];
export type KnownHintConditionKind =
  (typeof KNOWN_HINT_CONDITION_KINDS)[number];
export type KnownHintCostRisk = (typeof KNOWN_HINT_COST_RISKS)[number];
export type KnownHintBreakerCoverage =
  (typeof KNOWN_HINT_BREAKER_COVERAGES)[number];
export type KnownHintBreakerSideEffect =
  (typeof KNOWN_HINT_BREAKER_SIDE_EFFECTS)[number];
export type KnownHintRemoteRoleKind =
  (typeof KNOWN_HINT_REMOTE_ROLE_KINDS)[number];
export type KnownHintRemoteThreatLevel =
  (typeof KNOWN_HINT_REMOTE_THREAT_LEVELS)[number];
export type KnownHintTargetZone = (typeof KNOWN_HINT_TARGET_ZONES)[number];
export type KnownHintTargetCardType =
  (typeof KNOWN_HINT_TARGET_CARD_TYPES)[number];
export type KnownHintTargetInstallCost =
  (typeof KNOWN_HINT_TARGET_INSTALL_COSTS)[number];
export type KnownHintTargetProfileSchemaVersion =
  (typeof KNOWN_HINT_TARGET_PROFILE_SCHEMA_VERSIONS)[number];
export type KnownHintTargetProfileKind =
  (typeof KNOWN_HINT_TARGET_PROFILE_KINDS)[number];
export type KnownHintTargetProfileTiming =
  (typeof KNOWN_HINT_TARGET_PROFILE_TIMINGS)[number];
export type KnownHintTargetProfileTargetType =
  (typeof KNOWN_HINT_TARGET_PROFILE_TARGET_TYPES)[number];
export type KnownHintTargetProfilePreference =
  (typeof KNOWN_HINT_TARGET_PROFILE_PREFERENCES)[number];
export type KnownHintTargetProfileAvoid =
  (typeof KNOWN_HINT_TARGET_PROFILE_AVOIDS)[number];
export type KnownHintTargetProfileHiddenInfoPolicy =
  (typeof KNOWN_HINT_TARGET_PROFILE_HIDDEN_INFO_POLICIES)[number];
export type KnownHintLineSupport = (typeof KNOWN_HINT_LINE_SUPPORT)[number];
export type KnownHintOpponentSignalKind =
  (typeof KNOWN_HINT_OPPONENT_SIGNAL_KINDS)[number];
export type KnownHintQualityConfidence =
  (typeof KNOWN_HINT_QUALITY_CONFIDENCE)[number];
export type KnownHintStrategySupportPairRole =
  (typeof KNOWN_HINT_STRATEGY_SUPPORT_PAIR_ROLES)[number];

export type AiHintStructuredEffect = {
  kind: KnownHintEffectKind;
  timing: KnownHintEffectTiming;
  scope: KnownHintEffectScope;
  resource?: KnownHintEffectResource;
  amount?: number;
  repeatable?: boolean;
  finite?: boolean;
};

export type AiHintCondition = {
  kind: KnownHintConditionKind;
};

export type AiHintCostProfile = {
  clicks?: number;
  credits?: number;
  memory?: number;
  counters?: number;
  agendaPoints?: number;
  reserveRisk?: KnownHintCostRisk;
  opportunityCost?: KnownHintCostRisk;
};

export type AiHintBreakerProfile = {
  coverage?: KnownHintBreakerCoverage[];
  coverageCandidates?: KnownHintBreakerCoverage[];
  baseStrength?: number;
  pumpCost?: number;
  pumpStrengthAmount?: number;
  breakCost?: number;
  maxSubroutinesPerBreak?: number;
  configurableCoverage?: boolean;
  reconfigurableType?: boolean;
  oneTimeModeChoice?: boolean;
  multiSubroutineBreak?: boolean;
  targetedIceBonus?: boolean;
  strengthBonusVsChosenIce?: boolean;
  scalingStrength?: boolean;
  hostedStrengthPenalty?: boolean;
  sideEffects?: KnownHintBreakerSideEffect[];
  restrictions?: string[];
};

export type AiHintRemoteRole = {
  kind: KnownHintRemoteRoleKind;
  threatLevel?: KnownHintRemoteThreatLevel;
  serverScope?: "fort" | "remote" | "central" | "server";
};

export type AiHintEffectTargetProfile = {
  zone: KnownHintTargetZone;
  targetCardType?: KnownHintTargetCardType;
  installsTarget?: boolean;
  installCost?: KnownHintTargetInstallCost;
  shuffleAfter?: boolean;
  showToOpponent?: boolean;
  oncePerRun?: boolean;
  lookCount?: number;
};

export type AiHintTargetProfileV1 = {
  schemaVersion: KnownHintTargetProfileSchemaVersion;
  kind: KnownHintTargetProfileKind;
  timing: KnownHintTargetProfileTiming;
  targetType: KnownHintTargetProfileTargetType;
  purpose: string;
  preferences?: KnownHintTargetProfilePreference[];
  avoid?: KnownHintTargetProfileAvoid[];
  hiddenInfoPolicy: KnownHintTargetProfileHiddenInfoPolicy;
};

export type AiHintOpponentSignal = {
  kind: KnownHintOpponentSignalKind;
  visibleEvidenceOnly: true;
};

export type AiHintQuality = {
  hintReviewed?: boolean;
  strategyCovered?: boolean;
  benchmarkCovered?: boolean;
  confidence?: KnownHintQualityConfidence;
  needsHumanReview?: boolean;
  reviewedBy?: string;
  reviewedDate?: string;
  focusedDecisionTest?: string;
};

export type AiHintStrategySupportPair = {
  strategyId: string;
  role: KnownHintStrategySupportPairRole;
  roleDetail?: string;
  evidence: string[];
  confidence: KnownHintQualityConfidence;
  rationale?: string;
};

export type AiHintOntologyExtension = {
  effects?: AiHintStructuredEffect[];
  conditions?: AiHintCondition[];
  costProfile?: AiHintCostProfile;
  breakerProfile?: AiHintBreakerProfile;
  remoteRole?: AiHintRemoteRole;
  targetProfiles?: Array<AiHintEffectTargetProfile | AiHintTargetProfileV1>;
  lineSupport?: KnownHintLineSupport[];
  strategySupportPairs?: AiHintStrategySupportPair[];
  opponentSignals?: AiHintOpponentSignal[];
  quality?: AiHintQuality;
};

export type AiHintOntologyIssueSeverity = "error" | "warning";

export type AiHintOntologyIssueKind =
  | "unknown_effect_kind"
  | "unknown_effect_timing"
  | "unknown_effect_scope"
  | "unknown_effect_resource"
  | "unknown_condition_kind"
  | "unknown_breaker_coverage"
  | "unknown_breaker_side_effect"
  | "unknown_remote_role"
  | "unknown_target_zone"
  | "unknown_target_card_type"
  | "unknown_target_install_cost"
  | "unknown_target_profile_schema_version"
  | "unknown_target_profile_kind"
  | "unknown_target_profile_timing"
  | "unknown_target_profile_target_type"
  | "unknown_target_profile_preference"
  | "unknown_target_profile_avoid"
  | "unknown_target_profile_hidden_info_policy"
  | "unknown_line_support"
  | "unknown_strategy_support_pair_role"
  | "unknown_strategy_support_pair_confidence"
  | "hidden_info_risk"
  | "invalid_shape"
  | "missing_required_effect_field";

export type AiHintOntologyIssue = {
  severity: AiHintOntologyIssueSeverity;
  kind: AiHintOntologyIssueKind;
  path: string;
  message: string;
};

export type AiHintOntologyValidationResult = {
  valid: boolean;
  issues: AiHintOntologyIssue[];
  errors: AiHintOntologyIssue[];
  warnings: AiHintOntologyIssue[];
};

export function validateAiHintOntologyExtension(
  input: unknown,
): AiHintOntologyValidationResult {
  const issues: AiHintOntologyIssue[] = [];
  validateHiddenInfoRisk(input, "$", issues);
  if (!isRecord(input)) {
    addIssue(issues, "error", "invalid_shape", "$", "Expected object.");
    return resultFromIssues(issues);
  }
  validateExtensionFields(input, "$", issues);
  return resultFromIssues(issues);
}

export function validateAiHintOntologyFields(
  hint: unknown,
): AiHintOntologyValidationResult {
  return validateAiHintOntologyExtension(hint);
}

function validateExtensionFields(
  input: Record<string, unknown>,
  path: string,
  issues: AiHintOntologyIssue[],
): void {
  validateEffects(input.effects, `${path}.effects`, issues);
  validateConditions(input.conditions, `${path}.conditions`, issues);
  validateCostProfile(input.costProfile, `${path}.costProfile`, issues);
  validateBreakerProfile(
    input.breakerProfile,
    `${path}.breakerProfile`,
    issues,
  );
  validateRemoteRole(input.remoteRole, `${path}.remoteRole`, issues);
  validateTargetProfiles(
    input.targetProfiles,
    `${path}.targetProfiles`,
    issues,
  );
  validateLineSupport(input.lineSupport, `${path}.lineSupport`, issues);
  validateStrategySupportPairs(
    input.strategySupportPairs,
    `${path}.strategySupportPairs`,
    issues,
  );
  validateOpponentSignals(
    input.opponentSignals,
    `${path}.opponentSignals`,
    issues,
  );
  validateQuality(input.quality, `${path}.quality`, issues);
}

function validateEffects(
  effects: unknown,
  path: string,
  issues: AiHintOntologyIssue[],
): void {
  if (effects === undefined) return;
  if (!Array.isArray(effects)) {
    addIssue(issues, "error", "invalid_shape", path, "Expected array.");
    return;
  }
  effects.forEach((effect, index) => {
    const effectPath = `${path}[${index}]`;
    if (!isRecord(effect)) {
      addIssue(
        issues,
        "error",
        "invalid_shape",
        effectPath,
        "Expected object.",
      );
      return;
    }
    requireKnownField(
      effect.kind,
      KNOWN_HINT_EFFECT_KINDS,
      `${effectPath}.kind`,
      "unknown_effect_kind",
      issues,
      true,
    );
    requireKnownField(
      effect.timing,
      KNOWN_HINT_EFFECT_TIMINGS,
      `${effectPath}.timing`,
      "unknown_effect_timing",
      issues,
      true,
    );
    requireKnownField(
      effect.scope,
      KNOWN_HINT_EFFECT_SCOPES,
      `${effectPath}.scope`,
      "unknown_effect_scope",
      issues,
      true,
    );
    if (effect.resource !== undefined) {
      requireKnownField(
        effect.resource,
        KNOWN_HINT_EFFECT_RESOURCES,
        `${effectPath}.resource`,
        "unknown_effect_resource",
        issues,
        false,
      );
    }
    validateOptionalNumber(effect.amount, `${effectPath}.amount`, issues);
    validateOptionalBoolean(
      effect.repeatable,
      `${effectPath}.repeatable`,
      issues,
    );
    validateOptionalBoolean(effect.finite, `${effectPath}.finite`, issues);
  });
}

function validateConditions(
  conditions: unknown,
  path: string,
  issues: AiHintOntologyIssue[],
): void {
  if (conditions === undefined) return;
  if (!Array.isArray(conditions)) {
    addIssue(issues, "error", "invalid_shape", path, "Expected array.");
    return;
  }
  conditions.forEach((condition, index) => {
    const conditionPath = `${path}[${index}]`;
    if (!isRecord(condition)) {
      addIssue(
        issues,
        "error",
        "invalid_shape",
        conditionPath,
        "Expected object.",
      );
      return;
    }
    requireKnownField(
      condition.kind,
      KNOWN_HINT_CONDITION_KINDS,
      `${conditionPath}.kind`,
      "unknown_condition_kind",
      issues,
      true,
    );
  });
}

function validateCostProfile(
  costProfile: unknown,
  path: string,
  issues: AiHintOntologyIssue[],
): void {
  if (costProfile === undefined) return;
  if (!isRecord(costProfile)) {
    addIssue(issues, "error", "invalid_shape", path, "Expected object.");
    return;
  }
  for (const key of [
    "clicks",
    "credits",
    "memory",
    "counters",
    "agendaPoints",
  ]) {
    validateOptionalNumber(costProfile[key], `${path}.${key}`, issues);
  }
  validateOptionalKnown(
    costProfile.reserveRisk,
    KNOWN_HINT_COST_RISKS,
    `${path}.reserveRisk`,
    "invalid_shape",
    issues,
  );
  validateOptionalKnown(
    costProfile.opportunityCost,
    KNOWN_HINT_COST_RISKS,
    `${path}.opportunityCost`,
    "invalid_shape",
    issues,
  );
}

function validateBreakerProfile(
  breakerProfile: unknown,
  path: string,
  issues: AiHintOntologyIssue[],
): void {
  if (breakerProfile === undefined) return;
  if (!isRecord(breakerProfile)) {
    addIssue(issues, "error", "invalid_shape", path, "Expected object.");
    return;
  }
  const hasConfigurableCoverage =
    breakerProfile.configurableCoverage === true ||
    Array.isArray(breakerProfile.coverageCandidates);
  validateKnownArray(
    breakerProfile.coverage,
    KNOWN_HINT_BREAKER_COVERAGES,
    `${path}.coverage`,
    "unknown_breaker_coverage",
    issues,
    !hasConfigurableCoverage,
  );
  validateKnownArray(
    breakerProfile.coverageCandidates,
    KNOWN_HINT_BREAKER_COVERAGES,
    `${path}.coverageCandidates`,
    "unknown_breaker_coverage",
    issues,
    false,
  );
  validateKnownArray(
    breakerProfile.sideEffects,
    KNOWN_HINT_BREAKER_SIDE_EFFECTS,
    `${path}.sideEffects`,
    "unknown_breaker_side_effect",
    issues,
    false,
  );
  for (const key of [
    "baseStrength",
    "pumpCost",
    "pumpStrengthAmount",
    "breakCost",
    "maxSubroutinesPerBreak",
  ]) {
    validateOptionalNumber(breakerProfile[key], `${path}.${key}`, issues);
  }
  for (const key of [
    "configurableCoverage",
    "reconfigurableType",
    "oneTimeModeChoice",
    "multiSubroutineBreak",
    "targetedIceBonus",
    "strengthBonusVsChosenIce",
    "scalingStrength",
    "hostedStrengthPenalty",
  ]) {
    validateOptionalBoolean(breakerProfile[key], `${path}.${key}`, issues);
  }
  if (
    breakerProfile.restrictions !== undefined &&
    !isStringArray(breakerProfile.restrictions)
  )
    addIssue(
      issues,
      "error",
      "invalid_shape",
      `${path}.restrictions`,
      "Expected string array.",
    );
}

function validateRemoteRole(
  remoteRole: unknown,
  path: string,
  issues: AiHintOntologyIssue[],
): void {
  if (remoteRole === undefined) return;
  if (!isRecord(remoteRole)) {
    addIssue(issues, "error", "invalid_shape", path, "Expected object.");
    return;
  }
  requireKnownField(
    remoteRole.kind,
    KNOWN_HINT_REMOTE_ROLE_KINDS,
    `${path}.kind`,
    "unknown_remote_role",
    issues,
    true,
  );
  validateOptionalKnown(
    remoteRole.threatLevel,
    KNOWN_HINT_REMOTE_THREAT_LEVELS,
    `${path}.threatLevel`,
    "invalid_shape",
    issues,
  );
}

function validateTargetProfiles(
  targetProfiles: unknown,
  path: string,
  issues: AiHintOntologyIssue[],
): void {
  if (targetProfiles === undefined) return;
  if (!Array.isArray(targetProfiles)) {
    addIssue(issues, "error", "invalid_shape", path, "Expected array.");
    return;
  }
  targetProfiles.forEach((targetProfile, index) => {
    const targetPath = `${path}[${index}]`;
    if (!isRecord(targetProfile)) {
      addIssue(
        issues,
        "error",
        "invalid_shape",
        targetPath,
        "Expected object.",
      );
      return;
    }
    if (isTargetProfileV1(targetProfile)) {
      validateTargetProfileV1(targetProfile, targetPath, issues);
      return;
    }
    requireKnownField(
      targetProfile.zone,
      KNOWN_HINT_TARGET_ZONES,
      `${targetPath}.zone`,
      "unknown_target_zone",
      issues,
      true,
    );
    validateOptionalKnown(
      targetProfile.targetCardType,
      KNOWN_HINT_TARGET_CARD_TYPES,
      `${targetPath}.targetCardType`,
      "unknown_target_card_type",
      issues,
    );
    validateOptionalKnown(
      targetProfile.installCost,
      KNOWN_HINT_TARGET_INSTALL_COSTS,
      `${targetPath}.installCost`,
      "unknown_target_install_cost",
      issues,
    );
    for (const key of [
      "installsTarget",
      "shuffleAfter",
      "showToOpponent",
      "oncePerRun",
    ]) {
      validateOptionalBoolean(
        targetProfile[key],
        `${targetPath}.${key}`,
        issues,
      );
    }
    validateOptionalNumber(
      targetProfile.lookCount,
      `${targetPath}.lookCount`,
      issues,
    );
  });
}

function isTargetProfileV1(targetProfile: Record<string, unknown>): boolean {
  return (
    targetProfile.schemaVersion === "target-profile-v1" ||
    targetProfile.kind !== undefined ||
    targetProfile.targetType !== undefined ||
    targetProfile.preferences !== undefined ||
    targetProfile.hiddenInfoPolicy !== undefined
  );
}

function validateTargetProfileV1(
  targetProfile: Record<string, unknown>,
  path: string,
  issues: AiHintOntologyIssue[],
): void {
  requireKnownField(
    targetProfile.schemaVersion,
    KNOWN_HINT_TARGET_PROFILE_SCHEMA_VERSIONS,
    `${path}.schemaVersion`,
    "unknown_target_profile_schema_version",
    issues,
    true,
  );
  requireKnownField(
    targetProfile.kind,
    KNOWN_HINT_TARGET_PROFILE_KINDS,
    `${path}.kind`,
    "unknown_target_profile_kind",
    issues,
    true,
  );
  requireKnownField(
    targetProfile.timing,
    KNOWN_HINT_TARGET_PROFILE_TIMINGS,
    `${path}.timing`,
    "unknown_target_profile_timing",
    issues,
    true,
  );
  requireKnownField(
    targetProfile.targetType,
    KNOWN_HINT_TARGET_PROFILE_TARGET_TYPES,
    `${path}.targetType`,
    "unknown_target_profile_target_type",
    issues,
    true,
  );
  if (typeof targetProfile.purpose !== "string" || targetProfile.purpose === "")
    addIssue(
      issues,
      "error",
      "invalid_shape",
      `${path}.purpose`,
      "Expected non-empty string.",
    );
  validateKnownArray(
    targetProfile.preferences,
    KNOWN_HINT_TARGET_PROFILE_PREFERENCES,
    `${path}.preferences`,
    "unknown_target_profile_preference",
    issues,
    false,
  );
  validateKnownArray(
    targetProfile.avoid,
    KNOWN_HINT_TARGET_PROFILE_AVOIDS,
    `${path}.avoid`,
    "unknown_target_profile_avoid",
    issues,
    false,
  );
  requireKnownField(
    targetProfile.hiddenInfoPolicy,
    KNOWN_HINT_TARGET_PROFILE_HIDDEN_INFO_POLICIES,
    `${path}.hiddenInfoPolicy`,
    "unknown_target_profile_hidden_info_policy",
    issues,
    true,
  );
}

function validateLineSupport(
  lineSupport: unknown,
  path: string,
  issues: AiHintOntologyIssue[],
): void {
  if (lineSupport === undefined) return;
  validateKnownArray(
    lineSupport,
    KNOWN_HINT_LINE_SUPPORT,
    path,
    "unknown_line_support",
    issues,
    false,
  );
}

function validateStrategySupportPairs(
  strategySupportPairs: unknown,
  path: string,
  issues: AiHintOntologyIssue[],
): void {
  if (strategySupportPairs === undefined) return;
  if (!Array.isArray(strategySupportPairs)) {
    addIssue(issues, "error", "invalid_shape", path, "Expected array.");
    return;
  }
  strategySupportPairs.forEach((pair, index) => {
    const pairPath = `${path}[${index}]`;
    if (!isRecord(pair)) {
      addIssue(issues, "error", "invalid_shape", pairPath, "Expected object.");
      return;
    }
    if (typeof pair.strategyId !== "string" || pair.strategyId.length === 0) {
      addIssue(
        issues,
        "error",
        "invalid_shape",
        `${pairPath}.strategyId`,
        "Expected non-empty string.",
      );
    }
    requireKnownField(
      pair.role,
      KNOWN_HINT_STRATEGY_SUPPORT_PAIR_ROLES,
      `${pairPath}.role`,
      "unknown_strategy_support_pair_role",
      issues,
      true,
    );
    if (pair.roleDetail !== undefined && typeof pair.roleDetail !== "string") {
      addIssue(
        issues,
        "error",
        "invalid_shape",
        `${pairPath}.roleDetail`,
        "Expected string.",
      );
    }
    if (
      !Array.isArray(pair.evidence) ||
      pair.evidence.length === 0 ||
      !pair.evidence.every((entry) => typeof entry === "string")
    ) {
      addIssue(
        issues,
        "error",
        "invalid_shape",
        `${pairPath}.evidence`,
        "Expected non-empty string array.",
      );
    }
    requireKnownField(
      pair.confidence,
      KNOWN_HINT_QUALITY_CONFIDENCE,
      `${pairPath}.confidence`,
      "unknown_strategy_support_pair_confidence",
      issues,
      true,
    );
    if (pair.rationale !== undefined && typeof pair.rationale !== "string") {
      addIssue(
        issues,
        "error",
        "invalid_shape",
        `${pairPath}.rationale`,
        "Expected string.",
      );
    }
  });
}

function validateOpponentSignals(
  opponentSignals: unknown,
  path: string,
  issues: AiHintOntologyIssue[],
): void {
  if (opponentSignals === undefined) return;
  if (!Array.isArray(opponentSignals)) {
    addIssue(issues, "error", "invalid_shape", path, "Expected array.");
    return;
  }
  opponentSignals.forEach((signal, index) => {
    const signalPath = `${path}[${index}]`;
    if (!isRecord(signal)) {
      addIssue(
        issues,
        "error",
        "invalid_shape",
        signalPath,
        "Expected object.",
      );
      return;
    }
    requireKnownField(
      signal.kind,
      KNOWN_HINT_OPPONENT_SIGNAL_KINDS,
      `${signalPath}.kind`,
      "hidden_info_risk",
      issues,
      true,
    );
    if (signal.visibleEvidenceOnly !== true)
      addIssue(
        issues,
        "error",
        "hidden_info_risk",
        `${signalPath}.visibleEvidenceOnly`,
        "Opponent signals must be explicitly visible-evidence-only.",
      );
  });
}

function validateQuality(
  quality: unknown,
  path: string,
  issues: AiHintOntologyIssue[],
): void {
  if (quality === undefined) return;
  if (!isRecord(quality)) {
    addIssue(issues, "error", "invalid_shape", path, "Expected object.");
    return;
  }
  validateOptionalKnown(
    quality.confidence,
    KNOWN_HINT_QUALITY_CONFIDENCE,
    `${path}.confidence`,
    "invalid_shape",
    issues,
  );
}

function validateHiddenInfoRisk(
  input: unknown,
  path: string,
  issues: AiHintOntologyIssue[],
): void {
  if (Array.isArray(input)) {
    input.forEach((value, index) =>
      validateHiddenInfoRisk(value, `${path}[${index}]`, issues),
    );
    return;
  }
  if (!isRecord(input)) return;
  for (const [key, value] of Object.entries(input)) {
    if (isHiddenInfoRiskField(key))
      addIssue(
        issues,
        "error",
        "hidden_info_risk",
        `${path}.${key}`,
        `Field ${key} is not side-safe for AI hints.`,
      );
    validateHiddenInfoRisk(value, `${path}.${key}`, issues);
  }
}

function isHiddenInfoRiskField(key: string): boolean {
  const normalized = key.toLowerCase();
  return HIDDEN_INFO_RISK_FIELDS.some(
    (field) => field.toLowerCase() === normalized,
  );
}

function requireKnownField<const T extends readonly string[]>(
  value: unknown,
  knownValues: T,
  path: string,
  issueKind: AiHintOntologyIssueKind,
  issues: AiHintOntologyIssue[],
  required: boolean,
): void {
  if (value === undefined) {
    if (required)
      addIssue(
        issues,
        "error",
        "missing_required_effect_field",
        path,
        "Required field is missing.",
      );
    return;
  }
  validateOptionalKnown(value, knownValues, path, issueKind, issues);
}

function validateKnownArray<const T extends readonly string[]>(
  values: unknown,
  knownValues: T,
  path: string,
  issueKind: AiHintOntologyIssueKind,
  issues: AiHintOntologyIssue[],
  required: boolean,
): void {
  if (values === undefined) {
    if (required)
      addIssue(issues, "error", "invalid_shape", path, "Expected array.");
    return;
  }
  if (!Array.isArray(values)) {
    addIssue(issues, "error", "invalid_shape", path, "Expected array.");
    return;
  }
  values.forEach((value, index) =>
    validateOptionalKnown(
      value,
      knownValues,
      `${path}[${index}]`,
      issueKind,
      issues,
    ),
  );
}

function validateOptionalKnown<const T extends readonly string[]>(
  value: unknown,
  knownValues: T,
  path: string,
  issueKind: AiHintOntologyIssueKind,
  issues: AiHintOntologyIssue[],
): void {
  if (value === undefined) return;
  const knownValueSet = new Set(knownValues);
  if (typeof value !== "string" || !knownValueSet.has(value)) {
    addIssue(
      issues,
      "error",
      issueKind,
      path,
      `Unknown value: ${String(value)}.`,
    );
  }
}

function validateOptionalNumber(
  value: unknown,
  path: string,
  issues: AiHintOntologyIssue[],
): void {
  if (value === undefined) return;
  if (typeof value !== "number" || !Number.isFinite(value))
    addIssue(issues, "error", "invalid_shape", path, "Expected number.");
}

function validateOptionalBoolean(
  value: unknown,
  path: string,
  issues: AiHintOntologyIssue[],
): void {
  if (value === undefined) return;
  if (typeof value !== "boolean")
    addIssue(issues, "error", "invalid_shape", path, "Expected boolean.");
}

function addIssue(
  issues: AiHintOntologyIssue[],
  severity: AiHintOntologyIssueSeverity,
  kind: AiHintOntologyIssueKind,
  path: string,
  message: string,
): void {
  issues.push({ severity, kind, path, message });
}

function resultFromIssues(
  issues: AiHintOntologyIssue[],
): AiHintOntologyValidationResult {
  const errors = issues.filter((issue) => issue.severity === "error");
  const warnings = issues.filter((issue) => issue.severity === "warning");
  return {
    valid: errors.length === 0,
    issues,
    errors,
    warnings,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isStringArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) && value.every((item) => typeof item === "string")
  );
}
