import type { LegalAction } from "@netgrid/shared";

export const ACTION_SEMANTIC_CANDIDATE_SCHEMA_VERSION =
  "action-semantic-candidate-v1" as const;

export type ActionSemanticVisibilityScope =
  | "actor_private"
  | "public"
  | "corp_private"
  | "runner_private"
  | "developer_only";

export type ActionSemanticSourceKind =
  | "card"
  | "basic_action"
  | "game_rule"
  | "choice"
  | "unknown";

export type ActionAbilityBindingMethod =
  | "explicit_ability_id"
  | "engine_payload"
  | "single_legal_ability_inferred"
  | "unresolved";

export type ActionSemanticConfidence = "none" | "low" | "medium" | "high";

export type ActionPrimaryProjectionStatus =
  | "projected"
  | "neutral_projected"
  | "partial_projected"
  | "blocked"
  | "schema_gap"
  | "hidden_info_blocked";

export type ActionProjectionIssue =
  | "source_unresolved"
  | "ability_unresolved"
  | "target_context_unavailable"
  | "hidden_info_blocked"
  | "cost_unknown"
  | "timing_unknown"
  | "card_semantics_unavailable";

export type ActionGateId =
  | "engine_legal_action"
  | "side_visibility"
  | "hidden_info"
  | "source_resolution"
  | "ability_resolution"
  | "target_context"
  | "cost_known"
  | "timing_known"
  | "runtime_no_effect";

export type ActionGateResult = {
  gateId: ActionGateId;
  status: "pass" | "block" | "unknown" | "not_applicable";
  severity: "info" | "warning" | "error";
  reason?: string;
  evidence?: string[];
};

export type StrategySupportPair = {
  strategyId: string;
  role: string;
  confidence: "low" | "medium" | "high";
  evidence: string;
};

export type SemanticCondition = {
  conditionId?: string;
  kind: string;
  status: "present" | "absent" | "unknown" | "not_evaluated";
  evidence?: string[];
};

export type SemanticRisk = {
  riskId?: string;
  kind: string;
  severity: "low" | "medium" | "high" | "unknown";
  evidence?: string[];
};

export type SemanticConstraint = {
  constraintId?: string;
  kind: string;
  status: "satisfied" | "unsatisfied" | "unknown" | "not_evaluated";
  evidence?: string[];
};

export type DamageAmount = {
  type: "net" | "meat" | "brain" | "core" | "unknown";
  amount: number | "unknown";
};

export type ActionCostProfile = {
  clickCost?: number;
  creditCost?: number;
  trashCost?: number;
  agendaPointCost?: number;
  forfeitAgenda?: boolean;
  selfDamage?: DamageAmount[];
  selfTag?: number;
  discardCost?: number;
  xValue?: number | "choice" | "unknown";
  paidBy?: "runner" | "corp" | "unknown";
  beneficiary?: "runner" | "corp" | "none" | "unknown";
  costKnownStatus: "known" | "partial" | "unknown" | "not_applicable";
  variableCost?: {
    kind: "x" | "trace_boost" | "trash_cost" | "rez_cost" | "choice" | "unknown";
    min?: number;
    max?: number;
    chosen?: number;
  };
  additionalCosts: string[];
};

export type ActionTimingProfile = {
  phase?: string;
  turnSide?: "runner" | "corp";
  window?: string;
  runPhase?: string;
  encounterPhase?: string;
  accessPhase?: boolean;
  scoreWindow?: boolean;
  rezWindow?: boolean;
  responseWindow?: boolean;
};

export type LegalTarget = {
  targetId: string;
  targetKind: "card" | "server" | "ice" | "program" | "resource" | "hardware" | "agenda" | "choice" | "unknown";
  targetSide: "runner" | "corp" | "both" | "unknown";
  targetZone?: string;
  visibilityScope: ActionSemanticVisibilityScope;
  evidence: string[];
};

export type LegalTargetSummary = {
  targetId: string;
  targetKind: LegalTarget["targetKind"];
  targetSide: LegalTarget["targetSide"];
  targetZone?: string;
  evidence: string[];
};

export type TargetProfileMatch = {
  targetProfileId?: string;
  status: "matched" | "not_matched" | "unknown" | "not_available";
  issues: ActionProjectionIssue[];
  evidence: string[];
};

export type ConstraintResult = {
  constraintId?: string;
  status: "pass" | "block" | "unknown" | "not_applicable";
  reason?: string;
  evidence: string[];
};

export type ActionTargetContext = {
  selectedTargets: LegalTarget[];
  availableTargets?: LegalTargetSummary[];
  targetKind:
    | "card"
    | "server"
    | "ice"
    | "program"
    | "resource"
    | "hardware"
    | "agenda"
    | "choice"
    | "unknown";
  targetZones: string[];
  targetSide: "runner" | "corp" | "both" | "unknown";
  hiddenInfoPolicy: string;
  availableTargetsStatus:
    | "engine_provided"
    | "not_available"
    | "target_context_unavailable";
  targetProfileMatches: TargetProfileMatch[];
  targetConstraintResults: ConstraintResult[];
};

export type BoardContextSummary = {
  source: "ai_decision_input" | "player_view" | "not_projected";
  sideSafe: boolean;
  stateVersion?: number;
  timingPoint?: string;
  notes: string[];
};

