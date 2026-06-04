import type {
  ActionGateId,
  ActionProjectionIssue,
  ActionSemanticCandidate,
  ActionSemanticSourceKind,
} from "./action-semantic-candidate";

export const DECK_DOCTRINE_V2_DIAGNOSTIC_SCHEMA_VERSION =
  "deck-doctrine-v2-diagnostic-schema-v1" as const;

export const TACTICAL_GOAL_TAXONOMY_SCHEMA_VERSION =
  "tactical-goal-taxonomy-diagnostic-schema-v1" as const;

export const DIAGNOSTIC_NO_EFFECT_FLAGS = {
  planner: false,
  actionScore: false,
  planWeight: false,
  targetingAi: false,
  engine: false,
  legality: false,
  profileOrDefaultSwitch: false,
  uiDerivation: false,
  hiddenInfoLeak: false,
} as const;

export type DiagnosticNoEffectFlags = typeof DIAGNOSTIC_NO_EFFECT_FLAGS;

export type DiagnosticFieldStatus =
  | "ready"
  | "partial"
  | "missing"
  | "blocked"
  | "not_applicable";

export type DeckDoctrineV2ReadinessStatus = "ready" | "partial" | "blocked";

export type DeckDoctrineV2DiagnosticFieldId =
  | "candidate_identity"
  | "projection_status"
  | "hidden_info_guard"
  | "source_card_context"
  | "ability_binding"
  | "strategy_support"
  | "conditions"
  | "risks"
  | "constraints"
  | "hard_gates";

export type DeckDoctrineV2DiagnosticField = {
  fieldId: DeckDoctrineV2DiagnosticFieldId;
  status: DiagnosticFieldStatus;
  evidence: string[];
  issues: ActionProjectionIssue[];
  notes: string[];
};

export type DeckDoctrineV2DiagnosticEntry = {
  actionId: string;
  actionType: string;
  actorSide: ActionSemanticCandidate["actorSide"];
  sourceKind: ActionSemanticSourceKind;
  primaryProjectionStatus: ActionSemanticCandidate["primaryProjectionStatus"];
  readinessStatus: DeckDoctrineV2ReadinessStatus;
  fields: DeckDoctrineV2DiagnosticField[];
  deckDoctrineGaps: string[];
  evidence: string[];
  sourceCardId?: string;
};

export type DeckDoctrineV2DiagnosticSummary = {
  totalCandidates: number;
  ready: number;
  partial: number;
  blocked: number;
  gapCategories: string[];
};

export type DeckDoctrineV2DiagnosticReadinessReport = {
  schemaVersion: typeof DECK_DOCTRINE_V2_DIAGNOSTIC_SCHEMA_VERSION;
  scope: "diagnostic_only";
  generatedFrom: "ActionSemanticCandidate";
  entries: DeckDoctrineV2DiagnosticEntry[];
  summary: DeckDoctrineV2DiagnosticSummary;
  noEffectFlags: DiagnosticNoEffectFlags;
};

export type TacticalGoalSide = "runner" | "corp";

export type TacticalGoalFamily =
  | "runner_economy_stabilize"
  | "runner_rig_setup"
  | "runner_central_pressure"
  | "runner_remote_contest"
  | "runner_survival"
  | "corp_economy_stabilize"
  | "corp_remote_score_window"
  | "corp_central_defense"
  | "corp_ice_tax"
  | "corp_tag_trace_punish";

export type TacticalGoalLifecycleState =
  | "proposed"
  | "evidence_ready"
  | "blocked_by_gap"
  | "shadow_only";

export type TacticalGoalCandidateField =
  | "semanticActionType"
  | "actionTacticSignals"
  | "strategySupport"
  | "conditions"
  | "risks"
  | "constraints"
  | "costProfile"
  | "timingProfile"
  | "targetContext"
  | "hardGates"
  | "projectionIssues"
  | "evidence";

export type TacticalGoalEvidenceRequirement = {
  field: TacticalGoalCandidateField;
  requirement: "present" | "side_safe" | "not_blocked" | "gap_marked";
  reason: string;
};

