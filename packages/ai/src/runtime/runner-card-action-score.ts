import { rolesHaveUnmatchedBreakerRole } from "./breaker-role-match";
import { rolesMatch } from "./role-match";

type RunnerCardActionScoreFeatures = {
  credits: number;
  handCount: number;
  memoryRemaining: number;
  rigRoles: Set<string>;
};

export function scoreRunnerInstall(
  roles: string[],
  features: RunnerCardActionScoreFeatures,
  profile: Record<string, number>,
): number {
  let score = 430 + (profile.setup ?? 1) * 40;
  if (rolesHaveUnmatchedBreakerRole(roles, features.rigRoles))
    score += 190;
  if (rolesMatch(roles, ["memory"]) && features.memoryRemaining <= 1)
    score += 160;
  if (features.credits < 2) score -= 90;
  return score;
}

export function scoreRunnerEvent(
  roles: string[],
  features: RunnerCardActionScoreFeatures,
  profile: Record<string, number>,
): number {
  let score = 420;
  if (rolesMatch(roles, ["economy"]))
    score += features.credits < 5 ? 170 * (profile.economy ?? 1) : 70;
  if (rolesMatch(roles, ["draw"])) score += features.handCount < 4 ? 150 : 60;
  if (rolesMatch(roles, ["run_pressure"]))
    score += features.credits >= 3 ? 150 * (profile.run ?? 1) : 30;
  return score;
}
