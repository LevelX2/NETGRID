import {
  AI_TURN_PLANNING_DEBUG_SCHEMA_VERSION,
  type AiDecision,
  type AiDecisionInput,
  type AiTurnPlanningDebug,
  type LegalAction,
} from "@netgrid/shared";

import type { ActionSemanticCandidate } from "../action-semantic-candidate-types";
import { currentTurnPlanningInvocationVariants } from "./corp-turn-planner-shadow";
import type { PlanModuleId } from "./plan-kernel-types";
import type { ResidentPlanPortfolio } from "./resident-plan-portfolio";
import {
  enumerateCurrentPlanSchedulerRoutes,
  type PlanSchedulerContext,
  type PlanSchedulerPlanningRouteCandidate,
  type PlanSchedulerResult,
  type SidePlanRegistry,
} from "./plan-scheduler";
import {
  compareValidatedPlanAssessments,
  type ValidatedPlanAssessment,
} from "./plan-assessment";
import type { PlanRouteStep, SemanticContinuation } from "./plan-route";
import { runnerCoveragePlanHandDisposition } from "./runner-core-plan-modules";
import { runnerDelayedInstallReplanningBoundary } from "./runner-delayed-install-replanning-boundary";
import {
  buildRunnerTurnPlanningCoverageReport,
  runnerTurnPlanningModuleCoverage,
  type RunnerTurnPlanningCoverageReport,
} from "./runner-turn-planning-coverage";
import {
  buildSemanticActionSetFingerprint,
  turnPlanningFingerprint,
  type CampaignMilestoneQuote,
  type PlanningRulesContext,
  type PlanningStateIdentity,
  type PriorityCoverage,
  type TurnPlanningHeadCandidate,
} from "./turn-planning-contracts";
import {
  applyCertifiedTurnProjectionDelta,
  assessTurnObservationBoundary,
  buildProjectedDecisionFrame,
  certifiedTurnProjectionDeltaFromCandidate,
  type BoundaryActionAssessment,
  type ProjectedDecisionFrame,
  type ProjectedHandDisposition,
} from "./turn-projection";
import {
  searchDeterministicRemainderTurnPlans,
  type TurnRemainderSearchLine,
  type TurnRemainderSearchOffer,
} from "./turn-remainder-search";

export const RUNNER_TURN_PLANNER_SHADOW_SCHEMA_VERSION =
  "runner-turn-planner-shadow-v1" as const;

type PlanningInput = AiDecisionInput & {
  planningRulesContext?: PlanningRulesContext;
  planningStateIdentity?: PlanningStateIdentity;
};

export type RunnerTurnPlannerShadowResult = {
  schemaVersion: typeof RUNNER_TURN_PLANNER_SHADOW_SCHEMA_VERSION;
  debug: AiTurnPlanningDebug;
  coverage: RunnerTurnPlanningCoverageReport;
  liveActionId: string;
  shadowActionId?: string;
  agreement: boolean;
  heads: TurnPlanningHeadCandidate[];
  lines: TurnRemainderSearchLine[];
  selectedLine?: TurnRemainderSearchLine;
  selectedHead?: TurnPlanningHeadCandidate;
  selectedPlanInstanceId?: string;
  headBindings: Array<{
    candidateId: string;
    planInstanceId: string;
    assessment: ValidatedPlanAssessment;
    step: PlanRouteStep;
    continuation?: SemanticContinuation;
  }>;
};

