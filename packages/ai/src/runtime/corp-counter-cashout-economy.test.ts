import { afterEach, describe, expect, it } from "vitest";
import { chooseCorpAction } from "../index";
import { PlanResolutionFailure } from "../plans/plan-resolution-failure";
import { resetResidentPlanPortfolioMemory } from "../plans/resident-plan-portfolio-memory";
import { resetTacticalPlanMemory } from "../tactical-plans";
import {
  aiInput,
  legalAction,
  server,
  visibleCard,
} from "../semantic-ai-runtime-cutover.test-support";

const DEFINITION_ID = "onr_v1_328_information-laundering";
const INSTANCE_ID = "counter-cashout-asset";

describe("Corp counter-cashout economy ownership", () => {
  afterEach(() => {
    resetTacticalPlanMemory();
    resetResidentPlanPortfolioMemory();
  });

  it("adds exactly one profitable counter through corp.economy", () => {
    const advance = cardAction("advance", "advance_card", 1, 1);
    const rez = cardAction("rez", "rez_card", 0, 0);
    const input = inputWithAsset(0, false, [advance, rez, basicCredit()]);

    const decision = chooseCorpAction(input);

    expectEconomyDecision(decision, "advance", "P5");
    expect(decision.evidence).toContain(
      "plan_assessment_evidence:corp_reviewed_counter_cashout_development:advance",
    );
  });

  it("rezzes a prepared counter-cashout source instead of adding another counter", () => {
    const advance = cardAction("advance-again", "advance_card", 1, 1);
    const rez = cardAction("rez", "rez_card", 0, 0);
    const input = inputWithAsset(1, false, [advance, rez, basicCredit()]);

    const decision = chooseCorpAction(input);

    expectEconomyDecision(decision, "rez", "P4");
    expect(decision.evidence).toContain(
      "plan_assessment_evidence:corp_reviewed_counter_cashout_development:rez",
    );
  });

  it("takes the exact Engine-quoted counter payout before a basic credit", () => {
    const payout = legalAction(
      "cashout",
      "corp",
      "activated_card_ability",
      "Take the counter payout",
      { clicks: 1, credits: 0 },
      {
        source: INSTANCE_ID,
        payload: {
          cardId: INSTANCE_ID,
          cardImplementationEconomyKind:
            "gain_credits_per_advancement_counter_on_source",
          cardImplementationAmountPerAdvancementCounter: 4,
          advancementCounterCount: 1,
          cardImplementationTrashesSource: true,
          gainCreditsAmount: 4,
        },
      },
    );
    const input = inputWithAsset(1, true, [payout, basicCredit()]);

    const decision = chooseCorpAction(input);

    expectEconomyDecision(decision, "cashout", "P4");
    expect(decision.evidence).toContain(
      `plan_assessment_evidence:corp_engine_certified_visible_card_payout:${DEFINITION_ID}`,
    );
  });

  it("does not invent a cashout when the current Engine quote is incomplete", () => {
    const incompletePayout = legalAction(
      "cashout-incomplete",
      "corp",
      "activated_card_ability",
      "Unquoted counter payout",
      { clicks: 1, credits: 0 },
      {
        source: INSTANCE_ID,
        payload: {
          cardId: INSTANCE_ID,
          cardImplementationEconomyKind:
            "gain_credits_per_advancement_counter_on_source",
          cardImplementationAmountPerAdvancementCounter: 4,
        },
      },
    );
    const input = inputWithAsset(1, true, [incompletePayout, basicCredit()]);

    expect(() => chooseCorpAction(input)).toThrowError(
      expect.objectContaining({
        name: PlanResolutionFailure.name,
        code: "missing_plan_module_coverage",
      }),
    );
  });
});

function inputWithAsset(
  advancementCounters: number,
  rezzed: boolean,
  actions: ReturnType<typeof legalAction>[],
) {
  const input = aiInput("corp", actions);
  input.playerView.own.credits = 5;
  input.playerView.own.clicks = 3;
  input.playerView.servers = [
    server("hq"),
    server("rd"),
    server("archives"),
    server(
      "remote_1",
      [],
      [
        visibleCard(INSTANCE_ID, "corp", "asset", {
          definitionId: DEFINITION_ID,
          title: "Counter cashout fixture",
          advancementCounters,
          rezzed,
        }),
      ],
    ),
  ];
  return input;
}

function cardAction(
  actionId: string,
  type: "advance_card" | "rez_card",
  clicks: number,
  credits: number,
) {
  return legalAction(
    actionId,
    "corp",
    type,
    actionId,
    { clicks, credits },
    {
      source: INSTANCE_ID,
      payload: { cardId: INSTANCE_ID, serverId: "remote_1" },
    },
  );
}

function basicCredit() {
  return legalAction("gain-credit", "corp", "gain_credit", "Gain 1", {
    clicks: 1,
    credits: 0,
  });
}

function expectEconomyDecision(
  decision: ReturnType<typeof chooseCorpAction>,
  actionId: string,
  priorityClass: "P4" | "P5",
) {
  expect(decision.actionId).toBe(actionId);
  expect(decision.reasonCode).toBe("plan_first.corp.economy");
  expect(decision.fallbackUsed).toBe(false);
  expect(decision.evidence).toEqual(
    expect.arrayContaining([
      `plan_priority_class:${priorityClass}`,
      "plan_module:corp.economy",
      "plan_step_capability:develop_or_convert_corp_economy",
    ]),
  );
}