export type TacticalGoalBlockerPolicy = {
  blockerId: string;
  issues: ActionProjectionIssue[];
  gateIds: ActionGateId[];
  reason: string;
  removalCondition: string;
};

export type TacticalGoalDefinition = {
  goalId: string;
  side: TacticalGoalSide;
  family: TacticalGoalFamily;
  lifecycleState: TacticalGoalLifecycleState;
  label: string;
  source: "neutral_doctrine" | "deck_doctrine" | "boardstate" | "threat";
  requiredCandidateEvidence: TacticalGoalEvidenceRequirement[];
  blockerPolicies: TacticalGoalBlockerPolicy[];
  evidence: string[];
};

export type TacticalGoalTaxonomyValidationIssue = {
  issueId: string;
  severity: "warning" | "error";
  message: string;
  goalId?: string;
};

export type TacticalGoalTaxonomyDiagnosticSummary = {
  totalGoals: number;
  runnerGoals: number;
  corpGoals: number;
  lifecycleStates: Record<TacticalGoalLifecycleState, number>;
  blockerPolicyCount: number;
  validationIssues: TacticalGoalTaxonomyValidationIssue[];
};

export type TacticalGoalTaxonomyDiagnosticReport = {
  schemaVersion: typeof TACTICAL_GOAL_TAXONOMY_SCHEMA_VERSION;
  scope: "diagnostic_taxonomy_only";
  definitions: TacticalGoalDefinition[];
  summary: TacticalGoalTaxonomyDiagnosticSummary;
  productiveUseAllowed: false;
  noEffectFlags: DiagnosticNoEffectFlags;
};

