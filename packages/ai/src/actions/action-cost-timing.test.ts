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

  it("projects the standardized printed X play-cost contract without treating it as free", () => {
    const profile = costProfileForAction({
      ...action("play_operation", {
        xValue: 2,
        xMinimum: 1,
        xMaximum: 4,
        xUpperBound: 4,
        xCreditsPerUnit: 1,
        variableCostKind: "printed_play_cost",
      }),
      costs: [{ clicks: 1, credits: 2 }],
    });

    expect(profile).toMatchObject({
      clickCost: 1,
      creditCost: 2,
      costKnownStatus: "known",
      xValue: 2,
      variableCost: {
        kind: "x",
        min: 1,
        max: 4,
        chosen: 2,
        source: "legal_action_payload",
      },
    });
    expect(profile.additionalCosts).toEqual(
      expect.arrayContaining([
        "xValue",
        "xMinimum",
        "xMaximum",
        "xUpperBound",
        "xCreditsPerUnit",
        "variableCostKind",
      ]),
    );
  });

  it("treats an omitted dimension in the complete Engine cost list as exact zero", () => {
    expect(
      costProfileForAction({
        ...action("install_card", {}),
        costs: [{ clicks: 1 }],
      }),
    ).toMatchObject({
      clickCost: 1,
      creditCost: 0,
      costKnownStatus: "known",
    });
    expect(
      costProfileForAction({
        ...action("play_operation", {}),
        costs: [{ credits: 3 }],
      }),
    ).toMatchObject({
      clickCost: 0,
      creditCost: 3,
      costKnownStatus: "known",
    });
  });

  it("keeps an Engine payload payment authoritative when the cost list only spends clicks", () => {
    expect(
      costProfileForAction({
        ...action("activated_card_ability", { paymentAmount: 10 }),
        costs: [{ clicks: 1 }],
      }),
    ).toMatchObject({
      clickCost: 1,
      creditCost: 10,
      costKnownStatus: "known",
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
