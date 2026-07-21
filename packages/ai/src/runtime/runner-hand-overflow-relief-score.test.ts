import type { AiDecisionInput, LegalAction } from "@netgrid/shared";
import { describe, expect, it } from "vitest";

import { runnerHandOverflowReliefScoreComponent } from "./runner-hand-overflow-relief-score";

describe("runnerHandOverflowReliefScoreComponent", () => {
  it("rewards consuming a grip card when discard is otherwise unavoidable", () => {
    const current = input(7);
    const action = installAction();

    expect(
      runnerHandOverflowReliefScoreComponent(current, action),
    ).toMatchObject({
      key: "runner_hand_overflow_relief",
      value: 120,
    });
  });

  it("does not reward a replacement draw that leaves hand size unchanged", () => {
    const current = input(7);
    const action = eventAction();

    expect(
      runnerHandOverflowReliefScoreComponent(current, action, {
        economyProjection: { netHandDelta: 0 },
      } as never),
    ).toBeUndefined();
  });
});

function input(handCount: number): AiDecisionInput {
  return {
    side: "runner",
    playerView: {
      own: {
        identity: { instanceId: "runner-id", known: true },
        credits: 6,
        clicks: 1,
        maxHandSize: 5,
        tags: 0,
        gripOrHq: Array.from({ length: handCount }, (_, index) => ({
          instanceId: index === 0 ? "grip-card" : `grip-${index}`,
          known: true,
        })),
        rig: [],
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

function installAction(): LegalAction {
  return {
    actionId: "runner.install_card.grip-card",
    side: "runner",
    type: "install_card",
    source: "grip-card",
    costs: [{ clicks: 1 }],
    payload: { cardId: "grip-card" },
  } as unknown as LegalAction;
}

function eventAction(): LegalAction {
  return {
    ...installAction(),
    actionId: "runner.play_event.grip-card",
    type: "play_event",
  } as LegalAction;
}
