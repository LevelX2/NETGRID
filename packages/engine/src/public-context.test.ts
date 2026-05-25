import type { GameState, LegalAction } from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import { publicContextForAction } from "./public-context";

describe("publicContextForAction", () => {
  it("forwards access index and Highlighter access context", () => {
    const state = {
      corp: { servers: [] },
      cardInstances: {},
    } as unknown as GameState;
    const action = {
      type: "access_card",
      payload: {
        accessIndex: 1,
        baseAccessCount: 1,
        installedAccessBonus: 2,
        effectiveAccessCount: 3,
        highlighterCounterCount: 3,
        highlighterAccessBonus: 2,
      },
    } as unknown as LegalAction;

    expect(
      publicContextForAction(state, action, {
        agendaPointsForScoredCard: () => 0,
        cardCounter: () => 0,
        cardStrengthModifier: () => 0,
        creditCostForAction: () => 0,
        definitionFor: () => {
          throw new Error("not needed");
        },
        pumpAmountForLegalAction: () => 0,
        runnerHqAccessBonus: () => 0,
        v1915InstalledAccessBonus: () => 0,
      }),
    ).toMatchObject({
      accessIndex: 1,
      baseAccessCount: 1,
      installedAccessBonus: 2,
      effectiveAccessCount: 3,
      highlighterCounterCount: 3,
      highlighterAccessBonus: 2,
    });
  });
});
