import type { AiDecisionInput, RulesBaseline, Side } from "@netgrid/shared";
import { createCurrentCardRegistryRulesContext } from "@netgrid/engine";
import {
  assertCardRegistryPlanningContext,
  assertCardRegistryRulesContext,
  type CardRegistryRulesContext,
  createPlanningRegistryContext,
  type CardRegistryPlanningContext,
} from "@netgrid/cards/planning";

import { fnv1a } from "../runtime/stable-hash";
import type { PriorityClass } from "./plan-assessment";
import type {
  PlanConditionRef,
  PlanModuleId,
  PlanTargetRef,
} from "./plan-kernel-types";

export const TURN_PLANNING_CONTRACT_SCHEMA_VERSION =
  "turn-planning-contract-v1" as const;
export const TURN_PLANNING_POLICY_VERSION = "turn-planning-policy-v1" as const;
export const TURN_ACTION_SEMANTIC_SCHEMA_VERSION =
  "turn-action-semantic-v1" as const;
export const TURN_PLAN_MODULE_SET_FINGERPRINT =
  "turn-plan-module-set-v1" as const;
export const TURN_PLAN_EVALUATION_REGISTRY_VERSION =
  "turn-plan-evaluation-registry-v1" as const;
export const CAMPAIGN_VALUE_POLICY_VERSION =
  "campaign-value-policy-v1" as const;

export type PlanningRulesContext = {
  schemaVersion: typeof TURN_PLANNING_CONTRACT_SCHEMA_VERSION;
  rulesBaseline: Omit<
    RulesBaseline,
    | "engineSchemaVersion"
    | "cardImplementationVersion"
    | "cardTextSource"
    | "cardTextSnapshotId"
  >;
  formatProfileId: string;
  lineEvaluationRegistryVersion: typeof TURN_PLAN_EVALUATION_REGISTRY_VERSION;
  campaignValuePolicyVersion: typeof CAMPAIGN_VALUE_POLICY_VERSION;
  cardRegistryRulesContext: CardRegistryRulesContext;
  cardRegistryContext: CardRegistryPlanningContext;
  fingerprint: string;
};

/**
 * Planner identity is derived exclusively from the actor-safe AI input.
 * A full GameState hash is intentionally not part of this contract.
 */
export type PlanningStateIdentity = {
  stateVersion: number;
  sideSafePlanningFingerprint: string;
};

export type ChoicePlanningRole =
  | "route_defining"
  | "resolution_only"
  | "observation_boundary";

export type BoundTargetSlot = {
  slotId: string;
  values: PlanTargetRef[];
  ordering: "single" | "ordered" | "unordered";
};

export type CanonicalChoiceValue =
  | { kind: "boolean"; value: boolean }
  | { kind: "number"; value: number }
  | { kind: "string"; value: string }
  | { kind: "target"; value: PlanTargetRef }
  | {
      kind: "target_list";
      values: PlanTargetRef[];
      ordering: "ordered" | "unordered";
    };

export type CanonicalChoiceBinding = {
  choiceId: string;
  role: ChoicePlanningRole;
  value: CanonicalChoiceValue;
};

/**
 * Semantic invocation for a current or future step. Future invocations never
 * carry an actionId. A current actionId lives only in CurrentLegalActionBinding.
 */
export type CanonicalLegalActionInvocation = {
  semanticActionType: string;
  sourceCardInstanceId?: string;
  sourceAbilityId?: string;
  boundTargets: BoundTargetSlot[];
  boundChoices: CanonicalChoiceBinding[];
  invocationKey: string;
};

export type CurrentLegalActionBinding = {
  actionId: string;
  stateVersion: number;
  semanticActionSetFingerprint: string;
  invocationKey: string;
};

export type ExecutableWitness = {
  stateVersion: number;
  sideSafePlanningFingerprint: string;
  semanticActionSetFingerprint: string;
  stepFingerprint: string;
  invocationKey: string;
  quoteIds: string[];
  safetyPolicyVersion: string;
  allRouteDefiningChoicesBound: boolean;
};

export type PlanModuleHorizonCapability =
  | "current_turn_only"
  | "campaign_capable"
  | "context_dependent";

export type CampaignQuoteBasis =
  | {
      kind: "actual_state";
      stateVersion: number;
      sideSafePlanningFingerprint: string;
    }
  | {
      kind: "projected_frame";
      baseStateVersion: number;
      projectedFrameKey: string;
      linePrefixHash: string;
    };

export type CampaignMilestoneQuote = {
  quoteId: string;
  campaignId: string;
  quoteVersion: string;
  basis: CampaignQuoteBasis;
  currentMilestoneId: string;
  nextMilestoneId: string;
  commitment: "hard" | "soft";
  remainingValue: number;
  expiresAt: "current_turn_end" | "next_own_turn" | "condition";
  revalidationCodes: string[];
};

export type CampaignValueClaimAggregation =
  | "exclusive"
  | "replace"
  | "maximum"
  | "bounded_sum"
  | "delta_from_previous_prefix";

