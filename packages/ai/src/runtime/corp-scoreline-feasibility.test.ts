import { describe, expect, it } from "vitest";

import { aiInput } from "../semantic-ai-runtime-cutover.test-support";
import { corpScorelineFeasibilityForDecisionInput } from "./corp-scoreline-feasibility";

describe("corpScorelineFeasibilityForDecisionInput", () => {
  it("counts mandatory draw windows instead of raw deck cards when a public extra draw is active", () => {
    const input = aiInput("corp", []);
    input.playerView.own.agendaPoints = 6;
    input.playerView.opponent.agendaPoints = 0;
    input.playerView.own.stackOrRdCount = 2;
    input.playerView.publicEvents.push({
      eventId: "evt-extra-mandatory-draw",
      type: "mandatory_draw",
      stateVersionBefore: 0,
      stateVersionAfter: 1,
      stateHashAfter: "fnv1a:extra-draw-test",
      publicPayload: {
        actor: "corp",
        actionType: "mandatory_draw",
        label: "Korp Pflichtkarten ziehen",
        corpMandatoryDraw: true,
        corpMandatoryCardCount: 1,
        corpMandatoryAdditionalCardCount: 1,
        corpMandatoryTotalBaseDrawCount: 2,
        corpMandatoryAgendaCardCount: 0,
        corpMandatoryOptionalAgendaCardCount: 0,
        corpMandatorySkivvissCardCount: 1,
        corpMandatoryAdditionalSourceCount: 1,
        corpMandatoryAdditionalSourceDefinitionIds: "onr_v1_064_skivviss",
      },
    });
    Object.assign(input, {
      ownDeckSnapshot: {
        deckSnapshotId: "extra-mandatory-draw-scoreline",
        side: "corp",
        cards: [
          {
            cardId: "onr_v1_191_black-ice-quality-assurance",
            quantity: 4,
          },
        ],
      },
    });

    expect(corpScorelineFeasibilityForDecisionInput(input)).toMatchObject({
      feasible: true,
      deadline: "last_draw_window",
      remainingMandatoryDraws: 1,
      evidence: expect.arrayContaining([
        "scoreline_mandatory_draw_cards_per_window:2",
      ]),
    });
  });
});
