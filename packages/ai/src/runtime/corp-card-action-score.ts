import { type LegalAction } from "@netgrid/shared";
import { rolesMatch } from "./role-match";

type CorpCardActionScoreFeatures = {
  credits: number;
  handCount: number;
  opponentTags: number;
};

const CORP_AGENDA_ROOT_ROLE_NEEDLES = [
  "agenda_asset",
  "agenda_support",
  "agenda_protection",
  "agenda_score",
  "agenda_fast_advance",
] as const;

export function scoreCorpRootInstall(
  roles: string[],
  action: LegalAction,
  features: CorpCardActionScoreFeatures,
  profile: Record<string, number>,
): number {
  let score = 500 + (profile.remote ?? 1) * 45;
  if (rolesMatch(roles, CORP_AGENDA_ROOT_ROLE_NEEDLES))
    score += 110 + (profile.score ?? 1) * 35;
  if (rolesMatch(roles, ["economy_asset"]))
    score += features.credits < 5 ? 90 : 30;
  if (action.payload?.serverId === "new_remote") score += 35;
  return score;
}

export function scoreCorpIceInstall(
  action: LegalAction,
  features: CorpCardActionScoreFeatures,
  profile: Record<string, number>,
): number {
  let score = 470 + (profile.remote ?? 1) * 30;
  if (action.payload?.serverId === "rd") score += 65;
  if (String(action.payload?.serverId ?? "").startsWith("remote_")) score += 55;
  if (features.credits < 3) score -= 80;
  return score;
}

export function scoreCorpOperation(
  roles: string[],
  features: CorpCardActionScoreFeatures,
  profile: Record<string, number>,
): number {
  if (rolesMatch(roles, ["tag_punishment"]))
    return features.opponentTags > 0 ? 790 : 120;
  let score = 480;
  if (rolesMatch(roles, ["economy_operation"]))
    score += features.credits < 6 ? 160 * (profile.economy ?? 1) : 70;
  if (rolesMatch(roles, ["draw_operation"]))
    score += features.handCount < 4 ? 120 : 50;
  return score;
}
