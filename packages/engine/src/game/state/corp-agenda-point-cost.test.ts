import { describe, it, expect } from "vitest";
import { createGameAfterSetup } from "../index";
import { ORIGINALSET_DEFAULT_DECKS } from "@netgrid/shared";
import { removeEverywhere } from "../../test-fixtures/mechanic-smoke-fixtures";
import {
  spendCorpAgendaPoints,
  scoredAgendaPointValue,
} from "./corp-agenda-point-cost";

function fixture() {
  const state = createGameAfterSetup({
    seed: "point-payment-projection",
    runnerDeck: ORIGINALSET_DEFAULT_DECKS.runner,
    corpDeck: {
      ...ORIGINALSET_DEFAULT_DECKS.corp,
      cards: [
        { id: "onr_classic_004_theorem-proof", quantity: 3 },
        { id: "onr_classic_001_data-fort-remapping", quantity: 3 },
      ],
    },
  });
  const scored = [
    "onr_classic_004_theorem-proof",
    "onr_classic_001_data-fort-remapping",
  ].map(
    (def) =>
      Object.values(state.cardInstances).find((c) => c.definitionId === def)!,
  );
  for (const card of scored) {
    removeEverywhere(state, card.instanceId);
    card.zone = { side: "corp", zone: "scoreArea" };
    card.faceup = true;
    state.corp.scoreArea.push(card.instanceId);
  }
  return { state, theorem: scored[0]!, remap: scored[1]! };
}
describe("deterministic Corp agenda-point payment used by execution and projections", () => {
  it("spends bonus first, then the smallest scored agenda, retaining card identity", () => {
    const { state, theorem, remap } = fixture();
    state.corpBonusAgendaPoints = 1;
    const receipt = spendCorpAgendaPoints(state, 4);
    expect(receipt).toEqual({
      paidPoints: 4,
      bonusPointsSpent: 1,
      spentAgendaIds: [remap.instanceId, theorem.instanceId],
      spentAgendaDefinitionIds: [remap.definitionId, theorem.definitionId],
    });
    expect(state.corpBonusAgendaPoints).toBe(0);
    expect(scoredAgendaPointValue(state, remap.instanceId)).toBe(0);
    expect(scoredAgendaPointValue(state, theorem.instanceId)).toBe(2);
    expect(state.corp.scoreArea).toEqual([
      theorem.instanceId,
      remap.instanceId,
    ]);
  });
  it("rejects an unfunded payment before mutating any point source", () => {
    const { state } = fixture(),
      before = structuredClone(state);
    expect(() => spendCorpAgendaPoints(state, 6)).toThrow("nicht genug");
    expect(state).toEqual(before);
  });
});
