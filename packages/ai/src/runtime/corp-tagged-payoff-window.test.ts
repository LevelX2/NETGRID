import type { AiDecisionInput, LegalAction } from "@netgrid/shared";
import { describe, expect, it } from "vitest";

import type { CorpTaggedRunnerPayoffActionProfile } from "./corp-scoring-assessment-types";
import { createCorpTaggedPayoffWindowContext } from "./corp-tagged-payoff-window";

describe("createCorpTaggedPayoffWindowContext", () => {
  it("does not penalize passive actions from visible meat payoff alone", () => {
    const context = testContext({
      visibleMeatDamagePayoff: () => true,
      taggedRunnerPayoffProfile: () => undefined,
    });
    const gain = action("gain-credit", "gain_credit");
    const input = corpInput([gain, action("draw", "draw_card")], 1);

    expect(
      context.corpTaggedPayoffWindowPassiveActionPenalty(input, gain),
    ).toBeUndefined();
  });

  it("penalizes passive actions when a concrete tagged payoff LegalAction exists", () => {
    const payoff = action("meat-payoff", "trigger_ability");
    const gain = action("gain-credit", "gain_credit");
    const context = testContext({
      taggedRunnerPayoffProfile: (_input, candidate) =>
        candidate.actionId === payoff.actionId
          ? {
              kind: "damage",
              value: 2600,
              evidence: [
                "tagged_payoff_kind:damage",
                "corp_tagged_meat_damage_payoff:true",
              ],
            }
          : undefined,
    });

    const penalty = context.corpTaggedPayoffWindowPassiveActionPenalty(
      corpInput([payoff, gain], 2),
      gain,
    );

    expect(penalty).toEqual(
      expect.objectContaining({
        key: "corp_tagged_payoff_window_passive_penalty",
        value: -1100,
        reason: expect.stringContaining("available_tagged_payoff_kind:damage"),
      }),
    );
  });

  it("keeps the concrete tagged payoff action itself unpenalized", () => {
    const payoff = action("resource-payoff", "trash_resource");
    const context = testContext({
      taggedRunnerPayoffProfile: (_input, candidate) =>
        candidate.actionId === payoff.actionId
          ? {
              kind: "resource_trash",
              value: 1800,
              evidence: ["tagged_payoff_kind:resource_trash"],
            }
          : undefined,
    });

    expect(
      context.corpTaggedPayoffWindowPassiveActionPenalty(
        corpInput([payoff, action("gain-credit", "gain_credit")], 1),
        payoff,
      ),
    ).toBeUndefined();
  });
});

function testContext(
  overrides: Partial<{
    visibleMeatDamagePayoff: (input: AiDecisionInput) => boolean;
    taggedRunnerPayoffProfile: (
      input: AiDecisionInput,
      action: LegalAction,
    ) => CorpTaggedRunnerPayoffActionProfile | undefined;
  }> = {},
) {
  return createCorpTaggedPayoffWindowContext({
    immediateTagSourceAvailable: () => false,
    unprotectedPersistentTagAssetSetup: () => false,
    taggedRunnerPayoffProfile:
      overrides.taggedRunnerPayoffProfile ?? (() => undefined),
    advanceCompletesScore: () => false,
    actionIsScoreLine: () => false,
    visibleMeatDamagePayoff:
      overrides.visibleMeatDamagePayoff ?? (() => false),
  });
}

function corpInput(
  legalActions: LegalAction[],
  runnerTags: number,
): AiDecisionInput {
  return {
    side: "corp",
    legalActions,
    playerView: {
      own: {
        credits: 3,
      },
      opponent: {
        tags: runnerTags,
      },
      legalActions,
    },
  } as unknown as AiDecisionInput;
}

function action(
  actionId: string,
  type: LegalAction["type"],
): LegalAction {
  return {
    actionId,
    side: "corp",
    type,
    label: actionId,
    costs: [],
    payload: {},
  } as unknown as LegalAction;
}

