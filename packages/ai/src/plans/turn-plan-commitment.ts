import type { AiDecisionInput, LegalAction, Side } from "@netgrid/shared";
import {
  assertAbilityRefIdentity,
  parseCanonicalCapabilityId,
} from "@netgrid/cards/planning";

import type { PlanConditionRef } from "./plan-kernel-types";
import {
  assertPlanningRulesContext,
  assertTurnPlan,
  assertTurnPlanningHeadCandidate,
  buildSemanticActionSetFingerprint,
  canonicalTurnPlanningSerialize,
  turnPlanningFingerprint,
  type CampaignMilestoneQuote,
  type CanonicalLegalActionInvocation,
  type CurrentLegalActionBinding,
  type PlanningRulesContext,
  type PlanningStateIdentity,
  type PriorityCoverage,
  type TurnPlan,
  type TurnPlanBoundary,
  type TurnPlanPhase,
  type TurnPlanningHeadCandidate,
} from "./turn-planning-contracts";

export const TURN_PLAN_COMMITMENT_SCHEMA_VERSION =
  "turn-plan-commitment-v2" as const;
export const CURRENT_TURN_COMPLETION_CERTIFICATE_SCHEMA_VERSION =
  "current-turn-completion-certificate-v1" as const;

export type TurnPlanObservationClass =
  | "expected_progress"
  | "expected_phase_transition"
  | "expected_no_material_change"
  | "plan_internal_continuation_boundary"
  | "scheduled_information_boundary"
  | "material_cost_or_target_drift"
  | "material_outcome_deviation"
  | "urgent_interrupt"
  | "phase_milestone_reached"
  | "runtime_restarted"
  | "commitment_invalidated";

export type TurnPlanReplanReason =
  | "runtime_restarted"
  | "rules_context_changed"
  | "turn_changed"
  | "state_identity_stale"
  | "current_step_not_legal"
  | "current_step_ambiguous"
  | "material_cost_drift"
  | "material_target_drift"
  | "material_choice_drift"
  | "material_outcome_deviation"
  | "scheduled_information_boundary"
  | "route_completed"
  | "route_unavailable"
  | "urgent_interrupt"
  | "phase_entry_invalid"
  | "hard_plan_commitment_invalid"
  | "campaign_requote_invalid"
  | "commitment_contract_invalid";

export type CommittedInvocationRoute = Omit<
  CanonicalLegalActionInvocation,
  "invocationKey"
> & {
  routeKey: string;
};

export type TurnPlanNodeExecutionExpectation = {
  nodeId: string;
  actionType: string;
  semanticActionFingerprint: string;
  costFingerprint: string;
  targetRequirementFingerprint: string;
  choiceRequirementFingerprint: string;
  payloadFingerprint: string;
  expectedStateDeltaCodes: string[];
  expectedNextPlanningFingerprint?: string;
};

export type CommittedTurnPlanNode = {
  nodeId: string;
  invocation: CommittedInvocationRoute;
  expectation: TurnPlanNodeExecutionExpectation;
  boundaryAfter?: TurnPlanBoundary;
};

export type CommittedTurnPlanPhase = Omit<TurnPlanPhase, "nodes"> & {
  nodes: CommittedTurnPlanNode[];
};

export type TurnPlanCommitmentStatus =
  | "active"
  | "awaiting_observation"
  | "completed"
  | "replanned"
  | "invalidated";

export type TurnPlanCommitment = {
  schemaVersion: typeof TURN_PLAN_COMMITMENT_SCHEMA_VERSION;
  commitmentId: string;
  sourcePlanId: string;
  sourceLineHash: string;
  /** Required by v2; optional in the structural type so v1 checkpoint evidence can be rejected at runtime. */
  sequenceRootPlanInstanceId?: string;
  predecessorCommitmentId?: string;
  side: Side;
  turnKey: string;
  planningRulesFingerprint: string;
  runtimeInstanceId: string;
  createdAtStateIdentity: PlanningStateIdentity;
  lastValidatedStateIdentity: PlanningStateIdentity;
  phases: CommittedTurnPlanPhase[];
  cursor: { phaseIndex: number; nodeIndex: number };
  phaseEntry: {
    phaseId: string;
    status: "validated" | "pending" | "invalid";
    validatedAtStateVersion?: number;
    reasonCode: string;
  };
  hardPlanCommitmentIds: string[];
  campaignIds: string[];
  quoteIds: string[];
  valueClaimIds: string[];
  priorityCoverage: PriorityCoverage;
  nextExpectedTransition: {
    expectationId: string;
    phaseId: string;
    nodeId: string;
    routeKey: string;
    expectedStateDeltaCodes: string[];
    boundaryAfter?: TurnPlanBoundary;
  };
  status: TurnPlanCommitmentStatus;
  observationClass: TurnPlanObservationClass;
  replanReason?: TurnPlanReplanReason;
};

export type TurnPlanExecutionLease = {
  leaseId: string;
  commitmentId: string;
  sourcePlanId: string;
  phaseId: string;
  nodeId: string;
  routeKey: string;
  stateIdentity: PlanningStateIdentity;
  currentBinding: CurrentLegalActionBinding;
  actionType: string;
  expectationId: string;
};

export type TurnPlanRematerialization =
  | {
      kind: "executable";
      commitment: TurnPlanCommitment;
      lease: TurnPlanExecutionLease;
      head: TurnPlanningHeadCandidate;
      legalAction: LegalAction;
    }
  | {
      kind: "replan_required";
      commitment: TurnPlanCommitment;
      reason: TurnPlanReplanReason;
      evidenceCodes: string[];
    };

export type HardPlanCommitmentRevalidation = {
  commitmentId: string;
  status: "valid" | "completed" | "invalid";
  evidenceCodes: string[];
};

export type CampaignRequote = {
  campaignId: string;
  status: "valid" | "completed" | "invalid";
  quote?: CampaignMilestoneQuote;
  evidenceCodes: string[];
};

export type TurnPlanContinuationEvidence = {
  hardPlanCommitments: HardPlanCommitmentRevalidation[];
  campaignRequotes: CampaignRequote[];
};

