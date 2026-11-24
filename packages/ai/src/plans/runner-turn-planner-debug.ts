import {
  AI_TURN_PLANNING_DEBUG_SCHEMA_VERSION,
  type AiDecisionInput,
  type AiTurnPlanningDebug,
} from "@netgrid/shared";
import type { PlanSchedulerPlanningRouteCandidate } from "./plan-scheduler";
import type { RunnerTurnPlanningCoverageReport } from "./runner-turn-planning-coverage";
import {
  turnPlanningFingerprint,
  type PlanningRulesContext,
  type PlanningStateIdentity,
  type TurnPlanningHeadCandidate,
} from "./turn-planning-contracts";
import type {
  TurnRemainderSearchLine,
  TurnRemainderSearchResult,
} from "./turn-remainder-search";

export function debugForRunnerPlanner(params: {
  input: AiDecisionInput;
  rulesContext: PlanningRulesContext;
  stateIdentity: PlanningStateIdentity;
  heads: TurnPlanningHeadCandidate[];
  records: readonly {
    head: TurnPlanningHeadCandidate;
    route: Pick<
      PlanSchedulerPlanningRouteCandidate,
      "instance" | "assessment" | "stepValue"
    >;
    dependencyCandidateIds: readonly string[];
  }[];
  coverage: RunnerTurnPlanningCoverageReport;
  search: TurnRemainderSearchResult;
  selectedLine: TurnRemainderSearchLine | undefined;
  liveActionId: string;
  selectedHead: TurnPlanningHeadCandidate | undefined;
  plannerSchemaVersion: string;
  authorityMode: "shadow" | "cutover";
}): AiTurnPlanningDebug {
  const selectedLine = params.selectedLine;
  const recordsById = new Map(
    params.records.map((record) => [record.head.candidateId, record]),
  );
  const headsById = new Map(
    params.heads.map((head) => [head.candidateId, head]),
  );
  const selectedCandidateIds = new Set(
    selectedLine?.steps.map((step) => step.candidateId),
  );
  const selectedBoundary =
    selectedLine?.stopReason === "observation_boundary"
      ? selectedLine.projectedFrame.pendingBoundary
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
    candidateAudit: {
      schemaVersion: "ai-turn-planning-candidate-audit-v1",
      provenance: "persisted_at_decision",
    },
    heads: params.heads.map((head) => {
      const record = recordsById.get(head.candidateId);
      const assessment = record?.route.assessment;
      return {
        candidateId: head.candidateId,
        moduleId: head.moduleId,
        rootPlanInstanceId: head.rootPlanInstanceId,
        ...(record
          ? { executorPlanInstanceId: record.route.instance.instanceId }
          : {}),
        actionId: head.currentBinding.actionId,
        semanticActionType: head.invocation.semanticActionType,
        invocationKey: head.invocation.invocationKey,
        witnessValid:
          head.executableWitness.sideSafePlanningFingerprint ===
          params.stateIdentity.sideSafePlanningFingerprint,
        selectedInLine: selectedCandidateIds.has(head.candidateId),
        rootEligible: (record?.dependencyCandidateIds.length ?? 0) === 0,
        dependencyCandidateIds: [...(record?.dependencyCandidateIds ?? [])],
        ...(assessment && record
          ? {
              assessment: {
                requestedPriorityClass: assessment.priorityClaim.requestedClass,
                effectivePriorityClass:
                  assessment.priorityValidation.effectiveClass,
                readiness: assessment.readiness,
                intentFit: assessment.intentFit,
                withinClassValue: assessment.withinClassValue,
                stepValue: record.route.stepValue,
                resourceGaps: assessment.resourceGaps.map((gap) => ({
                  needId: gap.needId,
                  capability: gap.capability,
                  minimum: gap.minimum,
                  available: gap.available,
                  deadline: gap.deadline,
                })),
                blockers: assessment.blockers.map((blocker) => ({
                  code: blocker.code,
                  owner: blocker.owner,
                  removable: blocker.removable,
                })),
                evidenceCodes: [...assessment.evidenceCodes],
              },
            }
          : {}),
      };
    }),
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
        (line.steps[0] &&
          headsById.get(line.steps[0].candidateId)?.currentBinding.actionId) ??
        "unavailable",
      rootPlanInstanceId: line.rootPlanInstanceId,
      stepCount: line.steps.length,
      scalarValue: line.scalarValue,
      upperBoundValue: line.upperBoundValue,
      partitionKey: line.partitionKey,
      priorityClass: line.priorityClass,
      stopReason: debugStopReason(line.stopReason),
      violatedObligationCount:
        line.priorityCoverage.violatedObligationIds.length,
      steps: line.steps.map((step) => ({
        candidateId: step.candidateId,
        semanticActionType: step.invocation.semanticActionType,
        rootPlanInstanceId: step.rootPlanInstanceId,
        nextMilestoneId: step.nextMilestoneId,
        actionId:
          headsById.get(step.candidateId)?.currentBinding.actionId ??
          "unavailable",
        ...(step.currentBinding
          ? { currentActionId: step.currentBinding.actionId }
          : {}),
      })),
      projectedEndState: {
        creditMinimum: line.projectedFrame.ownCredits.minimum,
        creditMaximum: line.projectedFrame.ownCredits.maximum,
        unrestrictedActionMinimum:
          line.projectedFrame.actionCapacityLedger.unrestricted.minimum,
        unrestrictedActionMaximum:
          line.projectedFrame.actionCapacityLedger.unrestricted.maximum,
        handMinimum: line.projectedFrame.ownHand.count.minimum,
        handMaximum: line.projectedFrame.ownHand.count.maximum,
        ...(line.projectedFrame.pendingBoundary
          ? {
              pendingBoundaryKind:
                line.projectedFrame.pendingBoundary.boundaryKind,
            }
          : {}),
      },
      evaluationValues: { ...line.evaluationValues },
      evidenceCodes: [...line.evidenceCodes],
    })),
    pruneEvents: params.search.pruneEvents.map((event) => ({
      candidateId: event.candidateId,
      reasonCode: event.reasonCode,
      partitionKey: event.partitionKey,
      ...(event.prefixLineId ? { prefixLineId: event.prefixLineId } : {}),
    })),
    evidenceCodes: [
      params.plannerSchemaVersion,
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
