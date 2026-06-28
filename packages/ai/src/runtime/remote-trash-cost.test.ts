import { describe, expect, it, vi } from "vitest";
import type { AiDecisionInput, LegalAction, VisibleCard } from "@netgrid/shared";
import { remoteTrashDedicatedCreditsForMetrics } from "./remote-trash-cost";

const runtimeCardsMock = vi.hoisted(() => ({
  cards: {} as Record<string, { mechanics?: string[] }>,
}));

vi.mock("../ai-hints", () => ({
  RUNTIME_CARDS: runtimeCardsMock.cards,
}));

describe("remoteTrashDedicatedCreditsForMetrics", () => {
  it("matches dedicated trash-credit mechanics by bounded terms", () => {
    expect(dedicatedCredits("upgrade", ["upgrade_trash_payment"])).toBe(5);
    expect(dedicatedCredits("upgrade", ["upgrade_trash_paymentish_noise"])).toBe(
      0,
    );

    expect(dedicatedCredits("asset", ["node_trash_recurring_credit"])).toBe(5);
    expect(
      dedicatedCredits("asset", ["node_trash_recurring_credited_noise"]),
    ).toBe(0);
  });
});

function dedicatedCredits(
  accessedType: "asset" | "upgrade",
  mechanics: string[],
) {
  runtimeCardsMock.cards.support = { mechanics };
  return remoteTrashDedicatedCreditsForMetrics(
    input(),
    action(),
    card("accessed", accessedType),
  );
}

function input(): AiDecisionInput {
  return {
    playerView: {
      own: {
        rig: [
          {
            ...card("support", "resource"),
            counters: {
              bit: 2,
              recurring_credit: 3,
            },
          },
        ],
      },
    },
  } as unknown as AiDecisionInput;
}

function action(): LegalAction {
  return {
    actionId: "trash",
    side: "runner",
    type: "trash_accessed_card",
    label: "Trash accessed card",
    source: "basic_action",
    payload: {
      accessTrashTotalCost: 5,
    },
    timingPoint: "runner_action.main",
    costs: [],
    targetRequirements: [],
    visibility: "public",
    expiresAtStateVersion: 1,
  };
}

function card(
  definitionId: string,
  type: VisibleCard["type"],
): VisibleCard {
  return {
    instanceId: definitionId,
    definitionId,
    known: true,
    type,
  } as VisibleCard;
}
