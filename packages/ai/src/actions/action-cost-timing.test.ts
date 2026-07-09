import type { LegalAction } from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import {
  costProfileForAction,
  timingProfileForAction,
} from "./action-cost-timing";

describe("action cost and timing profiles", () => {
  it("binds X bounds, selected value and explicit reserve from LegalAction payload", () => {
    const profile = costProfileForAction(
      action("play_operation", {
        xValue: 3,
        xMinValue: 1,
        xMaxValue: 6,
        creditsRemainingAfterCost: 4,
      }),
    );

    expect(profile).toMatchObject({
      xValue: 3,
      variableCost: {
        kind: "x",
        min: 1,
        max: 6,
        chosen: 3,
        postActionReserve: 4,
        source: "legal_action_payload",
      },
    });
  });

  it("keeps pending X choices unknown instead of inventing a value", () => {
    expect(
      costProfileForAction(
        action("activated_card_ability", { xValue: "choice" }),
      ),
    ).toMatchObject({
      xValue: "choice",
      variableCost: {
        kind: "x",
        source: "legal_action_payload",
      },
    });
  });

  it("normalizes structured run duration and action debt", () => {
    expect(
      timingProfileForAction(
        action("activated_card_ability", {
          modifierDuration: "current_run",
          expiresAt: "run_end",
        }),
      ).duration,
    ).toEqual({
      kind: "current_run",
      source: "legal_action_payload",
      expiresAt: "run_end",
    });
    expect(
      timingProfileForAction(action("forgo_action", { forgoActionsPending: 3 }))
        .duration,
    ).toEqual({ kind: "action_debt", source: "action_type", actions: 3 });
  });
});

function action(
  type: LegalAction["type"],
  payload: NonNullable<LegalAction["payload"]>,
): LegalAction {
  return {
    actionId: `cost-timing-${type}`,
    side: "corp",
    type,
    label: type,
    source: "game_rule",
    timingPoint:
      type === "forgo_action" ? "corp_action.main" : "run.encounter_ice",
    costs: [],
    targetRequirements: [],
    visibility: "private_to_actor",
    expiresAtStateVersion: 1,
    payload,
  };
}
