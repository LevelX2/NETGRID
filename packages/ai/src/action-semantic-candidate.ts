import type {
  CardDefinitionId,
  CardInstanceId,
  LegalAction,
} from "@netgrid/shared";
import { applyCardSemanticJoin } from "./actions/action-card-semantic-join";
import { applyCostAndTimingProfiles } from "./actions/action-cost-timing";
import { applyCardActionSourceBinding } from "./actions/action-source-binding";
import { applyTagEffectSemantics } from "./actions/tag-effect-semantics";
import { applyTargetContextProjection } from "./actions/action-target-context";
import { applyBasicActionSemantics } from "./actions/basic-action-semantics";
import { applyRunAccessDecisionModel } from "./actions/run-access-decision-model";

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
  temporaryCredits?: {
    budget?: number;
    provided?: number;
    spent?: number;
    remaining?: number;
    returned?: number;
  };
  tapCost?: boolean;
  revealCost?: boolean;
  forfeitAgenda?: boolean;
  selfDamage?: DamageAmount[];
  selfTag?: number;
  discardCost?: number;
  xValue?: number | "choice" | "unknown";
  paidBy?: "runner" | "corp" | "unknown";
  beneficiary?: "runner" | "corp" | "none" | "unknown";
  costKnownStatus: "known" | "partial" | "unknown" | "not_applicable";
  variableCost?: {
    kind:
      | "x"
      | "trace_boost"
      | "trash_cost"
      | "rez_cost"
      | "choice"
      | "unknown";
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
  targetKind:
    | "card"
    | "server"
    | "ice"
    | "program"
    | "resource"
    | "hardware"
    | "agenda"
    | "choice"
    | "subroutine"
    | "unknown";
  targetSide: "runner" | "corp" | "both" | "unknown";
  targetZone?: string;
  targetDefinitionId?: string;
  targetTitle?: string;
  targetSubtypes?: string[];
  targetConstraints?: string[];
  visibilityScope: ActionSemanticVisibilityScope;
  evidence: string[];
};

export type LegalTargetSummary = {
  targetId: string;
  targetKind: LegalTarget["targetKind"];
  targetSide: LegalTarget["targetSide"];
  targetZone?: string;
  targetDefinitionId?: string;
  targetTitle?: string;
  targetSubtypes?: string[];
  targetConstraints?: string[];
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
    | "subroutine"
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

export type ActionRunProjectionSummary = {
  serverId?: string;
  serverKind?: "hq" | "rd" | "archives" | "remote";
  source: "legal_action_payload" | "target_context" | "run_action_projection";
  evidence: string[];
};

export type RunAccessModifierKind =
  | "bypass_ice"
  | "additional_subroutines"
  | "redirect_run"
  | "access_replacement"
  | "post_run_followup"
  | "forced_run_end";

export type RunAccessRiskKind =
  | "ambush"
  | "damage"
  | "tag"
  | "program_disruption"
  | "steal_tax"
  | "access_reduction";

export type RunAccessPayoffKind =
  | "additional_access"
  | "free_trash"
  | "ice_trash"
  | "information";

export type ActionRunAccessDecisionModel = {
  schemaVersion: "run-access-decision-model-v1";
  coverageStatus: "covered" | "partial" | "blocked";
  serverId?: string;
  modifiers: RunAccessModifierKind[];
  accessRisks: RunAccessRiskKind[];
  payoffs: RunAccessPayoffKind[];
  unknownRemoteIdentityPreserved: true;
  hiddenInfoPolicy: "side_safe_visible_only";
  whyNot: string[];
  evidence: string[];
};

export type ActionTagEffectProfile = {
  kind: "remove_tags" | "avoid_tag" | "avoid_next_tag" | "tag_clear_support";
  recipient: "runner";
  mode?: "amount" | "up_to_amount" | "all" | "support_only";
  amount?: number | "all" | "unknown";
  currentTagReduction?: number | "all" | "unknown";
  acuteTagRemoval: boolean;
  source:
    | "legal_action_type"
    | "legal_action_payload"
    | "card_implementation"
    | "ai_hint";
  evidence: string[];
};

export type BoardContextSummary = {
  source: "ai_decision_input" | "player_view" | "not_projected";
  sideSafe: boolean;
  stateVersion?: number;
  timingPoint?: string;
  notes: string[];
};

/**
 * @aiProjection Read-only descriptor for an Engine-provided LegalAction.
 * @authority Candidates must not influence legality or create actions; they can
 * only explain or rank actions that already exist.
 * @visibility Fields must be built from the observer's side-safe projection and
 * hidden-info barriers must remain explicit.
 */
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
  /**
   * Legacy-compatible alias for the action source card. New semantic joins must
   * use sourceDefinitionId for card profiles and sourceCardInstanceId for
   * instance identity.
   */
  sourceCardId?: CardInstanceId | CardDefinitionId;
  sourceCardInstanceId?: CardInstanceId;
  sourceDefinitionId?: CardDefinitionId;
  abilityId?: string;
  abilityKey?: string;
  primitiveKind?: string;
  effectKind?: string;
  abilityBindingMethod: ActionAbilityBindingMethod;
  semanticActionType: string;
  cardContextSignals: string[];
  actionTacticSignals: string[];
  compatibilitySignals?: string[];
  strategySupport: StrategySupportPair[];
  conditions: SemanticCondition[];
  risks: SemanticRisk[];
  constraints: SemanticConstraint[];
  costProfile: ActionCostProfile;
  timingProfile: ActionTimingProfile;
  targetContext?: ActionTargetContext;
  runProjectionSummary?: ActionRunProjectionSummary;
  runAccessDecisionModel?: ActionRunAccessDecisionModel;
  tagEffectProfile?: ActionTagEffectProfile;
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
  visibleSourceDefinitionsByInstanceId?: Readonly<
    Record<CardInstanceId, CardDefinitionId>
  >;
  selectedTargetsByActionId?: Readonly<
    Record<string, Readonly<Record<string, string>>>
  >;
  availableTargetsByActionId?: Readonly<
    Record<string, readonly LegalTargetSummary[]>
  >;
  cardSemanticProfilesByDefinitionId?: Readonly<
    Record<CardDefinitionId, ActionCardSemanticProfile>
  >;
  /**
   * Deprecated compatibility alias for older callers. It is interpreted as a
   * definition-id keyed map and must not be populated from hidden instance ids.
   */
  cardSemanticProfilesByCardId?: Readonly<
    Record<CardDefinitionId, ActionCardSemanticProfile>
  >;
};

