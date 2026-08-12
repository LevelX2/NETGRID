import type { CardInstanceId, GameState } from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import { icebreakerStrengthModifierFromDeclarativeCounters } from "./effective-values";

describe("declarative effective values", () => {
  it("derives icebreaker strength from each counter producer's declared effect", () => {
    const breakerId = "breaker" as CardInstanceId;
    const state = {
      cardInstances: {
        [breakerId]: {
          id: breakerId,
          definitionId: "simple_decoder",
          zone: { side: "runner", zone: "rigPrograms" },
          faceup: true,
          rezzed: false,
          advancementCounters: 0,
          strengthModifier: 0,
          counters: { militech: 3, pattel: 2 },
        },
      },
    } as unknown as GameState;

    expect(
      icebreakerStrengthModifierFromDeclarativeCounters(state, breakerId),
    ).toBe(1);
  });
});
