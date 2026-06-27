import type { AiDecisionInput, LegalAction, PlayerView } from "@netgrid/shared";
import { assessKnownRezzedIcePath } from "../visible-run-analysis";
import { visibleCardByInstanceId } from "./tactical-plan-visible-cards";

export function remoteIsProtected(
  playerView: PlayerView,
  serverId: string,
): boolean {
  const server = playerView.servers.find(
    (candidate) => candidate.id === serverId,
  );
  return (server?.ice.length ?? 0) > 0;
}

export function corpRemoteContestabilityAssessment(
  playerView: PlayerView,
  serverId: string,
): { contestable: boolean; evidence: string[] } | undefined {
  const server = playerView.servers.find(
    (candidate) => candidate.id === serverId,
  );
  if (!server || server.ice.length === 0) return undefined;
  const runnerRig = playerView.opponent.rig ?? [];
  const assessment = assessKnownRezzedIcePath(
    server.ice,
    runnerRig,
    playerView.opponent.credits,
    server.root,
  );
  if (assessment.assessedKnownIceCount <= 0) return undefined;
  const contestable =
    assessment.canReachAccess === true && assessment.creditsAfterPath >= 0;
  return {
    contestable,
    evidence: [
      `remote_contestable_by_runner:${contestable}`,
      `runner_credits:${playerView.opponent.credits}`,
      `runner_visible_rig_count:${runnerRig.length}`,
      `assessed_known_ice_count:${assessment.assessedKnownIceCount}`,
      `can_reach_access:${assessment.canReachAccess}`,
      `credits_after_path:${assessment.creditsAfterPath}`,
      ...(assessment.visibleBreakCost !== undefined
        ? [`visible_break_cost:${assessment.visibleBreakCost}`]
        : []),
      ...(assessment.noAccessReason
        ? [`no_access_reason:${assessment.noAccessReason}`]
        : []),
    ],
  };
}

export function advanceCompletesScore(
  playerView: PlayerView,
  action: LegalAction,
): boolean {
  const sourceCard = visibleCardByInstanceId(playerView, String(action.source));
  if (!sourceCard) return false;
  const currentAdvancement = sourceCard.advancementCounters ?? 0;
  const requirement = sourceCard.advancementRequirement;
  return requirement !== undefined && currentAdvancement + 1 >= requirement;
}

export function corpHasSafeScoreAlternative(
  input: AiDecisionInput,
  actionToSkip: LegalAction,
): boolean {
  return input.legalActions.some(
    (action) =>
      action.actionId !== actionToSkip.actionId &&
      (action.type === "gain_credit" ||
        action.type === "draw_card" ||
        action.type === "install_card" ||
        action.type === "rez_ice" ||
        action.type === "score_agenda"),
  );
}
