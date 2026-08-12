import type { Side } from "@netgrid/shared";
import type { PlanAssessment, PriorityClaim } from "./plan-assessment";
import type { PlanInstance, PlanProposal } from "./plan-kernel-types";
import type {
  PlanMaterialization,
  PlanModule,
  PlanSchedulerContext,
} from "./plan-scheduler";
import { isStandardEndTurnCandidate } from "./plan-scheduler";

type TurnCompletionState = {
  kind: "turn_completion";
  standardEndTurnActionIds: string[];
};

export function createTurnCompletionPlanModule(side: Side): PlanModule {
  const moduleId = `${side}.complete_turn` as const;
  return {
    moduleId,
    side,
    discover: (context) => {
      const candidates = standardEndTurnCandidates(context);
      if (candidates.length === 0 || !turnCompletionIsAdmissible(context)) {
        return [];
      }
      return [
        completionProposal(
          side,
          moduleId,
          candidates.map((candidate) => candidate.actionId),
          (context.actionDispositions ?? []).map((entry) => entry.evidenceCode),
        ),
      ];
    },
    assess: (instance, context, portfolio) => {
      const candidates = standardEndTurnCandidates(context);
      const routeExists =
        candidates.length > 0 && turnCompletionIsAdmissible(context);
      return completionAssessment(
        instance,
        routeExists,
        portfolio.executorInstanceId,
      );
    },
    materialize: (instance, _assessment, context) => {
      const current = completionState(instance);
      const explicitlyNonproductiveActionIds =
        currentExplicitlyNonproductiveActionIds(context);
      return {
        step: {
          stepId: `${instance.instanceId}:complete_turn`,
          capability: {
            capabilityId: "complete_turn_after_productive_routes_exhausted",
            semanticActionTypes: ["turn_flow.end_turn"],
          },
          purpose:
            "Complete the turn after every productive LegalAction route is exhausted.",
        },
        candidates: standardEndTurnCandidates(context)
          .filter((candidate) =>
            current.standardEndTurnActionIds.includes(candidate.actionId),
          )
          .map((candidate) => ({ candidate, stepValue: -10_000 })),
      ...(context.input.playerView.own.clicks > 0 &&
        explicitlyNonproductiveActionIds.length > 0
          ? {
              earlyEndTurnJustification: {
                kind: "forgo_exhausted_voluntary_capacity" as const,
                capacityKind:
                  "all_current_voluntary_actions_explicitly_nonproductive" as const,
                explicitlyNonproductiveActionIds,
              },
            }
          : {}),
      } satisfies PlanMaterialization;
    },
  };
}

function turnCompletionIsAdmissible(context: PlanSchedulerContext): boolean {
  const explicitlyNonproductive = new Set(
    (context.actionDispositions ?? [])
      .filter((entry) => entry.disposition === "explicitly_nonproductive")
      .map((entry) => entry.actionId),
  );
  const productiveCandidates = context.actionCandidates.filter(
    (candidate) =>
      !isStandardEndTurnCandidate(candidate) &&
      !explicitlyNonproductive.has(candidate.actionId),
  );
  return productiveCandidates.length === 0;
}

function standardEndTurnCandidates(context: PlanSchedulerContext) {
  return context.actionCandidates.filter(isStandardEndTurnCandidate);
}

function currentExplicitlyNonproductiveActionIds(
  context: PlanSchedulerContext,
): string[] {
  const currentVoluntaryActionIds = new Set(
    context.actionCandidates
      .filter((candidate) => !isStandardEndTurnCandidate(candidate))
      .map((candidate) => candidate.actionId),
  );
  return (context.actionDispositions ?? [])
    .filter(
      (entry) =>
        entry.disposition === "explicitly_nonproductive" &&
        currentVoluntaryActionIds.has(entry.actionId),
    )
    .map((entry) => entry.actionId)
    .sort();
}

function completionProposal(
  side: Side,
  moduleId: PlanProposal["moduleId"],
  standardEndTurnActionIds: string[],
  dispositionEvidenceCodes: string[],
): PlanProposal {
  return {
    moduleId,
    moduleVersion: "1",
    dedupeKey: "standard-turn-completion",
    side,
    strategyLineIds: [],
    executionClass: "bounded_sequence",
    initialViability: "ready",
    persistencePolicy: "locked_sequence",
    retentionPolicy: {
      blockedStateVersionTtl: 0,
      dormantStateVersionTtl: 0,
      completedHistoryStateVersionTtl: 2,
      abandonWhenTargetMissing: true,
      protectedWhileNeedOpen: false,
      protectedWhileCommitted: false,
    },
    target: { kind: "player", id: side },
    phase: "complete_turn",
    milestone: "productive_routes_exhausted",
    moduleState: {
      kind: "turn_completion",
      standardEndTurnActionIds,
    } satisfies TurnCompletionState,
    blockers: [],
    resumeConditions: [],
    completionConditions: [{ code: "turn_ended" }],
    abandonmentConditions: [{ code: "productive_route_available" }],
    evidenceRefs: [
      {
        code: "productive_legal_routes_exhausted",
        source: "visible_state",
      },
      ...[...new Set(dispositionEvidenceCodes)].map((code) => ({
        code,
        source: "visible_state" as const,
      })),
    ],
  };
}

function completionAssessment(
  instance: PlanInstance,
  routeExists: boolean,
  executorInstanceId: string | undefined,
): PlanAssessment {
  const priorityClaim: PriorityClaim = {
    requestedClass: "P6",
    reasonCode: "turn_completion",
    horizon: "current_turn",
  };
  return {
    instanceId: instance.instanceId,
    side: instance.side,
    priorityClaim,
    intentFit: "none",
    readiness: routeExists ? "executable_now" : "nonviable",
    ...(routeExists
      ? {
          nextStepPreview: {
            stepId: `${instance.instanceId}:complete_turn`,
            capability: "turn_flow.end_turn",
            purpose: "Complete the exhausted turn.",
          },
        }
      : {}),
    feasibility: {
      currentRouteHeadPossible: routeExists,
      projectedActionCount: routeExists ? 1 : 0,
      opponentCanReact: false,
      confidence: "rules_proven",
    },
    resourceGaps: [],
    expectedOutcome: {
      outcomeKind: "turn_completion",
      minimumValue: 0,
      expectedValue: 0,
      maximumValue: 0,
      terminal: false,
      guarantee: "rules_proven",
    },
    continuity: {
      isCurrentForeground: executorInstanceId === instance.instanceId,
      sameObjectiveAsForeground: executorInstanceId === instance.instanceId,
      switchingCost: 0,
      progressAtRisk: 0,
    },
    blockers: [],
    withinClassValue: -10_000,
    evidenceCodes: instance.evidenceRefs.map((entry) => entry.code),
  };
}

function completionState(instance: PlanInstance): TurnCompletionState {
  const value = instance.moduleState as Partial<TurnCompletionState>;
  if (
    value.kind !== "turn_completion" ||
    !Array.isArray(value.standardEndTurnActionIds)
  ) {
    throw new Error("invalid_turn_completion_plan_state");
  }
  return value as TurnCompletionState;
}
