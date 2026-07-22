import { CARD_DEFINITIONS_BY_ID } from "@netgrid/shared";
import { describe, expect, it } from "vitest";

import { deterministicOnPlayResourcePayload } from "./card-implementation-runtime-shared";

describe("deterministic on-play action-capacity payload", () => {
  it("publishes Valu-Pak's exact restricted program-install bundle", () => {
    const definition =
      CARD_DEFINITIONS_BY_ID["onr_v1_117_valu-pak-software-bundle"];

    expect(
      deterministicOnPlayResourcePayload(definition!, "runner"),
    ).toMatchObject({
      gainActionsAmount: 5,
      actionCapacityTiming: "immediate",
      actionCapacityRestriction: "program_install_only",
      actionCapacityAllowedActionType: "install_card",
      actionCapacityReliability: "guaranteed",
      actionCapacityExpiresAt: "side_turn_end",
    });
  });

  it("publishes Edgerunner's exact restricted Corp-install bundle", () => {
    const definition =
      CARD_DEFINITIONS_BY_ID["onr_v1_289_edgerunner-inc-temps"];

    expect(
      deterministicOnPlayResourcePayload(definition!, "corp"),
    ).toMatchObject({
      gainActionsAmount: 3,
      actionCapacityTiming: "immediate",
      actionCapacityRestriction: "install_only",
      actionCapacityAllowedActionType: "install_card",
      actionCapacityReliability: "guaranteed",
      actionCapacityExpiresAt: "side_turn_end",
    });
  });
});