export function buildRunnerTurnPlannerShadow(params: {
  input: AiDecisionInput;
  context: PlanSchedulerContext;
  registry: SidePlanRegistry;
  runtimeResult: Extract<PlanSchedulerResult, { lane: "plan" }>;
  selectedChoicesForDecision: (
    input: AiDecisionInput,
    action: LegalAction,
    currentPortfolio?: ResidentPlanPortfolio,
  ) => AiDecision["selectedChoices"] | undefined;
  authorityMode?: "shadow" | "cutover";
}): RunnerTurnPlannerShadowResult | undefined {
  const input = params.input as PlanningInput;
  const rulesContext = input.planningRulesContext;
  const stateIdentity = input.planningStateIdentity;
  if (input.side !== "runner" || !rulesContext || !stateIdentity) {
    return undefined;
  }

  const enumeration = enumerateCurrentPlanSchedulerRoutes({
    context: params.context,
    registry: params.registry,
    portfolio: params.runtimeResult.portfolio,
  });
  const entryFrame = buildProjectedDecisionFrame({
    input,
    rulesContext,
    stateIdentity,
    turnKey: params.context.turnKey,
    handDispositions: runnerPlanHandDispositions(input),
  });
  const rawRecords = enumeration.candidates.flatMap((route) =>
    headsForRoute({
      input,
      stateIdentity,
      entryFrame,
      route,
      portfolio: params.runtimeResult.portfolio,
      moduleSelectedActionId: params.runtimeResult.route.head.actionId,
      selectedChoicesForDecision: params.selectedChoicesForDecision,
    }).map((head) => ({ head, route })),
  );
  const records = deduplicateHeadRecords(rawRecords);
  const heads = records.map((record) => record.head);
  const coveredActionIds = new Set(
    heads.map((head) => head.currentBinding.actionId),
  );
  const dispositions = runnerCoverageDispositions({
    existing: params.context.actionDispositions ?? [],
    candidates: params.context.actionCandidates,
    coveredActionIds,
  });
  const coverage = buildRunnerTurnPlanningCoverageReport({
    input,
    stateIdentity,
    candidates: params.context.actionCandidates,
    heads,
    dispositions,
    engineWindowActionIds: [],
  });
  const urgentPriorityClass = highestUrgentPriorityClass(heads);
  const offers = offersForHeads({
    input,
    heads,
    candidates: params.context.actionCandidates,
    urgentPriorityClass,
    moduleSelectedActionId: params.runtimeResult.route.head.actionId,
    protectedRootPlanInstanceId:
      params.runtimeResult.portfolio.turnPlanCommitment
        ?.sequenceRootPlanInstanceId,
  });
  const search = searchDeterministicRemainderTurnPlans({
    entryFrame,
    offers,
  });
  const selectedLine =
    search.lines.find((line) => line.lineId === search.selectedLineId) ??
    fallbackLine(heads, entryFrame, params.runtimeResult.route.head.actionId);
  const selectedHead = selectedLine?.steps[0]
    ? heads.find(
        (head) => head.candidateId === selectedLine.steps[0]!.candidateId,
      )
    : undefined;
  const selectedPlanInstanceId = selectedHead
    ? records.find(
        (record) => record.head.candidateId === selectedHead.candidateId,
      )?.route.instance.instanceId
    : undefined;
  const liveActionId = params.runtimeResult.route.head.actionId;
  const debug = debugForRunnerPlanner({
    input,
    rulesContext,
    stateIdentity,
    heads,
    coverage,
    search,
    selectedLine,
    liveActionId,
    selectedHead,
    candidates: params.context.actionCandidates,
    authorityMode: params.authorityMode ?? "shadow",
  });
  return {
    schemaVersion: RUNNER_TURN_PLANNER_SHADOW_SCHEMA_VERSION,
    debug,
    coverage,
    liveActionId,
    ...(selectedHead
      ? { shadowActionId: selectedHead.currentBinding.actionId }
      : {}),
    agreement: selectedHead?.currentBinding.actionId === liveActionId,
    heads: structuredClone(heads),
    lines: structuredClone(search.lines),
    ...(selectedLine ? { selectedLine: structuredClone(selectedLine) } : {}),
    ...(selectedHead ? { selectedHead: structuredClone(selectedHead) } : {}),
    ...(selectedPlanInstanceId ? { selectedPlanInstanceId } : {}),
    headBindings: records.map((record) => ({
      candidateId: record.head.candidateId,
      planInstanceId: record.route.instance.instanceId,
      assessment: structuredClone(record.route.assessment),
      step: structuredClone(record.route.step),
      ...(record.route.continuation
        ? { continuation: structuredClone(record.route.continuation) }
        : {}),
    })),
  };
}

function runnerCoverageDispositions(params: {
  existing: readonly NonNullable<
    PlanSchedulerContext["actionDispositions"]
  >[number][];
  candidates: readonly ActionSemanticCandidate[];
  coveredActionIds: ReadonlySet<string>;
}) {
  const dispositions = params.existing
    .filter((entry) => !params.coveredActionIds.has(entry.actionId))
    .map((entry) => structuredClone(entry));
  const classified = new Set([
    ...params.coveredActionIds,
    ...dispositions.map((entry) => entry.actionId),
  ]);
  for (const candidate of params.candidates) {
    if (classified.has(candidate.actionId)) continue;
    const ownerModuleId = candidate.semanticActionType.startsWith("search.")
      ? ("runner.rig_and_coverage" as const)
      : candidate.semanticActionType === "play.runner_event"
        ? ("runner.develop_board_and_hand" as const)
        : undefined;
    if (!ownerModuleId) continue;
    dispositions.push({
      actionId: candidate.actionId,
      disposition: "explicitly_nonproductive",
      ownerModuleId,
      evidenceCode: candidate.semanticActionType.startsWith("search.")
        ? "runner_search_has_no_current_bound_coverage_or_development_need"
        : "runner_event_has_no_current_bound_run_or_development_route",
    });
    classified.add(candidate.actionId);
  }
  return dispositions;
}

