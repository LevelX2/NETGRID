import type { AiDecisionInput, AiTurnPlanningDebug } from "@netgrid/shared";

import type { ActionSemanticCandidate } from "../action-semantic-candidate-types";
import type { CorpTurnPlannerShadowResult } from "./corp-turn-planner-shadow";
import type { RunnerTurnPlannerShadowResult } from "./runner-turn-planner-shadow";
import type { PlanConditionRef, PlanModuleId } from "./plan-kernel-types";
import { PlanResolutionFailure } from "./plan-resolution-failure";
import type { ResidentPlanPortfolio } from "./resident-plan-portfolio";
import {
  advanceTurnPlanCommitment,
  createTurnPlanCommitment,
  executionExpectationFromLegalAction,
  rematerializeCommittedTurnStep,
  validateCommittedTurnPhaseEntry,
  type TurnPlanCommitment,
  type TurnPlanExecutionLease,
  type TurnPlanNodeExecutionExpectation,
  type TurnPlanReplanReason,
} from "./turn-plan-commitment";
import {
  TURN_PLAN_EVALUATION_REGISTRY_VERSION,
  TURN_PLANNING_CONTRACT_SCHEMA_VERSION,
  turnPlanningFingerprint,
  type PlanningRulesContext,
  type PlanningStateIdentity,
  type TurnPlan,
  type TurnPlanBoundary,
  type TurnPlanningHeadCandidate,
} from "./turn-planning-contracts";

export const CORP_TURN_PLANNER_CUTOVER_VERSION =
  "corp-turn-planner-cutover-v1" as const;
export const TURN_PLANNER_CUTOVER_VERSION = "turn-planner-cutover-v2" as const;

type TurnPlannerShadowResult =
  | CorpTurnPlannerShadowResult
  | RunnerTurnPlannerShadowResult;

export type TurnPlannerCutoverResult = {
  planner: TurnPlannerShadowResult;
  head: TurnPlanningHeadCandidate;
  selectedPlanInstanceId: string;
  commitment: TurnPlanCommitment;
  lease: TurnPlanExecutionLease;
  debug: AiTurnPlanningDebug;
  replanReason?: TurnPlanReplanReason;
};

export type CorpTurnPlannerCutoverResult = TurnPlannerCutoverResult;

export function resolveCorpTurnPlannerCutover(params: {
  input: AiDecisionInput;
  planner: CorpTurnPlannerShadowResult;
  portfolio: ResidentPlanPortfolio;
  candidates: readonly ActionSemanticCandidate[];
  rulesContext: PlanningRulesContext;
  stateIdentity: PlanningStateIdentity;
  runtimeInstanceId: string;
}): CorpTurnPlannerCutoverResult {
  return resolveTurnPlannerCutover(params);
}

export function resolveTurnPlannerCutover(params: {
  input: AiDecisionInput;
  planner: TurnPlannerShadowResult;
  portfolio: ResidentPlanPortfolio;
  candidates: readonly ActionSemanticCandidate[];
  rulesContext: PlanningRulesContext;
  stateIdentity: PlanningStateIdentity;
  runtimeInstanceId: string;
}): TurnPlannerCutoverResult {
  requireCutoverReady(params);
  const turnKey = `${params.input.side}:turn:${params.input.playerView.turnSerial ?? "unknown"}`;
  const continuation = continueResidentCommitment({
    ...params,
    turnKey,
  });
  if (continuation?.kind === "executable") {
    const selectedPlanInstanceId = planInstanceIdForHead(
      continuation.head,
      params.planner,
    );
    return {
      planner: params.planner,
      head: continuation.head,
      selectedPlanInstanceId,
      commitment: continuation.commitment,
      lease: continuation.lease,
      debug: cutoverDebug(
        params.planner.debug,
        continuation.commitment,
        continuation.lease,
        continuation.head,
        continuation.replanReason,
      ),
      ...(continuation.replanReason
        ? { replanReason: continuation.replanReason }
        : {}),
    };
  }

  const created = createCurrentCommitment({
    ...params,
    turnKey,
  });
  return {
    planner: params.planner,
    head: created.head,
    selectedPlanInstanceId: created.selectedPlanInstanceId,
    commitment: created.commitment,
    lease: created.lease,
    debug: cutoverDebug(
      params.planner.debug,
      created.commitment,
      created.lease,
      created.head,
      continuation?.reason,
    ),
    ...(continuation?.reason ? { replanReason: continuation.reason } : {}),
  };
}

