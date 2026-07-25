import type { AiDecisionInput, LegalAction, VisibleCard } from "@netgrid/shared";
import { describe, expect, it } from "vitest";

import {
  createCorpTagPunishPayoffProfileContext,
} from "./corp-tag-punish-payoff-profiles";

describe("createCorpTagPunishPayoffProfileContext", () => {
  it("values basic credit when it reaches a visible tagged payoff cost", () => {
    const payoff = corpCard("tagged-payoff", {
      playCost: { kind: "fixed", credits: 1 },
    });
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
        gripOrHq: [
          corpCard("tagged-payoff", {
            playCost: { kind: "fixed", credits: 1 },
          }),
        ],
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
        gripOrHq: [
          corpCard("tagged-payoff", {
            playCost: { kind: "fixed", credits: 3 },
          }),
        ],
      }),
      gainCreditAction(),
    );

    expect(profile).toBeUndefined();
  });

  it("funds the explicit minimum of a variable-X tagged payoff", () => {
    const context = testContext();
    const profile = context.corpTagPunishPayoffFundingProfile(
      corpInput({
        credits: 0,
        runnerTags: 1,
        gripOrHq: [
          corpCard("tagged-payoff", {
            playCost: {
              kind: "variable_x",
              minimumX: 1,
              creditsPerX: 1,
              maximumX: { kind: "context" },
            },
          }),
        ],
      }),
      gainCreditAction(),
    );

    expect(profile?.evidence).toEqual(
      expect.arrayContaining(["payoff_cost:1", "credits_after_action:1"]),
    );
  });

  it("fails closed when a visible tagged payoff has no play-cost model", () => {
    const context = testContext();
    const profile = context.corpTagPunishPayoffFundingProfile(
      corpInput({
        credits: 0,
        runnerTags: 1,
        gripOrHq: [corpCard("tagged-payoff")],
      }),
      gainCreditAction(),
    );

    expect(profile).toBeUndefined();
  });

  it("fails closed for malformed fixed and variable-X play-cost payloads", () => {
    const context = testContext();
    for (const playCost of [
      { kind: "fixed", credits: -1 },
      {
        kind: "variable_x",
        minimumX: 0,
        creditsPerX: 1,
        maximumX: { kind: "context" },
      },
      {
        kind: "variable_x",
        minimumX: 1,
        creditsPerX: 0,
        maximumX: { kind: "context" },
      },
    ]) {
      const profile = context.corpTagPunishPayoffFundingProfile(
        corpInput({
          credits: 0,
          runnerTags: 1,
          gripOrHq: [
            corpCard("tagged-payoff", {
              playCost: playCost as NonNullable<VisibleCard["playCost"]>,
            }),
          ],
        }),
        gainCreditAction(),
      );
      expect(profile).toBeUndefined();
    }
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