function headsForRoute(params: {
  input: AiDecisionInput;
  stateIdentity: PlanningStateIdentity;
  entryFrame: ProjectedDecisionFrame;
  route: PlanSchedulerPlanningRouteCandidate;
  portfolio: Extract<PlanSchedulerResult, { lane: "plan" }>["portfolio"];
  moduleSelectedActionId: string;
  selectedChoicesForDecision: (
    input: AiDecisionInput,
    action: LegalAction,
    currentPortfolio?: ResidentPlanPortfolio,
  ) => AiDecision["selectedChoices"] | undefined;
}): TurnPlanningHeadCandidate[] {
  const action = params.input.legalActions.find(
    (candidate) => candidate.actionId === params.route.candidate.actionId,
  );
  const moduleCoverage = runnerTurnPlanningModuleCoverage(
    params.route.instance.moduleId,
  );
  if (!action || !moduleCoverage) return [];
  const invocations = currentTurnPlanningInvocationVariants({
    stateIdentity: params.stateIdentity,
    action,
    candidate: params.route.candidate,
    selectedChoices: params.selectedChoicesForDecision(
      params.input,
      action,
      params.portfolio,
    ),
  });
  const rootPlanInstanceId = findRootPlanInstanceId(
    params.route.instance.instanceId,
    params.portfolio,
  );
  const semanticActionSetFingerprint = buildSemanticActionSetFingerprint(
    params.input.legalActions,
  );
  const campaignCapable =
    moduleCoverage.horizonCapability === "campaign_capable";
  return invocations.map((invocation) => {
    const nextMilestoneId = params.route.step.capability.capabilityId;
    const stepFingerprint = turnPlanningFingerprint(
      "runner-planning-head-step",
      {
        moduleId: params.route.instance.moduleId,
        planInstanceId: params.route.instance.instanceId,
        rootPlanInstanceId,
        step: params.route.step,
        invocationKey: invocation.invocationKey,
      },
    );
    const campaignQuote = campaignCapable
      ? runnerCampaignQuote({
          route: params.route,
          stateIdentity: params.stateIdentity,
          rootPlanInstanceId,
          nextMilestoneId,
        })
      : undefined;
    return {
      candidateId: turnPlanningFingerprint("runner-planning-head", {
        sideSafePlanningFingerprint:
          params.stateIdentity.sideSafePlanningFingerprint,
        rootPlanInstanceId,
        planInstanceId: params.route.instance.instanceId,
        stepFingerprint,
        invocationKey: invocation.invocationKey,
      }),
      side: "runner" as const,
      moduleId: params.route.instance.moduleId,
      rootPlanInstanceId,
      nextMilestoneId,
      stepFingerprint,
      horizonCapability: moduleCoverage.horizonCapability,
      instanceHorizon: campaignCapable
        ? ("multi_turn" as const)
        : ("current_turn" as const),
      priorityClass: params.route.assessment.priorityValidation.effectiveClass,
      invocation,
      currentBinding: {
        actionId: action.actionId,
        stateVersion: params.stateIdentity.stateVersion,
        semanticActionSetFingerprint,
        invocationKey: invocation.invocationKey,
      },
      executableWitness: {
        stateVersion: params.stateIdentity.stateVersion,
        sideSafePlanningFingerprint:
          params.stateIdentity.sideSafePlanningFingerprint,
        semanticActionSetFingerprint,
        stepFingerprint,
        invocationKey: invocation.invocationKey,
        quoteIds: campaignQuote ? [campaignQuote.quoteId] : [],
        safetyPolicyVersion: "runner-turn-planner-shadow-v1",
        allRouteDefiningChoicesBound: true,
      },
      ...(campaignQuote ? { campaignQuote } : {}),
      evaluationValues: runnerEvaluationValues(
        params.route,
        action.actionId === params.moduleSelectedActionId,
        params.entryFrame,
        params.route.candidate,
      ),
      valueClaims: [],
      evidenceCodes: [
        "runner_current_plan_module_head",
        ...runnerCandidateCleanupProjection(
          params.entryFrame,
          params.route.candidate,
        ).evidenceCodes,
        `runner_vertical_slice:${moduleCoverage.ownerKind}`,
        ...(params.route.continuation
          ? [
              "runner_run_plan_continuation_integrated_as_domain_context",
              "semantic_continuation_requires_real_state",
            ]
          : ["future_projection_not_supported"]),
        `plan_instance:${params.route.instance.instanceId}`,
        `root_plan_instance:${rootPlanInstanceId}`,
      ],
    };
  });
}

function runnerCampaignQuote(params: {
  route: PlanSchedulerPlanningRouteCandidate;
  stateIdentity: PlanningStateIdentity;
  rootPlanInstanceId: string;
  nextMilestoneId: string;
}): CampaignMilestoneQuote {
  const campaignId = turnPlanningFingerprint("runner-campaign", {
    rootPlanInstanceId: params.rootPlanInstanceId,
    moduleId: params.route.instance.moduleId,
    dedupeKey: params.route.instance.dedupeKey,
  });
  return {
    quoteId: turnPlanningFingerprint("runner-campaign-quote", {
      campaignId,
      stateVersion: params.stateIdentity.stateVersion,
      nextMilestoneId: params.nextMilestoneId,
    }),
    campaignId,
    quoteVersion: "runner-campaign-quote-v1",
    basis: {
      kind: "actual_state",
      stateVersion: params.stateIdentity.stateVersion,
      sideSafePlanningFingerprint:
        params.stateIdentity.sideSafePlanningFingerprint,
    },
    currentMilestoneId: params.route.instance.milestone,
    nextMilestoneId: params.nextMilestoneId,
    commitment: "soft",
    remainingValue: boundedUtility(
      params.route.assessment.withinClassValue + params.route.stepValue,
    ),
    expiresAt: "next_own_turn",
    revalidationCodes: [
      "runner_domain_plan_revalidated",
      "runner_run_context_revalidated",
    ],
  };
}