export type TurnPlanExecutionReceipt = {
  lease: TurnPlanExecutionLease;
  runtimeInstanceId: string;
  turnKey: string;
  stateIdentityAfter: PlanningStateIdentity;
  outcomeCodes: string[];
  materialOutcomeDeviation?: boolean;
  urgentInterrupt?: boolean;
};

export type TurnPlanContinuationResult = {
  commitment: TurnPlanCommitment;
  observationClass: TurnPlanObservationClass;
  replanReason?: TurnPlanReplanReason;
  phaseEntryRequired: boolean;
};

export type TurnPlanPhaseEntryEvidence = {
  runtimeInstanceId: string;
  turnKey: string;
  stateIdentity: PlanningStateIdentity;
  phaseId: string;
  entryFrameKey: string;
  rootAssessmentFingerprint: string;
  satisfiedConditionCodes: string[];
  supportAssignmentIds: string[];
  resourceHandoffIds: string[];
};

export type CurrentTurnCompletionCertificate = {
  schemaVersion: typeof CURRENT_TURN_COMPLETION_CERTIFICATE_SCHEMA_VERSION;
  certificateId: string;
  side: Side;
  turnKey: string;
  planningRulesFingerprint: string;
  stateIdentity: PlanningStateIdentity;
  legalActionSetFingerprint: string;
  endTurnActionId: string;
  endTurnInvocationKey: string;
  evidenceCodes: string[];
};

export class TurnPlanCommitmentError extends Error {
  constructor(
    readonly code: TurnPlanReplanReason | "turn_completion_not_certified",
    readonly evidenceCodes: string[],
  ) {
    super(`${code}:${[...new Set(evidenceCodes)].sort().join(",")}`);
    this.name = "TurnPlanCommitmentError";
  }
}

export function executionExpectationFromLegalAction(params: {
  nodeId: string;
  legalAction: LegalAction;
  expectedStateDeltaCodes: string[];
  expectedNextPlanningFingerprint?: string;
}): TurnPlanNodeExecutionExpectation {
  return {
    nodeId: params.nodeId,
    actionType: params.legalAction.type,
    semanticActionFingerprint: legalActionPartFingerprint(
      "turn-step-semantic-action",
      semanticLegalActionContract(params.legalAction),
    ),
    costFingerprint: legalActionPartFingerprint(
      "turn-step-costs",
      params.legalAction.costs,
    ),
    targetRequirementFingerprint: legalActionPartFingerprint(
      "turn-step-target-requirements",
      params.legalAction.targetRequirements,
    ),
    choiceRequirementFingerprint: legalActionPartFingerprint(
      "turn-step-choice-requirements",
      params.legalAction.choiceRequirements ?? [],
    ),
    payloadFingerprint: legalActionPartFingerprint(
      "turn-step-payload",
      params.legalAction.payload ?? {},
    ),
    expectedStateDeltaCodes: sortedUnique(params.expectedStateDeltaCodes),
    ...(params.expectedNextPlanningFingerprint
      ? {
          expectedNextPlanningFingerprint:
            params.expectedNextPlanningFingerprint,
        }
      : {}),
  };
}

export function createTurnPlanCommitment(params: {
  plan: TurnPlan;
  rulesContext: PlanningRulesContext;
  runtimeInstanceId: string;
  nodeExpectations: readonly TurnPlanNodeExecutionExpectation[];
}): TurnPlanCommitment {
  assertTurnPlan(params.plan, params.rulesContext, params.plan.stateIdentity);
  requireNonBlank(params.runtimeInstanceId, "commitment_contract_invalid", [
    "runtime_instance_id_missing",
  ]);
  const expectations = new Map(
    params.nodeExpectations.map((expectation) => [
      expectation.nodeId,
      expectation,
    ]),
  );
  if (expectations.size !== params.nodeExpectations.length) {
    throw commitmentError("commitment_contract_invalid", [
      "duplicate_node_expectation",
    ]);
  }
  const expectedNodeIds = params.plan.phases.flatMap((phase) =>
    phase.nodes.map((node) => node.nodeId),
  );
  if (
    expectations.size !== expectedNodeIds.length ||
    expectedNodeIds.some((nodeId) => !expectations.has(nodeId))
  ) {
    throw commitmentError("commitment_contract_invalid", [
      "node_expectation_coverage_incomplete",
    ]);
  }

  const phases = params.plan.phases.map((phase) => ({
    ...structuredClone(phase),
    nodes: phase.nodes.map((node) => ({
      nodeId: node.nodeId,
      invocation: committedInvocationRoute(node.invocation),
      expectation: structuredClone(expectations.get(node.nodeId)!),
      ...(node.boundaryAfter ? { boundaryAfter: node.boundaryAfter } : {}),
    })),
  }));
  const cursor = structuredClone(params.plan.cursor);
  const currentPhase = phases[cursor.phaseIndex]!;
  const currentNode = currentPhase.nodes[cursor.nodeIndex]!;
  const campaignIds = sortedUnique(
    params.plan.campaignValueClaims.map((claim) => claim.campaignId),
  );
  const quoteIds = sortedUnique(
    params.plan.campaignValueClaims.flatMap((claim) => [
      claim.beforeQuoteId,
      claim.afterQuoteId,
    ]),
  );
  const hardPlanCommitmentIds = sortedUnique(
    phases.flatMap((phase) =>
      phase.hardPlanCommitmentId ? [phase.hardPlanCommitmentId] : [],
    ),
  );
  const sourceLineHash = turnPlanningFingerprint("turn-plan-source-line", {
    sourcePlanId: params.plan.planId,
    side: params.plan.side,
    turnKey: params.plan.turnKey,
    phases,
    priorityCoverage: params.plan.priorityCoverage,
    valueClaimIds: params.plan.campaignValueClaims.map(
      (claim) => claim.claimId,
    ),
  });
  const commitmentId = turnPlanningFingerprint("turn-plan-commitment", {
    sourceLineHash,
    runtimeInstanceId: params.runtimeInstanceId,
    planningRulesFingerprint: params.plan.planningRulesFingerprint,
    stateIdentity: params.plan.stateIdentity,
  });
  const commitment: TurnPlanCommitment = {
    schemaVersion: TURN_PLAN_COMMITMENT_SCHEMA_VERSION,
    commitmentId,
    sourcePlanId: params.plan.planId,
    sourceLineHash,
    sequenceRootPlanInstanceId: phases[0]!.root.planInstanceId,
    side: params.plan.side,
    turnKey: params.plan.turnKey,
    planningRulesFingerprint: params.plan.planningRulesFingerprint,
    runtimeInstanceId: params.runtimeInstanceId,
    createdAtStateIdentity: structuredClone(params.plan.stateIdentity),
    lastValidatedStateIdentity: structuredClone(params.plan.stateIdentity),
    phases,
    cursor,
    phaseEntry: {
      phaseId: currentPhase.phaseId,
      status: "validated",
      validatedAtStateVersion: params.plan.stateIdentity.stateVersion,
      reasonCode: "initial_phase_entry_validated",
    },
    hardPlanCommitmentIds,
    campaignIds,
    quoteIds,
    valueClaimIds: sortedUnique(
      params.plan.campaignValueClaims.map((claim) => claim.claimId),
    ),
    priorityCoverage: structuredClone(params.plan.priorityCoverage),
    nextExpectedTransition: expectedTransition(
      currentPhase,
      currentNode,
      cursor,
    ),
    status: "active",
    observationClass: "expected_no_material_change",
  };
  assertTurnPlanCommitment(commitment);
  return commitment;
}

