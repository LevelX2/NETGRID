import type {
  PlanAssessment,
  PriorityClass,
  PriorityClaim,
  ResourceGap,
} from "./plan-assessment";
import type {
  PlanBlocker,
  PlanInstance,
  PlanProposal,
} from "./plan-kernel-types";
import type { PlanSchedulerContext } from "./plan-scheduler";
import { PlanResolutionFailure } from "./plan-resolution-failure";

// Existing Runner lifecycle/priority defaults shared by core and vertical owners.
// Domain phases, values, routes and dispositions remain with their owner.
export function runnerPlanProposal(params: {
  moduleId: PlanProposal["moduleId"];
  dedupeKey: string;
  moduleState: unknown;
  priorityClass: PriorityClass;
  target?: PlanProposal["target"];
  routeExists: boolean;
  blockerCode: string;
  evidenceCode: string;
  evidenceCodes?: readonly string[];
  parentInstanceId?: string;
  parentNeedId?: string;
}): PlanProposal {
  const blockers: PlanBlocker[] = params.routeExists
    ? []
    : [
        {
          code: params.blockerCode,
          owner: "plan_module",
          removable: true,
          resumeCondition: { code: "compatible_route_available" },
        },
      ];
  return {
    moduleId: params.moduleId,
    moduleVersion: "1",
    dedupeKey: params.dedupeKey,
    side: "runner",
    strategyLineIds: [],
    executionClass:
      params.priorityClass === "P1" || params.priorityClass === "P2"
        ? "urgent_response"
        : params.priorityClass === "P3"
          ? "bounded_sequence"
          : "development_project",
    initialViability: params.routeExists ? "ready" : "blocked",
    persistencePolicy:
      params.priorityClass === "P2" || params.priorityClass === "P3"
        ? "locked_sequence"
        : "sticky_goal",
    retentionPolicy: {
      blockedStateVersionTtl: 2,
      dormantStateVersionTtl: 2,
      completedHistoryStateVersionTtl: 4,
      abandonWhenTargetMissing: params.target !== undefined,
      protectedWhileNeedOpen: true,
      protectedWhileCommitted: true,
    },
    ...(params.target ? { target: params.target } : {}),
    ...(params.parentInstanceId
      ? { parentInstanceId: params.parentInstanceId }
      : {}),
    ...(params.parentNeedId !== undefined
      ? { parentNeedId: params.parentNeedId }
      : {}),
    phase: moduleStatePhase(params.moduleState),
    milestone: "need_open",
    moduleState: structuredClone(params.moduleState),
    blockers,
    resumeConditions: [{ code: "compatible_route_available" }],
    completionConditions: [{ code: "need_satisfied" }],
    abandonmentConditions: [{ code: "need_disappeared" }],
    evidenceRefs: (params.evidenceCodes ?? [params.evidenceCode]).map(
      (code) => ({ code, source: "visible_state" as const }),
    ),
  };
}

export function runnerPlanAssessment(
  instance: PlanInstance,
  priorityClass: "P1" | "P2" | "P3" | "P4" | "P5" | "P6",
  routeExists: boolean,
  withinClassValue: number,
  currentExecutorId: string | undefined,
  resourceGaps: readonly ResourceGap[] = [],
): PlanAssessment {
  const priorityClaim: PriorityClaim =
    priorityClass === "P1"
      ? {
          requestedClass: "P1",
          reasonCode: "terminal_win",
          horizon: "current_turn",
          witness: {
            kind: "terminal_path",
            evidenceCode:
              instance.evidenceRefs[0]?.code ??
              "installed_agenda_terminal_score",
            guarantee: "rules_proven",
          },
        }
      : priorityClass === "P2"
        ? {
            requestedClass: "P2",
            reasonCode: "survival_threat",
            horizon: "current_turn",
            witness: {
              kind: "survival_threat",
              evidenceCode: instance.evidenceRefs[0]?.code ?? "visible_threat",
              guarantee: "visible_state_forced",
            },
          }
        : priorityClass === "P3"
          ? {
              requestedClass: "P3",
              reasonCode: "expiring_conversion",
              horizon: "current_turn",
            }
          : priorityClass === "P5"
            ? {
                requestedClass: "P5",
                reasonCode: "development_need",
                horizon: "multi_turn",
              }
            : priorityClass === "P4"
              ? {
                  requestedClass: "P4",
                  reasonCode: "strategic_campaign",
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
    priorityClaim,
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
            stepId: `${instance.instanceId}:${instance.phase}`,
            capability: instance.phase,
            purpose: "Execute the current module phase.",
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
      opponentCanReact: false,
      confidence: "visible_state_forced",
    },
    resourceGaps: resourceGaps.map((gap) => ({ ...gap })),
    expectedOutcome: {
      outcomeKind: "plan_progress",
      minimumValue: routeExists || resourceGaps.length > 0 ? 1 : 0,
      expectedValue: routeExists || resourceGaps.length > 0 ? 1 : 0,
      maximumValue: routeExists || resourceGaps.length > 0 ? 1 : 0,
      terminal: priorityClass === "P1",
      guarantee: "visible_state_forced",
    },
    continuity: {
      isCurrentForeground: currentExecutorId === instance.instanceId,
      sameObjectiveAsForeground: currentExecutorId === instance.instanceId,
      switchingCost: currentExecutorId === instance.instanceId ? 1 : 0,
      progressAtRisk: currentExecutorId === instance.instanceId ? 1 : 0,
    },
    blockers:
      routeExists || resourceGaps.length > 0
        ? []
        : structuredClone(instance.blockers),
    withinClassValue,
    evidenceCodes: instance.evidenceRefs.map((entry) => entry.code),
  };
}

function moduleStatePhase(moduleState: unknown): string {
  const value = moduleState as { phase?: string; kind?: string };
  if ("phase" in value && typeof value.phase === "string") return value.phase;
  return value.kind ?? "execute";
}

export function runnerPlanDomain<T>(context: PlanSchedulerContext): T {
  const value = context.domain as T | undefined;
  if (!value) {
    throw new PlanResolutionFailure("missing_plan_module_coverage", {
      side: context.input.side,
      stateVersion: context.input.playerView.stateVersion,
      timingPoint: context.input.playerView.timingPoint,
      legalActionTypes: context.input.legalActions.map((action) => action.type),
      owner: "plan_module",
      removalCondition:
        "Build the Runner core domain signals before discovering Runner plans.",
    });
  }
  return value;
}
