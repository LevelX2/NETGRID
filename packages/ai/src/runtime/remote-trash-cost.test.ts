import { describe, expect, it, vi } from "vitest";
import type { AiDecisionInput, LegalAction, VisibleCard } from "@netgrid/shared";
import { remoteTrashDedicatedCreditsForMetrics } from "./remote-trash-cost";

const runtimeCardsMock = vi.hoisted(() => ({
  cards: new Map<
    string,
    {
      effects?: Array<{
        kind: "recurring_economy";
        resource: "credits";
        economyMode: "restricted_credit";
        target: string;
      }>;
    }
  >(),
}));

vi.mock("../ai-hints", () => ({
  createAiHintsByCard: () => runtimeCardsMock.cards,
}));

describe("remoteTrashDedicatedCreditsForMetrics", () => {
  it("matches dedicated trash-credit mechanics by bounded terms", () => {
    expect(dedicatedCredits("upgrade", ["upgrade_trash"])).toBe(5);
    expect(dedicatedCredits("upgrade", ["upgrade_trash_noise"])).toBe(
      0,
    );

    expect(dedicatedCredits("asset", ["node_trash"])).toBe(5);
    expect(dedicatedCredits("asset", ["node_trash_noise"])).toBe(0);
  });
});

function dedicatedCredits(
  accessedType: "asset" | "upgrade",
  targets: string[],
) {
  runtimeCardsMock.cards.set("support", {
    effects: targets.map((target) => ({
      kind: "recurring_economy",
      resource: "credits",
      economyMode: "restricted_credit",
      target,
    })),
  });
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