export type CampaignValueClaim = {
  claimId: string;
  campaignId: string;
  ownerModuleId: PlanModuleId;
  objectiveKey: string;
  componentKey: string;
  evaluationDimensionId: string;
  aggregationMode: CampaignValueClaimAggregation;
  contributionKind:
    | "objective_payoff"
    | "risk_reduction"
    | "funding_gap_reduction"
    | "option_preservation"
    | "tempo_delta"
    | "future_flexibility";
  beforeQuoteId: string;
  afterQuoteId: string;
  amount: number;
  dependencyKeys: string[];
  conflictKeys: string[];
  status: "quoted" | "reserved" | "consumed" | "released";
  consumedAtMilestoneId?: string;
};

export type TurnPlanningHeadCandidate = {
  candidateId: string;
  side: Side;
  moduleId: PlanModuleId;
  rootPlanInstanceId: string;
  rootPlanModuleId?: PlanModuleId;
  executorPlanInstanceId?: string;
  executorParentPlanInstanceId?: string;
  executorParentNeedId?: string;
  nextMilestoneId: string;
  stepFingerprint: string;
  horizonCapability: PlanModuleHorizonCapability;
  instanceHorizon: "current_turn" | "multi_turn";
  priorityClass: PriorityClass;
  invocation: CanonicalLegalActionInvocation;
  currentBinding: CurrentLegalActionBinding;
  executableWitness: ExecutableWitness;
  campaignQuote?: CampaignMilestoneQuote;
  evaluationValues: Record<string, number>;
  valueClaims: CampaignValueClaim[];
  evidenceCodes: string[];
};

export type TurnPlanEvaluationDimension = {
  dimensionId: string;
  direction: "maximize" | "minimize";
  scope: "global";
  valueKind: "bounded_utility" | "count" | "probability";
};

export type TurnPlanEvaluationRegistry = {
  version: typeof TURN_PLAN_EVALUATION_REGISTRY_VERSION;
  dimensions: TurnPlanEvaluationDimension[];
};

/**
 * P1-P3 are validated obligations and deliberately not numerical dimensions.
 * Only P4-P6 line-quality dimensions are aggregated here.
 */
export const TURN_PLAN_EVALUATION_REGISTRY: TurnPlanEvaluationRegistry = {
  version: TURN_PLAN_EVALUATION_REGISTRY_VERSION,
  dimensions: [
    {
      dimensionId: "terminal_outcome",
      direction: "maximize",
      scope: "global",
      valueKind: "bounded_utility",
    },
    {
      dimensionId: "agenda_progress",
      direction: "maximize",
      scope: "global",
      valueKind: "bounded_utility",
    },
    {
      dimensionId: "defense",
      direction: "maximize",
      scope: "global",
      valueKind: "bounded_utility",
    },
    {
      dimensionId: "economy",
      direction: "maximize",
      scope: "global",
      valueKind: "bounded_utility",
    },
    {
      dimensionId: "hand_quality",
      direction: "maximize",
      scope: "global",
      valueKind: "bounded_utility",
    },
    {
      dimensionId: "flexibility",
      direction: "maximize",
      scope: "global",
      valueKind: "bounded_utility",
    },
    {
      dimensionId: "continuity",
      direction: "maximize",
      scope: "global",
      valueKind: "bounded_utility",
    },
    {
      dimensionId: "risk",
      direction: "minimize",
      scope: "global",
      valueKind: "probability",
    },
  ],
};

export type TurnPlanBoundary =
  | "private_observation"
  | "public_random_outcome"
  | "opponent_response_window"
  | "engine_continuation"
  | "projection_not_supported";

export type TurnPlanNode = {
  nodeId: string;
  invocation: CanonicalLegalActionInvocation;
  executionBinding?: CurrentLegalActionBinding;
  expectedStateDeltaCodes: string[];
  boundaryAfter?: TurnPlanBoundary;
};

export type TurnPlanPhaseTransition =
  | {
      kind: "next_bound_phase";
      nextPhaseId: string;
      reasonCode: string;
      resourceHandoffIds: string[];
    }
  | { kind: "turn_end" }
  | { kind: "observation_boundary" }
  | { kind: "projected_plan_discovery_required" };

export type TurnPlanPhase = {
  phaseId: string;
  root: {
    planInstanceId: string;
    moduleId: PlanModuleId;
    milestoneId: string;
    provenance: "resident" | "admitted_child" | "admitted_support";
  };
  hardPlanCommitmentId?: string;
  rootAssessmentFingerprint: string;
  entryFrameKey: string;
  entryConditions: PlanConditionRef[];
  completionCondition: PlanConditionRef;
  supportLeaves: Array<{
    planInstanceId: string;
    moduleId: PlanModuleId;
    parentNeedId: string;
    assignmentId: string;
  }>;
  nodes: TurnPlanNode[];
  protectedValueClaimIds: string[];
  transition: TurnPlanPhaseTransition;
};