export const DEFAULT_TACTICAL_GOAL_TAXONOMY = [
  tacticalGoal({
    goalId: "runner.economy_stabilize",
    side: "runner",
    family: "runner_economy_stabilize",
    lifecycleState: "proposed",
    label: "Runner economy stabilize",
    source: "neutral_doctrine",
    fields: ["semanticActionType", "costProfile", "timingProfile", "hardGates"],
    blockerPolicies: [
      blocker(
        "runner_economy_hidden_info",
        ["hidden_info_blocked"],
        ["hidden_info"],
        "Economy stabilization cannot use hidden opponent data.",
      ),
    ],
    evidence: ["Roadmap Step 9: Runner can stabilize economy."],
  }),
  tacticalGoal({
    goalId: "runner.rig_setup",
    side: "runner",
    family: "runner_rig_setup",
    lifecycleState: "blocked_by_gap",
    label: "Runner rig setup",
    source: "deck_doctrine",
    fields: [
      "actionTacticSignals",
      "strategySupport",
      "costProfile",
      "timingProfile",
      "projectionIssues",
    ],
    blockerPolicies: [
      blocker(
        "runner_rig_missing_card_semantics",
        ["card_semantics_unavailable", "ability_unresolved"],
        ["ability_resolution"],
        "Provide side-safe CardSemanticProfile and ability binding evidence.",
      ),
    ],
    evidence: ["Roadmap Step 9: Runner can repair coverage or setup."],
  }),
  tacticalGoal({
    goalId: "runner.central_pressure",
    side: "runner",
    family: "runner_central_pressure",
    lifecycleState: "blocked_by_gap",
    label: "Runner central pressure",
    source: "deck_doctrine",
    fields: ["actionTacticSignals", "targetContext", "costProfile", "hardGates"],
    blockerPolicies: [
      blocker(
        "runner_central_target_context_missing",
        ["target_context_unavailable"],
        ["target_context"],
        "Provide side-safe server target context from legal action options.",
      ),
    ],
    evidence: ["Roadmap Step 9: Runner can take safe central runs."],
  }),
  tacticalGoal({
    goalId: "runner.remote_contest",
    side: "runner",
    family: "runner_remote_contest",
    lifecycleState: "blocked_by_gap",
    label: "Runner remote contest",
    source: "threat",
    fields: ["targetContext", "costProfile", "timingProfile", "hardGates"],
    blockerPolicies: [
      blocker(
        "runner_remote_hidden_target",
        ["hidden_info_blocked", "target_context_unavailable"],
        ["hidden_info", "target_context"],
        "Keep hidden remote contents blocked unless legally revealed or side-safe.",
      ),
    ],
    evidence: ["Roadmap Step 9: Boardstate threats can override strategy."],
  }),
  tacticalGoal({
    goalId: "runner.survival",
    side: "runner",
    family: "runner_survival",
    lifecycleState: "proposed",
    label: "Runner survival",
    source: "threat",
    fields: ["semanticActionType", "risks", "costProfile", "hardGates"],
    blockerPolicies: [
      blocker(
        "runner_survival_risk_missing",
        ["card_semantics_unavailable"],
        ["source_resolution"],
        "Risk evidence must be explicit or the gap must remain marked.",
      ),
    ],
    evidence: ["Roadmap Step 9: Runner can remove tags or avoid visible danger."],
  }),
  tacticalGoal({
    goalId: "corp.economy_stabilize",
    side: "corp",
    family: "corp_economy_stabilize",
    lifecycleState: "proposed",
    label: "Corp economy stabilize",
    source: "neutral_doctrine",
    fields: ["semanticActionType", "costProfile", "timingProfile", "hardGates"],
    blockerPolicies: [
      blocker(
        "corp_economy_hidden_info",
        ["hidden_info_blocked"],
        ["hidden_info"],
        "Economy stabilization cannot depend on hidden Runner information.",
      ),
    ],
    evidence: ["Roadmap Step 9: Corp can stabilize economy."],
  }),
  tacticalGoal({
    goalId: "corp.remote_score_window",
    side: "corp",
    family: "corp_remote_score_window",
    lifecycleState: "blocked_by_gap",
    label: "Corp remote score window",
    source: "deck_doctrine",
    fields: [
      "strategySupport",
      "conditions",
      "targetContext",
      "costProfile",
      "hardGates",
    ],
    blockerPolicies: [
      blocker(
        "corp_remote_score_target_missing",
        ["target_context_unavailable", "card_semantics_unavailable"],
        ["target_context", "source_resolution"],
        "Score-window diagnostics need side-safe target and card semantics.",
      ),
    ],
    evidence: ["Roadmap Step 9: Corp can prepare or use score windows."],
  }),
  tacticalGoal({
    goalId: "corp.central_defense",
    side: "corp",
    family: "corp_central_defense",
    lifecycleState: "blocked_by_gap",
    label: "Corp central defense",
    source: "threat",
    fields: ["targetContext", "costProfile", "timingProfile", "hardGates"],
    blockerPolicies: [
      blocker(
        "corp_central_defense_target_missing",
        ["target_context_unavailable"],
        ["target_context"],
        "Central-defense diagnostics need side-safe server or ICE context.",
      ),
    ],
    evidence: ["Roadmap Step 9: Corp can protect HQ/R&D."],
  }),
  tacticalGoal({
    goalId: "corp.ice_tax",
    side: "corp",
    family: "corp_ice_tax",
    lifecycleState: "blocked_by_gap",
    label: "Corp ICE tax",
    source: "deck_doctrine",
    fields: [
      "actionTacticSignals",
      "constraints",
      "targetContext",
      "costProfile",
      "hardGates",
    ],
    blockerPolicies: [
      blocker(
        "corp_ice_tax_target_missing",
        ["target_context_unavailable", "ability_unresolved"],
        ["target_context", "ability_resolution"],
        "ICE tax diagnostics need side-safe ICE/ability context.",
      ),
    ],
    evidence: ["Guide V3: ICE tax and constraints must stay precise."],
  }),
  tacticalGoal({
    goalId: "corp.tag_trace_punish",
    side: "corp",
    family: "corp_tag_trace_punish",
    lifecycleState: "blocked_by_gap",
    label: "Corp tag/trace punish",
    source: "deck_doctrine",
    fields: [
      "actionTacticSignals",
      "strategySupport",
      "conditions",
      "risks",
      "hardGates",
    ],
    blockerPolicies: [
      blocker(
        "corp_tag_trace_missing_condition",
        ["card_semantics_unavailable", "ability_unresolved"],
        ["ability_resolution", "source_resolution"],
        "Tag/trace punish diagnostics require explicit condition and ability evidence.",
      ),
    ],
    evidence: ["Guide V3: Tag source, payoff and snowball must stay separated."],
  }),
] as const satisfies readonly TacticalGoalDefinition[];

