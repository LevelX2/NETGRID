import { expect, it } from "vitest";
import type { GameState } from "@netgrid/shared";
import { CARD_DEFINITIONS_BY_ID } from "../card-definitions";
import { deterministicOnPlayResourcePayload } from "./card-implementation-runtime-shared";
const definition = CARD_DEFINITIONS_BY_ID["onr_v1_101_mit-west-tier"]!;
it.each([
  [1, 0, 0, 0, -1, 0],
  [1, 0, 2, 2, 1, -2],
  [4, 4, 30, 5, 1, 2],
  [7, 3, 0, 5, -2, 4],
])(
  "quotes the complete recycle action for grip%d heap%d stack%d",
  (grip, heap, stack, gross, netHand, netStack) => {
    const state = {
      runner: {
        grip: Array.from({ length: grip }, (_, i) => `g${i}`),
        heap: Array.from({ length: heap }, (_, i) => `h${i}`),
        stack: Array.from({ length: stack }, (_, i) => `s${i}`),
      },
    } as GameState;
    expect(
      deterministicOnPlayResourcePayload(definition, "runner", state),
    ).toMatchObject({
      runnerRecycleDrawProjectionSchemaVersion:
        "runner-recycle-draw-projection-v1",
      runnerRecycleDrawProjectionGripBefore: grip,
      runnerRecycleDrawProjectionHeapBefore: heap,
      runnerRecycleDrawProjectionStackBefore: stack,
      runnerRecycleDrawProjectionSourceConsumption: 1,
      runnerRecycleDrawProjectionGrossDrawCount: gross,
      runnerRecycleDrawProjectionNetHandDelta: netHand,
      runnerRecycleDrawProjectionNetStackDelta: netStack,
      drawCardsAmount: gross,
    });
  },
);
it("requires the current own-zone counts instead of guessing them", () => {
  expect(() =>
    deterministicOnPlayResourcePayload(definition, "runner"),
  ).toThrow(/requires the current game state/);
});
