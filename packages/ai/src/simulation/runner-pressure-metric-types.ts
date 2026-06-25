export type RunnerCoveragePressureForMetrics = {
  blockedServers: Set<string>;
  knownIceBlockedServers: Set<string>;
  missingBreakerRoles: Set<string>;
  matchingInstallActionIds: Set<string>;
  searchActionIds: Set<string>;
  recoveryActionIds: Set<string>;
  heapMatchingBreakerCount: number;
};

export type RunnerPressureReadyTargetForMetrics = {
  serverId: string;
  targetType: "hq" | "rnd" | "archives" | "remote";
};

export type RunnerPressureReadyForMetrics = {
  broadReady: boolean;
  readyTargets: RunnerPressureReadyTargetForMetrics[];
  falsePositive: boolean;
  blockers: Set<
    | "insufficient_credits"
    | "missing_post_run_reserve"
    | "stale_central"
    | "remote_too_dangerous"
    | "no_valuable_target"
  >;
};
