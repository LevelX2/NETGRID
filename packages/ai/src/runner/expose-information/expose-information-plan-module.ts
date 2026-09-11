import type {
  PlanModule,
  PlanMaterialization,
  PlanSchedulerContext,
} from "../../plans/plan-scheduler";
import {
  runnerTacticalProposal as proposal,
  runnerTacticalAssessment as assessment,
  runnerTacticalPlanDomain,
} from "../../plans/runner-tactical-module-support";
import type {
  RunnerExposeInformationSignal,
  ExposeInformationState,
} from "./expose-information-types";

export function createRunnerExposeInformationModule(): PlanModule {
  return {
    moduleId: "runner.expose_information",
    side: "runner",
    discover: (context) =>
      runnerTacticalPlanDomain<{
        exposeInformation: RunnerExposeInformationSignal[];
      }>(context).exposeInformation.map((signal) =>
        proposal(
          "runner.expose_information",
          signal.informationId,
          {
            kind: "expose_information",
            signal,
          } satisfies ExposeInformationState,
          "P3",
          [],
          {
            kind: "card",
            id: signal.targetIceInstanceId ?? signal.sourceCardInstanceId,
          },
          exposeInformationCandidates(context, signal).length > 0,
          signal.evidenceCodes[0] ?? "runner_expose_information_exact_window",
          signal.parentPlanInstanceId,
          {
            phase: signal.phase,
            evidenceCodes: signal.evidenceCodes,
          },
        ),
      ),
    assess: (instance, context, portfolio) => {
      const current = instance.moduleState as ExposeInformationState;
      return assessment(
        instance,
        "P3",
        exposeInformationCandidates(context, current.signal).length > 0,
        current.signal.phase === "expose_unknown_ice"
          ? 300
          : current.signal.phase === "decline_known_ice"
            ? 200
            : 240,
        portfolio.executorInstanceId,
      );
    },
    materialize: (instance, _assessment, context) => {
      const current = instance.moduleState as ExposeInformationState;
      return {
        step: {
          stepId: `${instance.instanceId}:${current.signal.phase}`,
          capability: {
            capabilityId: current.signal.phase,
            semanticActionTypes:
              current.signal.kind === "run_window"
                ? ["card_ability.trigger"]
                : current.signal.phase === "install_information_tool"
                  ? ["install.card"]
                  : ["play.runner_event"],
          },
          purpose:
            current.signal.phase === "expose_unknown_ice"
              ? "Expose the exact approached unknown ICE once before rez."
              : current.signal.phase === "decline_known_ice"
                ? "Decline a repeated expose because the exact approached ICE is already known."
                : current.signal.phase === "install_information_tool"
                  ? "Install an information tool while unknown ICE remains."
                  : "Expose currently unknown installed Corp cards.",
        },
        candidates: exposeInformationCandidates(context, current.signal),
      };
    },
  };
}

function exposeInformationCandidates(
  context: PlanSchedulerContext,
  signal: RunnerExposeInformationSignal,
): PlanMaterialization["candidates"] {
  if (!signal.admissible) return [];
  if (signal.kind === "proactive") {
    return context.actionCandidates
      .filter(
        (candidate) =>
          (signal.actionIds ?? [signal.selectedActionId]).includes(
            candidate.actionId,
          ) &&
          candidate.sourceCardInstanceId === signal.sourceCardInstanceId &&
          (signal.phase === "install_information_tool"
            ? candidate.semanticActionType === "install.card"
            : candidate.semanticActionType === "play.runner_event"),
      )
      .map((candidate) => ({ candidate, stepValue: 240 }));
  }
  return context.actionCandidates
    .filter((candidate) => {
      if (
        candidate.actionId !== signal.selectedActionId ||
        candidate.sourceCardInstanceId !== signal.sourceCardInstanceId ||
        candidate.semanticActionType !== "card_ability.trigger"
      ) {
        return false;
      }
      const action = context.input.legalActions.find(
        (entry) => entry.actionId === candidate.actionId,
      );
      return (
        action?.type === "trigger_ability" &&
        action.source === signal.sourceCardInstanceId &&
        action.expiresAtStateVersion ===
          context.input.playerView.stateVersion &&
        action.payload?.cardId === signal.sourceCardInstanceId &&
        action.payload?.iceId === signal.targetIceInstanceId &&
        action.payload?.approachIceExposeDecision ===
          (signal.phase === "expose_unknown_ice" ? "expose" : "decline")
      );
    })
    .map((candidate) => ({
      candidate,
      stepValue: signal.phase === "expose_unknown_ice" ? 300 : 200,
    }));
}
