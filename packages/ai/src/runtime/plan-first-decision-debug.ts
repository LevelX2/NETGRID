import {
  AI_PLAN_FIRST_DECISION_DEBUG_SCHEMA_VERSION,
  AI_TURN_PLANNING_DEBUG_SCHEMA_VERSION,
  type AiDecisionInput,
  type AiPlanFirstDecisionDebug,
  type AiTurnPlanningDebug,
  type LegalAction,
} from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../action-semantic-candidate-types";
import { actionMatchesCurrentDecision } from "../actions/current-legal-action";
import { buildCorpDefenseTurnPlanningSlice } from "../corp/defense/corp-defense-turn-planning";
import { buildCorpAgendaTurnPlanningSlice } from "../corp/score/corp-agenda-turn-planning";
import { type CorpPlanDomain } from "../plans/corp-tactical-plan-contracts";
import {
  type PlanSchedulerContext,
  type PlanSchedulerResult,
} from "../plans/plan-scheduler";
import { type ResidentPlanPortfolio } from "../plans/resident-plan-portfolio";
import { runnerDelayedInstallReplanningBoundary } from "../plans/runner-delayed-install-replanning-boundary";
import { type RunnerPlanDomain } from "../plans/runner-tactical-plan-contracts";
import {
  buildCanonicalLegalActionInvocation,
  turnPlanningFingerprint,
} from "../plans/turn-planning-contracts";
import {
  applyCertifiedTurnProjectionDelta,
  assessTurnObservationBoundary,
  buildProjectedDecisionFrame,
  certifiedTurnProjectionDeltaFromCandidate,
} from "../plans/turn-projection";
import { runnerCentralPressureRunTracePurpose } from "../runner/central-pressure/central-pressure-plan-module";
import type { AiDecisionInputWithDeckCapabilities } from "./ai-decision-input";

