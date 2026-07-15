import type {
  AiDecisionInput,
  AiDecisionScoreComponent,
  LegalAction,
} from "@netgrid/shared";

type FollowUp = {
  serverId: string;
  estimatedProbeCredits: number;
};

export function runnerRunLockReleaseScoreComponent(
  input: AiDecisionInput,
  action: LegalAction,
): AiDecisionScoreComponent | undefined {
  if (
    input.side !== "runner" ||
    action.side !== "runner" ||
    !isRunLockReleaseAction(action) ||
    input.playerView.opponent.agendaPoints <
      input.playerView.agendaPointsToWin - 1
  ) {
    return undefined;
  }

  const clickCost = action.costs.reduce(
    (sum, cost) => sum + (cost.clicks ?? 0),
    0,
  );
  const creditCost = action.costs.reduce(
    (sum, cost) => sum + (cost.credits ?? 0),
    0,
  );
  const clicksAfterRelease = input.playerView.own.clicks - clickCost;
  const creditsAfterRelease = input.playerView.own.credits - creditCost;
  if (clicksAfterRelease < 1 || creditsAfterRelease < 0) return undefined;

  const followUp = plausibleFollowUpRun(input, creditsAfterRelease);
  if (!followUp) return undefined;

  return {
    key: "runner_matchpoint_run_lock_release",
    label: "Run-Sperre für Matchpoint-Zug lösen",
    value: 4_100,
    reason: [
      `corp_agenda_points:${input.playerView.opponent.agendaPoints}`,
      `agenda_points_to_win:${input.playerView.agendaPointsToWin}`,
      `clicks_after_release:${clicksAfterRelease}`,
      `credits_after_release:${creditsAfterRelease}`,
      `follow_up_server:${followUp.serverId}`,
      `estimated_probe_credits:${followUp.estimatedProbeCredits}`,
    ].join("|"),
  };
}

function isRunLockReleaseAction(action: LegalAction): boolean {
  return (
    action.type === "trigger_ability" &&
    (action.payload?.abilityId === "pay_to_remove_run_lock" ||
      action.payload?.v1920RunnerRunLockAbility === "pay_to_remove_run_lock")
  );
}

function plausibleFollowUpRun(
  input: AiDecisionInput,
  creditsAfterRelease: number,
): FollowUp | undefined {
  const candidates = input.playerView.servers
    .filter((server) => serverHasContestPayoff(input, server.id))
    .map((server) => ({
      serverId: server.id,
      estimatedProbeCredits: server.ice.reduce(
        (sum, ice) => sum + estimatedProbeCreditForIce(ice),
        0,
      ),
    }))
    .filter(
      (candidate) => candidate.estimatedProbeCredits <= creditsAfterRelease,
    )
    .sort(
      (left, right) =>
        left.estimatedProbeCredits - right.estimatedProbeCredits ||
        serverPriority(left.serverId) - serverPriority(right.serverId) ||
        left.serverId.localeCompare(right.serverId),
    );
  return candidates[0];
}

function serverHasContestPayoff(
  input: AiDecisionInput,
  serverId: string,
): boolean {
  if (serverId === "hq") return input.playerView.opponent.handCount > 0;
  if (serverId === "rd") return input.playerView.opponent.deckCount > 0;
  if (!serverId.startsWith("remote_")) return false;
  const server = input.playerView.servers.find(
    (entry) => entry.id === serverId,
  );
  return (
    server?.root.some(
      (card) => !card.known || !card.definitionId || card.type === "agenda",
    ) === true
  );
}

function estimatedProbeCreditForIce(
  ice: AiDecisionInput["playerView"]["servers"][number]["ice"][number],
): number {
  if (ice.rezzed !== true || !ice.known || !ice.definitionId) return 1;
  const endTheRunSubroutines =
    ice.effectiveRunQuote?.subroutines.filter((subroutine) =>
      ["end_the_run", "initiate_trace"].includes(subroutine.type),
    ).length ?? 0;
  return Math.max(1, endTheRunSubroutines);
}

function serverPriority(serverId: string): number {
  if (serverId === "hq") return 0;
  if (serverId === "rd") return 1;
  return 2;
}