export type ActionSemanticCandidate = {
  actionId: string;
  actionType: string;
  actorSide: "runner" | "corp";
  actorId?: string;
  observerSide?: "runner" | "corp" | "system";
  visibilityScope: ActionSemanticVisibilityScope;
  legalActionRef: {
    actionId: string;
    actionType: string;
    originalPayloadKeys: string[];
    payloadHash?: string;
  };
  stateVersion?: number;
  sourceKind: ActionSemanticSourceKind;
  sourceCardId?: string;
  abilityId?: string;
  abilityBindingMethod: ActionAbilityBindingMethod;
  semanticActionType: string;
  cardContextSignals: string[];
  actionTacticSignals: string[];
  strategySupport: StrategySupportPair[];
  conditions: SemanticCondition[];
  risks: SemanticRisk[];
  constraints: SemanticConstraint[];
  costProfile: ActionCostProfile;
  timingProfile: ActionTimingProfile;
  targetContext?: ActionTargetContext;
  boardContext: BoardContextSummary;
  confidence: ActionSemanticConfidence;
  primaryProjectionStatus: ActionPrimaryProjectionStatus;
  projectionIssues: ActionProjectionIssue[];
  hardGates: ActionGateResult[];
  evidence: string[];
};

export type BuildActionSemanticCandidatesParams = {
  legalActions: readonly LegalAction[];
  observerSide?: "runner" | "corp" | "system";
  stateVersion?: number;
  projectionMode?: "neutral_only" | "basic_semantics";
  sideSafeAbilityBindings?: readonly SideSafeActionAbilityBinding[];
  selectedTargetsByActionId?: Readonly<
    Record<string, Readonly<Record<string, string>>>
  >;
  availableTargetsByActionId?: Readonly<
    Record<string, readonly LegalTargetSummary[]>
  >;
  cardSemanticProfilesByCardId?: Readonly<
    Record<string, ActionCardSemanticProfile>
  >;
};

export type BuildNeutralActionSemanticCandidateOptions = {
  observerSide?: "runner" | "corp" | "system";
  stateVersion?: number;
};

export type SideSafeActionAbilityBinding = {
  actionId: string;
  sourceCardId: string;
  abilityId: string;
  method: "single_legal_ability_inferred";
  evidence: string[];
};

export type ActionCardAbilitySemanticProfile = {
  abilityId: string;
  tacticSignals: readonly string[];
  strategySupport?: readonly StrategySupportPair[];
  conditions?: readonly SemanticCondition[];
  risks?: readonly SemanticRisk[];
  constraints?: readonly SemanticConstraint[];
  targetProfileMatches?: readonly TargetProfileMatch[];
};

export type ActionCardSemanticProfile = {
  cardId: string;
  tacticSignals: readonly string[];
  strategySupport?: readonly StrategySupportPair[];
  conditions?: readonly SemanticCondition[];
  risks?: readonly SemanticRisk[];
  constraints?: readonly SemanticConstraint[];
  targetProfileMatches?: readonly TargetProfileMatch[];
  abilitySemantics?: readonly ActionCardAbilitySemanticProfile[];
};

export function buildActionSemanticCandidates(
  params: BuildActionSemanticCandidatesParams,
): ActionSemanticCandidate[] {
  const projectionMode = params.projectionMode ?? "basic_semantics";
  return params.legalActions.map((action) =>
    projectActionSemanticCandidate(
      action,
      projectionMode,
      {
        ...(params.observerSide !== undefined
          ? { observerSide: params.observerSide }
          : {}),
        ...(params.stateVersion !== undefined
          ? { stateVersion: params.stateVersion }
          : {}),
      },
      params.sideSafeAbilityBindings ?? [],
      params.selectedTargetsByActionId?.[action.actionId],
      params.availableTargetsByActionId?.[action.actionId],
      params.cardSemanticProfilesByCardId,
    ),
  );
}

function projectActionSemanticCandidate(
  action: LegalAction,
  projectionMode: "neutral_only" | "basic_semantics",
  options: BuildNeutralActionSemanticCandidateOptions,
  sideSafeAbilityBindings: readonly SideSafeActionAbilityBinding[],
  selectedTargets: Readonly<Record<string, string>> | undefined,
  availableTargets: readonly LegalTargetSummary[] | undefined,
  cardSemanticProfilesByCardId:
    | Readonly<Record<string, ActionCardSemanticProfile>>
    | undefined,
): ActionSemanticCandidate {
  const neutralCandidate = buildNeutralActionSemanticCandidate(action, options);
  if (projectionMode === "neutral_only") return neutralCandidate;
  const basicCandidate = applyBasicActionSemantics(neutralCandidate, action);
  const sourceBoundCandidate = applyCardActionSourceBinding(
    basicCandidate,
    action,
    sideSafeAbilityBindings,
  );
  const targetCandidate = applyTargetContextProjection(
    sourceBoundCandidate,
    action,
    selectedTargets,
    availableTargets,
  );
  const costTimingCandidate = applyCostAndTimingProfiles(targetCandidate, action);
  return applyCardSemanticJoin(
    costTimingCandidate,
    cardSemanticProfilesByCardId,
  );
}

export function buildNeutralActionSemanticCandidate(
  action: LegalAction,
  options: BuildNeutralActionSemanticCandidateOptions = {},
): ActionSemanticCandidate {
  const originalPayloadKeys = Object.keys(action.payload ?? {}).sort();

  return {
    actionId: action.actionId,
    actionType: action.type,
    actorSide: action.side,
    ...(options.observerSide !== undefined
      ? { observerSide: options.observerSide }
      : {}),
    visibilityScope: visibilityScopeForAction(action),
    legalActionRef: {
      actionId: action.actionId,
      actionType: action.type,
      originalPayloadKeys,
    },
    ...(options.stateVersion !== undefined
      ? { stateVersion: options.stateVersion }
      : {}),
    sourceKind: "unknown",
    abilityBindingMethod: "unresolved",
    semanticActionType: "unknown",
    cardContextSignals: [],
    actionTacticSignals: [],
    strategySupport: [],
    conditions: [],
    risks: [],
    constraints: [],
    costProfile: {
      costKnownStatus: "unknown",
      additionalCosts: [],
    },
    timingProfile: {},
    boardContext: {
      source: "not_projected",
      sideSafe: true,
      ...(options.stateVersion !== undefined
        ? { stateVersion: options.stateVersion }
        : {}),
      timingPoint: action.timingPoint,
      notes: ["AI036 neutral projection only"],
    },
    confidence: "none",
    primaryProjectionStatus: "neutral_projected",
    projectionIssues: [],
    hardGates: neutralHardGates(action),
    evidence: ["AI036 neutral projection", "source: LegalAction only"],
  };
}

