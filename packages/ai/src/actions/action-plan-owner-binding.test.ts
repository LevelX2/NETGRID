import type { LegalAction } from "@netgrid/shared";
import { describe, expect, it } from "vitest";

import { buildActionSemanticCandidates } from "../action-semantic-candidate";
import type { ActionCardSemanticProfile } from "../action-semantic-candidate-types";

const brokerProfile: ActionCardSemanticProfile = {
  cardId: "onr_v1_154_broker",
  tacticSignals: [],
  actionPlanOwnerBindings: [
    {
      capabilityKey: "store_credits",
      owner: "runner.credit_bank",
      route: "build",
    },
    {
      capabilityKey: "withdraw_credits",
      owner: "runner.credit_bank",
      route: "cash_out",
    },
  ],
};

describe("capability-bound action plan owners", () => {
  it("keeps Broker build and cash-out on distinct exact LegalAction capabilities", () => {
    const candidates = buildActionSemanticCandidates({
      legalActions: [
        canonicalAction("onr_v1_154_broker", "store_credits", "runner", 0),
        canonicalAction("onr_v1_154_broker", "withdraw_credits", "runner", 1),
      ],
      cardSemanticProfilesByDefinitionId: {
        onr_v1_154_broker: brokerProfile,
      },
    });

    expect(candidates.map((candidate) => candidate.planOwnerBinding)).toEqual([
      {
        capabilityKey: "store_credits",
        owner: "runner.credit_bank",
        route: "build",
      },
      {
        capabilityKey: "withdraw_credits",
        owner: "runner.credit_bank",
        route: "cash_out",
      },
    ]);
  });

  it("binds Loan and Data Fort owners from their exact capabilities", () => {
    const profiles: Readonly<Record<string, ActionCardSemanticProfile>> = {
      "onr_v1_168_loan-from-chiba": {
        cardId: "onr_v1_168_loan-from-chiba",
        tacticSignals: [],
        actionPlanOwnerBindings: [
          {
            capabilityKey: "trash_at_end_of_turn",
            owner: "runner.resource_lifecycle",
          },
        ],
      },
      "onr_v1_197_data-fort-reclamation": {
        cardId: "onr_v1_197_data-fort-reclamation",
        tacticSignals: [],
        actionPlanOwnerBindings: [
          {
            capabilityKey: "hq_to_new_remote_install_rez",
            owner: "corp.score_agenda",
          },
        ],
      },
    };
    const candidates = buildActionSemanticCandidates({
      legalActions: [
        canonicalAction(
          "onr_v1_168_loan-from-chiba",
          "trash_at_end_of_turn",
          "runner",
          0,
        ),
        canonicalAction(
          "onr_v1_197_data-fort-reclamation",
          "hq_to_new_remote_install_rez",
          "corp",
          1,
        ),
      ],
      cardSemanticProfilesByDefinitionId: profiles,
    });
    expect(candidates[0]?.planOwnerBinding?.owner).toBe(
      "runner.resource_lifecycle",
    );
    expect(candidates[1]?.planOwnerBinding?.owner).toBe("corp.score_agenda");
  });

  it("does not fall back card-wide for missing or forged capabilities", () => {
    const forgedCapability = buildActionSemanticCandidates({
      legalActions: [
        canonicalAction("onr_v1_154_broker", "forged_route", "runner", 0),
      ],
      cardSemanticProfilesByDefinitionId: {
        onr_v1_154_broker: brokerProfile,
      },
    })[0];
    expect(forgedCapability?.planOwnerBinding).toBeUndefined();

    const nonCanonical = canonicalAction(
      "onr_v1_154_broker",
      "store_credits",
      "runner",
      1,
    );
    delete nonCanonical.abilityRef;
    if (nonCanonical.payload) {
      delete nonCanonical.payload.cardImplementationCapabilityBindingKind;
      delete nonCanonical.payload.cardImplementationAbilityId;
      delete nonCanonical.payload.cardImplementationAbilityKey;
    }
    expect(
      buildActionSemanticCandidates({
        legalActions: [nonCanonical],
        cardSemanticProfilesByDefinitionId: {
          onr_v1_154_broker: brokerProfile,
        },
      })[0]?.planOwnerBinding,
    ).toBeUndefined();
  });

  it("rejects duplicate owner bindings at the action join", () => {
    expect(() =>
      buildActionSemanticCandidates({
        legalActions: [
          canonicalAction("onr_v1_154_broker", "store_credits", "runner", 0),
        ],
        cardSemanticProfilesByDefinitionId: {
          onr_v1_154_broker: {
            ...brokerProfile,
            actionPlanOwnerBindings: [
              ...brokerProfile.actionPlanOwnerBindings!,
              brokerProfile.actionPlanOwnerBindings![0]!,
            ],
          },
        },
      }),
    ).toThrow("duplicate plan-owner capability binding");
  });
});

function canonicalAction(
  definitionId: string,
  capabilityKey: string,
  side: "runner" | "corp",
  index: number,
): LegalAction {
  const source = `${side}-source-${index}`;
  const sourceAbilityId = `${definitionId}:${capabilityKey}`;
  return {
    actionId: `plan-owner-${index}-${capabilityKey}`,
    side,
    type: "activated_card_ability",
    label: "Plan owner witness",
    source,
    timingPoint: side === "runner" ? "runner_action.main" : "corp_action.main",
    costs: [],
    targetRequirements: [],
    visibility: "public",
    expiresAtStateVersion: 1,
    abilityRef: { sourceCardInstanceId: source, sourceAbilityId },
    payload: {
      sourceDefinitionId: definitionId,
      cardImplementationCapabilityBindingKind: "card_spec_capability_key",
      cardImplementationAbilityId: sourceAbilityId,
      cardImplementationAbilityKey: capabilityKey,
    },
  };
}
