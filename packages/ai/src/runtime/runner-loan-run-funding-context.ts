import type { AiDecisionInput } from "@netgrid/shared";
import type { RunnerRunTargetEvaluation } from "../runner-run-target-evaluation";

type RunnerLoanAssessmentRemoteThreat =
  | "none"
  | "possible"
  | "visible"
  | "urgent";

export type RunnerLoanRunFundingContext = {
  remoteScoreThreat: RunnerLoanAssessmentRemoteThreat;
  remoteContestFunding: boolean;
  knownAgendaPayoff: boolean;
  knownAgendaFunding: boolean;
  closeoutFunding: boolean;
  bestTargetId?: string;
  bestTargetPayoff?: RunnerRunTargetEvaluation["accessPayoff"];
  bestTargetRecommendation?: RunnerRunTargetEvaluation["recommendation"];
  bestTargetPathCost: number;
  bestTargetCreditsAfterRun: number;
  evidence: string[];
};

export function runnerLoanRunFundingContext(params: {
  input: AiDecisionInput;
  runTargets: readonly RunnerRunTargetEvaluation[];
  creditsAfterLoan: number;
  desiredCreditReserve: number;
  contestReserve: number;
}): RunnerLoanRunFundingContext {
  const rankedTargets = [...params.runTargets].sort(
    (left, right) =>
      right.score - left.score || left.actionId.localeCompare(right.actionId),
  );
  const scoreThreatTarget = rankedTargets.find((target) => target.scoreThreat);
  const agendaTarget = rankedTargets.find(
    (target) => target.accessPayoff === "agenda",
  );
  const closeoutTarget = rankedTargets.find((target) =>
    runnerLoanCloseoutTarget(params.input, target),
  );
  const bestTarget =
    scoreThreatTarget ?? agendaTarget ?? closeoutTarget ?? rankedTargets[0];
  const remoteContestFunding =
    scoreThreatTarget !== undefined &&
    params.creditsAfterLoan >=
      Math.max(scoreThreatTarget.pathCost, params.contestReserve) &&
    (params.input.playerView.own.credits < params.contestReserve ||
      scoreThreatTarget.pathPassability === "blocked_unpayable" ||
      scoreThreatTarget.recommendation === "gain_credits_first");
  const knownAgendaFunding =
    agendaTarget !== undefined &&
    params.creditsAfterLoan >= Math.max(0, agendaTarget.pathCost) &&
    (params.input.playerView.own.credits < agendaTarget.pathCost ||
      agendaTarget.recommendation === "gain_credits_first" ||
      params.input.playerView.own.credits < params.desiredCreditReserve);
  const closeoutFunding =
    closeoutTarget !== undefined &&
    params.creditsAfterLoan >= Math.max(0, closeoutTarget.pathCost) &&
    params.input.playerView.own.credits < params.desiredCreditReserve;
  const remoteScoreThreat: RunnerLoanAssessmentRemoteThreat = scoreThreatTarget
    ? scoreThreatTarget.accessPayoff === "score_threat" &&
      scoreThreatTarget.pathPassability === "reachable"
      ? "urgent"
      : "visible"
    : params.runTargets.some(
          (target) =>
            target.targetKind === "remote" &&
            target.knownAccessState === "unknown",
        )
      ? "possible"
      : "none";
  return {
    remoteScoreThreat,
    remoteContestFunding,
    knownAgendaPayoff: agendaTarget !== undefined,
    knownAgendaFunding,
    closeoutFunding,
    ...(bestTarget ? { bestTargetId: bestTarget.targetServerId } : {}),
    ...(bestTarget ? { bestTargetPayoff: bestTarget.accessPayoff } : {}),
    ...(bestTarget
      ? { bestTargetRecommendation: bestTarget.recommendation }
      : {}),
    bestTargetPathCost: bestTarget?.pathCost ?? 0,
    bestTargetCreditsAfterRun:
      bestTarget?.creditsAfterRun ?? params.input.playerView.own.credits,
    evidence: [
      `loanRunTargets:${params.runTargets.length}`,
      `loanBestTarget:${bestTarget?.targetServerId ?? "none"}`,
      `loanBestTargetPayoff:${bestTarget?.accessPayoff ?? "none"}`,
      `loanBestTargetRecommendation:${bestTarget?.recommendation ?? "none"}`,
      `loanBestTargetPathCost:${bestTarget?.pathCost ?? 0}`,
      `loanRemoteContestFunding:${remoteContestFunding}`,
      `loanKnownAgendaFunding:${knownAgendaFunding}`,
      `loanCloseoutFunding:${closeoutFunding}`,
    ],
  };
}

function runnerLoanCloseoutTarget(
  input: AiDecisionInput,
  target: RunnerRunTargetEvaluation,
): boolean {
  if (
    input.playerView.own.agendaPoints <
    input.playerView.agendaPointsToWin - 2
  ) {
    return false;
  }
  return (
    target.accessPayoff === "agenda" ||
    target.accessPayoff === "access_bonus" ||
    target.accessPayoff === "score_threat" ||
    target.multiaccessAvailable
  );
}