function visibilityScopeForAction(
  action: LegalAction,
): ActionSemanticVisibilityScope {
  if (action.visibility === "public") return "public";
  return "actor_private";
}

function neutralHardGates(action: LegalAction): ActionGateResult[] {
  return [
    {
      gateId: "engine_legal_action",
      status: "pass",
      severity: "info",
      reason: "Candidate was built from an existing LegalAction.",
      evidence: [action.actionId],
    },
    {
      gateId: "side_visibility",
      status: "pass",
      severity: "info",
      reason: `LegalAction visibility is ${action.visibility}.`,
    },
    {
      gateId: "hidden_info",
      status: "pass",
      severity: "info",
      reason: "No full game state, hidden zone or private opponent data is read.",
    },
    {
      gateId: "source_resolution",
      status: "unknown",
      severity: "warning",
      reason: "Source binding is deferred to AI038.",
    },
    {
      gateId: "ability_resolution",
      status: "unknown",
      severity: "warning",
      reason: "Ability binding is deferred to AI038.",
    },
    {
      gateId: "target_context",
      status: "unknown",
      severity: "warning",
      reason: "TargetContext projection is deferred to AI039.",
    },
    {
      gateId: "cost_known",
      status: "unknown",
      severity: "warning",
      reason: "Cost normalization is deferred to AI040.",
    },
    {
      gateId: "timing_known",
      status: "unknown",
      severity: "warning",
      reason: "Timing normalization is deferred to AI040.",
    },
    {
      gateId: "runtime_no_effect",
      status: "pass",
      severity: "info",
      reason: "Builder returns diagnostics only and has no decision consumer.",
    },
  ];
}

type BasicActionSemanticClassification = {
  semanticActionType: string;
  primaryProjectionStatus: ActionPrimaryProjectionStatus;
  confidence: Exclude<ActionSemanticConfidence, "none">;
  projectionIssues?: ActionProjectionIssue[];
};

const BASIC_ACTION_SEMANTICS: Partial<
  Record<LegalAction["type"], BasicActionSemanticClassification>
> = {
  mandatory_draw: {
    semanticActionType: "draw.mandatory",
    primaryProjectionStatus: "projected",
    confidence: "high",
  },
  gain_credit: {
    semanticActionType: "economy.gain_credit",
    primaryProjectionStatus: "projected",
    confidence: "high",
  },
  draw_card: {
    semanticActionType: "draw.card",
    primaryProjectionStatus: "projected",
    confidence: "high",
  },
  start_run: {
    semanticActionType: "run.start",
    primaryProjectionStatus: "projected",
    confidence: "high",
  },
  continue_run: {
    semanticActionType: "run.continue",
    primaryProjectionStatus: "projected",
    confidence: "high",
  },
  jack_out: {
    semanticActionType: "run.jack_out",
    primaryProjectionStatus: "projected",
    confidence: "high",
  },
  access_card: {
    semanticActionType: "access.resolve_card",
    primaryProjectionStatus: "projected",
    confidence: "high",
  },
  steal_agenda: {
    semanticActionType: "access.steal_agenda",
    primaryProjectionStatus: "projected",
    confidence: "high",
  },
  trash_accessed_card: {
    semanticActionType: "access.trash_accessed_card",
    primaryProjectionStatus: "partial_projected",
    confidence: "medium",
    projectionIssues: ["target_context_unavailable"],
  },
  trash_resource: {
    semanticActionType: "tag.trash_runner_resource",
    primaryProjectionStatus: "partial_projected",
    confidence: "medium",
    projectionIssues: ["target_context_unavailable"],
  },
  decline_trash: {
    semanticActionType: "access.decline_trash",
    primaryProjectionStatus: "projected",
    confidence: "high",
  },
  rez_ice: {
    semanticActionType: "corp_window.rez",
    primaryProjectionStatus: "partial_projected",
    confidence: "medium",
    projectionIssues: ["target_context_unavailable"],
  },
  decline_rez: {
    semanticActionType: "corp_window.decline_rez",
    primaryProjectionStatus: "projected",
    confidence: "high",
  },
  end_turn: {
    semanticActionType: "turn_flow.end_turn",
    primaryProjectionStatus: "projected",
    confidence: "high",
  },
  forgo_action: {
    semanticActionType: "turn_flow.forgo_action",
    primaryProjectionStatus: "projected",
    confidence: "high",
  },
  remove_tag: {
    semanticActionType: "tag.remove",
    primaryProjectionStatus: "projected",
    confidence: "high",
  },
  purge_virus_counters: {
    semanticActionType: "counter.purge_virus",
    primaryProjectionStatus: "projected",
    confidence: "high",
  },
  purge_runner_virus_counters: {
    semanticActionType: "counter.purge_runner_virus",
    primaryProjectionStatus: "projected",
    confidence: "high",
  },
  resolve_choice: {
    semanticActionType: "choice.resolve",
    primaryProjectionStatus: "partial_projected",
    confidence: "medium",
    projectionIssues: ["target_context_unavailable"],
  },
  install_card: {
    semanticActionType: "install.card",
    primaryProjectionStatus: "partial_projected",
    confidence: "low",
    projectionIssues: ["target_context_unavailable"],
  },
  play_event: {
    semanticActionType: "play.runner_event",
    primaryProjectionStatus: "partial_projected",
    confidence: "medium",
  },
  play_operation: {
    semanticActionType: "play.corp_operation",
    primaryProjectionStatus: "partial_projected",
    confidence: "medium",
  },
  advance_card: {
    semanticActionType: "score.advance_card",
    primaryProjectionStatus: "partial_projected",
    confidence: "medium",
    projectionIssues: ["target_context_unavailable"],
  },
  score_agenda: {
    semanticActionType: "score.agenda",
    primaryProjectionStatus: "partial_projected",
    confidence: "medium",
    projectionIssues: ["target_context_unavailable"],
  },
  pump_breaker: {
    semanticActionType: "breaker.boost_strength",
    primaryProjectionStatus: "partial_projected",
    confidence: "medium",
    projectionIssues: ["ability_unresolved", "target_context_unavailable"],
  },
  break_subroutine: {
    semanticActionType: "breaker.break_subroutine",
    primaryProjectionStatus: "partial_projected",
    confidence: "medium",
    projectionIssues: ["ability_unresolved", "target_context_unavailable"],
  },
  activated_card_ability: {
    semanticActionType: "card_ability.unknown",
    primaryProjectionStatus: "partial_projected",
    confidence: "low",
    projectionIssues: ["ability_unresolved"],
  },
  trigger_ability: {
    semanticActionType: "card_ability.trigger",
    primaryProjectionStatus: "partial_projected",
    confidence: "low",
    projectionIssues: ["ability_unresolved"],
  },
  move_to_set_aside: {
    semanticActionType: "special_zone.move_to_set_aside",
    primaryProjectionStatus: "partial_projected",
    confidence: "low",
  },
  move_to_removed_from_game: {
    semanticActionType: "special_zone.move_to_removed_from_game",
    primaryProjectionStatus: "partial_projected",
    confidence: "low",
  },
  return_from_set_aside: {
    semanticActionType: "special_zone.return_from_set_aside",
    primaryProjectionStatus: "partial_projected",
    confidence: "low",
  },
  change_card_control: {
    semanticActionType: "special_zone.change_card_control",
    primaryProjectionStatus: "partial_projected",
    confidence: "low",
  },
};

