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
  "zone_shuffle",
  "extra_action",
  "counter_economy",
  "scored_agenda_action",
  "future_run_effect",
  "future_encounter_effect",
  "access_replacement",
  "install_discount",
  "rez_discount",
  "program_trash",
  "hardware_trash",
  "resource_trash",
  "tag_punish_payoff",
  "tag_source",
] as const;

export const KNOWN_HINT_EFFECT_TIMINGS = [
  "action",
  "scored_activated",
  "when_scored",
  "start_of_turn",
  "during_run",
  "on_access",
  "persistent",
  "encounter",
  "successful_run",
  "trace_success",
  "corp_turn",
  "runner_turn",
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
export type KnownHintLineSupport = (typeof KNOWN_HINT_LINE_SUPPORT)[number];
export type KnownHintOpponentSignalKind =
  (typeof KNOWN_HINT_OPPONENT_SIGNAL_KINDS)[number];
export type KnownHintQualityConfidence =
  (typeof KNOWN_HINT_QUALITY_CONFIDENCE)[number];

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
  reserveRisk?: KnownHintCostRisk;
  opportunityCost?: KnownHintCostRisk;
};

export type AiHintBreakerProfile = {
  coverage: KnownHintBreakerCoverage[];
  baseStrength?: number;
  pumpCost?: number;
  breakCost?: number;
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

export type AiHintOntologyExtension = {
  effects?: AiHintStructuredEffect[];
  conditions?: AiHintCondition[];
  costProfile?: AiHintCostProfile;
  breakerProfile?: AiHintBreakerProfile;
  remoteRole?: AiHintRemoteRole;
  targetProfiles?: AiHintEffectTargetProfile[];
  lineSupport?: KnownHintLineSupport[];
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
  | "unknown_line_support"
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
  for (const key of ["clicks", "credits", "memory", "counters"]) {
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
  validateKnownArray(
    breakerProfile.coverage,
    KNOWN_HINT_BREAKER_COVERAGES,
    `${path}.coverage`,
    "unknown_breaker_coverage",
    issues,
    true,
  );
  validateKnownArray(
    breakerProfile.sideEffects,
    KNOWN_HINT_BREAKER_SIDE_EFFECTS,
    `${path}.sideEffects`,
    "unknown_breaker_side_effect",
    issues,
    false,
  );
  for (const key of ["baseStrength", "pumpCost", "breakCost"]) {
    validateOptionalNumber(breakerProfile[key], `${path}.${key}`, issues);
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
  if (typeof value !== "string" || !knownValues.includes(value)) {
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
