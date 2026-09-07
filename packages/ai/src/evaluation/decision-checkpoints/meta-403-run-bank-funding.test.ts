import { describe, expect, it } from "vitest";
import checkpointJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-403-run-bank-funding-d188.json";
import paymentJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-403-run-bank-payment-d186.json";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import {
  assessKnownRezzedIcePath,
  runnerRunPathCreditBudgetWithVisiblePools,
} from "../../visible-run-analysis";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";

function checkpoint() {
  return structuredClone(checkpointJson) as unknown as {
    input: AiDecisionInputWithDeckCapabilities;
    runtime: AiRuntimeCheckpointV1;
  };
}

describe("meta 403 installed payment source funds the remaining run", () => {
  it.each([2, 5])(
    "retains activation liquidity in the current bound payment window: %i",
    (credits) => {
      const capture = structuredClone(paymentJson) as unknown as ReturnType<
        typeof checkpoint
      >;
      capture.input.playerView.own.credits = credits;
      resetResidentPlanPortfolioMemory();
      restoreAiRuntimeCheckpoint(
        capture.input,
        capture.input.ownDeckSnapshot!.deckSnapshotId,
        capture.runtime,
      );
      const original = capture.input.legalActions.find(
        (action) =>
          action.payload?.runnerCostPenaltySupportContinuation === true,
      )!;
      const bank = capture.input.legalActions.find(
        (action) =>
          action.payload?.costPenaltySupportOriginalActionId ===
          original.actionId,
      )!;
      // This old capture predates the explicit Engine cash-target projection.
      // Its exact pending break costs 2, with no restricted or run-only pool.
      bank.payload!.costPenaltySupportRunnerCreditTarget = 2;
      const decision = chooseAiAction(capture.input);
      expect(decision.actionId).toBe(
        credits === 2 ? bank.actionId : original.actionId,
      );
      expect(decision.fallbackUsed).toBe(false);
      expect(decision.decisionDebug?.planFirstDecision).toMatchObject({
        rootPlanInstanceId: "plan:runner.contest_remote:remote%3Aremote_1",
        leafExecutorInstanceId: "plan:runner.convert_run_window:run%3Arun_168",
      });
    },
  );
  it.each([true, false])(
    "retains the exact remote run only with its available bank: %s",
    (withBank) => {
      const capture = checkpoint();
      if (!withBank)
        capture.input.playerView.own.rig =
          capture.input.playerView.own.rig!.filter(
            (card) => !card.runnerPaymentSupportAbilities?.length,
          );
      resetResidentPlanPortfolioMemory();
      restoreAiRuntimeCheckpoint(
        capture.input,
        capture.input.ownDeckSnapshot!.deckSnapshotId,
        capture.runtime,
      );
      const decision = chooseAiAction(capture.input);
      expect(decision.actionId).toBe(
        withBank ? "runner.continue_run" : "runner.jack_out",
      );
      expect(decision.fallbackUsed).toBe(false);
      expect(decision.decisionDebug?.planFirstDecision).toMatchObject({
        rootPlanInstanceId: "plan:runner.contest_remote:remote%3Aremote_1",
        leafExecutorInstanceId: "plan:runner.convert_run_window:run%3Arun_168",
      });
    },
  );

  it("quotes each source once and never pays bank activation from run-only credits", () => {
    const { input } = checkpoint();
    const rig = input.playerView.own.rig!;
    const ice = input.playerView.servers.find(
      (server) => server.id === "remote_1",
    )!.ice[0]!;
    const budget = runnerRunPathCreditBudgetWithVisiblePools(3, rig, {
      liquidCredits: 3,
    });
    const one = assessKnownRezzedIcePath([ice], rig, budget);
    expect(one).toMatchObject({ canReachAccess: true, creditsAfterPath: 2 });
    expect(one.creditBudgetAfterPath).toMatchObject({
      paymentSupportSources: [],
      paymentSupportCreditsGained: 3,
    });
    const two = assessKnownRezzedIcePath(
      [
        {
          ...ice,
          instanceId: "second-wall",
          effectiveRunQuote: {
            ...ice.effectiveRunQuote!,
            iceInstanceId: "second-wall",
          },
        },
        ice,
      ],
      rig,
      budget,
    );
    expect(two.canReachAccess).toBe(false);
    expect(
      assessKnownRezzedIcePath(
        [ice],
        rig,
        runnerRunPathCreditBudgetWithVisiblePools(3, rig, { liquidCredits: 0 }),
      ).canReachAccess,
    ).toBe(false);
    const empty = assessKnownRezzedIcePath([], rig, budget);
    expect(empty.creditsAfterPath).toBe(3);
    expect(budget.paymentSupportSources).toHaveLength(1);
  });
});