export function rematerializeCommittedTurnStep(params: {
  commitment: TurnPlanCommitment;
  rulesContext: PlanningRulesContext;
  runtimeInstanceId: string;
  turnKey: string;
  stateIdentity: PlanningStateIdentity;
  heads: readonly TurnPlanningHeadCandidate[];
  legalActions: readonly LegalAction[];
  continuationEvidence: TurnPlanContinuationEvidence;
}): TurnPlanRematerialization {
  const preflight = continuationPreflight(params);
  if (preflight) return preflight;
  const commitment = structuredClone(params.commitment);
  const node = currentCommittedNode(commitment);
  const structuralMatches: TurnPlanningHeadCandidate[] = [];
  const routeFamilyMatches: TurnPlanningHeadCandidate[] = [];

  for (const head of params.heads) {
    try {
      assertTurnPlanningHeadCandidate(head, params.stateIdentity);
    } catch {
      continue;
    }
    const currentPhase = commitment.phases[commitment.cursor.phaseIndex];
    const producerOwnedByPhase =
      head.moduleId === currentPhase?.root.moduleId ||
      currentPhase?.supportLeaves.some(
        (leaf) => leaf.moduleId === head.moduleId,
      );
    if (
      head.side !== commitment.side ||
      head.rootPlanInstanceId !== currentPhase?.root.planInstanceId ||
      head.nextMilestoneId !== currentPhase.root.milestoneId ||
      !producerOwnedByPhase
    ) {
      continue;
    }
    if (sameInvocationFamily(node.invocation, head.invocation)) {
      routeFamilyMatches.push(head);
    }
    if (sameCommittedInvocation(node.invocation, head.invocation)) {
      structuralMatches.push(head);
    }
  }

  if (structuralMatches.length === 0) {
    const drift = classifyRouteDrift(node.invocation, routeFamilyMatches);
    return replanResult(commitment, drift, [
      "committed_invocation_not_materializable",
      `node:${node.nodeId}`,
    ]);
  }
  if (structuralMatches.length > 1) {
    return replanResult(commitment, "current_step_ambiguous", [
      "multiple_current_heads_match_committed_invocation",
      `node:${node.nodeId}`,
    ]);
  }
  const head = structuralMatches[0]!;
  const currentActionSetFingerprint = buildSemanticActionSetFingerprint(
    params.legalActions as AiDecisionInput["legalActions"],
  );
  if (
    head.currentBinding.semanticActionSetFingerprint !==
      currentActionSetFingerprint ||
    head.executableWitness.semanticActionSetFingerprint !==
      currentActionSetFingerprint
  ) {
    return replanResult(commitment, "current_step_not_legal", [
      "semantic_action_set_fingerprint_mismatch",
      `node:${node.nodeId}`,
    ]);
  }
  const legalActionMatches = params.legalActions.filter(
    (action) =>
      action.actionId === head.currentBinding.actionId &&
      action.side === commitment.side &&
      action.expiresAtStateVersion === params.stateIdentity.stateVersion &&
      legalActionMatchesInvocationSource(action, head.invocation),
  );
  if (legalActionMatches.length !== 1) {
    return replanResult(commitment, "current_step_not_legal", [
      legalActionMatches.length === 0
        ? "bound_legal_action_missing_or_stale"
        : "bound_legal_action_ambiguous",
      `node:${node.nodeId}`,
    ]);
  }
  const legalAction = legalActionMatches[0]!;
  const drift = legalActionExpectationDrift(node.expectation, legalAction);
  if (drift) {
    return replanResult(commitment, drift, [
      "legal_action_contract_drift",
      `node:${node.nodeId}`,
    ]);
  }
  const lease: TurnPlanExecutionLease = {
    leaseId: turnPlanningFingerprint("turn-plan-execution-lease", {
      commitmentId: commitment.commitmentId,
      phaseIndex: commitment.cursor.phaseIndex,
      nodeIndex: commitment.cursor.nodeIndex,
      stateIdentity: params.stateIdentity,
      actionId: head.currentBinding.actionId,
      invocationKey: head.invocation.invocationKey,
      expectationId: commitment.nextExpectedTransition.expectationId,
    }),
    commitmentId: commitment.commitmentId,
    sourcePlanId: commitment.sourcePlanId,
    phaseId: commitment.phases[commitment.cursor.phaseIndex]?.phaseId ?? "",
    nodeId: node.nodeId,
    routeKey: node.invocation.routeKey,
    stateIdentity: structuredClone(params.stateIdentity),
    currentBinding: structuredClone(head.currentBinding),
    actionType: legalAction.type,
    expectationId: commitment.nextExpectedTransition.expectationId,
  };
  commitment.lastValidatedStateIdentity = structuredClone(params.stateIdentity);
  commitment.observationClass = "expected_no_material_change";
  delete commitment.replanReason;
  return {
    kind: "executable",
    commitment,
    lease,
    head: structuredClone(head),
    legalAction: structuredClone(legalAction),
  };
}

