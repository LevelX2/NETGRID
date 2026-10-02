import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it } from "vitest";
import type { AiDecisionInputWithDeckCapabilities } from "./ai-decision-input";
import { chooseAiAction } from "../ai-runtime-public-entrypoints";
import { resetResidentPlanPortfolioMemory } from "../plans/resident-plan-portfolio-memory";
import { buildAiDecisionInputDto } from "../input-dto";
import { PlanResolutionFailure } from "../plans/plan-resolution-failure";
import {
  currentCorpHostedBankCycleQuotes,
  corpHostedBankCycleForParentFunding,
} from "../corp/economy/hosted-credit-bank-cycle";
import { buildActionSemanticCandidates } from "../action-semantic-candidate";
import { corpVisibleCardEconomyWithdrawals } from "../corp/economy/economy-signals";
import { restoreResidentPlanPortfolioMemorySnapshot } from "../plans/resident-plan-portfolio-memory";
import { restoreStrategicIntentMemorySnapshot } from "../strategic-intent-memory";
import type { CorpEconomyParentFundingSignal } from "../corp/economy/economy-types";

function checkpoint() {
  return JSON.parse(
    readFileSync(
      new URL(
        "../../../../data/scenarios/ai-decision-checkpoints/cp-meta-472-sp456-bank-cycle.json",
        import.meta.url,
      ),
      "utf8",
    ),
  ) as {
    beforeInput: AiDecisionInputWithDeckCapabilities;
    boundaries: Array<{
      name: string;
      input: AiDecisionInputWithDeckCapabilities;
      expectedAction: string;
    }>;
    scoreParentSignal: CorpEconomyParentFundingSignal;
    defenseParentSignal: CorpEconomyParentFundingSignal;
    steps: Array<{
      input: AiDecisionInputWithDeckCapabilities;
      expected: {
        actionId: string;
        root: string;
        priority: string;
        parent: string;
        need: string;
      };
    }>;
  };
}
afterEach(resetResidentPlanPortfolioMemory);
function currentCashoutCheckpoint() {
  return JSON.parse(
    readFileSync(
      new URL(
        "../../../../data/scenarios/ai-decision-checkpoints/cp-meta-472-sp456-unbound-bank-cashout.json",
        import.meta.url,
      ),
      "utf8",
    ),
  ) as {
    input: AiDecisionInputWithDeckCapabilities;
    validation: Record<string, boolean>;
    runtime: {
      strategicIntent: Parameters<
        typeof restoreStrategicIntentMemorySnapshot
      >[1];
      residentPlanPortfolio: Parameters<
        typeof restoreResidentPlanPortfolioMemorySnapshot
      >[1];
    };
  };
}

function currentWithdrawalSignals(input: AiDecisionInputWithDeckCapabilities) {
  return corpVisibleCardEconomyWithdrawals(
    input,
    buildActionSemanticCandidates({
      legalActions: input.legalActions,
      observerSide: "corp",
      stateVersion: input.playerView.stateVersion,
    }),
  );
}

describe("SP-456 exact current all-pool withdrawal at R6 G1/D200", () => {
  it("selects the native fifteen-credit cashout through the existing Economy plan, step and route", () => {
    const cp = currentCashoutCheckpoint();
    expect(Object.values(cp.validation).every(Boolean)).toBe(true);
    restoreStrategicIntentMemorySnapshot(
      cp.input,
      cp.runtime.strategicIntent,
      cp.input.ownDeckSnapshot!.deckSnapshotId,
    );
    restoreResidentPlanPortfolioMemorySnapshot(
      cp.input,
      cp.runtime.residentPlanPortfolio,
    );
    const cashout = cp.input.legalActions.find(
      (action) => action.payload?.hostedCreditTakeMode === "all",
    )!;
    const decision = chooseAiAction(cp.input, {
      persistTacticalPlanMemory: false,
    });
    expect(decision.actionId).toBe(cashout.actionId);
    expect(decision.decisionDebug?.fallbackUsed).toBe(false);
    const plan = decision.decisionDebug?.planFirstDecision;
    expect(plan?.rootPlanInstanceId).toBe(
      `plan:corp.economy:economy-visible-card-payout%3A${cashout.source}`,
    );
    expect(plan?.priority?.effectiveClass).toBe("P4");
    expect(plan?.selectedStep?.planInstanceId).toBe(plan?.rootPlanInstanceId);
    expect(plan?.route).toMatchObject({
      planInstanceId: plan?.rootPlanInstanceId,
      stepId: plan?.selectedStep?.stepId,
      actionId: cashout.actionId,
      actionType: "activated_card_ability",
      semanticActionType: "economy.gain_credit",
      stateVersion: cp.input.playerView.stateVersion,
    });
    expect(currentWithdrawalSignals(cp.input)[0]?.conversion).toMatchObject({
      grossLiquidCreditGain: 15,
      netLiquidCreditGain: 15,
      payoutMode: "all_available",
      hostedCreditTakeMode: "all",
    });
    expect(currentWithdrawalSignals(buildAiDecisionInputDto(cp.input))).toEqual(
      currentWithdrawalSignals(cp.input),
    );
  });

  it("rejects an all-pool payout that disagrees with the currently visible bank", () => {
    const input = currentCashoutCheckpoint().input;
    const cashout = input.legalActions.find(
      (action) => action.payload?.hostedCreditTakeMode === "all",
    )!;
    const source = input.playerView.servers
      .flatMap((server) => server.root)
      .find((card) => card.instanceId === cashout.source)!;
    source.counters!.bit = 14;
    expect(currentWithdrawalSignals(input)).toEqual([]);
  });
});