function applyBasicActionSemantics(
  candidate: ActionSemanticCandidate,
  action: LegalAction,
): ActionSemanticCandidate {
  const classification = BASIC_ACTION_SEMANTICS[action.type];
  if (!classification) return candidate;

  const sourceKind = basicSourceKindForAction(action);
  const projectionIssues = classification.projectionIssues ?? [];

  return {
    ...candidate,
    sourceKind,
    semanticActionType: classification.semanticActionType,
    confidence: classification.confidence,
    primaryProjectionStatus: classification.primaryProjectionStatus,
    projectionIssues,
    hardGates: updateBasicActionGates(candidate.hardGates, action, sourceKind),
    evidence: [
      ...candidate.evidence,
      `AI037 basic action semantic: ${classification.semanticActionType}`,
    ],
  };
}

function basicSourceKindForAction(action: LegalAction): ActionSemanticSourceKind {
  if (action.type === "resolve_choice") return "choice";
  if (action.source === "basic_action") return "basic_action";
  if (action.source === "game_rule") return "game_rule";
  return "unknown";
}

function updateBasicActionGates(
  hardGates: ActionGateResult[],
  action: LegalAction,
  sourceKind: ActionSemanticSourceKind,
): ActionGateResult[] {
  const sourceResolved = sourceKind !== "unknown";
  const abilityNotApplicable =
    sourceKind === "basic_action" ||
    sourceKind === "game_rule" ||
    sourceKind === "choice";

  return hardGates.map((gate) => {
    if (gate.gateId === "source_resolution") {
      return {
        ...gate,
        status: sourceResolved ? "pass" : "unknown",
        severity: sourceResolved ? "info" : "warning",
        reason: sourceResolved
          ? `Source kind resolved from LegalAction.source for ${action.type}.`
          : "Card source binding remains deferred to AI038.",
      };
    }
    if (gate.gateId === "ability_resolution" && abilityNotApplicable) {
      return {
        ...gate,
        status: "not_applicable",
        severity: "info",
        reason: "Basic, game-rule and choice actions do not need card ability binding.",
      };
    }
    return gate;
  });
}

function applyCardActionSourceBinding(
  candidate: ActionSemanticCandidate,
  action: LegalAction,
  sideSafeAbilityBindings: readonly SideSafeActionAbilityBinding[],
): ActionSemanticCandidate {
  const sourceCardId = sourceCardIdForAction(action);
  const abilityBinding = abilityBindingForAction(
    action,
    sourceCardId,
    sideSafeAbilityBindings,
  );
  const sourceKind: ActionSemanticSourceKind =
    sourceCardId !== undefined ? "card" : candidate.sourceKind;
  const projectionIssues = reconcileSourceAbilityIssues(
    candidate.projectionIssues,
    action,
    sourceCardId,
    abilityBinding,
  );

  return {
    ...candidate,
    sourceKind,
    ...(sourceCardId !== undefined ? { sourceCardId } : {}),
    ...(abilityBinding?.abilityId !== undefined
      ? { abilityId: abilityBinding.abilityId }
      : {}),
    abilityBindingMethod:
      abilityBinding?.method ?? candidate.abilityBindingMethod,
    projectionIssues,
    hardGates: updateSourceAbilityGates(
      candidate.hardGates,
      sourceCardId,
      abilityBinding,
      action,
    ),
    evidence: [
      ...candidate.evidence,
      ...(sourceCardId !== undefined
        ? [`AI038 source bound from LegalAction: ${sourceCardId}`]
        : []),
      ...(abilityBinding !== undefined ? abilityBinding.evidence : []),
    ],
  };
}