function legalActionMatchesInvocationSource(
  action: LegalAction,
  invocation: CanonicalLegalActionInvocation,
): boolean {
  if (
    invocation.sourceCardInstanceId !== undefined &&
    action.source !== invocation.sourceCardInstanceId
  )
    return false;
  const binding = invocation.sourceAbilityBinding;
  if (!binding) return true;
  try {
    assertAbilityRefIdentity(action.abilityRef);
    const parsed = parseCanonicalCapabilityId(binding.sourceAbilityId);
    return Boolean(
      action.abilityRef &&
      "sourceAbilityId" in action.abilityRef &&
      action.abilityRef.sourceCardInstanceId ===
        invocation.sourceCardInstanceId &&
      action.abilityRef.sourceAbilityId === binding.sourceAbilityId &&
      action.payload?.cardId === invocation.sourceCardInstanceId &&
      action.payload?.cardImplementationCapabilityBindingKind ===
        "card_spec_capability_key" &&
      action.payload?.cardImplementationAbilityId === binding.sourceAbilityId &&
      action.payload?.cardImplementationAbilityKey === parsed.capabilityKey,
    );
  } catch {
    return false;
  }
}

export function advanceTurnPlanCommitment(
  commitmentInput: TurnPlanCommitment,
  receipt: TurnPlanExecutionReceipt,
): TurnPlanContinuationResult {
  assertTurnPlanCommitment(commitmentInput);
  const commitment = structuredClone(commitmentInput);
  const restart = runtimeOrTurnReplan(
    commitment,
    receipt.runtimeInstanceId,
    receipt.turnKey,
  );
  if (restart) {
    return continuationReplan(commitment, restart.reason, restart.observation);
  }
  const node = currentCommittedNode(commitment);
  const leaseMatches =
    receipt.lease.commitmentId === commitment.commitmentId &&
    receipt.lease.sourcePlanId === commitment.sourcePlanId &&
    receipt.lease.phaseId ===
      commitment.phases[commitment.cursor.phaseIndex]?.phaseId &&
    receipt.lease.nodeId === node.nodeId &&
    receipt.lease.routeKey === node.invocation.routeKey &&
    receipt.lease.expectationId ===
      commitment.nextExpectedTransition.expectationId &&
    receipt.lease.stateIdentity.stateVersion ===
      commitment.lastValidatedStateIdentity.stateVersion &&
    receipt.lease.currentBinding.stateVersion ===
      receipt.lease.stateIdentity.stateVersion;
  if (!leaseMatches) {
    return continuationReplan(
      commitment,
      "commitment_contract_invalid",
      "commitment_invalidated",
    );
  }
  if (
    receipt.stateIdentityAfter.stateVersion <=
      receipt.lease.stateIdentity.stateVersion ||
    receipt.stateIdentityAfter.stateVersion <=
      commitment.lastValidatedStateIdentity.stateVersion
  ) {
    return continuationReplan(
      commitment,
      "state_identity_stale",
      "commitment_invalidated",
    );
  }
  if (receipt.urgentInterrupt) {
    return continuationReplan(
      commitment,
      "urgent_interrupt",
      "urgent_interrupt",
    );
  }
  const expectedCodes = node.expectation.expectedStateDeltaCodes;
  const outcomeMatches =
    !receipt.materialOutcomeDeviation &&
    expectedCodes.every((code) => receipt.outcomeCodes.includes(code)) &&
    (node.expectation.expectedNextPlanningFingerprint === undefined ||
      node.expectation.expectedNextPlanningFingerprint ===
        receipt.stateIdentityAfter.sideSafePlanningFingerprint);
  if (!outcomeMatches) {
    return continuationReplan(
      commitment,
      "material_outcome_deviation",
      "material_outcome_deviation",
    );
  }
  commitment.lastValidatedStateIdentity = structuredClone(
    receipt.stateIdentityAfter,
  );
  if (node.boundaryAfter) {
    commitment.status = "awaiting_observation";
    commitment.observationClass = "scheduled_information_boundary";
    commitment.replanReason = "scheduled_information_boundary";
    return {
      commitment,
      observationClass: commitment.observationClass,
      replanReason: commitment.replanReason,
      phaseEntryRequired: false,
    };
  }

  const phase = commitment.phases[commitment.cursor.phaseIndex]!;
  if (commitment.cursor.nodeIndex + 1 < phase.nodes.length) {
    commitment.cursor.nodeIndex += 1;
    commitment.nextExpectedTransition = expectedTransition(
      phase,
      phase.nodes[commitment.cursor.nodeIndex]!,
      commitment.cursor,
    );
    commitment.observationClass = "expected_progress";
    delete commitment.replanReason;
    return {
      commitment,
      observationClass: commitment.observationClass,
      phaseEntryRequired: false,
    };
  }

  if (phase.transition.kind === "next_bound_phase") {
    commitment.cursor.phaseIndex += 1;
    commitment.cursor.nodeIndex = 0;
    const nextPhase = commitment.phases[commitment.cursor.phaseIndex]!;
    commitment.phaseEntry = {
      phaseId: nextPhase.phaseId,
      status: "pending",
      reasonCode: phase.transition.reasonCode,
    };
    commitment.nextExpectedTransition = expectedTransition(
      nextPhase,
      nextPhase.nodes[0]!,
      commitment.cursor,
    );
    commitment.observationClass = "expected_phase_transition";
    delete commitment.replanReason;
    return {
      commitment,
      observationClass: commitment.observationClass,
      phaseEntryRequired: true,
    };
  }

  if (phase.transition.kind === "turn_end") {
    commitment.status = "completed";
    commitment.observationClass = "phase_milestone_reached";
    delete commitment.replanReason;
    return {
      commitment,
      observationClass: commitment.observationClass,
      phaseEntryRequired: false,
    };
  }

  commitment.status = "awaiting_observation";
  commitment.observationClass = "plan_internal_continuation_boundary";
  delete commitment.replanReason;
  return {
    commitment,
    observationClass: commitment.observationClass,
    phaseEntryRequired: false,
  };
}