export function planFirstDecisionDebug(params: {
  input: AiDecisionInput;
  context: PlanSchedulerContext;
  result: PlanSchedulerResult;
  planWindowKind: AiPlanFirstDecisionDebug["executionOrigin"]["windowKind"];
  action: LegalAction;
  planId: string;
  assessmentEvidenceCodes: readonly string[];
  turnPlanningDebug?: AiTurnPlanningDebug;
}): AiPlanFirstDecisionDebug {
  const strategicIntent = (params.input as AiDecisionInputWithDeckCapabilities)
    .ownStrategicIntentState;
  const base = {
    schemaVersion: AI_PLAN_FIRST_DECISION_DEBUG_SCHEMA_VERSION,
    stateVersion: params.input.playerView.stateVersion,
    strategicContext: {
      authority: "diagnostic_only" as const,
      ...(strategicIntent?.primaryStrategy.strategyId
        ? { primaryStrategyId: strategicIntent.primaryStrategy.strategyId }
        : {}),
      ...(strategicIntent?.phase ? { phase: strategicIntent.phase } : {}),
      signals: [],
    },
    dispositions: (params.context.actionDispositions ?? []).map(
      (disposition) => ({ ...disposition }),
    ),
  };
  if (params.result.lane === "engine_window") {
    return {
      ...base,
      lane: "engine_window",
      selectionAuthority: "engine_window",
      rootPlanInstanceId: params.result.origin.rootPlanInstanceId,
      leafExecutorInstanceId: params.result.origin.leafPlanInstanceId,
      executionOrigin: structuredClone(params.result.origin),
      selectedStep: {
        planInstanceId: params.result.origin.leafPlanInstanceId,
        stepId: params.result.origin.windowId,
      },
      engineWindowAction: {
        actionId: params.action.actionId,
        actionType: params.action.type,
        reasonCode:
          params.result.diagnostics.find((event) => event.stage === "window")
            ?.code ?? "engine_window_resolution",
      },
      engineQuoteEvidence: {
        status: "not_reported",
        evidenceCodes: [],
      },
      assessmentEvidenceCodes: [],
      portfolio: [],
    };
  }

  const selectedPlan = params.result.portfolio.instances.find(
    (instance) => instance.instanceId === params.planId,
  );
  if (!selectedPlan) {
    throw new Error("plan_first_selected_plan_instance_missing");
  }
  const rootPlanInstanceId =
    params.result.portfolio.rootForegroundInstanceId ?? params.planId;
  const leafPlanInstanceId =
    params.result.portfolio.executorInstanceId ?? params.planId;
  const assessment = params.result.selectedAssessment;
  const actionCandidate = params.context.actionCandidates.find(
    (candidate) => candidate.actionId === params.action.actionId,
  );
  const assessmentEvidenceCodes = uniquePlanFirstDebugCodes([
    ...params.assessmentEvidenceCodes,
    ...assessment.evidenceCodes,
    ...selectedPlan.evidenceRefs.map((reference) => reference.code),
    ...(actionCandidate?.evidence ?? []),
  ]);
  const quoteEvidenceCodes = assessmentEvidenceCodes.filter((code) =>
    /(?:quote|engine_certified|exact_(?:cost|payment|liquid)|cost_semantics)/i.test(
      code,
    ),
  );
  const quoteStatus: AiPlanFirstDecisionDebug["engineQuoteEvidence"]["status"] =
    quoteEvidenceCodes.some((code) =>
      /(?:unknown|missing|malformed|stale|incomplete|unsupported)/i.test(code),
    )
      ? "unknown"
      : quoteEvidenceCodes.some((code) =>
            /(?:engine_certified|quote.*(?:complete|certified)|exact_(?:cost|payment|liquid))/i.test(
              code,
            ),
          )
        ? "certified"
        : "not_reported";
  const priority = assessment.priorityValidation;
  const p6Contract =
    priority.effectiveClass === "P6"
      ? planFirstP6Contract(
          selectedPlan.moduleId,
          assessment.priorityClaim.reasonCode,
          assessmentEvidenceCodes,
        )
      : undefined;
  let turnPlanning = params.turnPlanningDebug;
  if (!turnPlanning) {
    try {
      turnPlanning = turnPlanningProjectionDebug({
        input: params.input,
        context: params.context,
        result: params.result,
        actionCandidate,
        selectedPlan,
      });
    } catch {
      // Runner projection remains diagnostic-only until its separate cutover.
      turnPlanning = undefined;
    }
  }
  const supportBinding = turnPlanning?.selectedLine.phases
    .flatMap((phase) => phase.supportBindings)
    .find((binding) => binding.planInstanceId === leafPlanInstanceId);
  const selectedRunQuote = selectedRunnerRunDebugQuote(
    params.input,
    params.context,
    params.action,
  );
  const selectedCentralRun =
    selectedPlan.moduleId === "runner.pressure_central"
      ? (params.context.domain as RunnerPlanDomain).runTargetEvaluations?.find(
          (evaluation) => evaluation.actionId === params.action.actionId,
        )
      : undefined;
  const centralRunPurpose = selectedCentralRun
    ? runnerCentralPressureRunTracePurpose(
        params.input,
        selectedCentralRun.runActionProjection,
      )
    : undefined;

  return {
    ...base,
    lane: "plan",
    selectionAuthority:
      params.turnPlanningDebug?.mode === "cutover"
        ? "turn_plan_commitment"
        : "resident_plan_instance",
    rootPlanInstanceId,
    leafExecutorInstanceId: leafPlanInstanceId,
    executionOrigin: {
      rootPlanInstanceId,
      leafPlanInstanceId,
      ...(params.result.portfolio.turnPlanCommitment?.commitmentId
        ? {
            commitmentId:
              params.result.portfolio.turnPlanCommitment.commitmentId,
          }
        : {}),
      side: params.input.side,
      windowKind: params.planWindowKind,
      windowId: decisionWindowId(
        params.input,
        params.result.route.head.semanticActionType,
      ),
      stateVersion: params.input.playerView.stateVersion,
      timingPoint: params.input.playerView.timingPoint,
    },
    selectedStep: {
      planInstanceId: params.result.route.planInstanceId,
      stepId: params.result.route.step.stepId,
      ...(selectedPlan.parentInstanceId
        ? { parentInstanceId: selectedPlan.parentInstanceId }
        : {}),
      ...((selectedPlan.parentNeedId ?? priority.needId)
        ? { needId: selectedPlan.parentNeedId ?? priority.needId }
        : {}),
      ...(supportBinding
        ? { supportAssignmentId: supportBinding.assignmentId }
        : {}),
    },
    ...(selectedRunQuote ? { selectedRunQuote } : {}),
    selectedPlan: planFirstDebugPlanInstance(selectedPlan),
    priority: {
      requestedClass: assessment.priorityClaim.requestedClass,
      effectiveClass: priority.effectiveClass,
      reasonCode: assessment.priorityClaim.reasonCode,
      horizon: assessment.priorityClaim.horizon,
      readiness: assessment.readiness,
      intentFit: assessment.intentFit,
      validationReasonCodes: [...priority.reasonCodes],
      ...(priority.delegatedFromPlanInstanceId
        ? {
            delegatedFromPlanInstanceId: priority.delegatedFromPlanInstanceId,
          }
        : {}),
      ...(priority.needId || selectedPlan.parentNeedId
        ? { parentNeedId: priority.needId ?? selectedPlan.parentNeedId }
        : {}),
      ...(assessment.priorityClaim.witness
        ? {
            witness: {
              kind: assessment.priorityClaim.witness.kind,
              evidenceCode: assessment.priorityClaim.witness.evidenceCode,
              guarantee: assessment.priorityClaim.witness.guarantee,
              ...(assessment.priorityClaim.witness.target
                ? { target: { ...assessment.priorityClaim.witness.target } }
                : {}),
            },
          }
        : {}),
      ...(p6Contract ? { p6Contract } : {}),
    },
    route: {
      planInstanceId: params.result.route.planInstanceId,
      stepId: params.result.route.step.stepId,
      capabilityId: params.result.route.step.capability.capabilityId,
      purpose: centralRunPurpose ?? params.result.route.step.purpose,
      actionId: params.result.route.head.actionId,
      actionType: params.result.route.head.actionType,
      semanticActionType: params.result.route.head.semanticActionType,
      stateVersion: params.result.route.head.stateVersion,
      ...((params.result.route.head.target ?? params.result.route.step.target)
        ? {
            target: {
              ...(params.result.route.head.target ??
                params.result.route.step.target)!,
            },
          }
        : {}),
      ...(params.result.route.continuation
        ? {
            continuation: {
              continuationId: params.result.route.continuation.continuationId,
              trigger: params.result.route.continuation.trigger,
              nextCapabilityId:
                params.result.route.continuation.nextCapability.capabilityId,
              purpose: params.result.route.continuation.purpose,
              ...(params.result.route.continuation.target
                ? { target: { ...params.result.route.continuation.target } }
                : {}),
            },
          }
        : {}),
    },
    strategicContext: {
      ...base.strategicContext,
      intentFit: assessment.intentFit,
      signals: (assessment.transientSignals ?? []).map((signal) => ({
        signalId: signal.signalId,
        kind: signal.kind,
        scope: signal.scope,
        planModuleId: signal.planModuleId,
        planDedupeKey: signal.planDedupeKey,
        evidenceCode: signal.evidenceCode,
        guarantee: signal.guarantee,
        ...(signal.target ? { target: { ...signal.target } } : {}),
      })),
    },
    engineQuoteEvidence: {
      status: quoteStatus,
      evidenceCodes: quoteEvidenceCodes,
    },
    assessmentEvidenceCodes,
    portfolio: params.result.portfolio.instances.map(
      planFirstDebugPlanInstance,
    ),
    ...(turnPlanning ? { turnPlanning } : {}),
  };
}

