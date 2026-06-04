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
};

export type BuildNeutralActionSemanticCandidateOptions = {
  observerSide?: "runner" | "corp" | "system";
  stateVersion?: number;
};

export function buildActionSemanticCandidates(
  params: BuildActionSemanticCandidatesParams,
): ActionSemanticCandidate[] {
  const projectionMode = params.projectionMode ?? "basic_semantics";
  return params.legalActions.map((action) =>
    projectActionSemanticCandidate(action, projectionMode, {
      ...(params.observerSide !== undefined
        ? { observerSide: params.observerSide }
        : {}),
      ...(params.stateVersion !== undefined
        ? { stateVersion: params.stateVersion }
        : {}),
    }),
  );
}

function projectActionSemanticCandidate(
  action: LegalAction,
  projectionMode: "neutral_only" | "basic_semantics",
  options: BuildNeutralActionSemanticCandidateOptions,
): ActionSemanticCandidate {
  const neutralCandidate = buildNeutralActionSemanticCandidate(action, options);
  if (projectionMode === "neutral_only") return neutralCandidate;
  return applyBasicActionSemantics(neutralCandidate, action);
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
      reason: "No GameState, hidden zone or private opponent data is read.",
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