function runnerPlanHandDispositions(
  input: AiDecisionInput,
): ReadonlyMap<string, ProjectedHandDisposition> {
  return new Map(
    input.playerView.own.gripOrHq.flatMap((card) => {
      const disposition = runnerCoveragePlanHandDisposition(input, card);
      return disposition ? [[card.instanceId, disposition] as const] : [];
    }),
  );
}

function runnerCandidateCleanupProjection(
  entryFrame: ProjectedDecisionFrame,
  candidate: ActionSemanticCandidate,
): {
  requiredDiscards: number;
  handQualityAdjustment: number;
  evidenceCodes: string[];
} {
  try {
    const delta = certifiedTurnProjectionDeltaFromCandidate({
      frame: entryFrame,
      candidate,
    });
    const projected = applyCertifiedTurnProjectionDelta(entryFrame, delta);
    if (
      projected.actionCapacityLedger.unrestricted.maximum > 0 ||
      projected.actionCapacityLedger.restrictedTokens.some(
        (token) => token.remaining > 0,
      )
    ) {
      return {
        requiredDiscards: 0,
        handQualityAdjustment: 0,
        evidenceCodes: [
          "runner_cleanup_projection:future_action_capacity_remains",
        ],
      };
    }
    const requiredDiscards =
      projected.projectedCleanup.requiredDiscardRange.minimum;
    const protectedKnownCards = projected.ownHand.dispositions.filter(
      (entry) =>
        entry.disposition === "current_plan_route" ||
        entry.disposition === "support_for_need" ||
        entry.disposition === "campaign_hold",
    ).length;
    const unavoidableProtectedDiscards = Math.max(
      0,
      requiredDiscards -
        Math.max(0, projected.ownHand.count.minimum - protectedKnownCards),
    );
    const handQualityAdjustment = -(
      requiredDiscards * 500 +
      unavoidableProtectedDiscards * 2_000
    );
    return {
      requiredDiscards,
      handQualityAdjustment,
      evidenceCodes: [
        "runner_cleanup_projection:certified_turn_end",
        `runner_cleanup_projection:required_discards:${requiredDiscards}`,
        `runner_cleanup_projection:protected_known_cards:${protectedKnownCards}`,
        `runner_cleanup_projection:unavoidable_protected_discards:${unavoidableProtectedDiscards}`,
      ],
    };
  } catch {
    return {
      requiredDiscards: 0,
      handQualityAdjustment: 0,
      evidenceCodes: ["runner_cleanup_projection:not_certified"],
    };
  }
}

function runnerEvaluationValues(
  route: PlanSchedulerPlanningRouteCandidate,
  moduleSelected: boolean,
  entryFrame: ProjectedDecisionFrame,
  candidate: ActionSemanticCandidate,
): Record<string, number> {
  const ownerKind = runnerTurnPlanningModuleCoverage(
    route.instance.moduleId,
  )?.ownerKind;
  const dimension = {
    economy: "economy",
    breaker: "defense",
    defense: "defense",
    development: "hand_quality",
    run: "agenda_progress",
    multiaccess: "agenda_progress",
    agenda: "terminal_outcome",
    resource: "flexibility",
    turn_completion: "flexibility",
  }[ownerKind ?? "turn_completion"];
  const cleanupProjection = runnerCandidateCleanupProjection(
    entryFrame,
    candidate,
  );
  return {
    [dimension]: boundedUtility(
      route.assessment.withinClassValue + route.stepValue,
    ),
    ...(cleanupProjection.handQualityAdjustment !== 0
      ? { hand_quality: cleanupProjection.handQualityAdjustment }
      : {}),
    ...(moduleSelected && cleanupProjection.requiredDiscards === 0
      ? { continuity: 10_000 }
      : {}),
  };
}

function deduplicateHeadRecords<
  T extends {
    head: TurnPlanningHeadCandidate;
    route: PlanSchedulerPlanningRouteCandidate;
  },
>(records: readonly T[]): T[] {
  const unique = [
    ...[...records]
      .sort(
        (left, right) =>
          compareValidatedPlanAssessments(
            left.route.assessment,
            right.route.assessment,
          ) || left.head.candidateId.localeCompare(right.head.candidateId),
      )
      .reduce((byKey, record) => {
        const key = [
          record.head.currentBinding.actionId,
          record.head.moduleId,
          record.head.invocation.invocationKey,
        ].join(":");
        if (!byKey.has(key)) byKey.set(key, record);
        return byKey;
      }, new Map<string, T>())
      .values(),
  ];
  const authoritativeModuleByActionId = new Map<string, PlanModuleId>();
  for (const record of unique) {
    if (
      !authoritativeModuleByActionId.has(record.head.currentBinding.actionId)
    ) {
      authoritativeModuleByActionId.set(
        record.head.currentBinding.actionId,
        record.head.moduleId,
      );
    }
  }
  return unique.filter(
    (record) =>
      authoritativeModuleByActionId.get(record.head.currentBinding.actionId) ===
      record.head.moduleId,
  );
}