function turnPlanningProjectionDebug(params: {
  input: AiDecisionInput;
  context: PlanSchedulerContext;
  result: Extract<PlanSchedulerResult, { lane: "plan" }>;
  actionCandidate: ActionSemanticCandidate | undefined;
  selectedPlan: ResidentPlanPortfolio["instances"][number];
}): AiTurnPlanningDebug | undefined {
  const extendedInput = params.input as AiDecisionInputWithDeckCapabilities;
  const rulesContext = extendedInput.planningRulesContext;
  const stateIdentity = extendedInput.planningStateIdentity;
  const candidate = params.actionCandidate;
  if (!rulesContext || !stateIdentity || !candidate) {
    return undefined;
  }

  const turnKey = `${params.input.side}:turn:${
    params.input.playerView.turnSerial ?? "unknown"
  }`;
  const entryFrame = buildProjectedDecisionFrame({
    input: params.input,
    rulesContext,
    stateIdentity,
    turnKey,
  });
  const isDrawObservationBoundary =
    candidate.actionType === "draw_card" ||
    (candidate.economyProjection?.cardsDrawn !== undefined &&
      candidate.economyProjection.cardsDrawn > 0);
  const remainingCapacity = {
    minimum: Math.max(
      0,
      entryFrame.actionCapacityLedger.unrestricted.minimum -
        (candidate.costProfile.clickCost ?? 0),
    ),
    maximum: Math.max(
      0,
      entryFrame.actionCapacityLedger.unrestricted.maximum -
        (candidate.costProfile.clickCost ?? 0),
    ),
  };
  const boundary = isDrawObservationBoundary
    ? assessTurnObservationBoundary({
        boundaryKind: "private_observation",
        remainingActionCapacity: remainingCapacity,
        residualTurnValueBasis: "hand_quality_distribution",
        immediateOutcomeCodes: ["own_draw_identity_observed"],
        uncertainty: [{ code: "post_draw_replanning_required" }],
        assumptionIds: ["current_legal_action_remains_executable"],
      })
    : runnerDelayedInstallReplanningBoundary(
        params.input,
        candidate,
        remainingCapacity,
      );
  const projectedCandidate = {
    ...candidate,
    stateVersion: stateIdentity.stateVersion,
  };
  const delta = certifiedTurnProjectionDeltaFromCandidate({
    frame: entryFrame,
    candidate: projectedCandidate,
    ...(boundary ? { boundary } : {}),
  });
  const projectedFrame = applyCertifiedTurnProjectionDelta(entryFrame, delta);
  const invocation = buildCanonicalLegalActionInvocation({
    stateIdentity,
    semanticActionType: candidate.semanticActionType,
    ...(candidate.sourceCardInstanceId
      ? { sourceCardInstanceId: candidate.sourceCardInstanceId }
      : {}),
    ...(candidate.abilityId &&
    candidate.abilityBindingMethod === "canonical_capability_id"
      ? {
          sourceAbilityBinding: {
            kind: "card_spec_capability_key" as const,
            sourceAbilityId: candidate.abilityId,
          },
        }
      : {}),
  });
  const rootPlanInstanceId =
    params.result.portfolio.rootForegroundInstanceId ??
    params.selectedPlan.instanceId;
  const rootPlan =
    params.result.portfolio.instances.find(
      (instance) => instance.instanceId === rootPlanInstanceId,
    ) ?? params.selectedPlan;
  const agendaProject =
    params.input.side === "corp" && rootPlan.moduleId === "corp.score_agenda"
      ? (
          params.context.domain as CorpPlanDomain | undefined
        )?.scoreProjects.find(
          (project) => project.projectId === rootPlan.dedupeKey,
        )
      : undefined;
  const agendaSlice = agendaProject
    ? buildCorpAgendaTurnPlanningSlice({
        input: params.input,
        project: agendaProject,
        candidates: params.context.actionCandidates,
        ...((params.context.domain as CorpPlanDomain | undefined)?.defenseNeeds
          ? {
              defenseNeeds: (params.context.domain as CorpPlanDomain)
                .defenseNeeds,
            }
          : {}),
        ...((params.context.domain as CorpPlanDomain | undefined)?.economyNeeds
          ? {
              economyNeeds: (params.context.domain as CorpPlanDomain)
                .economyNeeds,
            }
          : {}),
        rulesContext,
        stateIdentity,
      })
    : undefined;
  const corpDomain =
    params.input.side === "corp"
      ? (params.context.domain as CorpPlanDomain | undefined)
      : undefined;
  const defenseSlice = corpDomain
    ? buildCorpDefenseTurnPlanningSlice({
        input: params.input,
        defenseNeeds: corpDomain.defenseNeeds,
        economyNeeds: corpDomain.economyNeeds,
        candidates: params.context.actionCandidates,
        stateIdentity,
      })
    : undefined;
  const supportBindings = params.selectedPlan.parentNeedId
    ? [
        {
          planInstanceId: params.selectedPlan.instanceId,
          parentNeedId: params.selectedPlan.parentNeedId,
          assignmentId: turnPlanningFingerprint("support-assignment", {
            planInstanceId: params.selectedPlan.instanceId,
            parentNeedId: params.selectedPlan.parentNeedId,
            turnKey,
          }),
        },
      ]
    : [];
  const nodeId = turnPlanningFingerprint("turn-node", {
    invocationKey: invocation.invocationKey,
    rootPlanInstanceId,
    leafPlanInstanceId: params.selectedPlan.instanceId,
  });
  const phaseId = turnPlanningFingerprint("turn-phase", {
    rootPlanInstanceId,
    leafPlanInstanceId: params.selectedPlan.instanceId,
    entryFrameKey: entryFrame.projectedFrameKey,
  });
  const lineId = turnPlanningFingerprint("turn-line", {
    phaseId,
    nodeId,
    projectedFrameKey: projectedFrame.projectedFrameKey,
  });

  return {
    schemaVersion: AI_TURN_PLANNING_DEBUG_SCHEMA_VERSION,
    mode: "projection_contract",
    stateVersion: stateIdentity.stateVersion,
    sideSafePlanningFingerprint: stateIdentity.sideSafePlanningFingerprint,
    planningRulesFingerprint: rulesContext.fingerprint,
    turnKey,
    heads: [
      {
        candidateId: `head:${candidate.actionId}`,
        moduleId: params.selectedPlan.moduleId,
        rootPlanInstanceId,
        actionId: candidate.actionId,
        semanticActionType: candidate.semanticActionType,
        invocationKey: invocation.invocationKey,
        witnessValid:
          candidate.actorSide === params.input.side &&
          candidate.stateVersion === stateIdentity.stateVersion &&
          params.input.legalActions.some(
            (action) =>
              action.actionId === candidate.actionId &&
              actionMatchesCurrentDecision(params.input, action),
          ),
      },
    ],
    selectedLine: {
      lineId,
      stopReason: boundary
        ? "observation_boundary"
        : "projection_not_supported",
      projectedFrameKey: projectedFrame.projectedFrameKey,
      cursor: { phaseIndex: 0, nodeIndex: 0 },
      phases: [
        {
          phaseId,
          rootPlanInstanceId,
          rootModuleId: rootPlan.moduleId,
          rootProvenance:
            params.selectedPlan.parentNeedId !== undefined
              ? "admitted_support"
              : "resident",
          entryFrameKey: entryFrame.projectedFrameKey,
          completionCode: boundary
            ? "observation_required"
            : "future_projection_not_yet_available",
          transitionKind: boundary
            ? "observation_boundary"
            : "projection_not_supported",
          supportBindings,
          nodes: [
            {
              nodeId,
              semanticActionType: candidate.semanticActionType,
              ...(boundary ? { boundaryAfter: boundary.boundaryKind } : {}),
            },
          ],
        },
      ],
    },
    commitment: {
      commitmentId: turnPlanningFingerprint(
        "prospective-turn-plan-commitment",
        {
          lineId,
          turnKey,
          stateIdentity,
          rulesFingerprint: rulesContext.fingerprint,
        },
      ),
      status: "prospective",
      cursor: {
        phaseIndex: 0,
        nodeIndex: 0,
        phaseId,
        nodeId,
      },
      phaseEntry: {
        phaseId,
        status: "projection_only",
        reasonCode: "commitment_not_bound_in_projection_mode",
      },
      rematerialization: {
        status: "not_attempted",
        reasonCode: "productive_cutover_not_active",
      },
      observationClass: boundary
        ? "scheduled_information_boundary"
        : "expected_no_material_change",
    },
    ...(boundary
      ? {
          boundary: {
            kind: boundary.boundaryKind,
            residualTurnValueBasis: boundary.residualTurnValueBasis,
            optionalityUnit: boundary.postBoundaryOptionality.unit,
            optionalityMinimum: boundary.postBoundaryOptionality.minimum,
            optionalityMaximum: boundary.postBoundaryOptionality.maximum,
          },
        }
      : {}),
    pruneEvents: [],
    evidenceCodes: [
      "turn_planning_projection_contract_only",
      ...(agendaSlice?.evidenceCodes ?? []),
      ...(defenseSlice?.evidenceCodes ?? []),
      ...(boundary
        ? ["observation_boundary_requires_replanning"]
        : ["future_projection_not_yet_available"]),
    ],
    ...(agendaSlice
      ? {
          agendaComparison: {
            opportunityKey: agendaSlice.opportunityKey,
            ...(agendaSlice.selectedFamily &&
            agendaSlice.randomizationEligibility === undefined
              ? { selectedFamily: agendaSlice.selectedFamily }
              : {}),
            selectionReason:
              agendaSlice.randomizationEligibility !== undefined
                ? "engine_randomization_pending"
                : agendaSlice.selectionReason,
            randomizationEligible:
              agendaSlice.randomizationEligibility !== undefined,
            lines: agendaSlice.lines.map((line) => ({
              lineId: line.lineId,
              family: line.family,
              actionCount: line.nodes.length,
              agendaProgress: line.evaluation.agendaProgress,
              defense: line.evaluation.defense,
              economy: line.evaluation.economy,
              risk: line.evaluation.risk,
              worstCaseFloor: line.evaluation.worstCaseFloor,
              expectedValue: line.evaluation.expectedValue,
            })),
          },
        }
      : {}),
    ...(defenseSlice &&
    (defenseSlice.lines.length > 0 || defenseSlice.rejected.length > 0)
      ? {
          defenseComparison: {
            ...(defenseSlice.selectedLineId
              ? { selectedLineId: defenseSlice.selectedLineId }
              : {}),
            lines: defenseSlice.lines.map((line) => ({
              lineId: line.lineId,
              targetServerId: line.targetServerId,
              disposition: line.disposition,
              actionCount: line.nodes.length,
              fundingGapBefore: line.fundingGapBefore,
              fundingGapAfter: line.fundingGapAfter,
              rezReadyAfterLine: line.rezReadyAfterLine,
              bluffValue: line.bluffValue,
              defenseValue: line.defenseValue,
              economyValue: line.economyValue,
              totalValue: line.totalValue,
            })),
            rejected: defenseSlice.rejected.map((entry) => ({ ...entry })),
          },
        }
      : {}),
  };
}

