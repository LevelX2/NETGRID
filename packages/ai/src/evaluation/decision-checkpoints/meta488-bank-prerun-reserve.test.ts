import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { beforeEach, describe, expect, it } from "vitest";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { buildAiDecisionInputDto } from "../../input-dto";
import { buildDeckCapabilityProfileFromInput } from "../../deck-capabilities";
import { buildActionSemanticCandidates } from "../../action-semantic-candidate";
import {
  evaluateRunnerRunTargets,
  quoteRunnerRunAfterGuaranteedBankCashouts,
} from "../../runner-run-target-evaluation";
import { buildRunnerEconomyPosture } from "../../runner-economy-posture";
import { assessRunnerRunFundingAdmission } from "../../runtime/runner-run-funding-admission";
import { runnerTerminalRemoteLastChanceKnownPathFundingGap } from "../../runner/remote-contest/remote-contest-admission";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import {
  resetResidentPlanPortfolioMemory,
  residentPlanPortfolioSnapshot,
} from "../../plans/resident-plan-portfolio-memory";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";

const parentId = "plan:runner.contest_remote:remote%3Aremote_1";
const needId = "run-support:remote:remote_1";

function engineFactsHash(input: AiDecisionInputWithDeckCapabilities) {
  return createHash("sha256").update(JSON.stringify({
    playerView: input.playerView, legalActions: input.legalActions,
    eventTail: input.eventTail,
  })).digest("hex");
}

function capture(game: 11 | 20) {
  const f = JSON.parse(readFileSync(new URL(
    `../../../../../data/scenarios/ai-decision-checkpoints/cp-meta488-r2-g${game}-bank-reserve.json`,
    import.meta.url,
  ), "utf8")) as {
    input: AiDecisionInputWithDeckCapabilities;
    runtime: AiRuntimeCheckpointV1;
    validation: Record<string, boolean>;
  };
  return { ...f, input: { ...f.input, ...buildAiDecisionInputDto(f.input) } };
}

function facts(input: AiDecisionInputWithDeckCapabilities) {
  const caps = buildDeckCapabilityProfileFromInput(input);
  const candidates = buildActionSemanticCandidates({
    legalActions: input.legalActions,
    observerSide: "runner",
    stateVersion: input.playerView.stateVersion,
  });
  const targets = evaluateRunnerRunTargets({ input, deckCapabilities: caps });
  const target = targets.find((t) => t.actionId === "runner.start_run.remote_1")!;
  const economy = buildRunnerEconomyPosture({ input, deckCapabilities: caps });
  const banks = candidates.filter((c) => c.economyProjection?.payoutMode === "all_available")
    .sort((a, b) => (b.economyProjection!.netLiquidCreditGain! - a.economyProjection!.netLiquidCreditGain!) || a.actionId.localeCompare(b.actionId));
  const quote = (fundingCandidates = banks) => quoteRunnerRunAfterGuaranteedBankCashouts({
    input, deckCapabilities: caps, fundingCandidates,
    runActionId: target.actionId, targetServerId: target.targetServerId,
  });
  return { candidates, targets, target, economy, banks, quote };
}