export type ValidatedPriorityObligation = {
  obligationId: string;
  priorityClass: Extract<PriorityClass, "P1" | "P2" | "P3">;
  sourcePlanInstanceId?: string;
  sourceSignalId?: string;
  activatedAtFrameKey: string;
  deadline: string;
  satisfactionCondition: PlanConditionRef;
  deferrable: boolean;
  deferUntil?: string;
  witnessId: string;
  guarantee: "guaranteed" | "bounded" | "uncertain";
};

export type PriorityCoverage = {
  requiredObligationIds: string[];
  satisfiedObligationIds: string[];
  violatedObligationIds: string[];
  deferredObligationIds: string[];
};

export type TurnPlan = {
  schemaVersion: typeof TURN_PLANNING_CONTRACT_SCHEMA_VERSION;
  planId: string;
  side: Side;
  turnKey: string;
  stateIdentity: PlanningStateIdentity;
  planningRulesFingerprint: string;
  evaluationRegistryVersion: typeof TURN_PLAN_EVALUATION_REGISTRY_VERSION;
  phases: TurnPlanPhase[];
  cursor: {
    phaseIndex: number;
    nodeIndex: number;
  };
  priorityObligations: ValidatedPriorityObligation[];
  priorityCoverage: PriorityCoverage;
  campaignValueClaims: CampaignValueClaim[];
};

export const PLAN_COMMITMENT_PRECEDENCE = [
  "engine",
  "hard_plan_commitment",
  "turn_plan_commitment",
  "persistence_hysteresis",
] as const;

export type PlanCommitmentPrecedence =
  (typeof PLAN_COMMITMENT_PRECEDENCE)[number];

export class TurnPlanningContractError extends Error {
  constructor(
    readonly code: string,
    readonly issues: string[],
  ) {
    super(`${code}:${[...new Set(issues)].sort().join(",")}`);
    this.name = "TurnPlanningContractError";
  }
}

export function buildPlanningRulesContext(params: {
  rulesBaseline: RulesBaseline;
  formatProfileId: string;
  cardPoolSnapshotId: string;
}): PlanningRulesContext {
  const cardRegistryRulesContext = createCurrentCardRegistryRulesContext({
    cardPoolSnapshotId: params.cardPoolSnapshotId,
    // CS06 replaces this empty migration boundary with the resolved format IDs.
    matchCardPoolDefinitionIds: [],
  });
  if (
    params.rulesBaseline.engineSchemaVersion !==
      cardRegistryRulesContext.engineSchemaVersion ||
    params.rulesBaseline.cardImplementationVersion !==
      cardRegistryRulesContext.cardImplementationVersion
  )
    throw new TurnPlanningContractError("rules_baseline_registry_mismatch", [
      "engine_or_card_implementation_version",
    ]);
  const cardRegistryContext = createPlanningRegistryContext(
    cardRegistryRulesContext,
    {
      plannerPolicyVersion: TURN_PLANNING_POLICY_VERSION,
      actionSemanticSchemaVersion: TURN_ACTION_SEMANTIC_SCHEMA_VERSION,
      planModuleSetFingerprint: TURN_PLAN_MODULE_SET_FINGERPRINT,
    },
  );
  const {
    engineSchemaVersion: _engineSchemaVersion,
    cardImplementationVersion: _cardImplementationVersion,
    cardTextSource: _cardTextSource,
    cardTextSnapshotId: _cardTextSnapshotId,
    ...rulesBaseline
  } = params.rulesBaseline;
  const contextWithoutFingerprint = {
    schemaVersion: TURN_PLANNING_CONTRACT_SCHEMA_VERSION,
    rulesBaseline: structuredClone(rulesBaseline),
    formatProfileId: params.formatProfileId,
    lineEvaluationRegistryVersion: TURN_PLAN_EVALUATION_REGISTRY_VERSION,
    campaignValuePolicyVersion: CAMPAIGN_VALUE_POLICY_VERSION,
    cardRegistryRulesContext,
    cardRegistryContext,
  } satisfies Omit<PlanningRulesContext, "fingerprint">;
  const context: PlanningRulesContext = {
    ...contextWithoutFingerprint,
    fingerprint: turnPlanningFingerprint(
      "planning-rules",
      contextWithoutFingerprint,
    ),
  };
  assertPlanningRulesContext(context);
  return context;
}

export function buildPlanningStateIdentity(
  input: Pick<
    AiDecisionInput,
    "side" | "playerView" | "eventTail" | "legalActions"
  >,
): PlanningStateIdentity {
  const stateVersion = input.playerView.stateVersion;
  const actionSemantics = canonicalLegalActionSemantics(input.legalActions);
  const {
    stateVersion: _stateVersion,
    legalActions: _playerViewLegalActions,
    ...planningView
  } = input.playerView;
  return {
    stateVersion,
    sideSafePlanningFingerprint: turnPlanningFingerprint("planning-state", {
      side: input.side,
      playerView: omitActionIds(planningView),
      eventTail: omitActionIds(input.eventTail),
      actionSemantics,
    }),
  };
}

