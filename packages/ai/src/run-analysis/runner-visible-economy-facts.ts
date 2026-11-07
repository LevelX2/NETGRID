import type { AiDecisionInput } from "@netgrid/shared";
import type {
  EvaluateRunnerRunTargetsParams,
  RunnerCreditReservePhase,
  RunnerRemoteScoreThreat,
} from "./runner-run-target-types";

export function hasRiskyUniversalPressure(
  params: Pick<
    EvaluateRunnerRunTargetsParams,
    "strategicIntent" | "deckCapabilities"
  >,
): boolean {
  const riskProfile = new Set(params.strategicIntent?.riskProfile ?? []);
  return (
    riskProfile.has("runner.risky_universal_breaker_pressure") ||
    (params.deckCapabilities?.runner?.breakerInventory.some((breaker) => {
      const coverage = new Set(breaker.coverage);
      return coverage.has("universal") && breaker.risks.length > 0;
    }) ??
      false)
  );
}

export function runnerCreditReservePhase(
  input: AiDecisionInput,
  remoteScoreThreat: RunnerRemoteScoreThreat,
): RunnerCreditReservePhase {
  if (
    remoteScoreThreat === "urgent" ||
    input.playerView.opponent.agendaPoints >=
      input.playerView.agendaPointsToWin - 2
  ) {
    return "late_contest";
  }
  if (remoteScoreThreat === "visible") return "late_contest";
  return input.playerView.stateVersion <= 8 ? "opening" : "midgame";
}

export function runnerRemoteScoreThreat(
  input: AiDecisionInput,
): RunnerRemoteScoreThreat {
  let threat: RunnerRemoteScoreThreat = "none";
  for (const server of input.playerView.servers) {
    if (!server.id.startsWith("remote_")) continue;
    if (server.root.length === 0) continue;
    const advancedRoot = server.root.some(
      (card) => (card.advancementCounters ?? 0) > 0,
    );
    const urgentRoot = server.root.some(
      (card) => (card.advancementCounters ?? 0) >= 2,
    );
    const knownAgenda = server.root.some(
      (card) => card.known && card.type === "agenda",
    );
    if (
      urgentRoot ||
      knownAgenda ||
      input.playerView.opponent.agendaPoints >=
        input.playerView.agendaPointsToWin - 2
    ) {
      return "urgent";
    }
    if (advancedRoot) threat = maxRemoteScoreThreat(threat, "visible");
    else threat = maxRemoteScoreThreat(threat, "possible");
  }
  return threat;
}

function maxRemoteScoreThreat(
  left: RunnerRemoteScoreThreat,
  right: RunnerRemoteScoreThreat,
): RunnerRemoteScoreThreat {
  return remoteScoreThreatRank(right) > remoteScoreThreatRank(left)
    ? right
    : left;
}

function remoteScoreThreatRank(threat: RunnerRemoteScoreThreat): number {
  switch (threat) {
    case "urgent":
      return 3;
    case "visible":
      return 2;
    case "possible":
      return 1;
    case "none":
      return 0;
  }
}
