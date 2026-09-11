import { EconomyState } from "../corp/economy/economy-types";

import {
  CorpCorePlanDomain,
  DefenseState,
  RemoteState,
  ScoreState,
} from "./corp-core-plan-contracts";
import type {
  PlanAssessment,
  PriorityClaim,
  PriorityClass,
  ResourceGap,
} from "./plan-assessment";
import type { PlanInstance, PlanProposal } from "./plan-kernel-types";
import { PlanResolutionFailure } from "./plan-resolution-failure";
import type { PlanSchedulerContext } from "./plan-scheduler";

export function proposal(params: {
  moduleId: PlanProposal["moduleId"];
  dedupeKey: string;
  moduleState: unknown;
  priorityClass: PriorityClass;
  target: NonNullable<PlanProposal["target"]>;
  routeExists: boolean;
  evidenceCode: string;
  persistencePolicy?: PlanProposal["persistencePolicy"];
  parentInstanceId?: string;
  parentNeedId?: string;
  supportable?: boolean;
  blockerCode?: string;
  abandonWhenTargetMissing?: boolean;
  moduleVersion?: string;
  cadence?: PlanProposal["cadence"];
}): PlanProposal {
  return {
    moduleId: params.moduleId,
    moduleVersion: params.moduleVersion ?? "1",
    dedupeKey: params.dedupeKey,
    side: "corp",
    strategyLineIds: [],
    executionClass:
      params.priorityClass === "P1" || params.priorityClass === "P2"
        ? "urgent_response"
        : params.priorityClass === "P3"
          ? "bounded_sequence"
          : "development_project",
    initialViability:
      params.routeExists || params.supportable ? "ready" : "blocked",
    persistencePolicy: params.persistencePolicy ?? "sticky_goal",
    retentionPolicy: {
      blockedStateVersionTtl: 2,
      dormantStateVersionTtl: 2,
      completedHistoryStateVersionTtl: 4,
      abandonWhenTargetMissing: params.abandonWhenTargetMissing ?? true,
      protectedWhileNeedOpen: true,
      protectedWhileCommitted: true,
    },
    target: params.target,
    ...(params.parentInstanceId
      ? { parentInstanceId: params.parentInstanceId }
      : {}),
    ...(params.parentNeedId !== undefined
      ? { parentNeedId: params.parentNeedId }
      : {}),
    phase: modulePhase(params.moduleState),
    milestone: "admitted",
    moduleState: structuredClone(params.moduleState),
    blockers:
      params.routeExists || params.supportable
        ? []
        : [
            {
              code: params.blockerCode ?? "no_current_corp_route",
              owner: "plan_module",
              removable: true,
              resumeCondition: { code: "route_becomes_available" },
            },
          ],
    resumeConditions: [{ code: "route_becomes_available" }],
    completionConditions: [{ code: "domain_goal_satisfied" }],
    abandonmentConditions: [{ code: "target_invalidated" }],
    ...(params.cadence ? { cadence: { ...params.cadence } } : {}),
    evidenceRefs: [{ code: params.evidenceCode, source: "visible_state" }],
  };
}

export function assessment(
  instance: PlanInstance,
  priorityClass: "P1" | "P2" | "P3" | "P4" | "P5" | "P6",
  routeExists: boolean,
  value: number,
  executorId: string | undefined,
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
            evidenceCode: instance.evidenceRefs[0]?.code ?? "terminal_score",
            guarantee: "visible_state_forced",
            ...(instance.target ? { target: instance.target } : {}),
          },
        }
      : priorityClass === "P2"
        ? {
            requestedClass: "P2",
            reasonCode: "irreversible_threat",
            horizon: "current_turn",
            witness: {
              kind: "irreversible_threat",
              evidenceCode:
                instance.evidenceRefs[0]?.code ?? "visible_server_threat",
              guarantee: "visible_state_forced",
              ...(instance.target ? { target: instance.target } : {}),
            },
          }
        : priorityClass === "P3"
          ? {
              requestedClass: "P3",
              reasonCode: "expiring_conversion",
              horizon: "current_turn",
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
                  reasonCode: "required_parent_support",
                  horizon: "multi_turn",
                }
              : {
                  requestedClass: "P6",
                  reasonCode: "neutral_progress",
                  horizon: "current_turn",
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
    ...(routeExists
      ? {
          nextStepPreview: {
            stepId: `${instance.instanceId}:${instance.phase}`,
            capability: instance.phase,
            purpose: "Execute current Corp domain phase.",
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
      opponentCanReact: true,
      confidence: "visible_state_forced",
    },
    resourceGaps: resourceGaps.map((gap) => ({ ...gap })),
    expectedOutcome: {
      outcomeKind: "corp_plan_progress",
      minimumValue: routeExists || resourceGaps.length > 0 ? value : 0,
      expectedValue: routeExists || resourceGaps.length > 0 ? value : 0,
      maximumValue: routeExists || resourceGaps.length > 0 ? value : 0,
      terminal: priorityClass === "P1",
      guarantee: "visible_state_forced",
    },
    continuity: {
      isCurrentForeground: executorId === instance.instanceId,
      sameObjectiveAsForeground: executorId === instance.instanceId,
      switchingCost: executorId === instance.instanceId ? 3 : 0,
      progressAtRisk: executorId === instance.instanceId ? 3 : 0,
    },
    blockers:
      routeExists || resourceGaps.length > 0
        ? []
        : structuredClone(instance.blockers),
    withinClassValue: value,
    evidenceCodes: instance.evidenceRefs.map((entry) => entry.code),
  };
}

export function corpDomainIfAvailable(
  context: PlanSchedulerContext,
): CorpCorePlanDomain | undefined {
  const value = context.domain as CorpCorePlanDomain | undefined;
  return value?.scoreProjects &&
    value.remoteProjects &&
    value.defenseNeeds &&
    value.economyNeeds
    ? value
    : undefined;
}

export function domain(context: PlanSchedulerContext): CorpCorePlanDomain {
  const value = corpDomainIfAvailable(context);
  if (value) return value;
  throw new PlanResolutionFailure("missing_plan_module_coverage", {
    side: context.input.side,
    stateVersion: context.input.playerView.stateVersion,
    timingPoint: context.input.playerView.timingPoint,
    legalActionTypes: context.input.legalActions.map((action) => action.type),
    owner: "plan_module",
    removalCondition:
      "Build the Corp core domain before discovering Corp plans.",
  });
}

function modulePhase(moduleState: unknown): string {
  const value = moduleState as Partial<
    ScoreState | RemoteState | DefenseState | EconomyState
  >;
  if ("signal" in value && value.signal && "phase" in value.signal)
    return String(value.signal.phase);
  return value.kind ?? "execute";
}

export function state<T>(instance: PlanInstance): T {
  return instance.moduleState as T;
}

import type { ActionSemanticCandidate } from "../action-semantic-candidate-types";

export function candidateTargetIds(
  candidate: ActionSemanticCandidate,
): string[] {
  const selectedTargets =
    candidate.targetContext?.selectedTargets.map((target) => target.targetId) ??
    [];
  return [
    ...(selectedTargets.length > 0
      ? selectedTargets
      : (candidate.targetContext?.availableTargets?.map(
          (target) => target.targetId,
        ) ?? [])),
    ...(candidate.runProjectionSummary?.serverId
      ? [candidate.runProjectionSummary.serverId]
      : []),
  ];
}
