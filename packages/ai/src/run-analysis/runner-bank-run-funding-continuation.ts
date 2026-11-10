import type { AiDecisionInput } from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../action-semantic-candidate-types";
import type { DeckCapabilityProfile } from "../deck-capabilities";
import {
  assessRunnerRunAfterGuaranteedFunding,
  buildRunnerEconomyPosture,
  type RunnerRunTargetEvaluation,
} from "../runner-run-target-evaluation";
import { runnerRunFundingSupport } from "./runner-plan-run-funding";
import { runnerTerminalRemoteContestIsDirectlyMandatory } from "../runner/remote-contest/remote-contest-admission";
import { runnerRunTargetIsDirectlyConvertible } from "../runtime/runner-run-funding-admission";
import type { RunnerRunFundingSupport } from "../plans/runner-funding-service-contract";

/** Certify a bank-owned prefix with the existing non-bank funding owner.
 * This quotes resources only; each action is rematerialized by its owner. */
export function runnerBankRunFundingContinuation(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
  deckCapabilities: DeckCapabilityProfile,
  target: RunnerRunTargetEvaluation,
  cashOutActionId: string,
): RunnerRunFundingSupport | undefined {
  if (target.accessTargetKind !== "remote") return undefined;
  const bank = candidates.find(
    (candidate) => candidate.actionId === cashOutActionId,
  );
  const projection = bank?.economyProjection;
  if (
    bank?.planOwnerBinding?.owner !== "runner.credit_bank" ||
    bank.planOwnerBinding.route !== "cash_out" ||
    projection?.sourcePool !== "finite" ||
    projection.payoutMode !== "all_available" ||
    projection.cardsConsumed !== 0 ||
    !(projection.storedCreditsTaken! > 0)
  )
    return undefined;
  const nonBankCandidates = candidates.filter(
    (candidate) => candidate.planOwnerBinding?.owner !== "runner.credit_bank",
  );
  const direct = runnerRunFundingSupport(
    input,
    buildRunnerEconomyPosture({ input, deckCapabilities }),
    target,
    [target],
    nonBankCandidates,
  );
  // An already complete current route keeps its owner. A bank prefix is
  // support for a genuinely uncovered consumer, never a competing chooser.
  if (
    direct?.routeAssessment.status === "covered_guaranteed" &&
    direct.routeAssessment.projectedGap === 0 &&
    direct.routeActionIds.length > 0
  )
    return undefined;
  const funded = assessRunnerRunAfterGuaranteedFunding({
    input,
    deckCapabilities,
    fundingCandidate: bank,
    runActionId: target.actionId,
    targetServerId: target.targetServerId,
  });
  if (!funded) return undefined;
  const economy = buildRunnerEconomyPosture({
    input: funded.input,
    deckCapabilities,
  });
  const support = runnerRunFundingSupport(
    funded.input,
    economy,
    funded.target,
    [funded.target],
    nonBankCandidates,
    {
      acceptFundedRun: (nextInput, nextTarget) =>
        nextTarget.actionId === target.actionId &&
        nextTarget.targetServerId === target.targetServerId &&
        (runnerTerminalRemoteContestIsDirectlyMandatory(
          nextInput,
          nextTarget,
        ) ||
          runnerRunTargetIsDirectlyConvertible({
            target: nextTarget,
            economy,
          })),
    },
  );
  if (
    !support ||
    support.routeAssessment.status !== "covered_guaranteed" ||
    support.routeAssessment.reliability !== "guaranteed" ||
    support.routeAssessment.horizon !== "same_turn" ||
    support.routeAssessment.projectedGap !== 0 ||
    support.routeActionIds.length !== 1 ||
    projection.clickCost + support.routeAssessment.totalClickCost + 1 >
      input.playerView.own.clicks
  )
    return undefined;
  return {
    ...support,
    gap: support.targetCredits - input.playerView.own.credits,
    routeActionIds: [cashOutActionId],
    routeAssessment: {
      ...support.routeAssessment,
      stateVersion: input.playerView.stateVersion,
      routeId: `bank-prefix:${cashOutActionId}:${support.routeAssessment.routeId}`,
      totalClickCost:
        projection.clickCost + support.routeAssessment.totalClickCost,
      firstStepActionId: cashOutActionId,
      evidenceCodes: [
        ...support.routeAssessment.evidenceCodes,
        `runner_bank_prefix_nonbank_continuation:${support.routeActionIds[0]}`,
        `runner_bank_prefix_exact_run:${target.actionId}`,
      ],
    },
  };
}
