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
  RunnerRecurringEconomySignal,
  RecurringEconomyState,
} from "./recurring-economy-types";

export function createRunnerRecurringEconomyModule(): PlanModule {
  return {
    moduleId: "runner.recurring_economy",
    side: "runner",
    discover: (context) =>
      (
        runnerPlanDomain<{ recurringEconomy?: RunnerRecurringEconomySignal[] }>(
          context,
        ).recurringEconomy ?? []
      ).map((signal) =>
        proposal({
          moduleId: "runner.recurring_economy",
          dedupeKey: signal.commitmentId,
          moduleState: {
            kind: "recurring_economy",
            phase: signal.phase,
            signal,
          } satisfies RecurringEconomyState,
          priorityClass: signal.priorityClass,
          target: { kind: "card", id: signal.definitionId },
          routeExists: recurringEconomyCandidates(context, signal).length > 0,
          blockerCode:
            signal.phase === "hold"
              ? "recurring_economy_waiting_for_value"
              : "recurring_economy_install_route_unavailable",
          evidenceCode:
            signal.evidenceCodes[0] ?? "runner_recurring_economy_commitment",
        }),
      ),
    assess: (instance, context, portfolio) => {
      const signal = (instance.moduleState as RecurringEconomyState).signal;
      const candidates = recurringEconomyCandidates(context, signal);
      return assessment(
        instance,
        signal.priorityClass,
        candidates.length > 0,
        signal.value,
        portfolio.executorInstanceId,
      );
    },
    materialize: (instance, _assessment, context) => {
      const signal = (instance.moduleState as RecurringEconomyState).signal;
      const candidates = recurringEconomyCandidates(context, signal);
      return {
        step: {
          stepId: `${instance.instanceId}:${signal.phase}`,
          capability: {
            capabilityId: `recurring_economy_${signal.phase}`,
            semanticActionTypes: [
              ...new Set(
                candidates.map((entry) => entry.candidate.semanticActionType),
              ),
            ],
            ...(signal.phase === "install"
              ? { requiredSourceDefinitionIds: [signal.definitionId] }
              : {}),
          },
          ...(signal.phase === "install"
            ? { target: { kind: "card" as const, id: signal.definitionId } }
            : {}),
          purpose:
            signal.phase === "install"
              ? "Install the recurring economy commitment with a productive setup window."
              : "Develop through explicit non-run steps until the installed recurring economy commitment resolves its automatic value.",
        },
        candidates,
      };
    },
  };
}

function recurringEconomyCandidates(
  context: PlanSchedulerContext,
  signal: RunnerRecurringEconomySignal,
): PlanMaterialization["candidates"] {
  const actionIds = new Set(signal.actionIds);
  return context.actionCandidates
    .filter(
      (candidate) =>
        actionIds.has(candidate.actionId) &&
        !context.actionDispositions?.some(
          (disposition) => disposition.actionId === candidate.actionId,
        ),
    )
    .map((candidate) => ({
      candidate,
      stepValue:
        signal.value +
        (signal.phase === "hold" && candidate.semanticActionType === "draw.card"
          ? 10
          : 0),
    }));
}