export function validateCommittedTurnPhaseEntry(
  commitmentInput: TurnPlanCommitment,
  evidence: TurnPlanPhaseEntryEvidence,
): TurnPlanContinuationResult {
  assertTurnPlanCommitment(commitmentInput);
  const commitment = structuredClone(commitmentInput);
  const restart = runtimeOrTurnReplan(
    commitment,
    evidence.runtimeInstanceId,
    evidence.turnKey,
  );
  if (restart) {
    return continuationReplan(commitment, restart.reason, restart.observation);
  }
  const phase = commitment.phases[commitment.cursor.phaseIndex];
  const priorPhase = commitment.phases[commitment.cursor.phaseIndex - 1];
  const requiredHandoffs =
    priorPhase?.transition.kind === "next_bound_phase"
      ? priorPhase.transition.resourceHandoffIds
      : [];
  const requiredAssignments = phase?.supportLeaves.map(
    (leaf) => leaf.assignmentId,
  );
  const valid =
    commitment.status === "active" &&
    commitment.phaseEntry.status === "pending" &&
    phase !== undefined &&
    evidence.phaseId === phase.phaseId &&
    evidence.stateIdentity.stateVersion ===
      commitment.lastValidatedStateIdentity.stateVersion &&
    evidence.stateIdentity.sideSafePlanningFingerprint ===
      commitment.lastValidatedStateIdentity.sideSafePlanningFingerprint &&
    evidence.entryFrameKey === phase.entryFrameKey &&
    evidence.rootAssessmentFingerprint === phase.rootAssessmentFingerprint &&
    allConditionsSatisfied(phase.entryConditions, evidence) &&
    sameStringSet(requiredAssignments ?? [], evidence.supportAssignmentIds) &&
    sameStringSet(requiredHandoffs, evidence.resourceHandoffIds);
  if (!valid) {
    commitment.phaseEntry.status = "invalid";
    commitment.phaseEntry.reasonCode = "phase_entry_validation_failed";
    return continuationReplan(
      commitment,
      "phase_entry_invalid",
      "commitment_invalidated",
    );
  }
  commitment.phaseEntry = {
    phaseId: phase.phaseId,
    status: "validated",
    validatedAtStateVersion: evidence.stateIdentity.stateVersion,
    reasonCode: "phase_entry_validated",
  };
  commitment.observationClass = "expected_phase_transition";
  delete commitment.replanReason;
  return {
    commitment,
    observationClass: commitment.observationClass,
    phaseEntryRequired: false,
  };
}

export function invalidateTurnPlanCommitmentForRestart(
  commitmentInput: TurnPlanCommitment,
  nextRuntimeInstanceId: string,
): TurnPlanContinuationResult {
  assertTurnPlanCommitment(commitmentInput);
  const commitment = structuredClone(commitmentInput);
  if (nextRuntimeInstanceId === commitment.runtimeInstanceId) {
    return {
      commitment,
      observationClass: commitment.observationClass,
      phaseEntryRequired: commitment.phaseEntry.status === "pending",
    };
  }
  return continuationReplan(
    commitment,
    "runtime_restarted",
    "runtime_restarted",
  );
}

export function certifyCurrentTurnCompletion(params: {
  input: Pick<AiDecisionInput, "side" | "playerView" | "legalActions">;
  rulesContext: PlanningRulesContext;
  turnKey: string;
  stateIdentity: PlanningStateIdentity;
  endTurnHead: TurnPlanningHeadCandidate;
  priorityCoverage: PriorityCoverage;
  mandatoryEngineWindowComplete: boolean;
  cleanupAndDispositionComplete: boolean;
  unresolvedDispositionActionIds: readonly string[];
  openMandatoryCommitmentIds: readonly string[];
  remainingRestrictedActionIds: readonly string[];
  restrictedCapacityForgo?: {
    capacityKind: "zero_click_non_basic_run_only";
    explicitlyNonproductiveActionIds: readonly string[];
  };
}): CurrentTurnCompletionCertificate {
  const evidenceCodes: string[] = [];
  try {
    assertPlanningRulesContext(params.rulesContext);
  } catch {
    evidenceCodes.push("planning_rules_context_invalid");
  }
  try {
    assertTurnPlanningHeadCandidate(params.endTurnHead, params.stateIdentity);
  } catch {
    evidenceCodes.push("end_turn_head_invalid");
  }
  const action = params.input.legalActions.find(
    (candidate) =>
      candidate.actionId === params.endTurnHead.currentBinding.actionId,
  );
  if (
    !action ||
    action.type !== "end_turn" ||
    action.source !== "game_rule" ||
    action.side !== params.input.side ||
    action.expiresAtStateVersion !== params.stateIdentity.stateVersion ||
    params.endTurnHead.invocation.semanticActionType !== "turn_flow.end_turn"
  ) {
    evidenceCodes.push("current_standard_end_turn_invocation_missing");
  }
  if (
    params.input.playerView.stateVersion !== params.stateIdentity.stateVersion
  ) {
    evidenceCodes.push("current_state_identity_mismatch");
  }
  if (!params.mandatoryEngineWindowComplete) {
    evidenceCodes.push("mandatory_engine_window_open");
  }
  if (!params.cleanupAndDispositionComplete) {
    evidenceCodes.push("cleanup_or_disposition_incomplete");
  }
  if (params.unresolvedDispositionActionIds.length > 0) {
    evidenceCodes.push("unresolved_current_invocations");
  }
  if (params.openMandatoryCommitmentIds.length > 0) {
    evidenceCodes.push("mandatory_commitment_open");
  }
  const coveredPriorityIds = new Set([
    ...params.priorityCoverage.satisfiedObligationIds,
    ...params.priorityCoverage.deferredObligationIds,
  ]);
  if (
    params.priorityCoverage.violatedObligationIds.length > 0 ||
    params.priorityCoverage.requiredObligationIds.some(
      (id) => !coveredPriorityIds.has(id),
    )
  ) {
    evidenceCodes.push("priority_obligation_violated");
  }
  if (params.input.playerView.own.clicks > 0) {
    evidenceCodes.push("usable_action_capacity_remains");
  }
  const restrictedForgoValid =
    params.remainingRestrictedActionIds.length === 0 ||
    (params.restrictedCapacityForgo?.capacityKind ===
      "zero_click_non_basic_run_only" &&
      sameStringSet(
        params.remainingRestrictedActionIds,
        params.restrictedCapacityForgo.explicitlyNonproductiveActionIds,
      ));
  if (params.remainingRestrictedActionIds.length > 0 && !restrictedForgoValid) {
    evidenceCodes.push("uncertified_restricted_capacity_remains");
  }
  if (evidenceCodes.length > 0) {
    throw new TurnPlanCommitmentError(
      "turn_completion_not_certified",
      evidenceCodes,
    );
  }
  const legalActionSetFingerprint = turnPlanningFingerprint(
    "current-turn-completion-legal-actions",
    params.input.legalActions.map((candidate) => ({
      side: candidate.side,
      type: candidate.type,
      source: candidate.source,
      timingPoint: candidate.timingPoint,
      costs: candidate.costs,
      targetRequirements: candidate.targetRequirements,
      choiceRequirements: candidate.choiceRequirements ?? [],
      payload: candidate.payload ?? {},
      expiresAtStateVersion: candidate.expiresAtStateVersion,
    })),
  );
  return {
    schemaVersion: CURRENT_TURN_COMPLETION_CERTIFICATE_SCHEMA_VERSION,
    certificateId: turnPlanningFingerprint(
      "current-turn-completion-certificate",
      {
        side: params.input.side,
        turnKey: params.turnKey,
        planningRulesFingerprint: params.rulesContext.fingerprint,
        stateIdentity: params.stateIdentity,
        legalActionSetFingerprint,
        endTurnActionId: action!.actionId,
        endTurnInvocationKey: params.endTurnHead.invocation.invocationKey,
      },
    ),
    side: params.input.side,
    turnKey: params.turnKey,
    planningRulesFingerprint: params.rulesContext.fingerprint,
    stateIdentity: structuredClone(params.stateIdentity),
    legalActionSetFingerprint,
    endTurnActionId: action!.actionId,
    endTurnInvocationKey: params.endTurnHead.invocation.invocationKey,
    evidenceCodes: [
      "current_state_end_turn_legal",
      "mandatory_windows_complete",
      "cleanup_and_disposition_complete",
      "priority_coverage_valid",
      "remaining_capacity_certified",
    ],
  };
}

