import type { AiDecisionInput, AiDecisionScoreComponent } from "@netgrid/shared";

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
        ? Math.min(4200, recentRuns * 2600)
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