export function buildDeckDoctrineV2DiagnosticReadinessReport(
  candidates: readonly ActionSemanticCandidate[],
): DeckDoctrineV2DiagnosticReadinessReport {
  const entries = candidates.map(buildDeckDoctrineV2DiagnosticEntry);

  return {
    schemaVersion: DECK_DOCTRINE_V2_DIAGNOSTIC_SCHEMA_VERSION,
    scope: "diagnostic_only",
    generatedFrom: "ActionSemanticCandidate",
    entries,
    summary: summarizeDeckDoctrineEntries(entries),
    noEffectFlags: DIAGNOSTIC_NO_EFFECT_FLAGS,
  };
}

export function buildTacticalGoalTaxonomyDiagnosticReport(
  definitions: readonly TacticalGoalDefinition[] = DEFAULT_TACTICAL_GOAL_TAXONOMY,
): TacticalGoalTaxonomyDiagnosticReport {
  const copiedDefinitions = definitions.map(copyTacticalGoalDefinition);

  return {
    schemaVersion: TACTICAL_GOAL_TAXONOMY_SCHEMA_VERSION,
    scope: "diagnostic_taxonomy_only",
    definitions: copiedDefinitions,
    summary: summarizeTacticalGoalTaxonomy(copiedDefinitions),
    productiveUseAllowed: false,
    noEffectFlags: DIAGNOSTIC_NO_EFFECT_FLAGS,
  };
}

function buildDeckDoctrineV2DiagnosticEntry(
  candidate: ActionSemanticCandidate,
): DeckDoctrineV2DiagnosticEntry {
  const fields = [
    field("candidate_identity", "ready", [
      candidate.actionId,
      candidate.actionType,
      candidate.actorSide,
    ]),
    projectionStatusField(candidate),
    hiddenInfoGuardField(candidate),
    sourceCardContextField(candidate),
    abilityBindingField(candidate),
    deckSupportArrayField(
      "strategy_support",
      candidate.sourceKind,
      candidate.strategySupport,
      candidate.strategySupport.map((support) => support.evidence),
    ),
    deckSupportArrayField(
      "conditions",
      candidate.sourceKind,
      candidate.conditions,
      candidate.conditions.flatMap((condition) => condition.evidence ?? []),
    ),
    deckSupportArrayField(
      "risks",
      candidate.sourceKind,
      candidate.risks,
      candidate.risks.flatMap((risk) => risk.evidence ?? []),
    ),
    deckSupportArrayField(
      "constraints",
      candidate.sourceKind,
      candidate.constraints,
      candidate.constraints.flatMap((constraint) => constraint.evidence ?? []),
    ),
    hardGatesField(candidate),
  ];
  const readinessStatus = readinessStatusForFields(fields);

  return {
    actionId: candidate.actionId,
    actionType: candidate.actionType,
    actorSide: candidate.actorSide,
    sourceKind: candidate.sourceKind,
    primaryProjectionStatus: candidate.primaryProjectionStatus,
    readinessStatus,
    fields,
    deckDoctrineGaps: deckDoctrineGaps(candidate, fields),
    evidence: [...candidate.evidence],
    ...(candidate.sourceCardId !== undefined
      ? { sourceCardId: candidate.sourceCardId }
      : {}),
  };
}

function projectionStatusField(
  candidate: ActionSemanticCandidate,
): DeckDoctrineV2DiagnosticField {
  if (
    candidate.primaryProjectionStatus === "blocked" ||
    candidate.primaryProjectionStatus === "hidden_info_blocked"
  ) {
    return field(
      "projection_status",
      "blocked",
      [candidate.primaryProjectionStatus],
      [...candidate.projectionIssues],
      ["Projection is not usable for DeckDoctrine-v2 readiness."],
    );
  }
  if (
    candidate.primaryProjectionStatus === "partial_projected" ||
    candidate.primaryProjectionStatus === "schema_gap"
  ) {
    return field(
      "projection_status",
      "partial",
      [candidate.primaryProjectionStatus],
      [...candidate.projectionIssues],
      ["Projection remains partial and must stay diagnostic."],
    );
  }
  return field("projection_status", "ready", [candidate.primaryProjectionStatus]);
}