function offersForHeads(params: {
  input: AiDecisionInput;
  heads: readonly TurnPlanningHeadCandidate[];
  candidates: readonly ActionSemanticCandidate[];
  urgentPriorityClass: string | undefined;
  moduleSelectedActionId: string;
  protectedRootPlanInstanceId: string | undefined;
}): TurnRemainderSearchOffer[] {
  const candidateIdsByActionId = new Map<string, string[]>();
  for (const head of params.heads) {
    candidateIdsByActionId.set(head.currentBinding.actionId, [
      ...(candidateIdsByActionId.get(head.currentBinding.actionId) ?? []),
      head.candidateId,
    ]);
  }
  const urgentHeadIds = params.urgentPriorityClass
    ? params.heads
        .filter((head) => head.priorityClass === params.urgentPriorityClass)
        .map((head) => head.candidateId)
    : [];
  const selectedHeadIds = params.heads
    .filter(
      (head) => head.currentBinding.actionId === params.moduleSelectedActionId,
    )
    .map((head) => head.candidateId);
  const selectedHeadHasCertifiedCleanupHarm = params.heads.some(
    (head) =>
      head.currentBinding.actionId === params.moduleSelectedActionId &&
      (head.evaluationValues.hand_quality ?? 0) < 0 &&
      head.evidenceCodes.some((code) =>
        /^runner_cleanup_projection:required_discards:[1-9]\d*$/.test(code),
      ),
  );
  return params.heads.flatMap((head) => {
    const candidate = params.candidates.find(
      (entry) => entry.actionId === head.currentBinding.actionId,
    );
    if (!candidate) return [];
    const dependencyVariants =
      selectedHeadIds.length > 0 &&
      !selectedHeadHasCertifiedCleanupHarm &&
      head.rootPlanInstanceId !== params.protectedRootPlanInstanceId &&
      head.currentBinding.actionId !== params.moduleSelectedActionId
        ? selectedHeadIds.map((candidateId) => [candidateId])
        : params.urgentPriorityClass &&
            head.rootPlanInstanceId !== params.protectedRootPlanInstanceId &&
            head.priorityClass !== params.urgentPriorityClass
          ? urgentHeadIds.map((candidateId) => [candidateId])
          : [[]];
    return dependencyVariants.map((dependencyCandidateIds) => {
      const priorityCoverage = priorityCoverageForHead(
        params.urgentPriorityClass,
      );
      const boundary = boundaryForRunnerCandidate(params.input, candidate);
      const commutativeKey = commutativeGroupKey(candidate);
      return {
        head,
        candidate,
        moduleCandidatePreferenceRank:
          head.currentBinding.actionId === params.moduleSelectedActionId
            ? 1
            : 0,
        obligationSignature:
          priorityCoverage.requiredObligationIds.join(",") || "no_urgent",
        priorityCoverage,
        continuationScope: "same_root",
        ...(dependencyCandidateIds.length > 0
          ? { dependencyCandidateIds, rootEligible: false }
          : {}),
        incompatibleCandidateIds: (
          candidateIdsByActionId.get(head.currentBinding.actionId) ?? []
        )
          .filter((candidateId) => candidateId !== head.candidateId)
          .sort(),
        ...(commutativeKey
          ? {
              commutativeGroupKey: commutativeKey,
              commutativityCertified: true,
            }
          : {}),
        ...(boundary ? { boundaryAfter: boundary } : {}),
      };
    });
  });
}