export function buildSemanticActionSetFingerprint(
  legalActions: AiDecisionInput["legalActions"],
): string {
  return turnPlanningFingerprint(
    "semantic-action-set",
    canonicalLegalActionSemantics(legalActions),
  );
}

export function buildCanonicalLegalActionInvocation(params: {
  stateIdentity: PlanningStateIdentity;
  semanticActionType: string;
  sourceCardInstanceId?: string;
  sourceAbilityId?: string;
  boundTargets?: BoundTargetSlot[];
  boundChoices?: CanonicalChoiceBinding[];
}): CanonicalLegalActionInvocation {
  const canonicalTargets = canonicalTargetSlots(params.boundTargets ?? []);
  const canonicalChoices = canonicalChoiceBindings(params.boundChoices ?? []);
  const route = {
    semanticActionType: params.semanticActionType,
    ...(params.sourceCardInstanceId
      ? { sourceCardInstanceId: params.sourceCardInstanceId }
      : {}),
    ...(params.sourceAbilityId
      ? { sourceAbilityId: params.sourceAbilityId }
      : {}),
    boundTargets: canonicalTargets,
    boundChoices: canonicalChoices,
  };
  const invocation = {
    ...route,
    invocationKey: turnPlanningFingerprint("invocation", {
      sideSafePlanningFingerprint:
        params.stateIdentity.sideSafePlanningFingerprint,
      route,
    }),
  };
  assertCanonicalLegalActionInvocation(invocation, params.stateIdentity);
  return invocation;
}

export function assertPlanningRulesContext(
  context: PlanningRulesContext,
): void {
  const issues: string[] = [];
  let nestedContextsValid = true;
  try {
    assertCardRegistryRulesContext(context.cardRegistryRulesContext);
    assertCardRegistryPlanningContext(context.cardRegistryContext);
  } catch {
    issues.push("card_registry_context_invalid");
    nestedContextsValid = false;
  }
  if (nestedContextsValid) {
    const expectedRulesContext = createCurrentCardRegistryRulesContext({
      cardPoolSnapshotId: context.cardRegistryRulesContext.cardPoolSnapshotId,
      matchCardPoolDefinitionIds:
        context.cardRegistryRulesContext.matchCardDefinitionIds,
    });
    if (
      expectedRulesContext.fingerprint !==
        context.cardRegistryRulesContext.fingerprint ||
      context.cardRegistryContext.rulesContextFingerprint !==
        context.cardRegistryRulesContext.fingerprint
    )
      issues.push("card_registry_rules_context_mismatch");
    if (
      context.cardRegistryContext.plannerPolicyVersion !==
        TURN_PLANNING_POLICY_VERSION ||
      context.cardRegistryContext.actionSemanticSchemaVersion !==
        TURN_ACTION_SEMANTIC_SCHEMA_VERSION ||
      context.cardRegistryContext.planModuleSetFingerprint !==
        TURN_PLAN_MODULE_SET_FINGERPRINT
    )
      issues.push("card_registry_planning_versions_mismatch");
  }
  if (context.schemaVersion !== TURN_PLANNING_CONTRACT_SCHEMA_VERSION) {
    issues.push("schema_version_mismatch");
  }
  if (
    context.lineEvaluationRegistryVersion !==
    TURN_PLAN_EVALUATION_REGISTRY_VERSION
  ) {
    issues.push("evaluation_registry_version_mismatch");
  }
  if (context.campaignValuePolicyVersion !== CAMPAIGN_VALUE_POLICY_VERSION) {
    issues.push("campaign_value_policy_mismatch");
  }
  const { fingerprint: _fingerprint, ...fingerprintInput } = context;
  if (
    context.fingerprint !==
    turnPlanningFingerprint("planning-rules", fingerprintInput)
  ) {
    issues.push("rules_fingerprint_mismatch");
  }
  requireNoIssues("invalid_planning_rules_context", issues);
}

export function assertCanonicalLegalActionInvocation(
  invocation: CanonicalLegalActionInvocation,
  stateIdentity?: PlanningStateIdentity,
): void {
  const issues: string[] = [];
  if (blank(invocation.semanticActionType)) {
    issues.push("blank_semantic_action_type");
  }
  if (containsForbiddenActionId(invocation)) {
    issues.push("future_action_id_forbidden");
  }
  const slotIds = new Set<string>();
  for (const slot of invocation.boundTargets) {
    if (blank(slot.slotId)) issues.push("blank_target_slot");
    if (slotIds.has(slot.slotId)) issues.push("duplicate_target_slot");
    slotIds.add(slot.slotId);
    if (slot.ordering === "single" && slot.values.length !== 1) {
      issues.push("single_target_slot_wrong_arity");
    }
    validateTargetList(slot.values, issues);
  }
  const choiceIds = new Set<string>();
  for (const choice of invocation.boundChoices) {
    if (blank(choice.choiceId)) issues.push("blank_choice_id");
    if (choiceIds.has(choice.choiceId)) issues.push("duplicate_choice");
    choiceIds.add(choice.choiceId);
    validateChoiceValue(choice.value, issues);
  }
  if (stateIdentity) {
    if (
      !nonNegativeInteger(stateIdentity.stateVersion) ||
      blank(stateIdentity.sideSafePlanningFingerprint)
    ) {
      issues.push("invalid_planning_state_identity");
    }
    const { invocationKey: _invocationKey, ...route } = invocation;
    const expectedKey = turnPlanningFingerprint("invocation", {
      sideSafePlanningFingerprint: stateIdentity.sideSafePlanningFingerprint,
      route: {
        ...route,
        boundTargets: canonicalTargetSlots(route.boundTargets),
        boundChoices: canonicalChoiceBindings(route.boundChoices),
      },
    });
    if (invocation.invocationKey !== expectedKey) {
      issues.push("invocation_key_mismatch");
    }
  }
  requireNoIssues("invalid_canonical_invocation", issues);
}

