import type {
  PlanMaterialization,
  PlanModule,
  PlanSchedulerContext,
} from "../../plans/plan-scheduler";
import {
  runnerTacticalAssessment as assessment,
  domain,
  exactRunnerParentSupportResourceGaps,
  runnerTacticalProposal as proposal,
  state,
} from "../../plans/runner-tactical-module-support";
import { RunnerRemoteContestSignal } from "../../plans/runner-tactical-plan-contracts";
type RemoteState = {
  kind: "remote_contest";
  signal: RunnerRemoteContestSignal;
};

export function remoteContestModule(): PlanModule {
  return {
    moduleId: "runner.contest_remote",
    side: "runner",
    discover: (context) =>
      domain(context).remoteContests.map((signal) => {
        const candidates = remoteCandidates(context, signal);
        return proposal(
          "runner.contest_remote",
          signal.contestId,
          { kind: "remote_contest", signal } satisfies RemoteState,
          remotePriority(signal),
          [],
          { kind: "server", id: signal.serverId },
          (signal.supportNeedId !== undefined ||
            (signal.reachable && candidates.length > 0)) &&
            signal.marginalValue > 0,
          signal.evidenceCode,
        );
      }),
    assess: (instance, context, portfolio) => {
      const current = state<RemoteState>(instance);
      const priorityClass = remotePriority(current.signal);
      const routeExists =
        current.signal.reachable &&
        current.signal.marginalValue > 0 &&
        remoteCandidates(context, current.signal).length > 0;
      const resourceGaps = exactRunnerParentSupportResourceGaps(
        context,
        instance,
        current.signal.supportNeedId,
        routeExists,
      );
      const result = assessment(
        instance,
        priorityClass,
        routeExists,
        current.signal.marginalValue,
        portfolio.executorInstanceId,
        current.signal.knownAgendaThreat || current.signal.terminalPatternThreat
          ? "score_threat"
          : undefined,
        current.signal.routePreparation === "targeted_bypass"
          ? "belief_supported"
          : current.signal.terminalPatternThreat
            ? "robust_but_reactive"
            : "visible_state_forced",
        resourceGaps,
      );
      if (priorityClass === "P4") {
        result.intentFit = "tactical_override";
      }
      if (!routeExists && current.signal.supportNeedId) {
        result.blockers = [
          {
            code: "waiting_for_bound_funding_support",
            owner: "plan_module",
            removable: true,
            resumeCondition: { code: current.signal.supportNeedId },
          },
        ];
      }
      return result;
    },
    materialize: (instance, _assessment, context) => {
      const current = state<RemoteState>(instance);
      const candidates = remoteCandidates(context, current.signal);
      return {
        step: {
          stepId: `${instance.instanceId}:contest`,
          capability: {
            capabilityId: "contest_remote",
            semanticActionTypes: [
              ...new Set(
                candidates.map(
                  (candidate) => candidate.candidate.semanticActionType,
                ),
              ),
            ],
          },
          ...(current.signal.routePreparation
            ? {}
            : {
                target: {
                  kind: "server" as const,
                  id: current.signal.serverId,
                },
              }),
          purpose: `Contest visible remote ${current.signal.serverId}.`,
        },
        candidates,
      };
    },
  };
}

function remotePriority(signal: RunnerRemoteContestSignal): "P2" | "P4" | "P6" {
  if (
    (signal.knownAgendaThreat || signal.terminalPatternThreat) &&
    signal.routePreparation !== "targeted_bypass"
  )
    return "P2";
  return signal.constrainedActionCapacity ? "P6" : "P4";
}

function remoteCandidates(
  context: PlanSchedulerContext,
  signal: RunnerRemoteContestSignal,
): PlanMaterialization["candidates"] {
  if (
    signal.routePreparation === "expose_remote" ||
    signal.routePreparation === "prepare_access_payoff" ||
    signal.routePreparation === "targeted_bypass" ||
    signal.routePreparation === "targeted_ice_trash"
  ) {
    const preparationActionIds = new Set(signal.preparationActionIds ?? []);
    return context.actionCandidates
      .filter((candidate) => preparationActionIds.has(candidate.actionId))
      .map((candidate) => ({
        candidate,
        stepValue: signal.marginalValue,
      }));
  }
  return context.actionCandidates.flatMap((candidate) => {
    const assessment = signal.runActionAssessments[candidate.actionId];
    if (
      assessment?.verdict !== "executable" ||
      !signal.reachable ||
      signal.marginalValue <= 0
    ) {
      return [];
    }
    return [{ candidate, stepValue: assessment.stepValue }];
  });
}