function hiddenInfoGuardField(
  candidate: ActionSemanticCandidate,
): DeckDoctrineV2DiagnosticField {
  const hiddenInfoGate = candidate.hardGates.find(
    (gate) => gate.gateId === "hidden_info",
  );
  if (candidate.projectionIssues.includes("hidden_info_blocked")) {
    return field(
      "hidden_info_guard",
      "blocked",
      hiddenInfoGate?.evidence ?? [],
      ["hidden_info_blocked"],
      ["Hidden-info-sensitive fields are intentionally not projected."],
    );
  }
  if (hiddenInfoGate?.status === "pass") {
    return field(
      "hidden_info_guard",
      "ready",
      hiddenInfoGate.evidence ?? [],
      [],
      [hiddenInfoGate.reason ?? "Hidden-info gate passed."],
    );
  }
  return field(
    "hidden_info_guard",
    "partial",
    hiddenInfoGate?.evidence ?? [],
    [],
    [hiddenInfoGate?.reason ?? "Hidden-info guard is not fully evidenced."],
  );
}

function sourceCardContextField(
  candidate: ActionSemanticCandidate,
): DeckDoctrineV2DiagnosticField {
  if (candidate.sourceKind !== "card") {
    return field(
      "source_card_context",
      "not_applicable",
      [candidate.sourceKind],
      [],
      ["Candidate is not card-sourced."],
    );
  }
  const sourceCardId = candidate.sourceCardId;
  const hasSourceCard = sourceCardId !== undefined;
  const hasCardSignals = candidate.cardContextSignals.length > 0;
  if (sourceCardId !== undefined && hasCardSignals) {
    return field(
      "source_card_context",
      "ready",
      [sourceCardId, ...candidate.cardContextSignals],
    );
  }
  return field(
    "source_card_context",
    hasSourceCard || hasCardSignals ? "partial" : "missing",
    [
      ...(candidate.sourceCardId !== undefined ? [candidate.sourceCardId] : []),
      ...candidate.cardContextSignals,
    ],
    candidate.projectionIssues.includes("card_semantics_unavailable")
      ? ["card_semantics_unavailable"]
      : [],
    ["Card source or card context signals are incomplete."],
  );
}

function abilityBindingField(
  candidate: ActionSemanticCandidate,
): DeckDoctrineV2DiagnosticField {
  if (candidate.projectionIssues.includes("ability_unresolved")) {
    return field(
      "ability_binding",
      "partial",
      [candidate.abilityBindingMethod],
      ["ability_unresolved"],
      ["Ability binding is unresolved or ambiguous."],
    );
  }
  if (candidate.abilityId !== undefined) {
    return field("ability_binding", "ready", [
      candidate.abilityBindingMethod,
      candidate.abilityId,
    ]);
  }
  return field(
    "ability_binding",
    candidate.sourceKind === "card" ? "partial" : "not_applicable",
    [candidate.abilityBindingMethod],
    [],
    ["No side-safe ability id is present."],
  );
}

function deckSupportArrayField<T>(
  fieldId: Extract<
    DeckDoctrineV2DiagnosticFieldId,
    "strategy_support" | "conditions" | "risks" | "constraints"
  >,
  sourceKind: ActionSemanticSourceKind,
  values: readonly T[],
  evidence: readonly string[],
): DeckDoctrineV2DiagnosticField {
  if (sourceKind !== "card") {
    return field(
      fieldId,
      "not_applicable",
      [sourceKind],
      [],
      ["Candidate is not card-sourced."],
    );
  }
  if (values.length > 0) return field(fieldId, "ready", [...evidence]);
  return field(fieldId, "missing", [], [], [`${fieldId} is not projected.`]);
}

