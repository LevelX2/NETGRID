import type { ActionSemanticCandidate } from "../../action-semantic-candidate-types";
import type {
  PlanModule,
  PlanMaterialization,
  PlanSchedulerContext,
} from "../../plans/plan-scheduler";
import {
  runnerPlanProposal as proposal,
  runnerPlanAssessment as assessment,
  runnerPlanDomain,
} from "../../plans/runner-plan-module-support";
import type {
  RunnerShellTradersPipelineSignal,
  ShellTradersPipelineState,
} from "./shell-traders-types";
import {
  shellTradersDestinationBinding,
  exactShellTradersDestinationAction,
  type ShellTradersDestinationState,
} from "./shell-traders-destination-binding";

export function createRunnerShellTradersPipelineModule(): PlanModule {
  return {
    moduleId: "runner.shell_traders_pipeline",
    side: "runner",
    discover: (context) => {
      const binding = shellTradersDestinationBinding(context.input);
      if (binding)
        return [
          proposal({
            moduleId: "runner.shell_traders_pipeline",
            dedupeKey: `${binding.sourceCardInstanceId}:${binding.targetCardInstanceId}`,
            moduleState: binding,
            priorityClass: "P2",
            target: { kind: "card", id: binding.targetCardInstanceId },
            routeExists: destinationCandidates(context, binding).length > 0,
            blockerCode: "shell_traders_destination_action_missing",
            evidenceCode: "shell_traders_exact_destination_bound",
          }),
        ];
      return (
        runnerPlanDomain<{
          shellTradersPipelines?: RunnerShellTradersPipelineSignal[];
        }>(context).shellTradersPipelines ?? []
      ).map((signal) =>
        proposal({
          moduleId: "runner.shell_traders_pipeline",
          dedupeKey: signal.pipelineId,
          moduleState: {
            kind: "shell_traders_pipeline",
            phase: signal.phase,
            signal,
          } satisfies ShellTradersPipelineState,
          priorityClass: signal.priorityClass,
          target: {
            kind: "card",
            id: signal.targetCardInstanceId,
          },
          routeExists:
            shellTradersPipelineCandidates(context, signal).length > 0,
          blockerCode:
            signal.phase === "hold"
              ? "shell_traders_pipeline_held"
              : "shell_traders_exact_route_unavailable",
          evidenceCode:
            signal.evidenceCodes[0] ??
            "runner_shell_traders_pipeline_visible_state",
          evidenceCodes: signal.evidenceCodes,
        }),
      );
    },
    assess: (instance, context, portfolio) => {
      const destination = instance.moduleState as ShellTradersDestinationState;
      if (destination.kind === "shell_traders_destination") {
        return assessment(
          instance,
          "P2",
          destinationCandidates(context, destination).length > 0,
          1,
          portfolio.executorInstanceId,
        );
      }
      const signal = (instance.moduleState as ShellTradersPipelineState).signal;
      const candidates = shellTradersPipelineCandidates(context, signal);
      return assessment(
        instance,
        signal.priorityClass,
        candidates.length > 0,
        signal.value,
        portfolio.executorInstanceId,
      );
    },
    materialize: (instance, _assessment, context) => {
      const destination = instance.moduleState as ShellTradersDestinationState;
      if (destination.kind === "shell_traders_destination") {
        const candidates = destinationCandidates(context, destination);
        return {
          step: {
            stepId: `${instance.instanceId}:resolve_destination:${destination.targetCardInstanceId}`,
            capability: {
              capabilityId: "shell_traders_destination",
              semanticActionTypes: candidates.map(
                (entry) => entry.candidate.semanticActionType,
              ),
              legalActionTypes: ["resolve_choice"],
            },
            purpose:
              "Complete the committed delayed install at its exact Engine-quoted destination while avoiding program displacement.",
          },
          candidates,
        };
      }
      const signal = (instance.moduleState as ShellTradersPipelineState).signal;
      const candidates = shellTradersPipelineCandidates(context, signal);
      return {
        step: {
          stepId: `${instance.instanceId}:${signal.phase}:${signal.targetCardInstanceId}`,
          capability: {
            capabilityId: `shell_traders_${signal.phase}`,
            semanticActionTypes: [
              ...new Set(
                candidates.map((entry) => entry.candidate.semanticActionType),
              ),
            ],
            legalActionTypes: ["trigger_ability"],
            requiredSourceDefinitionIds: [signal.sourceDefinitionId],
          },
          target: {
            kind: "card",
            id: signal.targetCardInstanceId,
          },
          purpose:
            signal.phase === "prepare"
              ? "Prepare the exact program or hardware target for delayed free installation."
              : signal.phase === "progress"
                ? "Progress the exact prepared target without sacrificing a more valuable rig."
                : "Hold the prepared target until its completion or replacement is useful.",
        },
        candidates,
      };
    },
  };
}

function destinationCandidates(
  context: PlanSchedulerContext,
  binding: ShellTradersDestinationState,
): PlanMaterialization["candidates"] {
  const action = exactShellTradersDestinationAction(context.input, binding);
  return context.actionCandidates
    .filter(
      (candidate) =>
        action &&
        candidate.actionId === action.actionId &&
        candidate.actionType === "resolve_choice",
    )
    .map((candidate) => ({ candidate, stepValue: 1 }));
}

function shellTradersPipelineCandidates(
  context: PlanSchedulerContext,
  signal: RunnerShellTradersPipelineSignal,
): PlanMaterialization["candidates"] {
  const actionIds = new Set(signal.actionIds);
  return context.actionCandidates
    .filter(
      (candidate) =>
        actionIds.has(candidate.actionId) &&
        candidate.actionType === "trigger_ability" &&
        shellTradersCandidateMatchesExactBinding(context, candidate, signal) &&
        !context.actionDispositions?.some(
          (disposition) =>
            disposition.actionId === candidate.actionId &&
            disposition.disposition === "explicitly_nonproductive",
        ),
    )
    .map((candidate) => ({
      candidate,
      stepValue: signal.value,
    }));
}

function shellTradersCandidateMatchesExactBinding(
  context: PlanSchedulerContext,
  candidate: ActionSemanticCandidate,
  signal: RunnerShellTradersPipelineSignal,
): boolean {
  if (
    candidate.sourceCardInstanceId !== signal.sourceCardInstanceId ||
    (candidate.sourceDefinitionId !== undefined &&
      candidate.sourceDefinitionId !== signal.sourceDefinitionId)
  ) {
    return false;
  }
  const legalAction = context.input.legalActions.find(
    (action) => action.actionId === candidate.actionId,
  );
  const payloadTargetCardId = legalAction?.payload?.targetCardId;
  const payloadTargetDefinitionId =
    legalAction?.payload?.targetCardDefinitionId;
  if (typeof payloadTargetCardId === "string") {
    return (
      payloadTargetCardId === signal.targetCardInstanceId &&
      (typeof payloadTargetDefinitionId !== "string" ||
        payloadTargetDefinitionId === signal.targetDefinitionId)
    );
  }
  const exactTarget = candidate.targetContext?.selectedTargets.find(
    (target) => target.targetId === signal.targetCardInstanceId,
  );
  return (
    exactTarget !== undefined &&
    (exactTarget.targetDefinitionId === undefined ||
      exactTarget.targetDefinitionId === signal.targetDefinitionId)
  );
}
