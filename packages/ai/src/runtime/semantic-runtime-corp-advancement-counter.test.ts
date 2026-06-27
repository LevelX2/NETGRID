import { describe, expect, it } from "vitest";
import type { AiDecisionInput, LegalAction, VisibleCard } from "@netgrid/shared";
import { semanticRuntimeCorpAdvancementCounterPlacementAssessment } from "./semantic-runtime-corp-advancement-counter";

describe("semanticRuntimeCorpAdvancementCounterPlacementAssessment", () => {
  it("derives agenda overadvance thresholds from generic rules text", () => {
    const agenda = corpCard("custom-overadvance-agenda", {
      advancementCounters: 4,
      advancementRequirement: 3,
      type: "agenda",
    });
    const advanceAction = corpAction("advance_card", {
      cardId: agenda.instanceId,
    });
    const placementAction = corpAction("play_operation", {
      cardId: "custom-advancement-distribution",
    });
    const input = corpInput({
      root: [agenda],
      legalActions: [advanceAction],
    });

    const assessment =
      semanticRuntimeCorpAdvancementCounterPlacementAssessment(
        input,
        placementAction,
        {
          sourceDefinitionIdForAction: (_input, action) =>
            typeof action.payload?.cardId === "string"
              ? action.payload.cardId
              : undefined,
          normalizedRulesTextForDefinition: (definitionId) =>
            definitionId === "custom-advancement-distribution"
              ? "add one advancement counter to each of up to two installed cards that can be advanced"
              : "for every two advancement counters over this agenda's difficulty that are on this agenda when you score it",
          actionCreditCost: () => 0,
          actionSourceCard: (_input, action) =>
            action.actionId === advanceAction.actionId ? agenda : undefined,
          visibleServerCard: (_input, cardId) =>
            cardId === agenda.instanceId
              ? {
                  card: agenda,
                  server: {
                    id: "remote_1",
                    label: "Remote 1",
                    ice: [],
                    root: [agenda],
                  },
                }
              : undefined,
          cardType: (card) => card.type,
          cardAdvancementRequirement: (card) => card.advancementRequirement,
          teamRestructuringCardId: "custom-team-restructuring",
        },
      );

    expect(assessment?.advancementWitness).toBe("overadvance_threshold");
    expect(assessment?.evidence).toContain(
      "advancement_target_class:agenda_overadvance_threshold",
    );
    expect(assessment?.evidence).toContain("overadvance_threshold_size:2");
    expect(assessment?.evidence).toContain("overadvance_hits_threshold:true");
  });
});

function corpInput(input: {
  root: VisibleCard[];
  legalActions: LegalAction[];
}): AiDecisionInput {
  return {
    side: "corp",
    playerView: {
      side: "corp",
      stateVersion: 1,
      timingPoint: "corp_action.main",
      activeSide: "corp",
      phase: "corp_action_phase",
      own: {
        identity: corpCard("corp-identity"),
        credits: 5,
        clicks: 3,
        agendaPoints: 0,
        gripOrHq: [],
        stackOrRdCount: 20,
        heapOrArchives: [],
        scoreArea: [],
        maxHandSize: 5,
        tags: 0,
      },
      opponent: {
        identity: corpCard("runner-identity"),
        credits: 5,
        clicks: 4,
        agendaPoints: 0,
        tags: 0,
        handCount: 5,
        maxHandSize: 5,
        deckCount: 20,
        discardCount: 0,
        scoreArea: [],
      },
      servers: [
        {
          id: "remote_1",
          label: "Remote 1",
          ice: [],
          root: input.root,
        },
      ],
      publicEvents: [],
      legalActions: input.legalActions,
      winner: null,
      agendaPointsToWin: 7,
    },
    eventTail: [],
    legalActions: input.legalActions,
    difficulty: "normal",
    seed: "semantic-runtime-corp-advancement-counter-test",
    decisionId: "semantic-runtime-corp-advancement-counter-test",
    actionNumber: 1,
    profileId: "semantic-runtime-corp-advancement-counter-test",
  } as AiDecisionInput;
}

function corpCard(
  definitionId: string,
  overrides: Partial<VisibleCard> = {},
): VisibleCard {
  return {
    instanceId: `${definitionId}-instance`,
    definitionId,
    title: definitionId,
    type: "asset",
    known: true,
    owner: "corp",
    controller: "corp",
    ...overrides,
  };
}

function corpAction(
  type: string,
  payload: Record<string, string> = {},
): LegalAction {
  return {
    actionId: `${type}-${payload.cardId ?? "action"}`,
    side: "corp",
    type,
    payload,
  } as LegalAction;
}