function planFirstDebugPlanInstance(
  instance: ResidentPlanPortfolio["instances"][number],
): AiPlanFirstDecisionDebug["portfolio"][number] {
  return {
    instanceId: instance.instanceId,
    dedupeKey: instance.dedupeKey,
    moduleId: instance.moduleId,
    moduleVersion: instance.moduleVersion,
    viability: instance.viability,
    portfolioRole: instance.portfolioRole,
    executionState: instance.executionState,
    persistencePolicy: instance.persistencePolicy,
    phase: instance.phase,
    milestone: instance.milestone,
    ...(instance.target ? { target: { ...instance.target } } : {}),
    ...(instance.parentInstanceId
      ? { parentInstanceId: instance.parentInstanceId }
      : {}),
    ...(instance.parentNeedId ? { parentNeedId: instance.parentNeedId } : {}),
    openNeedIds: [...instance.openNeedIds],
    blockers: instance.blockers.map((blocker) => blocker.code),
    evidenceCodes: instance.evidenceRefs.map((reference) => reference.code),
  };
}

function planFirstP6Contract(
  moduleId: string,
  reasonCode: string,
  evidenceCodes: readonly string[],
): NonNullable<AiPlanFirstDecisionDebug["priority"]>["p6Contract"] {
  if (reasonCode === "turn_completion" || moduleId.endsWith(".complete_turn")) {
    return "turn_completion";
  }
  if (
    evidenceCodes.some((code) =>
      code.includes("engine_certified_immediate_liquidity_development"),
    )
  ) {
    return "temporary_bounded_liquidity_transition";
  }
  return "bounded_plan_contract";
}

