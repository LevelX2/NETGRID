import { type AiDifficulty, type LegalAction } from "@netgrid/shared";

type RunnerRunTargetServerFeatures = {
  iceCount: number;
  rootCount: number;
  knownRootCount: number;
  rezzedRootCount: number;
};

type RunnerRunTargetScoreFeatures = {
  credits: number;
  rigRoles: Set<string>;
  blockedRunServers: Set<string>;
  serverFeaturesById: Map<string, RunnerRunTargetServerFeatures>;
};

export function scoreRunTarget(
  action: LegalAction,
  features: RunnerRunTargetScoreFeatures,
  profile: Record<string, number>,
  difficulty: AiDifficulty,
  staleCentralRepeatPenalty = 0,
): number {
  const serverId = String(action.payload?.serverId ?? "");
  const server = features.serverFeaturesById.get(serverId);
  let score = difficulty === "easy" ? 330 : 560 + (profile.run ?? 1) * 55;
  if (serverId.startsWith("remote_")) {
    score += 60;
    if ((server?.rootCount ?? 0) === 0) score -= 380;
    else score += Math.min(server?.rootCount ?? 0, 3) * 45;
  }
  if (serverId === "rd") score += 45;
  if (server?.iceCount) score -= Math.min(server.iceCount, 3) * 25;
  if (features.blockedRunServers.has(serverId)) score -= 2000;
  if (features.credits < 3) score -= 140;
  if (features.rigRoles.size === 0 && difficulty !== "hard") score -= 60;
  score -= staleCentralRepeatPenalty;
  return score;
}

export function runnerRunReasonCode(
  action: LegalAction,
  features: RunnerRunTargetScoreFeatures,
): string {
  const serverId = String(action.payload?.serverId ?? "");
  const server = features.serverFeaturesById.get(serverId);
  if (features.blockedRunServers.has(serverId))
    return "runner.run.blocked_by_rezzed_ice";
  if (serverId.startsWith("remote_") && (server?.rootCount ?? 0) === 0)
    return "runner.run.empty_remote_low_value";
  return "runner.run.visible_pressure";
}

export function runTargetEvidence(
  action: LegalAction,
  features: RunnerRunTargetScoreFeatures,
): string[] {
  const serverId = String(action.payload?.serverId ?? "");
  const server = features.serverFeaturesById.get(serverId);
  if (!server) return [];
  return [
    `ice_count:${server.iceCount}`,
    `root_count:${server.rootCount}`,
    `known_root_count:${server.knownRootCount}`,
    `rezzed_root_count:${server.rezzedRootCount}`,
  ];
}