function boundaryForRunnerCandidate(
  input: AiDecisionInput,
  candidate: ActionSemanticCandidate,
): BoundaryActionAssessment | undefined {
  const remainingActionCapacity = {
    minimum: Math.max(
      0,
      input.playerView.own.clicks - (candidate.costProfile.clickCost ?? 0),
    ),
    maximum: Math.max(
      0,
      input.playerView.own.clicks - (candidate.costProfile.clickCost ?? 0),
    ),
  };
  if (
    candidate.actionType === "draw_card" ||
    (candidate.economyProjection?.cardsDrawn ?? 0) > 0
  ) {
    return assessTurnObservationBoundary({
      boundaryKind: "private_observation",
      remainingActionCapacity,
      residualTurnValueBasis: "hand_quality_distribution",
      immediateOutcomeCodes: ["runner_draw_identity_observed"],
      uncertainty: [{ code: "post_draw_replanning_required" }],
      assumptionIds: ["runner_draw_route_executable"],
    });
  }
  if (
    candidate.semanticActionType === "run.start" ||
    candidate.actionType === "initiate_run"
  ) {
    return assessTurnObservationBoundary({
      boundaryKind: "opponent_response_window",
      remainingActionCapacity,
      residualTurnValueBasis: "remaining_capacity",
      immediateOutcomeCodes: ["runner_run_declared"],
      uncertainty: [{ code: "corp_rez_and_response_unknown" }],
      assumptionIds: ["runner_run_route_executable"],
    });
  }
  if (
    candidate.semanticActionType.startsWith("run.") ||
    candidate.semanticActionType.startsWith("access.") ||
    candidate.semanticActionType.startsWith("breaker.") ||
    candidate.semanticActionType.startsWith("icebreaker.")
  ) {
    return assessTurnObservationBoundary({
      boundaryKind: "engine_continuation",
      remainingActionCapacity,
      residualTurnValueBasis: "remaining_capacity",
      immediateOutcomeCodes: ["runner_run_step_applied"],
      uncertainty: [{ code: "run_state_revalidation_required" }],
      assumptionIds: ["runner_run_plan_context_current"],
    });
  }
  const delayedInstallBoundary = runnerDelayedInstallReplanningBoundary(
    input,
    candidate,
    remainingActionCapacity,
  );
  if (delayedInstallBoundary) return delayedInstallBoundary;
  if (
    candidate.randomBadPublicityModel?.randomOutcome ||
    candidate.actionCapacityProjection?.reliability === "random"
  ) {
    return assessTurnObservationBoundary({
      boundaryKind: "public_random_outcome",
      remainingActionCapacity,
      residualTurnValueBasis: "public_outcome_distribution",
      immediateOutcomeCodes: ["runner_public_random_result_observed"],
      uncertainty: [{ code: "post_random_replanning_required" }],
      assumptionIds: ["runner_random_route_executable"],
    });
  }
  return undefined;
}

function commutativeGroupKey(
  candidate: ActionSemanticCandidate,
): string | undefined {
  if (
    candidate.semanticActionType === "economy.gain_credit" &&
    candidate.sourceKind === "basic_action"
  ) {
    return "runner-basic-credit";
  }
  if (
    candidate.semanticActionType === "install.card" &&
    candidate.costProfile.costKnownStatus === "known"
  ) {
    return "runner-independent-current-install";
  }
  return undefined;
}

function highestUrgentPriorityClass(
  heads: readonly TurnPlanningHeadCandidate[],
): string | undefined {
  return heads
    .map((head) => head.priorityClass)
    .filter((priorityClass) => ["P1", "P2", "P3"].includes(priorityClass))
    .sort()[0];
}

function priorityCoverageForHead(
  urgentPriorityClass: string | undefined,
): PriorityCoverage {
  if (!urgentPriorityClass) {
    return {
      requiredObligationIds: [],
      satisfiedObligationIds: [],
      violatedObligationIds: [],
      deferredObligationIds: [],
    };
  }
  const obligationId = `priority-band:${urgentPriorityClass}`;
  return {
    requiredObligationIds: [obligationId],
    satisfiedObligationIds: [obligationId],
    violatedObligationIds: [],
    deferredObligationIds: [],
  };
}

function fallbackLine(
  heads: readonly TurnPlanningHeadCandidate[],
  entryFrame: ProjectedDecisionFrame,
  moduleSelectedActionId: string,
): TurnRemainderSearchLine | undefined {
  const head =
    heads.find(
      (candidate) =>
        candidate.currentBinding.actionId === moduleSelectedActionId,
    ) ?? heads[0];
  if (!head) return undefined;
  return {
    lineId: turnPlanningFingerprint("runner-turn-line-fallback", {
      candidateId: head.candidateId,
      projectedFrameKey: entryFrame.projectedFrameKey,
    }),
    partitionKey: `runner-fallback:${head.rootPlanInstanceId}`,
    obligationSignature: "fallback_current_head",
    rootPlanInstanceId: head.rootPlanInstanceId,
    nextMilestoneId: head.nextMilestoneId,
    priorityClass: head.priorityClass,
    steps: [
      {
        candidateId: head.candidateId,
        invocation: structuredClone(head.invocation),
        rootPlanInstanceId: head.rootPlanInstanceId,
        nextMilestoneId: head.nextMilestoneId,
        currentBinding: structuredClone(head.currentBinding),
      },
    ],
    projectedFrame: structuredClone(entryFrame),
    evaluationValues: structuredClone(head.evaluationValues),
    priorityCoverage: {
      requiredObligationIds: [],
      satisfiedObligationIds: [],
      violatedObligationIds: [],
      deferredObligationIds: [],
    },
    valueClaims: structuredClone(head.valueClaims),
    scalarValue: 0,
    upperBoundValue: 0,
    stopReason: "depth_limit",
    evidenceCodes: ["runner_current_head_fallback_line"],
  };
}

