import type { AiDecisionInput, VisibleCard } from "@netgrid/shared";
import { describe, expect, it } from "vitest";

import type { AiDecisionInputWithDeckCapabilities } from "./ai-decision-input";
import { corpKnownAgendaInventory } from "./corp-known-agenda-inventory";

describe("corpKnownAgendaInventory", () => {
  it("derives zero stealable points from own deck and public score areas", () => {
    const input = corpInput();

    expect(corpKnownAgendaInventory(input)).toMatchObject({
      totalAgendaPoints: 9,
      corpScoredAgendaPoints: 3,
      runnerScoredAgendaPoints: 6,
      remainingStealableAgendaPoints: 0,
    });
  });

  it("reopens matchpoint defense when a Corp-scored agenda returns to HQ", () => {
    const input = corpInput();
    const returnedAgenda = input.playerView.own.scoreArea.pop();
    if (!returnedAgenda) throw new Error("Missing agenda counterprobe");
    input.playerView.own.gripOrHq.push(returnedAgenda);

    expect(corpKnownAgendaInventory(input)).toMatchObject({
      corpScoredAgendaPoints: 0,
      runnerScoredAgendaPoints: 6,
      remainingStealableAgendaPoints: 3,
    });
  });
});

function corpInput(): AiDecisionInputWithDeckCapabilities {
  return {
    side: "corp",
    difficulty: "hard",
    profileId: "agenda-inventory-test",
    seed: "agenda-inventory-test",
    decisionId: "agenda-inventory-test",
    actionNumber: 1,
    legalActions: [],
    eventTail: [],
    ownDeckSnapshot: {
      deckSnapshotId: "agenda-inventory-test",
      side: "corp",
      cards: [
        { cardId: "onr_v1_196_corporate-war", quantity: 3 },
        { cardId: "onr_v1_252_keeper", quantity: 36 },
      ],
    },
    playerView: {
      side: "corp",
      stateVersion: 1,
      timingPoint: "corp_action.main",
      activeSide: "corp",
      phase: "corp_action_phase",
      own: {
        identity: card("corp-identity", "corp-identity", "identity"),
        credits: 5,
        clicks: 3,
        agendaPoints: 3,
        gripOrHq: [],
        stackOrRdCount: 20,
        heapOrArchives: [],
        scoreArea: [agenda("corp-scored")],
        maxHandSize: 5,
        tags: 0,
      },
      opponent: {
        identity: card("runner-identity", "runner-identity", "identity"),
        credits: 5,
        clicks: 3,
        agendaPoints: 6,
        tags: 0,
        handCount: 5,
        maxHandSize: 5,
        deckCount: 20,
        discardCount: 0,
        scoreArea: [agenda("runner-scored-1"), agenda("runner-scored-2")],
      },
      servers: [],
      publicEvents: [],
      legalActions: [],
      winner: null,
      agendaPointsToWin: 7,
    },
  };
}

function agenda(instanceId: string): VisibleCard {
  return card(instanceId, "onr_v1_196_corporate-war", "agenda", 3);
}

function card(
  instanceId: string,
  definitionId: string,
  type: NonNullable<VisibleCard["type"]>,
  agendaPoints?: number,
): VisibleCard {
  return {
    instanceId,
    definitionId,
    title: definitionId,
    type,
    known: true,
    owner: "corp",
    controller: "corp",
    ...(agendaPoints !== undefined ? { agendaPoints } : {}),
  };
}