describe("SP-456 actual Engine bank cycle through the normal Corp chooser", () => {
  it("preserves the original basic-credit result before the missing producer is supplied", () => {
    const decision = chooseAiAction(checkpoint().beforeInput);
    expect(decision.actionId).toBe("corp.gain_credit");
    expect(decision.decisionDebug?.fallbackUsed).toBe(false);
  });
  it("runs rez, load, load and cashout with the current Score and Defense funding bindings", () => {
    for (const step of checkpoint().steps) {
      const decision = chooseAiAction(step.input);
      const plan = decision.decisionDebug?.planFirstDecision;
      expect(decision.actionId).toBe(step.expected.actionId);
      expect(plan?.rootPlanInstanceId).toBe(step.expected.root);
      expect(plan?.priority?.effectiveClass).toBe(step.expected.priority);
      expect(plan?.selectedStep).toMatchObject({
        parentInstanceId: step.expected.parent,
        needId: step.expected.need,
        planInstanceId: expect.stringContaining("plan:corp.economy:"),
      });
      expect(decision.decisionDebug?.fallbackUsed).toBe(false);
      expect(
        step.input.legalActions.some((a) => a.actionId === decision.actionId),
      ).toBe(true);
    }
  });
  it("keeps the exact current root-rez quote across the side-safe DTO boundary", () => {
    const input = checkpoint().steps[0]!.input;
    const before = currentCorpHostedBankCycleQuotes(input);
    expect(before).toHaveLength(1);
    const dto = buildAiDecisionInputDto(input);
    expect(currentCorpHostedBankCycleQuotes(dto)).toEqual(before);
    expect(
      dto.legalActions.find((a) => a.actionId === before[0]!.actionId)?.payload
        ?.rootRez,
    ).toBe(true);
  });
  for (const name of [
    "two_click_unrezzed",
    "unaffordable_rez",
    "one_click_load_unknown",
    "another_income_available",
  ])
    it("keeps the Engine-proved alternative at " + name, () => {
      const boundary = checkpoint().boundaries.find((b) => b.name === name)!;
      const decision = chooseAiAction(boundary.input);
      expect(decision.actionId).toBe(boundary.expectedAction);
      expect(decision.decisionDebug?.fallbackUsed).toBe(false);
    });
  it("does not reload a bank for a Score parent already funded by its current cashout", () => {
    const cp = checkpoint(),
      input = cp.boundaries.find(
        (b) => b.name === "loaded_bank_two_clicks",
      )!.input;
    const candidates = buildActionSemanticCandidates({
      legalActions: input.legalActions,
      observerSide: "corp",
      stateVersion: input.playerView.stateVersion,
    });
    expect(
      currentCorpHostedBankCycleQuotes(input)[0]!.currentHostedCredits,
    ).toBe(cp.scoreParentSignal.gap);
    expect(
      corpHostedBankCycleForParentFunding(
        input,
        candidates,
        cp.scoreParentSignal,
      ),
    ).toBeUndefined();
  });
  it("does not consume all remaining clicks for an uninstalled ICE reserve", () => {
    const cp = checkpoint(),
      input = cp.steps[1]!.input;
    const candidates = buildActionSemanticCandidates({
      legalActions: input.legalActions,
      observerSide: "corp",
      stateVersion: input.playerView.stateVersion,
    });
    expect(
      corpHostedBankCycleForParentFunding(
        input,
        candidates,
        cp.defenseParentSignal,
      ),
    ).toBeDefined();
    cp.defenseParentSignal.incrementalDefenseReserve!.iceInstanceId =
      input.playerView.own.gripOrHq.find((c) => c.type === "ice")!.instanceId;
    expect(
      corpHostedBankCycleForParentFunding(
        input,
        candidates,
        cp.defenseParentSignal,
      ),
    ).toBeUndefined();
  });
  for (const field of [
    "stateVersion",
    "sourceServerId",
    "currentHostedCredits",
    "loadAbilityId",
    "setupCreditCost",
  ] as const)
    it("fails closed on inconsistent " + field, () => {
      const input = checkpoint().steps[0]!.input;
      const action = input.legalActions.find(
        (a) => a.payload?.hostedCreditBankCycleQuoteJson,
      )!;
      const quote = JSON.parse(
        String(action.payload!.hostedCreditBankCycleQuoteJson),
      );
      quote[field] =
        typeof quote[field] === "number" ? quote[field] + 1 : "invalid:binding";
      action.payload!.hostedCreditBankCycleQuoteJson = JSON.stringify(quote);
      expect(() => currentCorpHostedBankCycleQuotes(input)).toThrow(
        PlanResolutionFailure,
      );
    });
});
