import { describe, expect, it } from "vitest";

import { aiInput } from "../semantic-ai-runtime-cutover.test-support";
import { corpScorelineFeasibilityForDecisionInput } from "./corp-scoreline-feasibility";

describe("corpScorelineFeasibilityForDecisionInput", () => {
  it("subtracts printed agendas that are scored or removed while using actual Corp score", () => {
    const input = aiInput("corp", []);
    const definitionId = "onr_v1_191_black-ice-quality-assurance";
    const card = {
      definitionId,
      known: true as const,
      type: "agenda" as const,
    };
    input.playerView.own.agendaPoints = 1;
    input.playerView.own.scoreArea = [
      { ...card, instanceId: "scored", agendaPoints: 1 },
    ];
    input.playerView.specialZones = {
      setAside: [],
      setAsideCount: 0,
      removedFromGameCount: 1,
      removedFromGame: [{ ...card, instanceId: "removed", agendaPoints: 2 }],
    };
    Object.assign(input, {
      ownDeckSnapshot: {
        deckSnapshotId: "scoreline-physical-inventory",
        side: "corp",
        cards: [{ cardId: definitionId, quantity: 4 }],
      },
    });

    expect(corpScorelineFeasibilityForDecisionInput(input)).toMatchObject({
      remainingAgendaPoints: 4,
      maxReachablePoints: 5,
      feasible: false,
    });
  });

  it("uses current mandatory draws when the previous draw included optional cards", () => {
    const input = aiInput("corp", []);
    input.playerView.own.agendaPoints = 6;
    input.playerView.opponent.agendaPoints = 0;
    input.playerView.own.stackOrRdCount = 2;
    input.playerView.corpMandatoryBaseDrawQuote = {
      baseCount: 2,
      virusDrawCount: 1,
    };
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
        corpMandatoryAdditionalCardCount: 3,
        corpMandatoryTotalBaseDrawCount: 4,
        corpMandatoryAgendaCardCount: 0,
        corpMandatoryOptionalAgendaCardCount: 2,
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
