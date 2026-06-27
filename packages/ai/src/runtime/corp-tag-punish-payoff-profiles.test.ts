import type { AiDecisionInput, LegalAction, VisibleCard } from "@netgrid/shared";
import { describe, expect, it } from "vitest";

import {
  createCorpTagPunishPayoffProfileContext,
} from "./corp-tag-punish-payoff-profiles";

describe("createCorpTagPunishPayoffProfileContext", () => {
  it("values basic credit when it reaches a visible tagged payoff cost", () => {
    const payoff = corpCard("tagged-payoff", { cost: 1 });
    const context = testContext();
    const profile = context.corpTagPunishPayoffFundingProfile(
      corpInput({
        credits: 0,
        runnerTags: 1,
        gripOrHq: [payoff],
      }),
      gainCreditAction(),
    );

    expect(profile).toEqual(
      expect.objectContaining({
        kind: "funding",
        value: 1350,
      }),
    );
    expect(profile?.evidence).toEqual(
      expect.arrayContaining([
        "corp_tagged_payoff_targeted_funding:true",
        "target_definition:tagged-payoff",
        "payoff_cost:1",
        "credits_after_action:1",
      ]),
    );
  });

  it("does not fund tagged payoffs when the Runner is not tagged", () => {
    const context = testContext();
    const profile = context.corpTagPunishPayoffFundingProfile(
      corpInput({
        credits: 0,
        runnerTags: 0,
        gripOrHq: [corpCard("tagged-payoff", { cost: 1 })],
      }),
      gainCreditAction(),
    );

    expect(profile).toBeUndefined();
  });

  it("does not claim targeted funding when the payoff cost remains unreachable", () => {
    const context = testContext();
    const profile = context.corpTagPunishPayoffFundingProfile(
      corpInput({
        credits: 0,
        runnerTags: 1,
        gripOrHq: [corpCard("tagged-payoff", { cost: 3 })],
      }),
      gainCreditAction(),
    );

    expect(profile).toBeUndefined();
  });
});

function testContext() {
  return createCorpTagPunishPayoffProfileContext({
    installedEconomyCreditAmount: () => 0,
    sourceDefinitionIdForAction: () => undefined,
    actionSourceCard: () => undefined,
    visibleCardStoredCredits: () => 0,
    visibleMeatDamagePayoff: () => false,
    payoffProfileForDefinition: (definitionId) =>
      definitionId === "tagged-payoff" ? {} : undefined,
  });
}

function corpInput(options: {
  credits: number;
  runnerTags: number;
  gripOrHq: VisibleCard[];
}): AiDecisionInput {
  return {
    side: "corp",
    playerView: {
      own: {
        credits: options.credits,
        gripOrHq: options.gripOrHq,
      },
      opponent: {
        tags: options.runnerTags,
      },
    },
  } as unknown as AiDecisionInput;
}

function gainCreditAction(): LegalAction {
  return {
    actionId: "gain-credit",
    side: "corp",
    type: "gain_credit",
    source: "basic_action",
    label: "Gain 1",
    costs: [],
  } as unknown as LegalAction;
}

function corpCard(
  definitionId: string,
  overrides: Partial<VisibleCard> = {},
): VisibleCard {
  return {
    instanceId: `${definitionId}-instance`,
    definitionId,
    title: definitionId,
    owner: "corp",
    controller: "corp",
    type: "operation",
    known: true,
    ...overrides,
  };
}