function sourceCardIdForAction(action: LegalAction): string | undefined {
  if (
    action.abilityRef?.sourceCardInstanceId !== undefined &&
    action.abilityRef.sourceCardInstanceId.length > 0
  ) {
    return action.abilityRef.sourceCardInstanceId;
  }
  if (action.source === "basic_action" || action.source === "game_rule") {
    return undefined;
  }
  return action.source;
}

type ResolvedAbilityBinding = {
  abilityId: string;
  method: ActionAbilityBindingMethod;
  evidence: string[];
};

function abilityBindingForAction(
  action: LegalAction,
  sourceCardId: string | undefined,
  sideSafeAbilityBindings: readonly SideSafeActionAbilityBinding[],
): ResolvedAbilityBinding | undefined {
  if (action.abilityRef?.abilityId) {
    return {
      abilityId: action.abilityRef.abilityId,
      method: "explicit_ability_id",
      evidence: [`AI038 abilityRef abilityId: ${action.abilityRef.abilityId}`],
    };
  }

  const payloadAbilityId = stringPayload(action, "abilityId");
  if (payloadAbilityId !== undefined) {
    return {
      abilityId: payloadAbilityId,
      method: "engine_payload",
      evidence: [`AI038 payload abilityId: ${payloadAbilityId}`],
    };
  }

  if (sourceCardId === undefined) return undefined;
  const matchingBindings = sideSafeAbilityBindings.filter(
    (binding) =>
      binding.actionId === action.actionId &&
      binding.sourceCardId === sourceCardId,
  );
  if (matchingBindings.length !== 1) return undefined;
  const [binding] = matchingBindings;
  if (!binding) return undefined;

  return {
    abilityId: binding.abilityId,
    method: binding.method,
    evidence: binding.evidence,
  };
}

function stringPayload(
  action: LegalAction,
  key: string,
): string | undefined {
  const value = action.payload?.[key];
  if (typeof value !== "string" || value.length === 0) return undefined;
  return value;
}

function reconcileSourceAbilityIssues(
  currentIssues: readonly ActionProjectionIssue[],
  action: LegalAction,
  sourceCardId: string | undefined,
  abilityBinding: ResolvedAbilityBinding | undefined,
): ActionProjectionIssue[] {
  const issues = new Set(currentIssues);
  if (requiresCardSource(action) && sourceCardId === undefined) {
    issues.add("source_unresolved");
  } else {
    issues.delete("source_unresolved");
  }

  if (requiresAbilityBinding(action) && abilityBinding === undefined) {
    issues.add("ability_unresolved");
  } else if (abilityBinding !== undefined || !requiresAbilityBinding(action)) {
    issues.delete("ability_unresolved");
  }

  return [...issues];
}

function requiresCardSource(action: LegalAction): boolean {
  return action.source !== "basic_action" && action.source !== "game_rule";
}

function requiresAbilityBinding(action: LegalAction): boolean {
  return [
    "activated_card_ability",
    "trigger_ability",
    "pump_breaker",
    "break_subroutine",
  ].includes(action.type);
}

function updateSourceAbilityGates(
  hardGates: ActionGateResult[],
  sourceCardId: string | undefined,
  abilityBinding: ResolvedAbilityBinding | undefined,
  action: LegalAction,
): ActionGateResult[] {
  return hardGates.map((gate) => {
    if (gate.gateId === "source_resolution" && sourceCardId !== undefined) {
      return {
        ...gate,
        status: "pass",
        severity: "info",
        reason: "Source card was bound from LegalAction/abilityRef.",
        evidence: [sourceCardId],
      };
    }
    if (gate.gateId === "ability_resolution") {
      if (abilityBinding !== undefined) {
        return {
          ...gate,
          status: "pass",
          severity: "info",
          reason: `Ability bound by ${abilityBinding.method}.`,
          evidence: [abilityBinding.abilityId],
        };
      }
      if (!requiresAbilityBinding(action)) {
        return {
          ...gate,
          status: "not_applicable",
          severity: "info",
          reason: "This action type does not require card ability binding.",
        };
      }
    }
    return gate;
  });
}

function applyTargetContextProjection(
  candidate: ActionSemanticCandidate,
  action: LegalAction,
  selectedTargets: Readonly<Record<string, string>> | undefined,
  availableTargets: readonly LegalTargetSummary[] | undefined,
): ActionSemanticCandidate {
  const hasTargetRequirement =
    action.targetRequirements.length > 0 ||
    (action.choiceRequirements?.length ?? 0) > 0;
  const hiddenTargetRequirement = action.targetRequirements.some(
    (requirement) => requirement.visibility === "engine_only",
  );

  if (!hasTargetRequirement && availableTargets === undefined) {
    return {
      ...candidate,
      hardGates: updateTargetContextGate(candidate.hardGates, "not_applicable"),
    };
  }

  const sideSafeSelectedTargets =
    hiddenTargetRequirement === true
      ? []
      : selectedLegalTargetsForAction(action, selectedTargets);
  const sideSafeAvailableTargets = availableTargets?.map((target) => ({
    ...target,
    evidence: [...target.evidence],
  }));
  const targetContext = targetContextForAction(
    action,
    sideSafeSelectedTargets,
    sideSafeAvailableTargets,
    hiddenTargetRequirement,
  );
  const hasProjectedTargetContext =
    targetContext.selectedTargets.length > 0 ||
    (targetContext.availableTargets?.length ?? 0) > 0;
  const projectionIssues = reconcileTargetProjectionIssues(
    candidate.projectionIssues,
    hasProjectedTargetContext,
    hasTargetRequirement,
    hiddenTargetRequirement,
  );

  return {
    ...candidate,
    targetContext,
    primaryProjectionStatus: hiddenTargetRequirement
      ? "hidden_info_blocked"
      : hasProjectedTargetContext
        ? candidate.primaryProjectionStatus
        : candidate.primaryProjectionStatus,
    projectionIssues,
    hardGates: updateTargetContextGate(
      candidate.hardGates,
      hasProjectedTargetContext ? "pass" : "unknown",
      hiddenTargetRequirement
        ? "TargetContext touches an engine-only target requirement and is not projected."
        : undefined,
    ),
    evidence: [
      ...candidate.evidence,
      ...(hasProjectedTargetContext
        ? ["AI039 target context projected from side-safe input"]
        : ["AI039 target context unavailable"]),
    ],
  };
}