export function assertTurnPlanCommitment(commitment: TurnPlanCommitment): void {
  const issues: string[] = [];
  if (commitment.schemaVersion !== TURN_PLAN_COMMITMENT_SCHEMA_VERSION) {
    issues.push("schema_version_mismatch");
  }
  for (const value of [
    commitment.commitmentId,
    commitment.sourcePlanId,
    commitment.sourceLineHash,
    commitment.sequenceRootPlanInstanceId,
    commitment.planningRulesFingerprint,
    commitment.runtimeInstanceId,
    commitment.turnKey,
  ]) {
    if (typeof value !== "string" || value.trim().length === 0) {
      issues.push("blank_identity");
    }
  }
  if (
    commitment.phases.length === 0 ||
    commitment.phases[0]?.root.planInstanceId !==
      commitment.sequenceRootPlanInstanceId
  ) {
    issues.push("sequence_root_mismatch");
  }
  if (
    !Number.isSafeInteger(commitment.cursor.phaseIndex) ||
    !Number.isSafeInteger(commitment.cursor.nodeIndex) ||
    commitment.cursor.phaseIndex < 0 ||
    commitment.cursor.nodeIndex < 0
  ) {
    issues.push("invalid_cursor");
  }
  const phase = commitment.phases[commitment.cursor.phaseIndex];
  const node = phase?.nodes[commitment.cursor.nodeIndex];
  if (
    commitment.status === "active" &&
    (!phase ||
      !node ||
      commitment.nextExpectedTransition.phaseId !== phase.phaseId ||
      commitment.nextExpectedTransition.nodeId !== node.nodeId ||
      commitment.nextExpectedTransition.routeKey !== node.invocation.routeKey)
  ) {
    issues.push("active_cursor_expectation_mismatch");
  }
  const nodeIds = commitment.phases.flatMap((candidate) =>
    candidate.nodes.map((entry) => entry.nodeId),
  );
  if (new Set(nodeIds).size !== nodeIds.length) {
    issues.push("duplicate_node_id");
  }
  if (
    commitment.phases.some((candidate) =>
      candidate.nodes.some(
        (entry) =>
          entry.expectation.nodeId !== entry.nodeId ||
          entry.invocation.routeKey !==
            turnPlanningFingerprint("committed-invocation-route", {
              semanticActionType: entry.invocation.semanticActionType,
              ...(entry.invocation.sourceCardInstanceId
                ? {
                    sourceCardInstanceId: entry.invocation.sourceCardInstanceId,
                  }
                : {}),
              ...(entry.invocation.sourceAbilityBinding
                ? {
                    sourceAbilityBinding: entry.invocation.sourceAbilityBinding,
                  }
                : {}),
              boundTargets: entry.invocation.boundTargets,
              boundChoices: entry.invocation.boundChoices,
            }),
      ),
    )
  ) {
    issues.push("invalid_committed_invocation");
  }
  const recursiveKeySet = new Set(
    recursiveKeys(commitment).map((key) => key.toLocaleLowerCase("en-US")),
  );
  if (recursiveKeySet.has("actionid")) {
    issues.push("future_action_id_forbidden");
  }
  if (
    recursiveKeySet.has("statehash") ||
    recursiveKeySet.has("gamestatehash") ||
    recursiveKeySet.has("fullstatehash")
  ) {
    issues.push("full_state_hash_forbidden");
  }
  if (issues.length > 0) {
    throw commitmentError("commitment_contract_invalid", issues);
  }
}