export function assertCurrentLegalActionBinding(
  binding: CurrentLegalActionBinding,
  invocation: CanonicalLegalActionInvocation,
  stateIdentity: PlanningStateIdentity,
): void {
  const issues: string[] = [];
  if (blank(binding.actionId)) issues.push("blank_action_id");
  if (binding.stateVersion !== stateIdentity.stateVersion) {
    issues.push("binding_state_version_mismatch");
  }
  if (blank(binding.semanticActionSetFingerprint)) {
    issues.push("blank_semantic_action_set_fingerprint");
  }
  if (binding.invocationKey !== invocation.invocationKey) {
    issues.push("binding_invocation_mismatch");
  }
  requireNoIssues("invalid_current_legal_action_binding", issues);
}

export function assertTurnPlanningHeadCandidate(
  candidate: TurnPlanningHeadCandidate,
  stateIdentity: PlanningStateIdentity,
  registry: TurnPlanEvaluationRegistry = TURN_PLAN_EVALUATION_REGISTRY,
): void {
  const issues: string[] = [];
  if (blank(candidate.candidateId)) issues.push("blank_candidate_id");
  if (blank(candidate.rootPlanInstanceId)) {
    issues.push("blank_root_plan_instance_id");
  }
  if (blank(candidate.nextMilestoneId)) issues.push("blank_next_milestone_id");
  if (blank(candidate.stepFingerprint)) issues.push("blank_step_fingerprint");
  if (!candidate.moduleId.startsWith(`${candidate.side}.`)) {
    issues.push("module_side_mismatch");
  }
  if (
    candidate.instanceHorizon === "multi_turn" &&
    candidate.horizonCapability === "current_turn_only"
  ) {
    issues.push("current_turn_module_claims_campaign");
  }
  if (
    candidate.instanceHorizon === "multi_turn" &&
    candidate.campaignQuote === undefined
  ) {
    issues.push("multi_turn_instance_without_campaign_quote");
  }
  if (
    candidate.instanceHorizon === "current_turn" &&
    candidate.campaignQuote !== undefined
  ) {
    issues.push("current_turn_instance_with_campaign_quote");
  }
  if (candidate.campaignQuote) {
    validateCampaignQuote(candidate.campaignQuote, stateIdentity, issues);
  }
  try {
    assertCanonicalLegalActionInvocation(candidate.invocation, stateIdentity);
    assertCurrentLegalActionBinding(
      candidate.currentBinding,
      candidate.invocation,
      stateIdentity,
    );
  } catch (error) {
    collectContractIssues(issues, error);
  }
  validateExecutableWitness(candidate, stateIdentity, issues);
  const dimensionIds = registryDimensionIds(registry);
  for (const [dimensionId, value] of Object.entries(
    candidate.evaluationValues,
  )) {
    if (!dimensionIds.has(dimensionId)) {
      issues.push(`unknown_evaluation_dimension:${dimensionId}`);
    }
    if (!Number.isFinite(value)) {
      issues.push(`non_finite_evaluation:${dimensionId}`);
    }
  }
  validateCampaignValueClaims(candidate.valueClaims, dimensionIds, issues);
  requireNoIssues("invalid_turn_planning_head", issues);
}

