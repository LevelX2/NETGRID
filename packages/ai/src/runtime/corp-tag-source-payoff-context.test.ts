import { describe, expect, it } from "vitest";
import type { AiDecisionInput, VisibleCard } from "@netgrid/shared";
import { createCorpTagSourcePayoffContext } from "./corp-tag-source-payoff-context";

describe("createCorpTagSourcePayoffContext", () => {
  it("derives visible economic tag punish payoff from payoff profiles", () => {
    const context = createCorpTagSourcePayoffContext({
      sourceDefinitionIdForAction: () => undefined,
      visibleMeatDamagePayoff: () => false,
      tagPunishAssessmentForAction: () => undefined,
      payoffProfileForDefinition: (definitionId) =>
        definitionId === "custom-economic-punish" ? { kind: "economic" } : undefined,
    });

    expect(
      context.corpVisibleTagPunishPayoffKind(
        inputWithHqCard(visibleCard("custom-economic-punish")),
      ),
    ).toBe("economic");
    expect(
      context.corpVisibleTagPunishPayoffKind(
        inputWithHqCard(visibleCard("unprofiled-punish-card")),
      ),
    ).toBeUndefined();
  });
});

function inputWithHqCard(card: VisibleCard): AiDecisionInput {
  return {
    side: "corp",
    playerView: {
      side: "corp",
      stateVersion: 1,
      timingPoint: "corp_action.main",
      activeSide: "corp",
      phase: "corp_action_phase",
      own: {
        identity: visibleCard("corp-identity"),
        credits: 5,
        clicks: 3,
        agendaPoints: 0,
        gripOrHq: [card],
        stackOrRdCount: 20,
        heapOrArchives: [],
        scoreArea: [],
        maxHandSize: 5,
        tags: 0,
      },
      opponent: {
        identity: visibleCard("runner-identity"),
        credits: 5,
        clicks: 3,
        agendaPoints: 0,
        tags: 1,
        handCount: 5,
        maxHandSize: 5,
        deckCount: 20,
        discardCount: 0,
        scoreArea: [],
      },
      servers: [],
      publicEvents: [],
      legalActions: [],
      winner: null,
      agendaPointsToWin: 7,
    },
    eventTail: [],
    legalActions: [],
    difficulty: "normal",
    seed: "corp-tag-source-payoff-context-test",
    decisionId: "corp-tag-source-payoff-context-test",
    actionNumber: 1,
    profileId: "corp-tag-source-payoff-context-test",
  } as AiDecisionInput;
}

function visibleCard(definitionId: string): VisibleCard {
  return {
    instanceId: `${definitionId}-instance`,
    definitionId,
    title: definitionId,
    type: "operation",
    known: true,
    owner: "corp",
    controller: "corp",
  };
}