function continuationPreflight(params: {
  commitment: TurnPlanCommitment;
  rulesContext: PlanningRulesContext;
  runtimeInstanceId: string;
  turnKey: string;
  stateIdentity: PlanningStateIdentity;
  continuationEvidence: TurnPlanContinuationEvidence;
}):
  | Extract<TurnPlanRematerialization, { kind: "replan_required" }>
  | undefined {
  try {
    assertTurnPlanCommitment(params.commitment);
  } catch {
    return replanResult(
      structuredClone(params.commitment),
      "commitment_contract_invalid",
      ["commitment_contract_validation_failed"],
    );
  }
  const commitment = structuredClone(params.commitment);
  if (commitment.status !== "active") {
    return replanResult(commitment, "commitment_contract_invalid", [
      `commitment_status:${commitment.status}`,
    ]);
  }
  const restart = runtimeOrTurnReplan(
    commitment,
    params.runtimeInstanceId,
    params.turnKey,
  );
  if (restart) {
    return replanResult(commitment, restart.reason, [
      `observation:${restart.observation}`,
    ]);
  }
  if (params.rulesContext.fingerprint !== commitment.planningRulesFingerprint) {
    return replanResult(commitment, "rules_context_changed", [
      "planning_rules_fingerprint_changed",
    ]);
  }
  if (
    params.stateIdentity.stateVersion !==
      commitment.lastValidatedStateIdentity.stateVersion ||
    params.stateIdentity.sideSafePlanningFingerprint !==
      commitment.lastValidatedStateIdentity.sideSafePlanningFingerprint
  ) {
    return replanResult(commitment, "state_identity_stale", [
      "current_state_identity_not_last_validated",
    ]);
  }
  if (commitment.phaseEntry.status !== "validated") {
    return replanResult(commitment, "phase_entry_invalid", [
      `phase_entry_status:${commitment.phaseEntry.status}`,
    ]);
  }
  const hardEvidence = new Map(
    params.continuationEvidence.hardPlanCommitments.map((entry) => [
      entry.commitmentId,
      entry,
    ]),
  );
  const currentHardCommitmentId =
    commitment.phases[commitment.cursor.phaseIndex]?.hardPlanCommitmentId;
  if (
    currentHardCommitmentId !== undefined &&
    hardEvidence.get(currentHardCommitmentId)?.status !== "valid"
  ) {
    return replanResult(commitment, "hard_plan_commitment_invalid", [
      "hard_plan_commitment_revalidation_failed",
    ]);
  }
  const campaignEvidence = new Map(
    params.continuationEvidence.campaignRequotes.map((entry) => [
      entry.campaignId,
      entry,
    ]),
  );
  if (
    commitment.campaignIds.some(
      (id) => campaignEvidence.get(id)?.status !== "valid",
    )
  ) {
    return replanResult(commitment, "campaign_requote_invalid", [
      "campaign_requote_failed",
    ]);
  }
  return undefined;
}

function legalActionExpectationDrift(
  expectation: TurnPlanNodeExecutionExpectation,
  legalAction: LegalAction,
): TurnPlanReplanReason | undefined {
  if (
    expectation.actionType !== legalAction.type ||
    expectation.semanticActionFingerprint !==
      legalActionPartFingerprint(
        "turn-step-semantic-action",
        semanticLegalActionContract(legalAction),
      )
  ) {
    return "current_step_not_legal";
  }
  if (
    expectation.costFingerprint !==
    legalActionPartFingerprint("turn-step-costs", legalAction.costs)
  ) {
    return "material_cost_drift";
  }
  if (
    expectation.targetRequirementFingerprint !==
    legalActionPartFingerprint(
      "turn-step-target-requirements",
      legalAction.targetRequirements,
    )
  ) {
    return "material_target_drift";
  }
  if (
    expectation.choiceRequirementFingerprint !==
      legalActionPartFingerprint(
        "turn-step-choice-requirements",
        legalAction.choiceRequirements ?? [],
      ) ||
    expectation.payloadFingerprint !==
      legalActionPartFingerprint("turn-step-payload", legalAction.payload ?? {})
  ) {
    return "material_choice_drift";
  }
  return undefined;
}

function committedInvocationRoute(
  invocation: CanonicalLegalActionInvocation,
): CommittedInvocationRoute {
  const route = {
    semanticActionType: invocation.semanticActionType,
    ...(invocation.sourceCardInstanceId
      ? { sourceCardInstanceId: invocation.sourceCardInstanceId }
      : {}),
    ...(invocation.sourceAbilityBinding
      ? {
          sourceAbilityBinding: structuredClone(
            invocation.sourceAbilityBinding,
          ),
        }
      : {}),
    boundTargets: structuredClone(invocation.boundTargets),
    boundChoices: structuredClone(invocation.boundChoices),
  };
  return {
    ...route,
    routeKey: turnPlanningFingerprint("committed-invocation-route", route),
  };
}

function sameCommittedInvocation(
  committed: CommittedInvocationRoute,
  current: CanonicalLegalActionInvocation,
): boolean {
  return committed.routeKey === committedInvocationRoute(current).routeKey;
}

function sameInvocationFamily(
  committed: CommittedInvocationRoute,
  current: CanonicalLegalActionInvocation,
): boolean {
  return (
    committed.semanticActionType === current.semanticActionType &&
    committed.sourceCardInstanceId === current.sourceCardInstanceId &&
    canonicalTurnPlanningSerialize(committed.sourceAbilityBinding) ===
      canonicalTurnPlanningSerialize(current.sourceAbilityBinding)
  );
}

function classifyRouteDrift(
  committed: CommittedInvocationRoute,
  matches: readonly TurnPlanningHeadCandidate[],
): TurnPlanReplanReason {
  if (matches.length === 0) return "current_step_not_legal";
  if (
    matches.some(
      (head) =>
        canonicalTurnPlanningSerialize(head.invocation.boundTargets) !==
        canonicalTurnPlanningSerialize(committed.boundTargets),
    )
  ) {
    return "material_target_drift";
  }
  return "material_choice_drift";
}