describe("native unknown-ICE reserve bank support", () => {
  beforeEach(resetResidentPlanPortfolioMemory);

  it.each([11, 20] as const)("executes the real bank under the exact Remote parent in game %s", (game) => {
    const { input, runtime, validation } = capture(game);
    expect(Object.values(validation).every(Boolean)).toBe(true);
    const before = engineFactsHash(input);
    restoreAiRuntimeCheckpoint(input, input.ownDeckSnapshot!.deckSnapshotId, runtime);
    const result = chooseAiAction(input);
    const action = input.legalActions.find((a) => a.actionId === result.actionId)!;
    expect(facts(input).banks.find((c) => c.actionId === action.actionId)
      ?.economyProjection?.storedCreditsTaken).toBe(game === 11 ? 9 : 3);
    expect(action.expiresAtStateVersion).toBe(input.playerView.stateVersion);
    expect(result.fallbackUsed).toBe(false);
    expect(result.decisionDebug?.planFirstDecision).toMatchObject({
      rootPlanInstanceId: parentId,
      leafExecutorInstanceId: `plan:runner.credit_bank:${action.source}`,
      selectedStep: { parentInstanceId: parentId, needId },
      route: { actionId: action.actionId, stateVersion: input.playerView.stateVersion },
    });
    const providers = residentPlanPortfolioSnapshot(input)!.instances.filter((p) => p.parentNeedId === needId);
    expect(providers).toHaveLength(1);
    expect(providers[0]!.moduleState).toMatchObject({
      signal: { runFunding: { gap: game === 11 ? 17 : 2,
        routeAssessment: { totalClickCost: game === 11 ? 2 : 1, status: "covered_guaranteed" } } },
    });
    expect(engineFactsHash(input)).toBe(before);
  });

  it.each([11, 20] as const)("retains the full standard reserve and conditional access in game %s", (game) => {
    const { input } = capture(game);
    const { target, targets, economy, banks, quote } = facts(input);
    expect(assessRunnerRunFundingAdmission({ target, runTargets: targets, economy })).toMatchObject({
      admitted: true, targetDirectlyConvertible: false,
      prerunReserveCreditGap: game === 11 ? 17 : 2,
      concreteFundingGap: game === 11 ? 17 : 2,
    });
    expect(runnerTerminalRemoteLastChanceKnownPathFundingGap(input, target)).toBeUndefined();
    if (game === 11) expect(quote(banks.slice(0, 1))?.prerunReserveQuote).toMatchObject({ status: "blocked", creditGap: 8, requiredCredits: 14 });
    const funded = quote(banks.slice(0, game === 11 ? 2 : 1))!;
    expect(funded.pathPassability).toBe("reachable");
    expect(funded.routeQuote).toMatchObject({ reachability: "conditional_access", unknownIceCount: game === 11 ? 1 : 2 });
    expect(funded.prerunReserveQuote).toMatchObject({ status: "satisfied", riskTolerance: "standard", requiredCredits: game === 11 ? 14 : 20 });
    expect(funded.creditsAfterRun).toBe(game === 11 ? 15 : 21);
  });

  it.each(["insufficient_payout", "no_run_click", "missing_cashout", "missing_hand_buffer"] as const)("does not bind an incomplete bank proof: %s", (boundary) => {
    const { input, runtime } = capture(11);
    if (boundary === "insufficient_payout") input.playerView.own.credits = 4;
    if (boundary === "no_run_click") input.playerView.own.clicks = 2;
    if (boundary === "missing_cashout") input.legalActions = input.legalActions.filter((a) => !a.actionId.includes("withdraw_credits"));
    if (boundary === "missing_hand_buffer") input.playerView.own.gripOrHq = input.playerView.own.gripOrHq.slice(0, 1);
    restoreAiRuntimeCheckpoint(input, input.ownDeckSnapshot!.deckSnapshotId, runtime);
    const result = chooseAiAction(input);
    expect(result.fallbackUsed).toBe(false);
    expect(result.actionId).not.toBe("runner.start_run.remote_1");
    expect(residentPlanPortfolioSnapshot(input)!.instances.filter((p) => p.parentNeedId === needId && p.moduleId === "runner.credit_bank")).toHaveLength(0);
  });

  it("does not count the same finite source twice or reuse a stale payout", () => {
    const { input } = capture(11);
    const { banks, quote } = facts(input);
    expect(quote([banks[0]!, banks[0]!])).toBeUndefined();
    input.legalActions.find((a) => a.actionId === banks[0]!.actionId)!.expiresAtStateVersion--;
    expect(quote(banks.slice(0, 2))).toBeUndefined();
  });
});