export function assertTurnPlan(
  plan: TurnPlan,
  context: PlanningRulesContext,
  currentStateIdentity: PlanningStateIdentity,
  registry: TurnPlanEvaluationRegistry = TURN_PLAN_EVALUATION_REGISTRY,
): void {
  const issues: string[] = [];
  if (plan.schemaVersion !== TURN_PLANNING_CONTRACT_SCHEMA_VERSION) {
    issues.push("schema_version_mismatch");
  }
  if (blank(plan.planId)) issues.push("blank_plan_id");
  if (
    plan.stateIdentity.stateVersion !== currentStateIdentity.stateVersion ||
    plan.stateIdentity.sideSafePlanningFingerprint !==
      currentStateIdentity.sideSafePlanningFingerprint
  ) {
    issues.push("planning_state_identity_mismatch");
  }
  if (
    !nonNegativeInteger(plan.stateIdentity.stateVersion) ||
    blank(plan.stateIdentity.sideSafePlanningFingerprint)
  ) {
    issues.push("invalid_planning_state_identity");
  }
  if (plan.planningRulesFingerprint !== context.fingerprint) {
    issues.push("rules_fingerprint_mismatch");
  }
  if (plan.evaluationRegistryVersion !== registry.version) {
    issues.push("evaluation_registry_version_mismatch");
  }
  if (plan.phases.length === 0) issues.push("turn_plan_without_phase");
  if (
    !nonNegativeInteger(plan.cursor.phaseIndex) ||
    !nonNegativeInteger(plan.cursor.nodeIndex) ||
    plan.cursor.phaseIndex >= plan.phases.length ||
    plan.cursor.nodeIndex >=
      (plan.phases[plan.cursor.phaseIndex]?.nodes.length ?? 0)
  ) {
    issues.push("invalid_plan_cursor");
  }
  validatePriorityCoverage(plan, issues);

  const phaseIds = new Set<string>();
  const nodeIds = new Set<string>();
  const ownerModuleIds = new Set<PlanModuleId>();
  let boundaryReached = false;
  for (const [phaseIndex, phase] of plan.phases.entries()) {
    if (blank(phase.phaseId)) issues.push("blank_phase_id");
    if (phaseIds.has(phase.phaseId)) issues.push("duplicate_phase_id");
    phaseIds.add(phase.phaseId);
    if (blank(phase.root.planInstanceId)) {
      issues.push("blank_phase_root_instance_id");
    }
    if (
      phase.hardPlanCommitmentId !== undefined &&
      blank(phase.hardPlanCommitmentId)
    ) {
      issues.push("blank_hard_plan_commitment_id");
    }
    if (!phase.root.moduleId.startsWith(`${plan.side}.`)) {
      issues.push("phase_root_side_mismatch");
    }
    if (
      phaseIndex > 0 &&
      phase.root.provenance !== "resident" &&
      phase.root.provenance !== "admitted_child" &&
      phase.root.provenance !== "admitted_support"
    ) {
      issues.push("projected_root_not_admitted");
    }
    if (
      blank(phase.rootAssessmentFingerprint) ||
      blank(phase.entryFrameKey) ||
      blank(phase.completionCondition.code)
    ) {
      issues.push("incomplete_phase_contract");
    }
    ownerModuleIds.add(phase.root.moduleId);
    if (phase.nodes.length === 0) issues.push("phase_without_node");
    for (const leaf of phase.supportLeaves) {
      if (blank(leaf.parentNeedId)) issues.push("support_without_parent_need");
      if (blank(leaf.assignmentId)) {
        issues.push("support_without_assignment");
      }
      if (!leaf.moduleId.startsWith(`${plan.side}.`)) {
        issues.push("support_leaf_side_mismatch");
      }
      ownerModuleIds.add(leaf.moduleId);
    }
    for (const [nodeIndex, node] of phase.nodes.entries()) {
      if (boundaryReached) issues.push("node_after_uncertainty_boundary");
      if (blank(node.nodeId)) issues.push("blank_node_id");
      if (nodeIds.has(node.nodeId)) issues.push("duplicate_node_id");
      nodeIds.add(node.nodeId);
      try {
        assertCanonicalLegalActionInvocation(
          node.invocation,
          plan.stateIdentity,
        );
        const isCurrentNode =
          phaseIndex === plan.cursor.phaseIndex &&
          nodeIndex === plan.cursor.nodeIndex;
        if (isCurrentNode && !node.executionBinding) {
          issues.push("current_node_without_execution_binding");
        }
        if (!isCurrentNode && node.executionBinding) {
          issues.push("noncurrent_node_with_execution_binding");
        }
        if (node.executionBinding) {
          assertCurrentLegalActionBinding(
            node.executionBinding,
            node.invocation,
            plan.stateIdentity,
          );
        }
      } catch (error) {
        collectContractIssues(issues, error);
      }
      if (node.boundaryAfter) boundaryReached = true;
    }
    validatePhaseTransition(phase, plan.phases, phaseIndex, issues);
  }
  const dimensionIds = registryDimensionIds(registry);
  validateCampaignValueClaims(
    plan.campaignValueClaims,
    dimensionIds,
    issues,
    ownerModuleIds,
  );
  requireNoIssues("invalid_turn_plan", issues);
}

function validateCampaignQuote(
  quote: CampaignMilestoneQuote,
  stateIdentity: PlanningStateIdentity,
  issues: string[],
): void {
  if (
    blank(quote.quoteId) ||
    blank(quote.campaignId) ||
    blank(quote.quoteVersion)
  ) {
    issues.push("incomplete_campaign_quote");
  }
  if (!Number.isFinite(quote.remainingValue)) {
    issues.push("non_finite_campaign_quote");
  }
  if (quote.basis.kind === "actual_state") {
    if (
      quote.basis.stateVersion !== stateIdentity.stateVersion ||
      quote.basis.sideSafePlanningFingerprint !==
        stateIdentity.sideSafePlanningFingerprint
    ) {
      issues.push("actual_campaign_quote_basis_mismatch");
    }
    return;
  }
  if (
    quote.basis.baseStateVersion !== stateIdentity.stateVersion ||
    blank(quote.basis.projectedFrameKey) ||
    blank(quote.basis.linePrefixHash)
  ) {
    issues.push("projected_campaign_quote_basis_mismatch");
  }
}

