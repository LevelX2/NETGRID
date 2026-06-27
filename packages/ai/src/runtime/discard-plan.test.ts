import type { AiDecisionInput, VisibleCard } from "@netgrid/shared";
import { describe, expect, it } from "vitest";

import { discardCurrentPlanKind } from "./discard-plan";

describe("discard plan", () => {
  it("detects corp remote support from structured role tokens", () => {
    const input = corpInput([
      card("agenda_1", "agenda"),
      card("remote_support_1", "asset"),
    ]);

    expect(
      discardCurrentPlanKind(input, {
        definitionTypeForCardId: (definitionId) =>
          definitionId === "agenda_1" ? "agenda" : "asset",
        rolesForCardId: (definitionId) =>
          definitionId === "remote_support_1" ? ["corp.remote_support"] : [],
      }),
    ).toBe("score_next_turn");
  });

  it("ignores remote-like role substrings without structured role tokens", () => {
    const input = corpInput([
      card("agenda_1", "agenda"),
      card("remote_noise_1", "asset"),
    ]);

    expect(
      discardCurrentPlanKind(input, {
        definitionTypeForCardId: (definitionId) =>
          definitionId === "agenda_1" ? "agenda" : "asset",
        rolesForCardId: (definitionId) =>
          definitionId === "remote_noise_1" ? ["remotecontrol_noise"] : [],
      }),
    ).toBeUndefined();
  });
});

function corpInput(hand: VisibleCard[]): AiDecisionInput {
  return {
    side: "corp",
    playerView: {
      own: {
        credits: 8,
        gripOrHq: hand,
      },
    },
  } as AiDecisionInput;
}

function card(
  definitionId: string,
  type: NonNullable<VisibleCard["type"]>,
): VisibleCard {
  return {
    instanceId: definitionId,
    definitionId,
    title: definitionId,
    owner: "corp",
    controller: "corp",
    type,
    known: true,
  };
}