function debugForRunnerPlanner(params: {
  input: AiDecisionInput;
  rulesContext: PlanningRulesContext;
  stateIdentity: PlanningStateIdentity;
  heads: TurnPlanningHeadCandidate[];
  coverage: RunnerTurnPlanningCoverageReport;
  search: ReturnType<typeof searchDeterministicRemainderTurnPlans>;
  selectedLine: TurnRemainderSearchLine | undefined;
  liveActionId: string;
  selectedHead: TurnPlanningHeadCandidate | undefined;
  candidates: readonly ActionSemanticCandidate[];
  authorityMode: "shadow" | "cutover";
}): AiTurnPlanningDebug {
  const selectedLine = params.selectedLine;
  const finalStepHead = params.heads.find(
    (head) => head.candidateId === selectedLine?.steps.at(-1)?.candidateId,
  );
  const finalStepCandidate = params.candidates.find(
    (candidate) =>
      candidate.actionId === finalStepHead?.currentBinding.actionId,
  );
  const selectedBoundary =
    selectedLine?.stopReason === "observation_boundary" && finalStepCandidate
      ? boundaryForRunnerCandidate(params.input, finalStepCandidate)
      : undefined;
  const phaseId = selectedLine
    ? turnPlanningFingerprint("runner-debug-phase", {
        lineId: selectedLine.lineId,
      })
    : "runner-no-selected-line";
  return {
    schemaVersion: AI_TURN_PLANNING_DEBUG_SCHEMA_VERSION,
    mode: params.authorityMode,
    stateVersion: params.stateIdentity.stateVersion,
    sideSafePlanningFingerprint:
      params.stateIdentity.sideSafePlanningFingerprint,
    planningRulesFingerprint: params.rulesContext.fingerprint,
    turnKey: `runner:turn:${params.input.playerView.turnSerial ?? "unknown"}`,
    heads: params.heads.map((head) => ({
      candidateId: head.candidateId,
      moduleId: head.moduleId,
      rootPlanInstanceId: head.rootPlanInstanceId,
      actionId: head.currentBinding.actionId,
      semanticActionType: head.invocation.semanticActionType,
      invocationKey: head.invocation.invocationKey,
      witnessValid:
        head.executableWitness.sideSafePlanningFingerprint ===
        params.stateIdentity.sideSafePlanningFingerprint,
    })),
    selectedLine: {
      lineId: selectedLine?.lineId ?? "runner-no-selected-line",
      stopReason: debugStopReason(selectedLine?.stopReason),
      projectedFrameKey:
        selectedLine?.projectedFrame.projectedFrameKey ??
        params.stateIdentity.sideSafePlanningFingerprint,
      cursor: { phaseIndex: 0, nodeIndex: 0 },
      phases: selectedLine
        ? [
            {
              phaseId,
              rootPlanInstanceId: selectedLine.rootPlanInstanceId,
              rootModuleId:
                params.selectedHead?.moduleId ?? "runner.complete_turn",
              rootProvenance: "resident",
              entryFrameKey: params.stateIdentity.sideSafePlanningFingerprint,
              completionCode: `runner_turn_line:${selectedLine.nextMilestoneId}`,
              transitionKind:
                selectedLine.stopReason === "observation_boundary"
                  ? "observation_boundary"
                  : "projected_plan_discovery_required",
              supportBindings: [],
              nodes: selectedLine.steps.map((step, index) => {
                const boundaryAfter =
                  index === selectedLine.steps.length - 1 &&
                  selectedLine.stopReason === "observation_boundary"
                    ? (selectedBoundary?.boundaryKind ??
                      debugBoundaryForSemantic(
                        step.invocation.semanticActionType,
                      ))
                    : undefined;
                return {
                  nodeId: turnPlanningFingerprint("runner-debug-node", {
                    lineId: selectedLine.lineId,
                    index,
                    candidateId: step.candidateId,
                  }),
                  semanticActionType: step.invocation.semanticActionType,
                  ...(boundaryAfter ? { boundaryAfter } : {}),
                };
              }),
            },
          ]
        : [],
    },
    shadowComparison: {
      liveActionId: params.liveActionId,
      ...(params.selectedHead
        ? {
            shadowActionId: params.selectedHead.currentBinding.actionId,
            shadowRootPlanInstanceId: params.selectedHead.rootPlanInstanceId,
          }
        : {}),
      agreement:
        params.selectedHead?.currentBinding.actionId === params.liveActionId,
      comparisonClass:
        params.selectedHead?.currentBinding.actionId === params.liveActionId
          ? "agreement"
          : params.selectedHead
            ? "different_current_head"
            : "no_shadow_line",
      twoStepChangedHead: false,
    },
    ...(selectedBoundary
      ? {
          boundary: {
            kind: selectedBoundary.boundaryKind,
            residualTurnValueBasis: selectedBoundary.residualTurnValueBasis,
            optionalityUnit: selectedBoundary.postBoundaryOptionality.unit,
            optionalityMinimum:
              selectedBoundary.postBoundaryOptionality.minimum,
            optionalityMaximum:
              selectedBoundary.postBoundaryOptionality.maximum,
          },
        }
      : {}),
    coverage: {
      status: params.coverage.status,
      coveragePercent: params.coverage.coveragePercent,
      legalActionCount: params.coverage.legalActionCount,
      productiveActionCount: params.coverage.productiveActionCount,
      explicitlyNonproductiveActionCount:
        params.coverage.explicitlyNonproductiveActionCount,
      assessmentUnknownActionCount:
        params.coverage.assessmentUnknownActionCount,
      engineWindowActionCount: params.coverage.engineWindowActionCount,
      missingActionCount: params.coverage.missingActionCount,
      conflictingActionCount: params.coverage.conflictingActionCount,
      issueCodes: params.coverage.issues.map((issue) => issue.code),
      missingActionIds: params.coverage.actions
        .filter((action) => action.classification === "missing")
        .map((action) => action.actionId),
      conflictingActionIds: params.coverage.actions
        .filter((action) => action.classification === "conflicting")
        .map((action) => action.actionId),
    },
    search: {
      headCount: params.heads.length,
      lineCount: params.search.lines.length,
      expandedNodeCount: params.search.expandedNodeCount,
      protectedPartitionCount: params.search.protectedPartitionKeys.length,
      conservativeBaselineCount:
        params.search.conservativeBaselineLineIds.length,
      maximumDepth: params.search.budget.maximumDepth,
      maximumExpandedNodes: params.search.budget.maximumExpandedNodes,
      maximumBranchesPerPartition:
        params.search.budget.maximumBranchesPerPartition,
      maximumParetoLinesPerPartition:
        params.search.budget.maximumParetoLinesPerPartition,
      selectedLineScalarValue: selectedLine?.scalarValue ?? 0,
      selectedLineStepCount: selectedLine?.steps.length ?? 0,
    },
    consideredLines: params.search.lines.map((line) => ({
      lineId: line.lineId,
      firstActionId:
        params.heads.find(
          (head) => head.candidateId === line.steps[0]?.candidateId,
        )?.currentBinding.actionId ?? "unavailable",
      rootPlanInstanceId: line.rootPlanInstanceId,
      stepCount: line.steps.length,
      scalarValue: line.scalarValue,
      stopReason: debugStopReason(line.stopReason),
      violatedObligationCount:
        line.priorityCoverage.violatedObligationIds.length,
      steps: line.steps.map((step) => ({
        candidateId: step.candidateId,
        semanticActionType: step.invocation.semanticActionType,
        rootPlanInstanceId: step.rootPlanInstanceId,
        nextMilestoneId: step.nextMilestoneId,
        ...(step.currentBinding
          ? { currentActionId: step.currentBinding.actionId }
          : {}),
      })),
      evaluationValues: { ...line.evaluationValues },
      evidenceCodes: [...line.evidenceCodes],
    })),
    pruneEvents: params.search.pruneEvents.map((event) => ({
      candidateId: event.candidateId,
      reasonCode: event.reasonCode,
    })),
    evidenceCodes: [
      RUNNER_TURN_PLANNER_SHADOW_SCHEMA_VERSION,
      "runner_vertical_slices:economy,draw_install,run,breaker,multiaccess",
      "runner_run_plan_is_context_not_execution_authority",
      params.authorityMode === "cutover"
        ? "runner_turn_planner_cutover_candidate"
        : "runner_turn_planner_shadow_only",
    ],
  };
}

