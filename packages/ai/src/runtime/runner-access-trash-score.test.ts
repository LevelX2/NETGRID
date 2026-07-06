import type { AiDecisionInput, LegalAction, PlayerView, VisibleCard } from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import { runnerAccessTrashScoreComponents } from "./runner-access-trash-score";

describe("runnerAccessTrashScoreComponents", () => {
  it("penalizes declining a free accessed ambush trash target", () => {
    const decline = accessAction("decline-setup", "decline_trash");
    const components = runnerAccessTrashScoreComponents(
      runnerInput([decline]),
      decline,
      {
        trashAccessContext: () => ({
          trashable: true,
          affordableRelevant: true,
          highImpact: true,
          trashCost: 0,
          generalCreditCost: 0,
          creditsAfterGeneralTrash: 3,
          reserveTarget: 2,
          deferredByBudget: false,
          centralAccess: true,
          accessServerId: "hq",
          targetType: "asset_node",
          role: "ambush",
        }),
      },
    );

    expect(components).toContainEqual(
      expect.objectContaining({
        key: "runner_decline_relevant_trash",
        value: -1800,
        reason: "ambush",
      }),
    );
  });
});

function runnerInput(legalActions: LegalAction[]): AiDecisionInput {
  const playerView: PlayerView = {
    side: "runner",
    stateVersion: 1,
    activeSide: "runner",
    phase: "runner_action_phase",
    timingPoint: "access.resolve_card",
    own: {
      identity: visibleIdentity("runner"),
      credits: 3,
      clicks: 2,
      agendaPoints: 0,
      gripOrHq: [],
      stackOrRdCount: 20,
      heapOrArchives: [],
      scoreArea: [],
      rig: [],
      maxHandSize: 5,
      tags: 0,
    },
    opponent: {
      identity: visibleIdentity("corp"),
      credits: 5,
      clicks: 3,
      agendaPoints: 0,
      tags: 0,
      handCount: 3,
      maxHandSize: 5,
      deckCount: 20,
      discardCount: 0,
      scoreArea: [],
    },
    servers: [{ id: "hq", label: "HQ", ice: [], root: [] }],
    publicEvents: [],
    legalActions,
    winner: null,
    agendaPointsToWin: 7,
  };
  return {
    side: "runner",
    playerView,
    eventTail: [],
    legalActions,
    difficulty: "normal",
    seed: "runner-access-trash-score-test",
    decisionId: "runner-access-trash-score-test:runner",
    actionNumber: 1,
    profileId: "runner-ai-test",
  };
}

function accessAction(
  actionId: string,
  type: "trash_accessed_card" | "decline_trash",
): LegalAction {
  return {
    actionId,
    side: "runner",
    type,
    label: actionId,
    source: "game_rule",
    timingPoint: "access.resolve_card",
    costs: [],
    targetRequirements: [],
    visibility: "public",
    expiresAtStateVersion: 2,
  };
}

function visibleIdentity(side: "runner" | "corp"): VisibleCard {
  return {
    instanceId: `${side}-identity`,
    definitionId: `${side}-identity`,
    title: `${side} identity`,
    owner: side,
    controller: side,
    type: "identity",
    known: true,
  };
}