function hardGatesField(
  candidate: ActionSemanticCandidate,
): DeckDoctrineV2DiagnosticField {
  const blockingGate = candidate.hardGates.find(
    (gate) => gate.status === "block" || gate.severity === "error",
  );
  if (blockingGate !== undefined) {
    return field(
      "hard_gates",
      "blocked",
      blockingGate.evidence ?? [],
      [],
      [blockingGate.reason ?? `Gate blocked: ${blockingGate.gateId}`],
    );
  }
  const unknownGates = candidate.hardGates.filter(
    (gate) => gate.status === "unknown",
  );
  if (unknownGates.length > 0) {
    return field(
      "hard_gates",
      "partial",
      unknownGates.flatMap((gate) => gate.evidence ?? []),
      [],
      unknownGates.map((gate) => gate.reason ?? `Gate unknown: ${gate.gateId}`),
    );
  }
  return field(
    "hard_gates",
    "ready",
    candidate.hardGates.flatMap((gate) => gate.evidence ?? []),
  );
}

function readinessStatusForFields(
  fields: readonly DeckDoctrineV2DiagnosticField[],
): DeckDoctrineV2ReadinessStatus {
  if (fields.some((entry) => entry.status === "blocked")) return "blocked";
  if (
    fields.some(
      (entry) => entry.status === "partial" || entry.status === "missing",
    )
  ) {
    return "partial";
  }
  return "ready";
}

function deckDoctrineGaps(
  candidate: ActionSemanticCandidate,
  fields: readonly DeckDoctrineV2DiagnosticField[],
): string[] {
  return uniqueStrings([
    ...candidate.projectionIssues,
    ...fields
      .filter((entry) => entry.status === "partial" || entry.status === "missing")
      .map((entry) => `${entry.fieldId}_${entry.status}`),
  ]);
}

function summarizeDeckDoctrineEntries(
  entries: readonly DeckDoctrineV2DiagnosticEntry[],
): DeckDoctrineV2DiagnosticSummary {
  return {
    totalCandidates: entries.length,
    ready: entries.filter((entry) => entry.readinessStatus === "ready").length,
    partial: entries.filter((entry) => entry.readinessStatus === "partial")
      .length,
    blocked: entries.filter((entry) => entry.readinessStatus === "blocked")
      .length,
    gapCategories: uniqueStrings(
      entries.flatMap((entry) => entry.deckDoctrineGaps),
    ),
  };
}

function summarizeTacticalGoalTaxonomy(
  definitions: readonly TacticalGoalDefinition[],
): TacticalGoalTaxonomyDiagnosticSummary {
  return {
    totalGoals: definitions.length,
    runnerGoals: definitions.filter((goal) => goal.side === "runner").length,
    corpGoals: definitions.filter((goal) => goal.side === "corp").length,
    lifecycleStates: {
      proposed: definitions.filter(
        (goal) => goal.lifecycleState === "proposed",
      ).length,
      evidence_ready: definitions.filter(
        (goal) => goal.lifecycleState === "evidence_ready",
      ).length,
      blocked_by_gap: definitions.filter(
        (goal) => goal.lifecycleState === "blocked_by_gap",
      ).length,
      shadow_only: definitions.filter(
        (goal) => goal.lifecycleState === "shadow_only",
      ).length,
    },
    blockerPolicyCount: definitions.reduce(
      (sum, goal) => sum + goal.blockerPolicies.length,
      0,
    ),
    validationIssues: validateTacticalGoalTaxonomy(definitions),
  };
}