function debugBoundaryForSemantic(
  semanticActionType: string,
): string | undefined {
  if (semanticActionType === "draw.card") return "private_observation";
  if (semanticActionType === "run.start") return "opponent_response_window";
  if (
    semanticActionType.startsWith("run.") ||
    semanticActionType.startsWith("access.") ||
    semanticActionType.startsWith("breaker.") ||
    semanticActionType.startsWith("icebreaker.")
  ) {
    return "engine_continuation";
  }
  return undefined;
}

function debugStopReason(
  reason: TurnRemainderSearchLine["stopReason"] | undefined,
): AiTurnPlanningDebug["selectedLine"]["stopReason"] {
  if (reason === "turn_capacity_exhausted") return "projected_turn_end";
  if (reason === "observation_boundary") return "observation_boundary";
  if (reason === "search_complete") return "projected_plan_discovery_required";
  return "bounded_search_horizon";
}

function findRootPlanInstanceId(
  instanceId: string,
  portfolio: Extract<PlanSchedulerResult, { lane: "plan" }>["portfolio"],
): string {
  let current = portfolio.instances.find(
    (instance) => instance.instanceId === instanceId,
  );
  const visited = new Set<string>();
  while (current?.parentInstanceId && !visited.has(current.instanceId)) {
    visited.add(current.instanceId);
    current = portfolio.instances.find(
      (instance) => instance.instanceId === current?.parentInstanceId,
    );
  }
  return current?.instanceId ?? instanceId;
}

function boundedUtility(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(-10_000, Math.min(10_000, Math.round(value)));
}
