import type { LegalAction } from "@netgrid/shared";
import { describe, expect, it } from "vitest";

import { buildActionSemanticCandidates } from "../action-semantic-candidate";
import type { ActionCardSemanticProfile } from "../action-semantic-candidate-types";
import { buildActionCardSemanticProfilesByDefinitionId } from "./action-card-semantic-profiles";

const OVERTIME_ID = "onr_v1_297_overtime-incentives" as const;

describe("action-capacity hint consumer", () => {
  it("confirms Overtime Incentives against LegalAction facts and consumes its durability contract", () => {
    const candidate = projectOvertime(
      buildActionCardSemanticProfilesByDefinitionId(),
    );

    expect(candidate.actionCapacityProjection).toMatchObject({
      kind: "immediate_unrestricted_gain",
      grossActionsGained: 2,
      followupActionCapacity: 2,
      repeatable: false,
      bankable: false,
      source: "legal_action_payload",
    });
    expect(candidate.actionCapacityProjection?.evidence).toEqual(
      expect.arrayContaining([
        "hint_contract:action_capacity_confirmed",
        "hint_contract:class:immediate_gain",
        "hint_contract:bankable:false",
        "hint_contract:repeatable:false",
      ]),
    );
  });

  it("does not replace a mismatching LegalAction amount with hint data", () => {
    const profiles: Readonly<Record<string, ActionCardSemanticProfile>> = {
      [OVERTIME_ID]: {
        cardId: OVERTIME_ID,
        tacticSignals: [],
        actionCapacityProfiles: [
          {
            class: "immediate_gain",
            timing: "immediate",
            recipient: "corp",
            restriction: "unrestricted",
            reliability: "guaranteed",
            sourceResource: "source_card",
            expiresAt: "side_turn_end",
            amount: 3,
            amountKind: "fixed",
            bankable: false,
            repeatable: false,
          },
        ],
      },
    };

    const candidate = projectOvertime(profiles);

    expect(candidate.actionCapacityProjection).toMatchObject({
      grossActionsGained: 2,
      repeatable: "unknown",
      bankable: "unknown",
      source: "legal_action_payload",
    });
    expect(candidate.actionCapacityProjection?.evidence).toEqual(
      expect.arrayContaining([
        "hint_contract:action_capacity_mismatch",
        "hint_contract:legal_action_remains_authoritative",
      ]),
    );
  });
});

function projectOvertime(
  profiles: Readonly<Record<string, ActionCardSemanticProfile>>,
) {
  const action: LegalAction = {
    actionId: "corp.play-overtime",
    side: "corp",
    type: "play_operation",
    label: "Overtime Incentives spielen",
    source: "overtime-instance",
    timingPoint: "corp_action.main",
    costs: [{ clicks: 1, credits: 1 }],
    targetRequirements: [],
    visibility: "private_to_actor",
    expiresAtStateVersion: 1,
    payload: {
      cardId: "overtime-instance",
      gainActionsAmount: 2,
      actionCapacityTiming: "immediate",
      actionCapacityRestriction: "unrestricted",
      actionCapacityReliability: "guaranteed",
    },
  };
  const [candidate] = buildActionSemanticCandidates({
    legalActions: [action],
    observerSide: "corp",
    visibleSourceDefinitionsByInstanceId: {
      "overtime-instance": OVERTIME_ID,
    },
    cardSemanticProfilesByDefinitionId: profiles,
  });
  if (!candidate) throw new Error("Expected Overtime candidate");
  return candidate;
}