function expectedTransition(
  phase: CommittedTurnPlanPhase,
  node: CommittedTurnPlanNode,
  cursor: { phaseIndex: number; nodeIndex: number },
): TurnPlanCommitment["nextExpectedTransition"] {
  const identity = {
    phaseId: phase.phaseId,
    nodeId: node.nodeId,
    routeKey: node.invocation.routeKey,
    cursor,
    expectedStateDeltaCodes: node.expectation.expectedStateDeltaCodes,
    expectedNextPlanningFingerprint:
      node.expectation.expectedNextPlanningFingerprint,
    boundaryAfter: node.boundaryAfter,
  };
  return {
    expectationId: turnPlanningFingerprint(
      "turn-plan-expected-transition",
      identity,
    ),
    phaseId: phase.phaseId,
    nodeId: node.nodeId,
    routeKey: node.invocation.routeKey,
    expectedStateDeltaCodes: structuredClone(
      node.expectation.expectedStateDeltaCodes,
    ),
    ...(node.boundaryAfter ? { boundaryAfter: node.boundaryAfter } : {}),
  };
}

function currentCommittedNode(
  commitment: TurnPlanCommitment,
): CommittedTurnPlanNode {
  const node =
    commitment.phases[commitment.cursor.phaseIndex]?.nodes[
      commitment.cursor.nodeIndex
    ];
  if (!node) {
    throw commitmentError("commitment_contract_invalid", [
      "current_node_missing",
    ]);
  }
  return node;
}

function runtimeOrTurnReplan(
  commitment: TurnPlanCommitment,
  runtimeInstanceId: string,
  turnKey: string,
):
  | {
      reason: Extract<
        TurnPlanReplanReason,
        "runtime_restarted" | "turn_changed"
      >;
      observation: Extract<
        TurnPlanObservationClass,
        "runtime_restarted" | "commitment_invalidated"
      >;
    }
  | undefined {
  if (runtimeInstanceId !== commitment.runtimeInstanceId) {
    return {
      reason: "runtime_restarted",
      observation: "runtime_restarted",
    };
  }
  if (turnKey !== commitment.turnKey) {
    return {
      reason: "turn_changed",
      observation: "commitment_invalidated",
    };
  }
  return undefined;
}

function replanResult(
  commitmentInput: TurnPlanCommitment,
  reason: TurnPlanReplanReason,
  evidenceCodes: string[],
): Extract<TurnPlanRematerialization, { kind: "replan_required" }> {
  const commitment = structuredClone(commitmentInput);
  commitment.status =
    reason === "runtime_restarted" ||
    reason === "rules_context_changed" ||
    reason === "turn_changed" ||
    reason === "scheduled_information_boundary" ||
    reason === "urgent_interrupt" ||
    reason === "material_outcome_deviation" ||
    reason === "material_cost_drift" ||
    reason === "material_target_drift" ||
    reason === "material_choice_drift"
      ? "replanned"
      : "invalidated";
  commitment.observationClass = observationForReplanReason(reason);
  commitment.replanReason = reason;
  return {
    kind: "replan_required",
    commitment,
    reason,
    evidenceCodes: sortedUnique(evidenceCodes),
  };
}

function continuationReplan(
  commitmentInput: TurnPlanCommitment,
  reason: TurnPlanReplanReason,
  observation: TurnPlanObservationClass,
): TurnPlanContinuationResult {
  const commitment = structuredClone(commitmentInput);
  commitment.status =
    observation === "commitment_invalidated" ? "invalidated" : "replanned";
  commitment.observationClass = observation;
  commitment.replanReason = reason;
  return {
    commitment,
    observationClass: observation,
    replanReason: reason,
    phaseEntryRequired: false,
  };
}

function observationForReplanReason(
  reason: TurnPlanReplanReason,
): TurnPlanObservationClass {
  if (reason === "runtime_restarted") return "runtime_restarted";
  if (reason === "scheduled_information_boundary") {
    return "scheduled_information_boundary";
  }
  if (reason === "urgent_interrupt") return "urgent_interrupt";
  if (
    reason === "material_cost_drift" ||
    reason === "material_target_drift" ||
    reason === "material_choice_drift"
  ) {
    return "material_cost_or_target_drift";
  }
  if (reason === "material_outcome_deviation") {
    return "material_outcome_deviation";
  }
  return "commitment_invalidated";
}

function allConditionsSatisfied(
  conditions: readonly PlanConditionRef[],
  evidence: TurnPlanPhaseEntryEvidence,
): boolean {
  const satisfied = new Set(evidence.satisfiedConditionCodes);
  return conditions.every((condition) => satisfied.has(condition.code));
}

function sameStringSet(
  left: readonly string[],
  right: readonly string[],
): boolean {
  const sortedLeft = sortedUnique(left);
  const sortedRight = sortedUnique(right);
  return (
    sortedLeft.length === sortedRight.length &&
    sortedLeft.every((value, index) => value === sortedRight[index])
  );
}

function sortedUnique(values: readonly string[]): string[] {
  return [...new Set(values)].sort();
}

function legalActionPartFingerprint(namespace: string, value: unknown): string {
  return turnPlanningFingerprint(namespace, value);
}

function semanticLegalActionContract(action: LegalAction): unknown {
  return {
    side: action.side,
    type: action.type,
    source: action.source,
    timingPoint: action.timingPoint,
    abilityRef: action.abilityRef,
    effectRef: action.effectRef,
    resolvedEffects: action.resolvedEffects ?? [],
    visibility: action.visibility,
  };
}

function recursiveKeys(value: unknown): string[] {
  if (Array.isArray(value)) return value.flatMap(recursiveKeys);
  if (!value || typeof value !== "object") return [];
  return Object.entries(value).flatMap(([key, child]) => [
    key,
    ...recursiveKeys(child),
  ]);
}

function requireNonBlank(
  value: string,
  code: TurnPlanReplanReason,
  evidenceCodes: string[],
): void {
  if (value.trim().length === 0) {
    throw commitmentError(code, evidenceCodes);
  }
}

function commitmentError(
  code: TurnPlanReplanReason,
  evidenceCodes: string[],
): TurnPlanCommitmentError {
  return new TurnPlanCommitmentError(code, evidenceCodes);
}
