import type {
  AiDecisionInput,
  LegalAction,
  PlayerView,
  VisibleCard,
} from "@netgrid/shared";
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
  const visibleRunnerContestCredits =
    playerView.opponent.credits + visibleRunnerRunCreditPool(runnerRig);
  const runnerExposureCreditActions = Math.max(
    3,
    Math.floor((playerView.opponent.clicks ?? 4) - 1),
  );
  const visibleRunnerExposureContestCredits =
    visibleRunnerContestCredits + runnerExposureCreditActions;
  const assessment = assessKnownRezzedIcePath(
    server.ice,
    runnerRig,
    visibleRunnerExposureContestCredits,
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
      `runner_visible_contest_credits:${visibleRunnerContestCredits}`,
      `runner_exposure_credit_actions:${runnerExposureCreditActions}`,
      `runner_visible_exposure_contest_credits:${visibleRunnerExposureContestCredits}`,
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

function visibleRunnerRunCreditPool(rig: readonly VisibleCard[]): number {
  return rig.reduce((sum, card) => {
    if (card.known === false) return sum;
    return (
      sum +
      (card.counterDisplays ?? []).reduce((cardSum, display) => {
        const uses = display.creditPool?.uses ?? [];
        if (
          uses.includes("using_icebreaker_during_run") ||
          uses.includes("using_icebreaker_during_run_non_noisy") ||
          uses.includes("using_killer_during_run")
        ) {
          return cardSum + Math.max(0, Math.floor(display.amount));
        }
        return cardSum;
      }, 0)
    );
  }, 0);
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