function validateExecutableWitness(
  candidate: TurnPlanningHeadCandidate,
  stateIdentity: PlanningStateIdentity,
  issues: string[],
): void {
  const witness = candidate.executableWitness;
  if (witness.stateVersion !== stateIdentity.stateVersion) {
    issues.push("witness_state_version_mismatch");
  }
  if (
    witness.sideSafePlanningFingerprint !==
    stateIdentity.sideSafePlanningFingerprint
  ) {
    issues.push("witness_planning_fingerprint_mismatch");
  }
  if (
    witness.semanticActionSetFingerprint !==
    candidate.currentBinding.semanticActionSetFingerprint
  ) {
    issues.push("witness_action_set_mismatch");
  }
  if (witness.stepFingerprint !== candidate.stepFingerprint) {
    issues.push("witness_step_fingerprint_mismatch");
  }
  if (witness.invocationKey !== candidate.invocation.invocationKey) {
    issues.push("witness_invocation_mismatch");
  }
  if (!witness.allRouteDefiningChoicesBound) {
    issues.push("witness_route_choices_unbound");
  }
}

function validatePriorityCoverage(plan: TurnPlan, issues: string[]): void {
  const obligationIds = new Set(
    plan.priorityObligations.map((obligation) => obligation.obligationId),
  );
  if (obligationIds.size !== plan.priorityObligations.length) {
    issues.push("duplicate_priority_obligation");
  }
  const coverage = plan.priorityCoverage;
  for (const id of coverage.requiredObligationIds) {
    if (!obligationIds.has(id)) issues.push("unknown_required_obligation");
  }
  if (coverage.violatedObligationIds.length > 0) {
    issues.push("violated_priority_obligation");
  }
  for (const id of coverage.deferredObligationIds) {
    const obligation = plan.priorityObligations.find(
      (candidate) => candidate.obligationId === id,
    );
    if (!obligation?.deferrable || !obligation.deferUntil) {
      issues.push("invalid_deferred_obligation");
    }
  }
}

function validatePhaseTransition(
  phase: TurnPlanPhase,
  phases: readonly TurnPlanPhase[],
  phaseIndex: number,
  issues: string[],
): void {
  if (phase.transition.kind === "next_bound_phase") {
    const next = phases[phaseIndex + 1];
    if (!next || next.phaseId !== phase.transition.nextPhaseId) {
      issues.push("phase_transition_target_mismatch");
    }
    return;
  }
  if (phaseIndex < phases.length - 1) {
    issues.push("phase_after_terminal_transition");
  }
}

function validateCampaignValueClaims(
  claims: readonly CampaignValueClaim[],
  dimensionIds: ReadonlySet<string>,
  issues: string[],
  ownerModuleIds?: ReadonlySet<PlanModuleId>,
): void {
  const claimIds = new Set<string>();
  const exclusiveOwners = new Set<string>();
  for (const claim of claims) {
    if (blank(claim.claimId)) issues.push("blank_value_claim_id");
    if (claimIds.has(claim.claimId)) issues.push("duplicate_value_claim_id");
    claimIds.add(claim.claimId);
    if (!dimensionIds.has(claim.evaluationDimensionId)) {
      issues.push(
        `unknown_claim_evaluation_dimension:${claim.evaluationDimensionId}`,
      );
    }
    if (!Number.isFinite(claim.amount)) issues.push("non_finite_claim_amount");
    if (ownerModuleIds && !ownerModuleIds.has(claim.ownerModuleId)) {
      issues.push("value_claim_owner_not_in_plan");
    }
    if (blank(claim.beforeQuoteId) || blank(claim.afterQuoteId)) {
      issues.push("claim_without_quote_basis");
    }
    if (
      claim.aggregationMode === "delta_from_previous_prefix" &&
      claim.beforeQuoteId === claim.afterQuoteId
    ) {
      issues.push("delta_claim_without_line_prefix_change");
    }
    if (claim.aggregationMode === "exclusive") {
      const ownerKey = `${claim.objectiveKey}:${claim.componentKey}`;
      if (exclusiveOwners.has(ownerKey)) {
        issues.push("campaign_value_double_count");
      }
      exclusiveOwners.add(ownerKey);
    }
    if (claim.status === "consumed" && !claim.consumedAtMilestoneId) {
      issues.push("consumed_claim_without_milestone");
    }
    if (claim.status !== "consumed" && claim.consumedAtMilestoneId) {
      issues.push("unconsumed_claim_with_milestone");
    }
  }
}

