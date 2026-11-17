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
  RunnerInstalledAgendaScoreSignal,
  InstalledAgendaScoreState,
} from "./installed-agenda-types";
import { runnerInstalledAgendaScoreActionIsCurrent } from "./installed-agenda-signals";

export function createRunnerInstalledAgendaScoreModule(): PlanModule {
  return {
    moduleId: "runner.score_installed_agenda",
    side: "runner",
    discover: (context) =>
      (
        runnerPlanDomain<{
          installedAgendaScores?: RunnerInstalledAgendaScoreSignal[];
        }>(context).installedAgendaScores ?? []
      ).map((signal) =>
        proposal({
          moduleId: "runner.score_installed_agenda",
          dedupeKey: signal.opportunityId,
          moduleState: {
            kind: "installed_agenda_score",
            phase: "score_installed_agenda",
            signal,
          } satisfies InstalledAgendaScoreState,
          priorityClass: signal.terminal ? "P1" : "P3",
          target: { kind: "card", id: signal.sourceCardInstanceId },
          routeExists:
            installedAgendaScoreCandidates(context, signal).length > 0,
          blockerCode: "installed_agenda_score_route_unavailable",
          evidenceCode: signal.evidenceCode,
        }),
      ),
    assess: (instance, context, portfolio) => {
      const signal = (instance.moduleState as InstalledAgendaScoreState).signal;
      return assessment(
        instance,
        signal.terminal ? "P1" : "P3",
        installedAgendaScoreCandidates(context, signal).length > 0,
        (signal.terminal ? 2_000 : 1_000) + signal.agendaPoints * 100,
        portfolio.executorInstanceId,
      );
    },
    materialize: (instance, _assessment, context) => {
      const signal = (instance.moduleState as InstalledAgendaScoreState).signal;
      const candidates = installedAgendaScoreCandidates(context, signal);
      return {
        step: {
          stepId: `${instance.instanceId}:score`,
          capability: {
            capabilityId: "score_installed_agenda",
            semanticActionTypes: [
              ...new Set(
                candidates.map((entry) => entry.candidate.semanticActionType),
              ),
            ],
          },
          target: { kind: "card", id: signal.sourceCardInstanceId },
          purpose:
            "Convert the installed agenda replacement into agenda points.",
        },
        candidates,
      };
    },
  };
}

function installedAgendaScoreCandidates(
  context: PlanSchedulerContext,
  signal: RunnerInstalledAgendaScoreSignal,
): PlanMaterialization["candidates"] {
  const { input } = context;
  if (
    signal.observedAtStateVersion !== input.playerView.stateVersion ||
    !Number.isSafeInteger(signal.agendaPoints) ||
    signal.agendaPoints <= 0
  )
    return [];
  const actionIds = new Set(
    input.legalActions
      .filter(
        (action) =>
          signal.actionIds.includes(action.actionId) &&
          runnerInstalledAgendaScoreActionIsCurrent(
            input,
            action,
            signal.sourceCardInstanceId,
          ),
      )
      .map((action) => action.actionId),
  );
  return context.actionCandidates
    .filter(
      (candidate) =>
        actionIds.has(candidate.actionId) &&
        candidate.actorSide === "runner" &&
        candidate.stateVersion === signal.observedAtStateVersion &&
        candidate.sourceCardInstanceId === signal.sourceCardInstanceId,
    )
    .map((candidate) => ({
      candidate,
      stepValue: (signal.terminal ? 2_000 : 1_000) + signal.agendaPoints * 100,
    }));
}