function selectedLegalTargetsForAction(
  action: LegalAction,
  selectedTargets: Readonly<Record<string, string>> | undefined,
): LegalTarget[] {
  if (selectedTargets === undefined) return [];

  return Object.entries(selectedTargets).map(([requirementId, targetId]) => {
    const requirement = action.targetRequirements.find(
      (candidate) => candidate.id === requirementId,
    );
    return {
      targetId,
      targetKind: targetKindFromRequirement(requirement?.kind),
      targetSide: targetSideFromRequirement(requirement?.side),
      ...(requirement?.zoneScope?.[0] !== undefined
        ? { targetZone: requirement.zoneScope[0] }
        : {}),
      visibilityScope: "actor_private",
      evidence: [`AI039 selected target for requirement ${requirementId}`],
    };
  });
}

function targetContextForAction(
  action: LegalAction,
  selectedTargets: LegalTarget[],
  availableTargets: readonly LegalTargetSummary[] | undefined,
  hiddenTargetRequirement: boolean,
): ActionTargetContext {
  const targetKind = firstTargetKind(action, selectedTargets, availableTargets);
  const targetZones = [
    ...new Set([
      ...selectedTargets.flatMap((target) =>
        target.targetZone !== undefined ? [target.targetZone] : [],
      ),
      ...(availableTargets?.flatMap((target) =>
        target.targetZone !== undefined ? [target.targetZone] : [],
      ) ?? []),
      ...action.targetRequirements.flatMap(
        (requirement) => requirement.zoneScope ?? [],
      ),
    ]),
  ];

  return {
    selectedTargets,
    ...(availableTargets !== undefined
      ? { availableTargets: [...availableTargets] }
      : {}),
    targetKind,
    targetZones,
    targetSide: firstTargetSide(action, selectedTargets, availableTargets),
    hiddenInfoPolicy: hiddenTargetRequirement
      ? "hidden_info_blocked"
      : "side_safe_engine_input_only",
    availableTargetsStatus:
      availableTargets !== undefined
        ? "engine_provided"
        : selectedTargets.length > 0
          ? "not_available"
          : "target_context_unavailable",
    targetProfileMatches: [],
    targetConstraintResults: [],
  };
}

function targetKindFromRequirement(
  kind: LegalAction["targetRequirements"][number]["kind"] | undefined,
): LegalTarget["targetKind"] {
  if (kind === "card") return "card";
  if (kind === "server") return "server";
  if (kind === "subroutine") return "unknown";
  if (kind === "side") return "unknown";
  return "unknown";
}

function targetSideFromRequirement(
  side: LegalAction["targetRequirements"][number]["side"] | undefined,
): LegalTarget["targetSide"] {
  if (side === "runner" || side === "corp") return side;
  return "unknown";
}

function firstTargetKind(
  action: LegalAction,
  selectedTargets: readonly LegalTarget[],
  availableTargets: readonly LegalTargetSummary[] | undefined,
): ActionTargetContext["targetKind"] {
  return (
    selectedTargets[0]?.targetKind ??
    availableTargets?.[0]?.targetKind ??
    targetKindFromRequirement(action.targetRequirements[0]?.kind)
  );
}

function firstTargetSide(
  action: LegalAction,
  selectedTargets: readonly LegalTarget[],
  availableTargets: readonly LegalTargetSummary[] | undefined,
): ActionTargetContext["targetSide"] {
  return (
    selectedTargets[0]?.targetSide ??
    availableTargets?.[0]?.targetSide ??
    targetSideFromRequirement(action.targetRequirements[0]?.side)
  );
}

function reconcileTargetProjectionIssues(
  currentIssues: readonly ActionProjectionIssue[],
  hasProjectedTargetContext: boolean,
  hasTargetRequirement: boolean,
  hiddenTargetRequirement: boolean,
): ActionProjectionIssue[] {
  const issues = new Set(currentIssues);
  if (hiddenTargetRequirement) {
    issues.add("hidden_info_blocked");
    issues.delete("target_context_unavailable");
    return [...issues];
  }
  if (hasTargetRequirement && !hasProjectedTargetContext) {
    issues.add("target_context_unavailable");
  } else if (hasProjectedTargetContext) {
    issues.delete("target_context_unavailable");
  }
  return [...issues];
}

function updateTargetContextGate(
  hardGates: ActionGateResult[],
  status: ActionGateResult["status"],
  reason?: string,
): ActionGateResult[] {
  return hardGates.map((gate) => {
    if (gate.gateId !== "target_context") return gate;
    return {
      ...gate,
      status,
      severity: status === "pass" || status === "not_applicable" ? "info" : "warning",
      reason:
        reason ??
        (status === "pass"
          ? "TargetContext was projected from side-safe selected or engine-provided targets."
          : status === "not_applicable"
            ? "LegalAction has no target or choice requirement."
            : "TargetContext is not side-safe available."),
    };
  });
}

function applyCostAndTimingProfiles(
  candidate: ActionSemanticCandidate,
  action: LegalAction,
): ActionSemanticCandidate {
  const costProfile = costProfileForAction(action);
  const timingProfile = timingProfileForAction(action);
  const projectionIssues = reconcileCostTimingIssues(
    candidate.projectionIssues,
    costProfile,
    timingProfile,
  );

  return {
    ...candidate,
    costProfile,
    timingProfile,
    projectionIssues,
    hardGates: updateCostTimingGates(
      candidate.hardGates,
      costProfile,
      timingProfile,
    ),
    evidence: [...candidate.evidence, "AI040 cost/timing profile normalized"],
  };
}

