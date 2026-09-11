import type {
  GuaranteeLevel,
  PlanAssessment,
  PriorityClaim,
  PriorityClass,
  ResourceGap,
} from "./plan-assessment";
import type { PlanInstance, PlanProposal } from "./plan-kernel-types";
import { PlanResolutionFailure } from "./plan-resolution-failure";
import type { PlanSchedulerContext } from "./plan-scheduler";

// Existing tactical lifecycle and priority defaults; domain policy stays in owners.
export function runnerTacticalProposal(
  moduleId: PlanProposal["moduleId"],
  dedupeKey: string,
  moduleState: unknown,
  priorityClass: PriorityClass,
  strategyLineIds: string[],
  target: NonNullable<PlanProposal["target"]>,
  routeExists: boolean,
  evidenceCode: string,
  parentInstanceId?: string,
  options?: {
    phase?: string;
    blockerCode?: string;
    evidenceCodes?: string[];
  },
): PlanProposal {
  return {
    moduleId,
    moduleVersion: "1",
    dedupeKey,
    side: "runner",
    strategyLineIds,
    executionClass:
      priorityClass === "P1" || priorityClass === "P2"
        ? "urgent_response"
        : priorityClass === "P3"
          ? "bounded_sequence"
          : "strategic_campaign",
    initialViability: routeExists ? "ready" : "blocked",
    persistencePolicy:
      priorityClass === "P1" || priorityClass === "P3"
        ? "locked_sequence"
        : "sticky_goal",
    retentionPolicy: {
      blockedStateVersionTtl: 2,
      dormantStateVersionTtl: 2,
      completedHistoryStateVersionTtl: 4,
      abandonWhenTargetMissing: true,
      protectedWhileNeedOpen: true,
      protectedWhileCommitted: true,
    },
    target,
    ...(parentInstanceId ? { parentInstanceId } : {}),
    phase: options?.phase ?? "execute",
    milestone: "admitted",
    moduleState: structuredClone(moduleState),
    blockers: routeExists
      ? []
      : [
          {
            code: options?.blockerCode ?? "no_current_tactical_route",
            owner: "plan_module",
            removable: true,
            resumeCondition: { code: "route_becomes_available" },
          },
        ],
    resumeConditions: [{ code: "route_becomes_available" }],
    completionConditions: [{ code: "purpose_converted" }],
    abandonmentConditions: [
      { code: "target_invalidated" },
      { code: "marginal_value_exhausted" },
    ],
    evidenceRefs: [
      { code: evidenceCode, source: "visible_state" },
      ...(options?.evidenceCodes ?? []).map((code) => ({
        code,
        source: "visible_state" as const,
      })),
    ],
  };
}

export function runnerTacticalAssessment(
  instance: PlanInstance,
  priorityClass: "P1" | "P2" | "P3" | "P4" | "P5" | "P6",
  routeExists: boolean,
  value: number,
  executorId: string | undefined,
  p2Reason: "score_threat" | undefined = undefined,
  guarantee: GuaranteeLevel = "visible_state_forced",
  resourceGaps: readonly ResourceGap[] = [],
): PlanAssessment {
  const claim: PriorityClaim =
    priorityClass === "P1"
      ? {
          requestedClass: "P1",
          reasonCode: "terminal_win",
          horizon: "current_turn",
          witness: {
            kind: "terminal_path",
            evidenceCode:
              instance.evidenceRefs[0]?.code ?? "rules_proven_terminal_path",
            guarantee: "rules_proven",
            ...(instance.target ? { target: instance.target } : {}),
          },
        }
      : priorityClass === "P2"
        ? {
            requestedClass: "P2",
            reasonCode: p2Reason ?? "irreversible_threat",
            horizon: "current_turn",
            witness: {
              kind:
                p2Reason === "score_threat"
                  ? "score_threat"
                  : "irreversible_threat",
              evidenceCode: instance.evidenceRefs[0]?.code ?? "visible_threat",
              guarantee,
              ...(instance.target ? { target: instance.target } : {}),
            },
          }
        : priorityClass === "P3"
          ? {
              requestedClass: "P3",
              reasonCode: "expiring_conversion",
              horizon: "current_window",
            }
          : priorityClass === "P4"
            ? {
                requestedClass: "P4",
                reasonCode: "strategic_campaign",
                horizon: "multi_turn",
              }
            : priorityClass === "P5"
              ? {
                  requestedClass: "P5",
                  reasonCode: "development_need",
                  horizon: "multi_turn",
                }
              : {
                  requestedClass: "P6",
                  reasonCode: "neutral_progress",
                  horizon: "current_turn",
                };
  return {
    instanceId: instance.instanceId,
    side: "runner",
    priorityClaim: claim,
    intentFit:
      priorityClass === "P4" || priorityClass === "P5" ? "aligned" : "none",
    readiness: routeExists
      ? "executable_now"
      : resourceGaps.length > 0
        ? "executable_with_support"
        : "blocked",
    ...(routeExists
      ? {
          nextStepPreview: {
            stepId: `${instance.instanceId}:execute`,
            capability: instance.moduleId,
            purpose: "Execute admitted tactical purpose.",
          },
        }
      : {}),
    feasibility: {
      currentRouteHeadPossible: routeExists,
      projectedActionCount: routeExists
        ? 1
        : resourceGaps.length > 0
          ? resourceGaps.length + 1
          : 0,
      opponentCanReact: priorityClass !== "P3",
      confidence: guarantee,
    },
    resourceGaps: resourceGaps.map((gap) => ({ ...gap })),
    expectedOutcome: {
      outcomeKind: "tactical_progress",
      minimumValue: routeExists || resourceGaps.length > 0 ? value : 0,
      expectedValue: routeExists || resourceGaps.length > 0 ? value : 0,
      maximumValue: routeExists || resourceGaps.length > 0 ? value : 0,
      terminal: false,
      guarantee,
    },
    continuity: {
      isCurrentForeground: executorId === instance.instanceId,
      sameObjectiveAsForeground: executorId === instance.instanceId,
      switchingCost: executorId === instance.instanceId ? 2 : 0,
      progressAtRisk: executorId === instance.instanceId ? 2 : 0,
    },
    blockers:
      routeExists || resourceGaps.length > 0
        ? []
        : structuredClone(instance.blockers),
    withinClassValue: value,
    evidenceCodes: instance.evidenceRefs.map((entry) => entry.code),
  };
}