function uniquePlanFirstDebugCodes(codes: readonly string[]): string[] {
  return [...new Set(codes.filter((code) => code.trim().length > 0))];
}

function decisionWindowId(input: AiDecisionInput, semantic: string): string {
  const choiceId = input.playerView.pendingChoice?.choiceId;
  if (choiceId) return choiceId;
  if (
    (semantic.startsWith("run.") || semantic.startsWith("breaker.")) &&
    input.playerView.run?.runId
  ) {
    return String(input.playerView.run.runId);
  }
  return `${input.playerView.timingPoint}:${input.playerView.stateVersion}`;
}

function selectedRunnerRunDebugQuote(
  input: AiDecisionInput,
  context: PlanSchedulerContext,
  action: LegalAction,
): AiPlanFirstDecisionDebug["selectedRunQuote"] | undefined {
  if (input.side !== "runner" || action.type !== "start_run") return undefined;
  const domain = context.domain as RunnerPlanDomain;
  const evaluation = domain.runTargetEvaluations?.find(
    (candidate) => candidate.actionId === action.actionId,
  );
  if (!evaluation) return undefined;
  const pressure = domain.centralPressure.find(
    (signal) =>
      signal.runActionIds?.includes(action.actionId) === true ||
      signal.runActionValues?.[action.actionId] !== undefined,
  );
  const contest = domain.remoteContests.find(
    (signal) => signal.runActionAssessments[action.actionId] !== undefined,
  );
  const signal = pressure ?? contest;
  const routeValue =
    pressure?.runActionRouteDiagnostics?.[action.actionId] ??
    contest?.runActionAssessments[action.actionId]?.routeDiagnostic;
  const riskContract = signal?.runRiskContract;
  return {
    schemaVersion: "ai-selected-run-quote-v1",
    actionId: action.actionId,
    serverId: evaluation.targetServerId,
    targetKind: evaluation.targetKind,
    purpose:
      riskContract?.reserveQuote.purpose ??
      (signal?.purpose === "contest"
        ? "contest"
        : (signal?.purpose ?? "access")),
    recommendation: evaluation.recommendation,
    pathPassability: evaluation.pathPassability,
    pathCost: evaluation.pathCost,
    creditsBeforeRun: input.playerView.own.credits,
    creditsAfterRun: evaluation.creditsAfterRun,
    score: evaluation.score,
    reachable: signal?.reachable ?? evaluation.pathPassability === "reachable",
    runCommitment: evaluation.runCommitment,
    ...(signal?.supportNeedId ? { supportNeedId: signal.supportNeedId } : {}),
    ...(signal?.routePreparation
      ? { routePreparation: signal.routePreparation }
      : {}),
    ...(routeValue ? { routeValue: structuredClone(routeValue) } : {}),
    ...(evaluation.prerunReserveQuote
      ? { reserveQuote: structuredClone(evaluation.prerunReserveQuote) }
      : {}),
    ...(riskContract
      ? {
          riskContract: {
            schemaVersion: riskContract.schemaVersion,
            observedAtStateVersion: riskContract.observedAtStateVersion,
            unrezzedIceRisk: riskContract.unrezzedIceRisk,
            runnerCreditsAtEntry: riskContract.runnerCreditsAtEntry,
            runnerHandCountAtEntry: riskContract.runnerHandCountAtEntry,
            visibleDuringRunRezSupport: riskContract.visibleDuringRunRezSupport,
            reserveQuote: structuredClone(riskContract.reserveQuote),
            evidenceCodes: [...riskContract.evidenceCodes],
          },
        }
      : {}),
    evidenceCodes: [
      ...evaluation.evidence,
      ...(signal ? [signal.evidenceCode] : []),
    ],
  };
}