function costProfileForAction(action: LegalAction): ActionCostProfile {
  const clickCost = sumCost(action, "clicks");
  const explicitCreditCost = sumCost(action, "credits");
  const payloadCreditCost =
    numberPayload(action, "accessTrashTotalCost") ??
    numberPayload(action, "stealCost") ??
    numberPayload(action, "paymentAmount") ??
    numberPayload(action, "rezCostPaid");
  const creditCost = explicitCreditCost ?? payloadCreditCost;
  const trashCost = numberPayload(action, "accessTrashTotalCost");
  const agendaPointCost =
    numberPayload(action, "agendaPointCost") ??
    numberPayload(action, "agendaPointCostPaid");
  const xValue = xValueForAction(action);
  const variableCost = variableCostForAction(action);
  const hasKnownCost =
    clickCost !== undefined ||
    creditCost !== undefined ||
    trashCost !== undefined ||
    agendaPointCost !== undefined ||
    xValue !== undefined ||
    variableCost !== undefined;

  return {
    ...(clickCost !== undefined ? { clickCost } : {}),
    ...(creditCost !== undefined ? { creditCost } : {}),
    ...(trashCost !== undefined ? { trashCost } : {}),
    ...(agendaPointCost !== undefined ? { agendaPointCost } : {}),
    ...(xValue !== undefined ? { xValue } : {}),
    paidBy: action.side,
    beneficiary: beneficiaryForAction(action),
    costKnownStatus: hasKnownCost
      ? "known"
      : action.costs.length === 0
        ? "not_applicable"
        : "unknown",
    ...(variableCost !== undefined ? { variableCost } : {}),
    additionalCosts: additionalCostFields(action),
  };
}

function sumCost(
  action: LegalAction,
  key: "clicks" | "credits",
): number | undefined {
  const values = action.costs
    .map((cost) => cost[key])
    .filter((value): value is number => typeof value === "number");
  if (values.length === 0) return undefined;
  return values.reduce((sum, value) => sum + value, 0);
}

function xValueForAction(
  action: LegalAction,
): ActionCostProfile["xValue"] | undefined {
  const value = action.payload?.xValue;
  if (typeof value === "number") return value;
  if (value === "choice" || value === "unknown") return value;
  if (action.payload !== undefined && "xValue" in action.payload) return "unknown";
  return undefined;
}

function variableCostForAction(
  action: LegalAction,
): ActionCostProfile["variableCost"] | undefined {
  const variableRezKind = stringPayload(action, "variableRezKind");
  const variableRezValue = numberPayload(action, "variableRezValue");
  const variableRezAdditionalCost = numberPayload(
    action,
    "variableRezAdditionalCost",
  );
  if (
    variableRezKind === undefined &&
    variableRezValue === undefined &&
    variableRezAdditionalCost === undefined
  ) {
    return undefined;
  }
  return {
    kind: "rez_cost",
    ...(variableRezValue !== undefined ? { chosen: variableRezValue } : {}),
    ...(variableRezAdditionalCost !== undefined
      ? { min: variableRezAdditionalCost }
      : {}),
  };
}

function beneficiaryForAction(
  action: LegalAction,
): NonNullable<ActionCostProfile["beneficiary"]> {
  if (action.type === "gain_credit" || action.type === "draw_card") {
    return action.side;
  }
  if (action.type === "remove_tag") return "runner";
  return "unknown";
}

function additionalCostFields(action: LegalAction): string[] {
  const fields = [
    "accessTrashTotalCost",
    "stealCost",
    "paymentAmount",
    "rezCostPaid",
    "agendaPointCost",
    "agendaPointCostPaid",
    "variableRezKind",
    "variableRezAdditionalCost",
    "variableRezValue",
    "xValue",
  ];
  return fields.filter((field) => action.payload?.[field] !== undefined);
}

function numberPayload(
  action: LegalAction,
  key: string,
): number | undefined {
  const value = action.payload?.[key];
  if (typeof value !== "number") return undefined;
  return value;
}

function timingProfileForAction(action: LegalAction): ActionTimingProfile {
  const timingPoint = action.timingPoint;
  const turnSide = turnSideForTimingPoint(timingPoint);
  return {
    phase: phaseForTimingPoint(timingPoint),
    ...(turnSide !== undefined ? { turnSide } : {}),
    window: timingPoint,
    ...(timingPoint.startsWith("run.") ? { runPhase: timingPoint } : {}),
    ...(timingPoint === "run.encounter_ice"
      ? { encounterPhase: "encounter_ice" }
      : {}),
    ...(timingPoint.startsWith("access.") ? { accessPhase: true } : {}),
    ...(action.type === "score_agenda" ? { scoreWindow: true } : {}),
    ...(action.type === "rez_ice" || action.type === "decline_rez"
      ? { rezWindow: true }
      : {}),
    ...(action.type === "trigger_ability" ||
    action.type === "activated_card_ability"
      ? { responseWindow: true }
      : {}),
  };
}

function phaseForTimingPoint(timingPoint: LegalAction["timingPoint"]): string {
  if (timingPoint.startsWith("corp_draw.")) return "corp_draw_phase";
  if (timingPoint.startsWith("corp_action.")) return "corp_action_phase";
  if (timingPoint.startsWith("corp_discard.")) return "corp_discard_phase";
  if (timingPoint.startsWith("runner_action.")) return "runner_action_phase";
  if (timingPoint.startsWith("runner_discard.")) return "runner_discard_phase";
  if (timingPoint.startsWith("run.")) return "run";
  if (timingPoint.startsWith("access.")) return "run";
  return "setup";
}