export function runnerTacticalPlanDomain<T>(context: PlanSchedulerContext): T {
  const value = context.domain as
    | (T & {
        terminalWins?: unknown;
        centralPressure?: unknown;
        remoteContests?: unknown;
        developments?: unknown;
        runWindows?: unknown;
      })
    | undefined;
  if (
    value?.terminalWins &&
    value.centralPressure &&
    value.remoteContests &&
    value.developments &&
    value.runWindows
  )
    return value;
  throw new PlanResolutionFailure("missing_plan_module_coverage", {
    side: context.input.side,
    stateVersion: context.input.playerView.stateVersion,
    timingPoint: context.input.playerView.timingPoint,
    legalActionTypes: context.input.legalActions.map((action) => action.type),
    owner: "plan_module",
    removalCondition:
      "Build the Runner tactical domain before discovering tactical plans.",
  });
}

import { type RunnerCorePlanDomain } from "./runner-core-plan-modules";
import { RunnerPlanDomain } from "./runner-tactical-plan-contracts";

export function exactRunnerParentSupportResourceGaps(
  context: PlanSchedulerContext,
  parent: PlanInstance,
  supportNeedId: string | undefined,
  currentRouteExists: boolean,
): ResourceGap[] {
  // A bound support need describes why the parent had no route. Once the
  // parent owns an executable route again, that historical need must not also
  // classify the same assessment as support-dependent.
  if (currentRouteExists) return [];
  if (supportNeedId === undefined) return [];
  const exactNeeds = domain(context).fundingNeeds.filter(
    (
      need,
    ): need is Extract<
      RunnerCorePlanDomain["fundingNeeds"][number],
      { kind: "parent_plan_support" }
    > =>
      need.kind === "parent_plan_support" &&
      need.needId === supportNeedId &&
      need.parentPlanInstanceId === parent.instanceId &&
      need.gap > 0,
  );
  if (exactNeeds.length === 1) {
    const [need] = exactNeeds;
    if (!need) return [];
    return [
      {
        needId: need.needId,
        capability: "credits",
        minimum: need.gap,
        available: 0,
        deadline:
          need.driver.kind === "development" ? "multi_turn" : "current_turn",
      },
    ];
  }
  const coverageGaps = domain(context).coverageGaps.filter(
    (gap) =>
      gap.gapId === supportNeedId &&
      gap.requesterPlanInstanceId === parent.instanceId &&
      gap.requesterNeedId === supportNeedId,
  );
  if (coverageGaps.length !== 1) return [];
  return [
    {
      needId: supportNeedId,
      capability: coverageGaps[0]!.requiredRole,
      minimum: 1,
      available: 0,
      deadline: "current_turn",
    },
  ];
}

export function domain(context: PlanSchedulerContext): RunnerPlanDomain {
  return runnerTacticalPlanDomain<RunnerPlanDomain>(context);
}

export function state<T>(instance: PlanInstance): T {
  return instance.moduleState as T;
}
