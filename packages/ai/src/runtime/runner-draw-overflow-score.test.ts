import type { AiDecisionInput, LegalAction } from "@netgrid/shared";
import { describe, expect, it } from "vitest";

import { runnerDrawOverflowScoreComponent } from "./runner-draw-overflow-score";

describe("runnerDrawOverflowScoreComponent", () => {
  it("penalizes expected overflow when a productive alternative exists", () => {
    const current = input(7, [drawAction(), installAction()]);

    expect(
      runnerDrawOverflowScoreComponent(current, drawAction()),
    ).toMatchObject({
      key: "runner_expected_draw_overflow",
      value: -900,
    });
  });

  it("does not penalize draw below the effective hand limit", () => {
    const current = input(6, [drawAction(), installAction()]);

    expect(
      runnerDrawOverflowScoreComponent(current, drawAction()),
    ).toBeUndefined();
  });

  it("allows full-hand draw when only basic fallback actions remain", () => {
    const current = input(7, [drawAction(), gainAction()]);

    expect(
      runnerDrawOverflowScoreComponent(current, drawAction()),
    ).toBeUndefined();
  });
});

function input(
  handCount: number,
  legalActions: LegalAction[],
): AiDecisionInput {
  return {
    side: "runner",
    legalActions,
    playerView: {
      own: {
        identity: { instanceId: "runner-id", known: true },
        credits: 8,
        clicks: 3,
        maxHandSize: 7,
        tags: 0,
        gripOrHq: Array.from({ length: handCount }, (_, index) => ({
          instanceId: `grip-${index}`,
          known: true,
        })),
        rig: [
          {
            instanceId: "hand-size-support",
            known: true,
            memoryLimitBonus: 2,
          },
        ],
      },
      opponent: {
        identity: { instanceId: "corp-id", known: true },
        agendaPoints: 0,
      },
      agendaPointsToWin: 7,
      servers: [],
    },
  } as unknown as AiDecisionInput;
}

function drawAction(): LegalAction {
  return {
    actionId: "runner.draw_card",
    side: "runner",
    type: "draw_card",
    source: "basic_action",
    costs: [{ clicks: 1 }],
  } as LegalAction;
}

function gainAction(): LegalAction {
  return {
    actionId: "runner.gain_credit",
    side: "runner",
    type: "gain_credit",
    source: "basic_action",
    costs: [{ clicks: 1 }],
  } as LegalAction;
}

function installAction(): LegalAction {
  return {
    actionId: "runner.install_card.example",
    side: "runner",
    type: "install_card",
    source: "example",
    costs: [{ clicks: 1, credits: 1 }],
  } as LegalAction;
}
