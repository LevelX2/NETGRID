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