function continueResidentCommitment(params: {
  input: AiDecisionInput;
  planner: TurnPlannerShadowResult;
  portfolio: ResidentPlanPortfolio;
  candidates: readonly ActionSemanticCandidate[];
  rulesContext: PlanningRulesContext;
  stateIdentity: PlanningStateIdentity;
  runtimeInstanceId: string;
  turnKey: string;
}):
  | {
      kind: "executable";
      commitment: TurnPlanCommitment;
      lease: TurnPlanExecutionLease;
      head: TurnPlanningHeadCandidate;
      replanReason?: TurnPlanReplanReason;
    }
  | { kind: "replan"; reason: TurnPlanReplanReason }
  | undefined {
  const resident = params.portfolio.turnPlanCommitment;
  const pendingLease = params.portfolio.turnPlanExecutionLease;
  if (!resident) return undefined;
  let commitment = structuredClone(resident);
  if (
    commitment.status === "active" &&
    pendingLease &&
    params.stateIdentity.stateVersion > pendingLease.stateIdentity.stateVersion
  ) {
    const currentNode =
      commitment.phases[commitment.cursor.phaseIndex]?.nodes[
        commitment.cursor.nodeIndex
      ];
    if (!currentNode) {
      return { kind: "replan", reason: "commitment_contract_invalid" };
    }
    const advanced = advanceTurnPlanCommitment(commitment, {
      lease: pendingLease,
      runtimeInstanceId: params.runtimeInstanceId,
      turnKey: params.turnKey,
      stateIdentityAfter: params.stateIdentity,
      outcomeCodes: [...currentNode.expectation.expectedStateDeltaCodes],
    });
    commitment = advanced.commitment;
    if (advanced.replanReason) {
      return { kind: "replan", reason: advanced.replanReason };
    }
    if (advanced.phaseEntryRequired) {
      const phase = commitment.phases[commitment.cursor.phaseIndex];
      const phaseHead = phase
        ? params.planner.heads.find(
            (head) =>
              head.rootPlanInstanceId === phase.root.planInstanceId &&
              head.moduleId === phase.root.moduleId &&
              head.nextMilestoneId === phase.root.milestoneId,
          )
        : undefined;
      if (!phase || !phaseHead) {
        return { kind: "replan", reason: "phase_entry_invalid" };
      }
      const validated = validateCommittedTurnPhaseEntry(commitment, {
        runtimeInstanceId: params.runtimeInstanceId,
        turnKey: params.turnKey,
        stateIdentity: params.stateIdentity,
        phaseId: phase.phaseId,
        entryFrameKey: phaseEntryKey(phaseHead),
        rootAssessmentFingerprint: rootAssessmentKey(phaseHead),
        satisfiedConditionCodes: phase.entryConditions.map(
          (condition) => condition.code,
        ),
        supportAssignmentIds: phase.supportLeaves.map(
          (leaf) => leaf.assignmentId,
        ),
        resourceHandoffIds: [],
      });
      commitment = validated.commitment;
      if (validated.replanReason) {
        return { kind: "replan", reason: validated.replanReason };
      }
    }
  }
  if (commitment.status !== "active") {
    return {
      kind: "replan",
      reason:
        commitment.replanReason ??
        (commitment.status === "awaiting_observation"
          ? "scheduled_information_boundary"
          : "commitment_contract_invalid"),
    };
  }
  const rematerialized = rematerializeCommittedTurnStep({
    commitment,
    rulesContext: params.rulesContext,
    runtimeInstanceId: params.runtimeInstanceId,
    turnKey: params.turnKey,
    stateIdentity: params.stateIdentity,
    heads: params.planner.heads,
    legalActions: params.input.legalActions,
    continuationEvidence: continuationEvidence(commitment, params.portfolio),
  });
  if (rematerialized.kind === "replan_required") {
    return { kind: "replan", reason: rematerialized.reason };
  }
  return {
    kind: "executable",
    commitment: rematerialized.commitment,
    lease: rematerialized.lease,
    head: rematerialized.head,
  };
}

