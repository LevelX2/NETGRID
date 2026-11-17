import { syntheticCardDefinitionId } from "@netgrid/engine/test-fixtures/synthetic-card-definition-id";
import type { AiDecisionInput, VisibleCard } from "@netgrid/shared";
import { describe, expect, it } from "vitest";

import { discardCurrentPlanKind } from "./discard-plan";

describe("discard plan", () => {
  it("detects corp remote support from structured role tokens", () => {
    const input = corpInput([
      card(syntheticCardDefinitionId("agenda_1"), "agenda"),
      card(syntheticCardDefinitionId("remote_support_1"), "asset"),
    ]);

    expect(
      discardCurrentPlanKind(input, {
        definitionTypeForCardId: (definitionId) =>
          definitionId === syntheticCardDefinitionId("agenda_1") ? "agenda" : "asset",
        rolesForCardId: (definitionId) =>
          definitionId === syntheticCardDefinitionId("remote_support_1") ? ["corp.remote_support"] : [],
      }),
    ).toBe("score_next_turn");
  });

  it("ignores remote-like role substrings without structured role tokens", () => {
    const input = corpInput([
      card(syntheticCardDefinitionId("agenda_1"), "agenda"),
      card(syntheticCardDefinitionId("remote_noise_1"), "asset"),
    ]);

    expect(
      discardCurrentPlanKind(input, {
        definitionTypeForCardId: (definitionId) =>
          definitionId === syntheticCardDefinitionId("agenda_1") ? "agenda" : "asset",
        rolesForCardId: (definitionId) =>
          definitionId === syntheticCardDefinitionId("remote_noise_1") ? ["remotecontrol_noise"] : [],
      }),
    ).toBeUndefined();
  });

  it("detects runner build-rig plans from bounded breaker roles", () => {
    const input = runnerInput([card(syntheticCardDefinitionId("hand_breaker"), "program")], []);

    expect(
      discardCurrentPlanKind(input, {
        definitionTypeForCardId: () => "program",
        rolesForCardId: (definitionId) =>
          definitionId === syntheticCardDefinitionId("hand_breaker") ? ["support_breaker_fracter"] : [],
      }),
    ).toBe("build_rig");
  });

  it("ignores runner breaker-like substrings for build-rig plans", () => {
    const input = runnerInput([card(syntheticCardDefinitionId("hand_noise"), "program")], []);

    expect(
      discardCurrentPlanKind(input, {
        definitionTypeForCardId: () => "program",
        rolesForCardId: (definitionId) =>
          definitionId === syntheticCardDefinitionId("hand_noise") ? ["breaker_fracterish_noise"] : [],
      }),
    ).toBeUndefined();
  });

  it("treats installed bounded breaker roles as existing rig coverage", () => {
    const input = runnerInput(
      [card(syntheticCardDefinitionId("hand_setup"), "hardware")],
      [card(syntheticCardDefinitionId("installed_breaker"), "program")],
    );

    expect(
      discardCurrentPlanKind(input, {
        definitionTypeForCardId: (definitionId) =>
          definitionId === syntheticCardDefinitionId("hand_setup") ? "hardware" : "program",
        rolesForCardId: (definitionId) =>
          definitionId === syntheticCardDefinitionId("installed_breaker")
            ? ["support_breaker_fracter"]
            : definitionId === syntheticCardDefinitionId("hand_setup")
              ? ["setup"]
              : [],
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

function runnerInput(hand: VisibleCard[], rig: VisibleCard[]): AiDecisionInput {
  return {
    side: "runner",
    playerView: {
      own: {
        credits: 8,
        gripOrHq: hand,
        rig,
      },
    },
  } as AiDecisionInput;
}

function card(
  definitionId: number,
  type: NonNullable<VisibleCard["type"]>,
): VisibleCard {
  return {
    instanceId: String(definitionId),
    definitionId,
    title: String(definitionId),
    owner: "corp",
    controller: "corp",
    type,
    known: true,
  };
}
