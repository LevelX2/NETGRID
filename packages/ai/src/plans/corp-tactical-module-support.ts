import type {
  GuaranteeLevel,
  PlanAssessment,
  PriorityClass,
  PriorityClaim,
  ResourceGap,
} from "./plan-assessment";
import type { PlanInstance, PlanProposal } from "./plan-kernel-types";
import type {
  PlanMaterialization,
  PlanSchedulerContext,
} from "./plan-scheduler";
import { PlanResolutionFailure } from "./plan-resolution-failure";
export function corpTacticalProposal(
  moduleId: PlanProposal["moduleId"],
  dedupeKey: string,
  moduleState: unknown,
  priorityClass: PriorityClass,
  candidates: PlanMaterialization["candidates"],
  evidenceCode: string | readonly string[],
  target: NonNullable<PlanProposal["target"]>,
  persistencePolicy: PlanProposal["persistencePolicy"],
  parentInstanceId?: string,
  parentNeedId?: string,
  blockerCode = "no_current_tactical_route",
  supportable = false,
): PlanProposal {
  const ready = candidates.length > 0;
  return {
    moduleId,
    moduleVersion: "1",
    dedupeKey,
    side: "corp",
    strategyLineIds: [],
    executionClass:
      priorityClass === "P1" || priorityClass === "P2"
        ? "urgent_response"
        : priorityClass === "P3"
          ? "bounded_sequence"
          : "development_project",
    initialViability: ready || supportable ? "ready" : "blocked",
    persistencePolicy,
    retentionPolicy: {
      blockedStateVersionTtl: 3,
      dormantStateVersionTtl: 4,
      completedHistoryStateVersionTtl: 4,
      abandonWhenTargetMissing: false,
      protectedWhileNeedOpen: true,
      protectedWhileCommitted: true,
    },
    target,
    ...(parentInstanceId ? { parentInstanceId } : {}),
    ...(parentNeedId ? { parentNeedId } : {}),
    phase: modulePhase(moduleState),
    milestone: "admitted",
    moduleState: structuredClone(moduleState),
    blockers:
      ready || supportable
        ? []
        : [
            {
              code: blockerCode,
              owner: "plan_module",
              removable: true,
              resumeCondition: { code: "route_becomes_available" },
            },
          ],
    resumeConditions: [{ code: "route_becomes_available" }],
    completionConditions: [{ code: "domain_goal_satisfied" }],
    abandonmentConditions: [{ code: "domain_invalidated" }],
    evidenceRefs: (typeof evidenceCode === "string"
      ? [evidenceCode]
      : evidenceCode
    ).map((code) => ({ code, source: "visible_state" as const })),
  };
}

export function corpTacticalAssessment(
  instance: PlanInstance,
  priorityClass: PriorityClass,
  routeExists: boolean,
  value: number,
  executorId: string | undefined,
  guarantee: GuaranteeLevel,
  terminalProjection = false,
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
            evidenceCode: instance.evidenceRefs[0]?.code ?? "terminal",
            guarantee,
            target: { kind: "player", id: "runner" },
          },
        }
      : priorityClass === "P2"
        ? {
            requestedClass: "P2",
            reasonCode: "irreversible_threat",
            horizon: "current_turn",
            witness: {
              kind: "irreversible_threat",
              evidenceCode: instance.evidenceRefs[0]?.code ?? "threat",
              guarantee,
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
                  horizon: "multi_turn",
                };
  return {
    instanceId: instance.instanceId,
    side: "corp",
    priorityClaim: claim,
    intentFit:
      priorityClass === "P4" || priorityClass === "P5" ? "aligned" : "none",
    readiness: routeExists
      ? "executable_now"
      : resourceGaps.length > 0
        ? "executable_with_support"
        : "blocked",
    feasibility: {
      currentRouteHeadPossible: routeExists,
      projectedActionCount: routeExists
        ? 1
        : resourceGaps.length > 0
          ? resourceGaps.length + 1
          : 0,
      opponentCanReact: guarantee !== "rules_proven",
      confidence: guarantee,
    },
    resourceGaps: resourceGaps.map((gap) => ({ ...gap })),
    expectedOutcome: {
      outcomeKind: terminalProjection
        ? "terminal_projection"
        : "domain_progress",
      minimumValue: routeExists || resourceGaps.length > 0 ? value : 0,
      expectedValue: routeExists || resourceGaps.length > 0 ? value : 0,
      maximumValue: routeExists || resourceGaps.length > 0 ? value : 0,
      terminal: terminalProjection,
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

export function corpTacticalPlanDomain<T>(context: PlanSchedulerContext): T {
  const value = context.domain as
    | (T & {
        virusPressure?: unknown;
        punishCampaigns?: unknown;
        ambushes?: unknown;
        handManagement?: unknown;
      })
    | undefined;
  if (
    value?.virusPressure &&
    value.punishCampaigns &&
    value.ambushes &&
    value.handManagement
  )
    return value;
  throw new PlanResolutionFailure("missing_plan_module_coverage", {
    side: context.input.side,
    stateVersion: context.input.playerView.stateVersion,
    timingPoint: context.input.playerView.timingPoint,
    legalActionTypes: context.input.legalActions.map((action) => action.type),
    owner: "plan_module",
    removalCondition:
      "Build the Corp tactical domain before discovering tactical plans.",
  });
}

function modulePhase(moduleState: unknown): string {
  const value = moduleState as Partial<{ kind: string; signal: object }>;
  if ("signal" in value && value.signal && "phase" in value.signal)
    return String(value.signal.phase);
  return value.kind ?? "execute";
}