function createCurrentCommitment(params: {
  input: AiDecisionInput;
  planner: TurnPlannerShadowResult;
  portfolio: ResidentPlanPortfolio;
  candidates: readonly ActionSemanticCandidate[];
  rulesContext: PlanningRulesContext;
  stateIdentity: PlanningStateIdentity;
  runtimeInstanceId: string;
  turnKey: string;
}) {
  const line = params.planner.selectedLine;
  const head = params.planner.selectedHead;
  const selectedPlanInstanceId = params.planner.selectedPlanInstanceId;
  if (!line || !head || !selectedPlanInstanceId) {
    throw cutoverFailure(
      params.input,
      `A passing ${params.input.side} cutover requires one selected deterministic TurnPlan line and a current executable head.`,
    );
  }
  const plan = turnPlanFromLine({
    ...params,
    line,
  });
  const expectations = nodeExpectations(
    plan,
    params.input,
    params.planner,
    line,
  );
  const commitment = createTurnPlanCommitment({
    plan,
    rulesContext: params.rulesContext,
    runtimeInstanceId: params.runtimeInstanceId,
    nodeExpectations: expectations,
  });
  const rematerialized = rematerializeCommittedTurnStep({
    commitment,
    rulesContext: params.rulesContext,
    runtimeInstanceId: params.runtimeInstanceId,
    turnKey: params.turnKey,
    stateIdentity: params.stateIdentity,
    heads: [head],
    legalActions: params.input.legalActions,
    continuationEvidence: continuationEvidence(commitment, params.portfolio),
  });
  if (rematerialized.kind === "replan_required") {
    throw cutoverFailure(
      params.input,
      `The selected ${params.input.side} TurnPlan head must rematerialize before execution (${rematerialized.reason}; ${rematerialized.evidenceCodes.join(",")}).`,
    );
  }
  return {
    head: rematerialized.head,
    selectedPlanInstanceId,
    commitment: rematerialized.commitment,
    lease: rematerialized.lease,
  };
}