export type BuildNeutralActionSemanticCandidateOptions = {
  observerSide?: "runner" | "corp" | "system";
  stateVersion?: number;
};

export type SideSafeActionAbilityBinding = {
  actionId: string;
  sourceCardInstanceId?: CardInstanceId;
  /**
   * Legacy-compatible alias for sourceCardInstanceId.
   */
  sourceCardId: CardInstanceId;
  sourceDefinitionId?: CardDefinitionId;
  abilityId: string;
  method: "single_legal_ability_inferred";
  evidence: string[];
};

export type ActionCardAbilitySemanticProfile = {
  abilityId: string;
  tacticSignals: readonly string[];
  compatibilitySignals?: readonly string[];
  strategySupport?: readonly StrategySupportPair[];
  conditions?: readonly SemanticCondition[];
  risks?: readonly SemanticRisk[];
  constraints?: readonly SemanticConstraint[];
  additionalCosts?: readonly string[];
  targetProfileMatches?: readonly TargetProfileMatch[];
};

export type ActionCardSemanticProfile = {
  cardId: CardDefinitionId;
  tacticSignals: readonly string[];
  compatibilitySignals?: readonly string[];
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
      params.visibleSourceDefinitionsByInstanceId,
      params.selectedTargetsByActionId?.[action.actionId],
      params.availableTargetsByActionId?.[action.actionId],
      params.cardSemanticProfilesByDefinitionId ??
        params.cardSemanticProfilesByCardId,
    ),
  );
}

function projectActionSemanticCandidate(
  action: LegalAction,
  projectionMode: "neutral_only" | "basic_semantics",
  options: BuildNeutralActionSemanticCandidateOptions,
  sideSafeAbilityBindings: readonly SideSafeActionAbilityBinding[],
  visibleSourceDefinitionsByInstanceId:
    | Readonly<Record<string, CardDefinitionId>>
    | undefined,
  selectedTargets: Readonly<Record<string, string>> | undefined,
  availableTargets: readonly LegalTargetSummary[] | undefined,
  cardSemanticProfilesByDefinitionId:
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
    visibleSourceDefinitionsByInstanceId,
  );
  const targetCandidate = applyTargetContextProjection(
    sourceBoundCandidate,
    action,
    selectedTargets,
    availableTargets,
  );
  const costTimingCandidate = applyCostAndTimingProfiles(
    targetCandidate,
    action,
  );
  const tagEffectCandidate = applyTagEffectSemantics(
    costTimingCandidate,
    action,
  );
  const cardSemanticCandidate = applyCardSemanticJoin(
    tagEffectCandidate,
    cardSemanticProfilesByDefinitionId,
  );
  return applyRunAccessDecisionModel(cardSemanticCandidate, action);
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
    boardContext: boardContextForAction(action, options, originalPayloadKeys),
    confidence: "none",
    primaryProjectionStatus: "neutral_projected",
    projectionIssues: [],
    hardGates: neutralHardGates(action),
    evidence: ["AI036 neutral projection", "source: LegalAction only"],
  };
}

function boardContextForAction(
  action: LegalAction,
  options: BuildNeutralActionSemanticCandidateOptions,
  originalPayloadKeys: readonly string[],
): BoardContextSummary {
  const hasDecisionContext =
    options.observerSide !== undefined || options.stateVersion !== undefined;
  return {
    source: hasDecisionContext ? "ai_decision_input" : "not_projected",
    sideSafe: true,
    ...(options.stateVersion !== undefined
      ? { stateVersion: options.stateVersion }
      : {}),
    timingPoint: action.timingPoint,
    notes: [
      hasDecisionContext
        ? "AI036 side-safe decision context projection"
        : "AI036 neutral projection only",
      `action_side:${action.side}`,
      `action_visibility:${action.visibility}`,
      `payload_keys:${originalPayloadKeys.length > 0 ? originalPayloadKeys.join(",") : "none"}`,
      `target_requirement_count:${action.targetRequirements.length}`,
      `choice_requirement_count:${action.choiceRequirements?.length ?? 0}`,
    ],
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
      reason:
        "No full game state, hidden zone or private opponent data is read.",
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
