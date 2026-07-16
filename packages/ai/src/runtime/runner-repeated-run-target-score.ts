import type { AiDecisionInput, AiDecisionScoreComponent } from "@netgrid/shared";
import { reconstructBeliefState } from "../belief-state";

export type RunnerRepeatedRunTargetScoreDependencies = {
  recentStartRunsOnServer: (
    input: AiDecisionInput,
    serverId: string,
  ) => number;
  isRemoteServerTarget: (serverId: string | undefined) => boolean;
};

export function runnerRepeatedRunTargetScoreComponents(
  input: AiDecisionInput,
  serverId: string | undefined,
  dependencies: RunnerRepeatedRunTargetScoreDependencies,
): AiDecisionScoreComponent[] {
  if (!serverId) return [];
  const recentRuns = dependencies.recentStartRunsOnServer(input, serverId);
  if (recentRuns <= 0) return [];
  const penalty =
    serverId === "hq"
      ? Math.min(4200, recentRuns * 2600)
      : serverId === "rd"
        ? runnerRndRepeatRunPenalty(input, recentRuns)
        : dependencies.isRemoteServerTarget(serverId)
          ? Math.min(2400, recentRuns * 1400)
          : 0;
  if (penalty === 0) return [];
  return [
    {
      key: "runner_recent_same_server_runs",
      label: "Wiederholtes Run-Ziel",
      value: -penalty,
      reason: `${serverId}:${recentRuns}`,
    },
  ];
}

function runnerRndRepeatRunPenalty(
  input: AiDecisionInput,
  recentRuns: number,
): number {
  const defaultPenalty = Math.min(4200, recentRuns * 2600);
  const freshness =
    reconstructBeliefState(input).runnerOpponentModel?.rndTopFreshness;
  const topChangedSinceKnownAccess =
    freshness?.freshness === "fresh_after_top_removed" ||
    (freshness?.freshness === "invalidated" &&
      freshness.invalidationReasons.length > 0);
  if (!topChangedSinceKnownAccess) return defaultPenalty;
  const agendaPointsToWin = Math.max(
    1,
    input.playerView.agendaPointsToWin ?? 7,
  );
  const runnerAgendaPoints = Math.max(0, input.playerView.own.agendaPoints);
  if (runnerAgendaPoints >= Math.max(0, agendaPointsToWin - 2)) return 0;
  return Math.min(1600, recentRuns * 700);
}