function turnPlanFromLine(params: {
  input: AiDecisionInput;
  planner: TurnPlannerShadowResult;
  portfolio: ResidentPlanPortfolio;
  candidates: readonly ActionSemanticCandidate[];
  rulesContext: PlanningRulesContext;
  stateIdentity: PlanningStateIdentity;
  runtimeInstanceId: string;
  turnKey: string;
  line: NonNullable<TurnPlannerShadowResult["selectedLine"]>;
}): TurnPlan {
  const groups: Array<{
    key: string;
    heads: TurnPlanningHeadCandidate[];
  }> = [];
  for (const step of params.line.steps) {
    const head = params.planner.heads.find(
      (candidate) => candidate.candidateId === step.candidateId,
    );
    if (!head) {
      throw cutoverFailure(
        params.input,
        "Every selected TurnPlan step must retain its validated head.",
      );
    }
    const key = `${head.rootPlanInstanceId}:${head.nextMilestoneId}`;
    const current = groups.at(-1);
    if (current?.key === key) current.heads.push(head);
    else groups.push({ key, heads: [head] });
  }
  const phases = groups.map((group, phaseIndex) => {
    const first = group.heads[0]!;
    const rootInstance = params.portfolio.instances.find(
      (instance) => instance.instanceId === first.rootPlanInstanceId,
    );
    const phaseId = turnPlanningFingerprint("cutover-turn-phase", {
      lineId: params.line.lineId,
      phaseIndex,
      rootPlanInstanceId: first.rootPlanInstanceId,
      nextMilestoneId: first.nextMilestoneId,
    });
    const nextGroup = groups[phaseIndex + 1];
    const boundary = boundaryForGroup(
      group,
      params.planner.debug,
      phaseIndex === groups.length - 1,
    );
    return {
      phaseId,
      root: {
        planInstanceId: first.rootPlanInstanceId,
        moduleId: first.moduleId,
        milestoneId: first.nextMilestoneId,
        provenance: "resident" as const,
      },
      ...(rootInstance?.commitmentId
        ? { hardPlanCommitmentId: rootInstance.commitmentId }
        : {}),
      rootAssessmentFingerprint: rootAssessmentKey(first),
      entryFrameKey: phaseEntryKey(first),
      entryConditions: [] as PlanConditionRef[],
      completionCondition: {
        code: `turn_plan_milestone:${first.nextMilestoneId}`,
      },
      supportLeaves: [],
      nodes: group.heads.map((head, nodeIndex) => ({
        nodeId: turnPlanningFingerprint("cutover-turn-node", {
          lineId: params.line.lineId,
          phaseIndex,
          nodeIndex,
          candidateId: head.candidateId,
        }),
        invocation: structuredClone(head.invocation),
        ...(phaseIndex === 0 && nodeIndex === 0
          ? { executionBinding: structuredClone(head.currentBinding) }
          : {}),
        expectedStateDeltaCodes: expectedDeltaCodes(head),
        ...(boundary && nodeIndex === group.heads.length - 1
          ? { boundaryAfter: boundary }
          : {}),
      })),
      protectedValueClaimIds: params.line.valueClaims
        .filter((claim) => claim.ownerModuleId === first.moduleId)
        .map((claim) => claim.claimId),
      transition: nextGroup
        ? {
            kind: "next_bound_phase" as const,
            nextPhaseId: turnPlanningFingerprint("cutover-turn-phase", {
              lineId: params.line.lineId,
              phaseIndex: phaseIndex + 1,
              rootPlanInstanceId: nextGroup.heads[0]!.rootPlanInstanceId,
              nextMilestoneId: nextGroup.heads[0]!.nextMilestoneId,
            }),
            reasonCode: "selected_turn_line_phase_transition",
            resourceHandoffIds: [],
          }
        : boundary
          ? { kind: "observation_boundary" as const }
          : params.line.stopReason === "turn_capacity_exhausted"
            ? { kind: "turn_end" as const }
            : { kind: "projected_plan_discovery_required" as const },
    };
  });
  return {
    schemaVersion: TURN_PLANNING_CONTRACT_SCHEMA_VERSION,
    planId: params.line.lineId,
    side: params.input.side,
    turnKey: params.turnKey,
    stateIdentity: structuredClone(params.stateIdentity),
    planningRulesFingerprint: params.rulesContext.fingerprint,
    evaluationRegistryVersion: TURN_PLAN_EVALUATION_REGISTRY_VERSION,
    phases,
    cursor: { phaseIndex: 0, nodeIndex: 0 },
    priorityObligations: params.line.priorityCoverage.requiredObligationIds.map(
      (obligationId) => ({
        obligationId,
        priorityClass:
          params.planner.selectedHead?.priorityClass === "P1" ||
          params.planner.selectedHead?.priorityClass === "P2" ||
          params.planner.selectedHead?.priorityClass === "P3"
            ? params.planner.selectedHead.priorityClass
            : ("P3" as const),
        sourcePlanInstanceId: params.line.rootPlanInstanceId,
        activatedAtFrameKey: params.stateIdentity.sideSafePlanningFingerprint,
        deadline: "current_turn_end",
        satisfactionCondition: {
          code: `turn_plan_obligation:${obligationId}`,
        },
        deferrable:
          params.line.priorityCoverage.deferredObligationIds.includes(
            obligationId,
          ),
        witnessId: turnPlanningFingerprint("cutover-obligation-witness", {
          obligationId,
          lineId: params.line.lineId,
        }),
        guarantee: "bounded" as const,
      }),
    ),
    priorityCoverage: structuredClone(params.line.priorityCoverage),
    campaignValueClaims: structuredClone(
      params.line.valueClaims.filter(
        (claim) =>
          phases.some((phase) => phase.root.moduleId === claim.ownerModuleId) &&
          params.portfolio.campaigns?.some(
            (campaign) =>
              campaign.campaignId === claim.campaignId &&
              campaign.status === "continuable",
          ),
      ),
    ),
  };
}

function nodeExpectations(
  plan: TurnPlan,
  input: AiDecisionInput,
  planner: TurnPlannerShadowResult,
  line: NonNullable<TurnPlannerShadowResult["selectedLine"]>,
): TurnPlanNodeExecutionExpectation[] {
  let stepIndex = 0;
  return plan.phases.flatMap((phase) =>
    phase.nodes.map((node) => {
      const step = line.steps[stepIndex++];
      const head = planner.heads.find(
        (candidate) => candidate.candidateId === step?.candidateId,
      );
      const legalAction = input.legalActions.find(
        (action) => action.actionId === head?.currentBinding.actionId,
      );
      if (!legalAction) {
        throw cutoverFailure(
          input,
          `TurnPlan node ${node.nodeId} has no current LegalAction contract for its expectation.`,
        );
      }
      return executionExpectationFromLegalAction({
        nodeId: node.nodeId,
        legalAction,
        expectedStateDeltaCodes: node.expectedStateDeltaCodes,
      });
    }),
  );
}

function expectedDeltaCodes(head: TurnPlanningHeadCandidate): string[] {
  return [
    `action_applied:${head.invocation.semanticActionType}`,
    `milestone_attempted:${head.nextMilestoneId}`,
  ];
}