function turnSideForTimingPoint(
  timingPoint: LegalAction["timingPoint"],
): "runner" | "corp" | undefined {
  if (timingPoint.startsWith("corp_")) return "corp";
  if (timingPoint.startsWith("runner_")) return "runner";
  return undefined;
}

function reconcileCostTimingIssues(
  currentIssues: readonly ActionProjectionIssue[],
  costProfile: ActionCostProfile,
  timingProfile: ActionTimingProfile,
): ActionProjectionIssue[] {
  const issues = new Set(currentIssues);
  if (
    costProfile.costKnownStatus === "known" ||
    costProfile.costKnownStatus === "not_applicable"
  ) {
    issues.delete("cost_unknown");
  } else {
    issues.add("cost_unknown");
  }

  if (timingProfile.window !== undefined) {
    issues.delete("timing_unknown");
  } else {
    issues.add("timing_unknown");
  }
  return [...issues];
}

function updateCostTimingGates(
  hardGates: ActionGateResult[],
  costProfile: ActionCostProfile,
  timingProfile: ActionTimingProfile,
): ActionGateResult[] {
  return hardGates.map((gate) => {
    if (gate.gateId === "cost_known") {
      const costKnown =
        costProfile.costKnownStatus === "known" ||
        costProfile.costKnownStatus === "not_applicable";
      return {
        ...gate,
        status: costKnown ? "pass" : "unknown",
        severity: costKnown ? "info" : "warning",
        reason: `Cost status is ${costProfile.costKnownStatus}.`,
      };
    }
    if (gate.gateId === "timing_known") {
      const timingKnown = timingProfile.window !== undefined;
      return {
        ...gate,
        status: timingKnown ? "pass" : "unknown",
        severity: timingKnown ? "info" : "warning",
        reason: timingKnown
          ? `Timing point ${timingProfile.window} normalized.`
          : "Timing point unavailable.",
      };
    }
    return gate;
  });
}

function applyCardSemanticJoin(
  candidate: ActionSemanticCandidate,
  cardSemanticProfilesByCardId:
    | Readonly<Record<string, ActionCardSemanticProfile>>
    | undefined,
): ActionSemanticCandidate {
  if (cardSemanticProfilesByCardId === undefined) return candidate;
  if (candidate.sourceCardId === undefined) return candidate;

  const profile = cardSemanticProfilesByCardId[candidate.sourceCardId];
  if (profile === undefined) {
    return {
      ...candidate,
      projectionIssues: [
        ...new Set([
          ...candidate.projectionIssues,
          "card_semantics_unavailable" as const,
        ]),
      ],
      evidence: [...candidate.evidence, "AI041 card semantics unavailable"],
    };
  }

  const abilitySemantics = profile.abilitySemantics ?? [];
  const matchingAbility = candidate.abilityId
    ? abilitySemantics.find((ability) => ability.abilityId === candidate.abilityId)
    : undefined;
  const singleAbility =
    abilitySemantics.length === 1 ? abilitySemantics[0] : undefined;
  const actionAbility =
    matchingAbility ??
    (candidate.abilityBindingMethod === "single_legal_ability_inferred"
      ? singleAbility
      : undefined);
  const abilityUnresolved =
    abilitySemantics.length > 1 && actionAbility === undefined;
  const cardContextSignals = uniqueStrings([
    ...candidate.cardContextSignals,
    ...profile.tacticSignals,
  ]);
  const actionTacticSignals =
    actionAbility !== undefined
      ? uniqueStrings([
          ...candidate.actionTacticSignals,
          ...actionAbility.tacticSignals,
        ])
      : candidate.actionTacticSignals;
  const projectionIssues = new Set(candidate.projectionIssues);
  projectionIssues.delete("card_semantics_unavailable");
  if (abilityUnresolved) projectionIssues.add("ability_unresolved");
  if (actionAbility !== undefined) projectionIssues.delete("ability_unresolved");
  const joinedTargetContext = targetContextWithSemanticMatches(
    candidate.targetContext,
    actionAbility?.targetProfileMatches ?? profile.targetProfileMatches,
  );

  return {
    ...candidate,
    cardContextSignals,
    actionTacticSignals,
    strategySupport:
      actionAbility !== undefined
        ? [...candidate.strategySupport, ...(actionAbility.strategySupport ?? [])]
        : candidate.strategySupport,
    conditions:
      actionAbility !== undefined
        ? [...candidate.conditions, ...(actionAbility.conditions ?? [])]
        : candidate.conditions,
    risks:
      actionAbility !== undefined
        ? [...candidate.risks, ...(actionAbility.risks ?? [])]
        : candidate.risks,
    constraints:
      actionAbility !== undefined
        ? [...candidate.constraints, ...(actionAbility.constraints ?? [])]
        : candidate.constraints,
    ...(joinedTargetContext !== undefined
      ? { targetContext: joinedTargetContext }
      : {}),
    projectionIssues: [...projectionIssues],
    evidence: [
      ...candidate.evidence,
      `AI041 card semantic profile joined: ${profile.cardId}`,
      ...(actionAbility !== undefined
        ? [`AI041 ability semantic joined: ${actionAbility.abilityId}`]
        : []),
    ],
  };
}

function targetContextWithSemanticMatches(
  targetContext: ActionTargetContext | undefined,
  targetProfileMatches: readonly TargetProfileMatch[] | undefined,
): ActionTargetContext | undefined {
  if (targetContext === undefined || targetProfileMatches === undefined) {
    return targetContext;
  }
  return {
    ...targetContext,
    targetProfileMatches: [
      ...targetContext.targetProfileMatches,
      ...targetProfileMatches,
    ],
  };
}

function uniqueStrings(values: readonly string[]): string[] {
  return [...new Set(values)];
}