function validateTacticalGoalTaxonomy(
  definitions: readonly TacticalGoalDefinition[],
): TacticalGoalTaxonomyValidationIssue[] {
  const issues: TacticalGoalTaxonomyValidationIssue[] = [];
  const seenGoalIds = new Set<string>();

  for (const goal of definitions) {
    if (seenGoalIds.has(goal.goalId)) {
      issues.push({
        issueId: "duplicate_goal_id",
        severity: "error",
        goalId: goal.goalId,
        message: `Duplicate TacticalGoal goalId: ${goal.goalId}`,
      });
    }
    seenGoalIds.add(goal.goalId);

    if (!goal.goalId.startsWith(`${goal.side}.`)) {
      issues.push({
        issueId: "side_goal_id_mismatch",
        severity: "error",
        goalId: goal.goalId,
        message: "goalId must be side-prefixed.",
      });
    }

    if (!goal.family.startsWith(`${goal.side}_`)) {
      issues.push({
        issueId: "side_family_mismatch",
        severity: "error",
        goalId: goal.goalId,
        message: "TacticalGoal family must match the goal side.",
      });
    }

    if (goal.requiredCandidateEvidence.length === 0) {
      issues.push({
        issueId: "missing_required_candidate_evidence",
        severity: "error",
        goalId: goal.goalId,
        message: "TacticalGoal must declare candidate evidence requirements.",
      });
    }

    if (goal.evidence.length === 0) {
      issues.push({
        issueId: "missing_goal_evidence",
        severity: "warning",
        goalId: goal.goalId,
        message: "TacticalGoal should cite roadmap or guide evidence.",
      });
    }
  }

  return issues;
}

function copyTacticalGoalDefinition(
  goal: TacticalGoalDefinition,
): TacticalGoalDefinition {
  return {
    goalId: goal.goalId,
    side: goal.side,
    family: goal.family,
    lifecycleState: goal.lifecycleState,
    label: goal.label,
    source: goal.source,
    requiredCandidateEvidence: goal.requiredCandidateEvidence.map(
      (requirement) => ({ ...requirement }),
    ),
    blockerPolicies: goal.blockerPolicies.map((policy) => ({
      blockerId: policy.blockerId,
      issues: [...policy.issues],
      gateIds: [...policy.gateIds],
      reason: policy.reason,
      removalCondition: policy.removalCondition,
    })),
    evidence: [...goal.evidence],
  };
}

function tacticalGoal(params: {
  goalId: string;
  side: TacticalGoalSide;
  family: TacticalGoalFamily;
  lifecycleState: TacticalGoalLifecycleState;
  label: string;
  source: TacticalGoalDefinition["source"];
  fields: readonly TacticalGoalCandidateField[];
  blockerPolicies: readonly TacticalGoalBlockerPolicy[];
  evidence: readonly string[];
}): TacticalGoalDefinition {
  return {
    goalId: params.goalId,
    side: params.side,
    family: params.family,
    lifecycleState: params.lifecycleState,
    label: params.label,
    source: params.source,
    requiredCandidateEvidence: params.fields.map((fieldId) => ({
      field: fieldId,
      requirement:
        fieldId === "projectionIssues"
          ? "gap_marked"
          : fieldId === "hardGates"
            ? "not_blocked"
            : fieldId === "targetContext"
              ? "side_safe"
              : "present",
      reason: `Required diagnostic evidence: ${fieldId}`,
    })),
    blockerPolicies: params.blockerPolicies.map((policy) => ({
      blockerId: policy.blockerId,
      issues: [...policy.issues],
      gateIds: [...policy.gateIds],
      reason: policy.reason,
      removalCondition: policy.removalCondition,
    })),
    evidence: [...params.evidence],
  };
}

function blocker(
  blockerId: string,
  issues: readonly ActionProjectionIssue[],
  gateIds: readonly ActionGateId[],
  removalCondition: string,
): TacticalGoalBlockerPolicy {
  return {
    blockerId,
    issues: [...issues],
    gateIds: [...gateIds],
    reason: "Diagnostic blocker for TacticalGoal readiness.",
    removalCondition,
  };
}

function field(
  fieldId: DeckDoctrineV2DiagnosticFieldId,
  status: DiagnosticFieldStatus,
  evidence: readonly string[] = [],
  issues: readonly ActionProjectionIssue[] = [],
  notes: readonly string[] = [],
): DeckDoctrineV2DiagnosticField {
  return {
    fieldId,
    status,
    evidence: uniqueStrings(evidence),
    issues: [...issues],
    notes: [...notes],
  };
}

function uniqueStrings(values: readonly string[]): string[] {
  return [...new Set(values)];
}