function boundaryForGroup(
  group: { heads: TurnPlanningHeadCandidate[] },
  debug: AiTurnPlanningDebug,
  finalGroup: boolean,
): TurnPlanBoundary | undefined {
  if (!finalGroup || debug.selectedLine.stopReason !== "observation_boundary") {
    return undefined;
  }
  const debugBoundary = debug.selectedLine.phases
    .flatMap((phase) => phase.nodes)
    .find(
      (node) =>
        node.semanticActionType ===
          group.heads.at(-1)?.invocation.semanticActionType &&
        node.boundaryAfter !== undefined,
    )?.boundaryAfter;
  return isTurnPlanBoundary(debugBoundary)
    ? debugBoundary
    : "projection_not_supported";
}

function isTurnPlanBoundary(value: unknown): value is TurnPlanBoundary {
  return [
    "private_observation",
    "public_random_outcome",
    "opponent_response_window",
    "engine_continuation",
    "projection_not_supported",
  ].includes(String(value));
}

function continuationEvidence(
  commitment: TurnPlanCommitment,
  portfolio: ResidentPlanPortfolio,
) {
  return {
    hardPlanCommitments: commitment.hardPlanCommitmentIds.map(
      (commitmentId) => ({
        commitmentId,
        status: portfolio.instances.some(
          (instance) =>
            instance.commitmentId === commitmentId &&
            instance.viability === "ready",
        )
          ? ("valid" as const)
          : ("invalid" as const),
        evidenceCodes: ["resident_plan_commitment_revalidated"],
      }),
    ),
    campaignRequotes: commitment.campaignIds.map((campaignId) => {
      const campaign = portfolio.campaigns?.find(
        (entry) => entry.campaignId === campaignId,
      );
      return {
        campaignId,
        status:
          campaign?.status === "completed"
            ? ("completed" as const)
            : campaign?.status === "continuable"
              ? ("valid" as const)
              : ("invalid" as const),
        evidenceCodes: [
          campaign
            ? `resident_campaign_status:${campaign.status}`
            : "resident_campaign_missing",
        ],
      };
    }),
  };
}

function planInstanceIdForHead(
  head: TurnPlanningHeadCandidate,
  planner: TurnPlannerShadowResult,
): string {
  const exact = planner.headBindings.find(
    (binding) => binding.candidateId === head.candidateId,
  );
  if (!exact) {
    throw new Error("turn_planner_selected_plan_instance_missing");
  }
  return exact.planInstanceId;
}

function rootAssessmentKey(head: TurnPlanningHeadCandidate): string {
  return turnPlanningFingerprint("cutover-root-assessment", {
    rootPlanInstanceId: head.rootPlanInstanceId,
    moduleId: head.moduleId,
    milestoneId: head.nextMilestoneId,
  });
}

function phaseEntryKey(head: TurnPlanningHeadCandidate): string {
  return turnPlanningFingerprint("cutover-phase-entry", {
    rootPlanInstanceId: head.rootPlanInstanceId,
    moduleId: head.moduleId,
    milestoneId: head.nextMilestoneId,
  });
}

