import type {
  PlanModule,
  PlanMaterialization,
  PlanSchedulerContext,
} from "../../plans/plan-scheduler";
import type { PlanInstance } from "../../plans/plan-kernel-types";
import type { ResourceGap } from "../../plans/plan-assessment";
import {
  validRunnerFundingNeedContract,
  type RunnerFundingNeedSignal,
} from "../../plans/runner-funding-contracts";
import {
  runnerPlanProposal as proposal,
  runnerPlanAssessment as assessment,
  runnerPlanDomain,
} from "../../plans/runner-plan-module-support";
import type {
  RunnerResourceLifecycleSignal,
  ResourceLifecycleState,
} from "./resource-lifecycle-types";

export function createRunnerResourceLifecycleModule(): PlanModule {
  return {
    moduleId: "runner.resource_lifecycle",
    side: "runner",
    discover: (context) =>
      (
        runnerPlanDomain<ResourceLifecycleDomain>(context).resourceLifecycle ??
        []
      ).map((signal) => {
        const lifecycleProposal = proposal({
          moduleId: "runner.resource_lifecycle",
          dedupeKey: signal.lifecycleId,
          moduleState: {
            kind: "resource_lifecycle",
            phase: signal.phase,
            signal,
          } satisfies ResourceLifecycleState,
          priorityClass: signal.priorityClass,
          target: { kind: "card", id: signal.sourceCardInstanceId },
          routeExists:
            resourceLifecycleCandidates(context, signal).length > 0 ||
            signal.supportNeedId !== undefined,
          blockerCode: `resource_lifecycle_${signal.phase}`,
          evidenceCode:
            signal.evidenceCodes[0] ??
            "runner_resource_lifecycle_visible_state",
        });
        if (!signal.supportNeedId) return lifecycleProposal;
        return {
          ...lifecycleProposal,
          resumeConditions: [{ code: signal.supportNeedId }],
        };
      }),
    assess: (instance, context, portfolio) => {
      const signal = (instance.moduleState as ResourceLifecycleState).signal;
      const resourceGaps = exactRunnerParentFundingResourceGaps(
        context,
        instance,
        signal.supportNeedId,
      );
      return assessment(
        instance,
        signal.priorityClass,
        resourceLifecycleCandidates(context, signal).length > 0,
        signal.value,
        portfolio.executorInstanceId,
        resourceGaps,
      );
    },
    materialize: (instance, _assessment, context) => {
      const signal = (instance.moduleState as ResourceLifecycleState).signal;
      const candidates = resourceLifecycleCandidates(context, signal);
      return {
        step: {
          stepId: `${instance.instanceId}:${signal.phase}`,
          capability: {
            capabilityId: `resource_lifecycle_${signal.phase}`,
            semanticActionTypes: [
              ...new Set(
                candidates.map((entry) => entry.candidate.semanticActionType),
              ),
            ],
            requiredSourceDefinitionIds: [signal.definitionId],
          },
          target: { kind: "card", id: signal.sourceCardInstanceId },
          purpose:
            signal.phase === "leave_play"
              ? "Resolve the explicitly profitable end-of-turn resource lifecycle route."
              : "Retain the resource while its leave-play route is not productive.",
        },
        candidates,
      };
    },
  };
}

function resourceLifecycleCandidates(
  context: PlanSchedulerContext,
  signal: RunnerResourceLifecycleSignal,
): PlanMaterialization["candidates"] {
  const actionIds = new Set(signal.actionIds);
  return context.actionCandidates
    .filter(
      (candidate) =>
        actionIds.has(candidate.actionId) &&
        candidate.sourceKind === "card" &&
        candidate.sourceDefinitionId === signal.definitionId &&
        candidate.sourceCardInstanceId === signal.sourceCardInstanceId &&
        candidate.planOwnerBinding?.owner === "runner.resource_lifecycle",
    )
    .map((candidate) => ({
      candidate,
      stepValue: signal.value,
    }));
}

function exactRunnerParentFundingResourceGaps(
  context: PlanSchedulerContext,
  parent: PlanInstance,
  supportNeedId: string | undefined,
): ResourceGap[] {
  if (supportNeedId === undefined) return [];
  const exactNeeds = runnerPlanDomain<ResourceLifecycleDomain>(
    context,
  ).fundingNeeds.filter(
    (
      need,
    ): need is Extract<
      RunnerFundingNeedSignal,
      { kind: "parent_plan_support" }
    > =>
      need.kind === "parent_plan_support" &&
      need.needId === supportNeedId &&
      need.parentPlanInstanceId === parent.instanceId &&
      need.gap > 0,
  );
  if (exactNeeds.length !== 1) return [];
  const [need] = exactNeeds;
  if (
    !need ||
    !validRunnerFundingNeedContract(need, context.input.playerView.stateVersion)
  ) {
    return [];
  }
  return [
    {
      needId: need.needId,
      capability: "credits",
      minimum: need.gap,
      available: 0,
      deadline: "current_turn",
    },
  ];
}

type ResourceLifecycleDomain = {
  resourceLifecycle?: RunnerResourceLifecycleSignal[];
  fundingNeeds: RunnerFundingNeedSignal[];
};
