import { describe, expect, it } from "vitest";
import type { AiDecisionInput, LegalAction, VisibleCard } from "@netgrid/shared";
import { buildLegacyBaselineDecisionDebug } from "./legacy-baseline-debug";

describe("legacy-baseline-debug", () => {
  it("builds side-safe baseline debug without choosing an action", () => {
    const debug = buildLegacyBaselineDecisionDebug(input());

    expect(debug.schemaVersion).toBe("ai-decision-debug-v1");
    expect(debug.aiLevel).toBe(1);
    expect(debug.memoryVersion).toBeDefined();
    expect(debug).not.toHaveProperty("ownDeckDoctrine");
    expect(JSON.stringify(debug)).not.toMatch(
      /cardInstances|privatePayload|secretGripIds|sessionToken|joinToken|reconnectToken/i,
    );
  });
});

function input(): AiDecisionInput {
  const legalActions = [legalAction("gain-1", "gain_credit")];
  return {
    side: "runner",
    playerView: {
      side: "runner",
      stateVersion: 1,
      timingPoint: "runner_action.main",
      activeSide: "runner",
      phase: "runner_action_phase",
      own: {
        identity: visibleCard("runner-identity"),
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
        identity: visibleCard("corp-identity"),
        credits: 5,
        clicks: 3,
        agendaPoints: 0,
        tags: 0,
        handCount: 5,
        maxHandSize: 5,
        deckCount: 20,
        discardCount: 0,
        scoreArea: [],
      },
      servers: [],
      publicEvents: [],
      legalActions,
      winner: null,
      agendaPointsToWin: 7,
    },
    eventTail: [],
    legalActions,
    difficulty: "normal",
    seed: "legacy-debug",
    decisionId: "legacy-debug:runner",
    actionNumber: 1,
    profileId: "runner:test",
  };
}

function legalAction(
  actionId: string,
  type: LegalAction["type"],
): LegalAction {
  return {
    actionId,
    side: "runner",
    type,
    label: type,
    source: "basic_action",
    timingPoint: "runner_action.main",
    costs: [],
    targetRequirements: [],
    visibility: "private_to_actor",
    expiresAtStateVersion: 1,
  };
}

function visibleCard(cardId: string): VisibleCard {
  return {
    instanceId: `${cardId}-instance`,
    definitionId: cardId,
    title: cardId,
    type: "identity",
    known: true,
  };
}