function cutoverDebug(
  source: AiTurnPlanningDebug,
  commitment: TurnPlanCommitment,
  lease: TurnPlanExecutionLease,
  head: TurnPlanningHeadCandidate,
  replanReason?: TurnPlanReplanReason,
): AiTurnPlanningDebug {
  const phase = commitment.phases[commitment.cursor.phaseIndex]!;
  const node = phase.nodes[commitment.cursor.nodeIndex]!;
  return {
    ...structuredClone(source),
    mode: "cutover",
    selectedLine: {
      lineId: commitment.sourcePlanId,
      stopReason:
        commitment.status === "awaiting_observation"
          ? "observation_boundary"
          : "bounded_search_horizon",
      projectedFrameKey:
        commitment.lastValidatedStateIdentity.sideSafePlanningFingerprint,
      cursor: structuredClone(commitment.cursor),
      phases: commitment.phases.map((entry) => ({
        phaseId: entry.phaseId,
        rootPlanInstanceId: entry.root.planInstanceId,
        rootModuleId: entry.root.moduleId,
        rootProvenance: entry.root.provenance,
        entryFrameKey: entry.entryFrameKey,
        completionCode: entry.completionCondition.code,
        transitionKind: entry.transition.kind,
        supportBindings: entry.supportLeaves.map((leaf) => ({
          planInstanceId: leaf.planInstanceId,
          parentNeedId: leaf.parentNeedId,
          assignmentId: leaf.assignmentId,
        })),
        nodes: entry.nodes.map((entryNode) => ({
          nodeId: entryNode.nodeId,
          semanticActionType: entryNode.invocation.semanticActionType,
          ...(entryNode.boundaryAfter
            ? { boundaryAfter: entryNode.boundaryAfter }
            : {}),
        })),
      })),
    },
    commitment: {
      commitmentId: commitment.commitmentId,
      status: commitment.status,
      cursor: {
        ...structuredClone(commitment.cursor),
        phaseId: phase.phaseId,
        nodeId: node.nodeId,
      },
      phaseEntry: {
        phaseId: commitment.phaseEntry.phaseId,
        status: commitment.phaseEntry.status,
        reasonCode: commitment.phaseEntry.reasonCode,
      },
      rematerialization: {
        status: "executable",
        actionId: head.currentBinding.actionId,
        leaseId: lease.leaseId,
        reasonCode: "committed_turn_step_rematerialized",
      },
      observationClass: source.boundary
        ? "scheduled_information_boundary"
        : commitment.observationClass,
      ...(replanReason
        ? { replanReason }
        : source.boundary
          ? { replanReason: "scheduled_information_boundary" }
          : {}),
    },
    ...(source.boundary ? { boundary: structuredClone(source.boundary) } : {}),
    shadowComparison: {
      liveActionId: source.shadowComparison?.liveActionId ?? "unavailable",
      shadowActionId: head.currentBinding.actionId,
      shadowRootPlanInstanceId: head.rootPlanInstanceId,
      ...(source.shadowComparison?.boundedBaselineActionId
        ? {
            boundedBaselineActionId:
              source.shadowComparison.boundedBaselineActionId,
          }
        : {}),
      agreement:
        source.shadowComparison?.liveActionId === head.currentBinding.actionId,
      comparisonClass:
        source.shadowComparison?.liveActionId === head.currentBinding.actionId
          ? "agreement"
          : "different_current_head",
      twoStepChangedHead:
        source.shadowComparison?.boundedBaselineActionId !== undefined &&
        source.shadowComparison.boundedBaselineActionId !==
          head.currentBinding.actionId,
    },
    evidenceCodes: [
      ...source.evidenceCodes.filter(
        (code) =>
          code !== "corp_turn_planner_shadow_only" &&
          code !== "runner_turn_planner_shadow_only" &&
          code !== "shadow_result_never_controls_live_action",
      ),
      TURN_PLANNER_CUTOVER_VERSION,
      ...(head.side === "corp"
        ? [CORP_TURN_PLANNER_CUTOVER_VERSION]
        : ["runner-turn-planner-cutover-v1"]),
      `${head.side}_turn_planner_cutover_authority`,
      "legacy_single_action_selection_comparison_only",
      ...(replanReason ? [`turn_plan_replanned:${replanReason}`] : []),
    ],
  };
}

function requireCutoverReady(params: {
  input: AiDecisionInput;
  planner: TurnPlannerShadowResult;
  stateIdentity: PlanningStateIdentity;
}): void {
  const coverage = params.planner.coverage;
  const selected = params.planner.selectedHead;
  if (
    (params.input.side !== "corp" && params.input.side !== "runner") ||
    coverage.status !== "pass" ||
    coverage.coveragePercent !== 100 ||
    coverage.missingActionCount !== 0 ||
    coverage.conflictingActionCount !== 0 ||
    !selected ||
    selected.currentBinding.stateVersion !==
      params.stateIdentity.stateVersion ||
    selected.executableWitness.sideSafePlanningFingerprint !==
      params.stateIdentity.sideSafePlanningFingerprint
  ) {
    throw cutoverFailure(
      params.input,
      `${params.input.side} TurnPlanner cutover requires 100% classified LegalActions and one current executable selected head; coverage=${coverage.status}/${coverage.coveragePercent}; issues=${coverage.issues
        .map(
          (issue) =>
            `${issue.code}:${issue.actionId ?? "global"}:${issue.moduleId ?? "none"}:${issue.detail}`,
        )
        .join("|")}; selected=${selected?.currentBinding.actionId ?? "none"}.`,
    );
  }
}

function cutoverFailure(
  input: AiDecisionInput,
  removalCondition: string,
): PlanResolutionFailure {
  return new PlanResolutionFailure("missing_plan_module_coverage", {
    side: input.side,
    stateVersion: input.playerView.stateVersion,
    timingPoint: input.playerView.timingPoint,
    legalActionTypes: input.legalActions.map((action) => action.type),
    unresolvedActionIds: input.legalActions.map((action) => action.actionId),
    owner: "plan_registry",
    removalCondition,
  });
}