function canonicalTargetSlots(
  slots: readonly BoundTargetSlot[],
): BoundTargetSlot[] {
  return slots
    .map((slot) => ({
      ...slot,
      values:
        slot.ordering === "unordered"
          ? [...slot.values].sort(compareCanonical)
          : [...slot.values],
    }))
    .sort((left, right) => left.slotId.localeCompare(right.slotId));
}

function canonicalChoiceBindings(
  choices: readonly CanonicalChoiceBinding[],
): CanonicalChoiceBinding[] {
  return choices
    .map((choice) => ({
      ...choice,
      value:
        choice.value.kind === "target_list" &&
        choice.value.ordering === "unordered"
          ? {
              ...choice.value,
              values: [...choice.value.values].sort(compareCanonical),
            }
          : choice.value,
    }))
    .sort((left, right) => left.choiceId.localeCompare(right.choiceId));
}

function validateChoiceValue(
  value: CanonicalChoiceValue,
  issues: string[],
): void {
  if (value.kind === "number" && !Number.isFinite(value.value)) {
    issues.push("non_finite_choice_number");
  }
  if (value.kind === "string" && blank(value.value)) {
    issues.push("blank_choice_string");
  }
  if (value.kind === "target") validateTargetList([value.value], issues);
  if (value.kind === "target_list") validateTargetList(value.values, issues);
}

function validateTargetList(
  targets: readonly PlanTargetRef[],
  issues: string[],
): void {
  const targetKeys = new Set<string>();
  for (const target of targets) {
    if (blank(target.id)) issues.push("blank_target_id");
    if (target.kind === "ability") {
      if (
        blank(target.sourceCardInstanceId ?? "") ||
        blank(target.abilityId ?? "")
      ) {
        issues.push("incomplete_ability_target");
      }
    }
    if (
      target.kind === "value" &&
      target.value !== undefined &&
      !Number.isFinite(target.value)
    ) {
      issues.push("invalid_value_target");
    }
    if (target.kind === "target_set") {
      if (!target.targets || target.targets.length === 0) {
        issues.push("empty_target_set");
      } else {
        validateTargetList(target.targets, issues);
      }
    }
    const key = canonicalTurnPlanningSerialize(target);
    if (targetKeys.has(key)) issues.push("duplicate_target");
    targetKeys.add(key);
  }
}

function canonicalLegalActionSemantics(
  legalActions: AiDecisionInput["legalActions"],
): unknown[] {
  return legalActions
    .map((action) =>
      canonicalize({
        side: action.side,
        type: action.type,
        source: action.source,
        timingPoint: action.timingPoint,
        costs: action.costs,
        targetRequirements: action.targetRequirements,
        choiceRequirements: action.choiceRequirements ?? [],
        abilityRef: action.abilityRef,
        effectRef: action.effectRef,
        resolvedEffects: action.resolvedEffects ?? [],
        visibility: action.visibility,
        payload: omitActionIds(action.payload),
      }),
    )
    .sort(compareCanonical);
}

function registryDimensionIds(
  registry: TurnPlanEvaluationRegistry,
): Set<string> {
  return new Set(registry.dimensions.map((dimension) => dimension.dimensionId));
}

export function turnPlanningFingerprint(
  namespace: string,
  value: unknown,
): string {
  return `fnv1a:${fnv1a(
    `${namespace}|${canonicalTurnPlanningSerialize(value)}`,
  )}`;
}

export function canonicalTurnPlanningSerialize(value: unknown): string {
  return JSON.stringify(canonicalize(value));
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (typeof value !== "object" || value === null) return value;
  const entries = Object.entries(value)
    .filter(([, child]) => child !== undefined)
    .sort(([left], [right]) => left.localeCompare(right));
  return Object.fromEntries(
    entries.map(([key, child]) => [key, canonicalize(child)]),
  );
}

function compareCanonical(left: unknown, right: unknown): number {
  return canonicalTurnPlanningSerialize(left).localeCompare(
    canonicalTurnPlanningSerialize(right),
  );
}

function omitActionIds(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(omitActionIds);
  if (typeof value !== "object" || value === null) return value;
  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => key.toLowerCase() !== "actionid")
      .map(([key, child]) => [key, omitActionIds(child)]),
  );
}

function containsForbiddenActionId(value: unknown): boolean {
  if (Array.isArray(value)) return value.some(containsForbiddenActionId);
  if (typeof value !== "object" || value === null) return false;
  return Object.entries(value).some(
    ([key, child]) =>
      key.toLowerCase() === "actionid" || containsForbiddenActionId(child),
  );
}

function collectContractIssues(issues: string[], error: unknown): void {
  if (error instanceof TurnPlanningContractError) {
    issues.push(...error.issues);
    return;
  }
  throw error;
}

function requireNoIssues(code: string, issues: string[]): void {
  if (issues.length > 0) throw new TurnPlanningContractError(code, issues);
}

function blank(value: string): boolean {
  return value.trim().length === 0;
}

function nonNegativeInteger(value: number): boolean {
  return Number.isSafeInteger(value) && value >= 0;
}
