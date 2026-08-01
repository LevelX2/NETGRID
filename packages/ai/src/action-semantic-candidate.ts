import type { CardDefinitionId, LegalAction } from "@netgrid/shared";
import { applyCardSemanticJoin } from "./actions/action-card-semantic-join";
import { applyCostAndTimingProfiles } from "./actions/action-cost-timing";
import { applyActionEconomyProjection } from "./actions/action-economy-projection";
import { applyActionCapacityProjection } from "./actions/action-capacity-projection";
import { applyCardActionSourceBinding } from "./actions/action-source-binding";
import { applyTagEffectSemantics } from "./actions/tag-effect-semantics";
import { applyTargetContextProjection } from "./actions/action-target-context";
import { applyConditionalDefenseFollowupQuote } from "./actions/conditional-defense-followup-quote";
import { applyBasicActionSemantics } from "./actions/basic-action-semantics";
import { applyRunAccessDecisionModel } from "./actions/run-access-decision-model";
import { applyRandomBadPublicityModel } from "./actions/random-bad-publicity-model";
import { applyHiddenResourceVirusModel } from "./actions/hidden-resource-virus-model";
import { applyRunnerHazardCounterSemantics } from "./actions/runner-hazard-counter-semantics";
import { applyCardImplementationEffectSemantics } from "./actions/card-implementation-effect-semantics";
import type {
  ActionSemanticVisibilityScope,
  ActionGateResult,
  LegalTargetSummary,
  BoardContextSummary,
  ActionSemanticCandidate,
  BuildActionSemanticCandidatesParams,
  BuildNeutralActionSemanticCandidateOptions,
  SideSafeActionAbilityBinding,
  ActionCardSemanticProfile,
} from "./action-semantic-candidate-types";

export type {
  ActionSemanticVisibilityScope,
  ActionSemanticSourceKind,
  ActionAbilityBindingMethod,
  ActionSemanticConfidence,
  ActionPrimaryProjectionStatus,
  ActionProjectionIssue,
  ActionGateId,
  ActionGateResult,
  StrategySupportPair,
  SemanticCondition,
  SemanticRisk,
  SemanticConstraint,
  DamageAmount,
  ActionCostProfile,
  ActionEconomyKind,
  ActionEconomyProjectionSource,
  ActionEconomyProjection,
  ActionCapacityKind,
  ActionCapacityRestriction,
  ActionCapacityProjectionSource,
  ActionCapacityProjection,
  ActionTimingProfile,
  LegalTarget,
  LegalTargetSummary,
  TargetProfileMatch,
  ConstraintResult,
  ActionTargetContext,
  ActionRunProjectionSummary,
  RunAccessModifierKind,
  RunAccessRiskKind,
  RunAccessPayoffKind,
  ActionRunAccessDecisionModel,
  ActionRandomOutcomeModel,
  ActionBadPublicityDecisionModel,
  ActionRandomBadPublicityModel,
  ActionHiddenResourceModel,
  ActionVirusCounterModel,
  ActionHiddenResourceVirusModel,
  ActionTagEffectProfile,
  ConditionalDefenseFollowupQuote,
  BoardContextSummary,
  ActionSemanticCandidate,
  BuildActionSemanticCandidatesParams,
  BuildNeutralActionSemanticCandidateOptions,
  SideSafeActionAbilityBinding,
  ActionCardAbilitySemanticProfile,
  ActionCardSemanticProfile,
} from "./action-semantic-candidate-types";

export const ACTION_SEMANTIC_CANDIDATE_SCHEMA_VERSION =
  "action-semantic-candidate-v1" as const;

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
  const economyCandidate = applyActionEconomyProjection(
    costTimingCandidate,
    action,
  );
  const actionCapacityCandidate = applyActionCapacityProjection(
    economyCandidate,
    action,
  );
  const conditionalDefenseCandidate = applyConditionalDefenseFollowupQuote(
    actionCapacityCandidate,
    action,
  );
  const tagEffectCandidate = applyTagEffectSemantics(
    conditionalDefenseCandidate,
    action,
  );
  const traceCounterCandidate = applyRunnerHazardCounterSemantics(
    tagEffectCandidate,
    action,
  );
  const implementationEffectCandidate =
    applyCardImplementationEffectSemantics(traceCounterCandidate, action);
  const cardSemanticCandidate = applyCardSemanticJoin(
    implementationEffectCandidate,
    cardSemanticProfilesByDefinitionId,
  );
  const runAccessCandidate = applyRunAccessDecisionModel(
    cardSemanticCandidate,
    action,
  );
  const randomBadPublicityCandidate = applyRandomBadPublicityModel(
    runAccessCandidate,
    action,
  );
  return applyHiddenResourceVirusModel(randomBadPublicityCandidate, action);
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
