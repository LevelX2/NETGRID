import { syntheticCardDefinitionId } from "@netgrid/engine/test-fixtures/synthetic-card-definition-id";
import { describe, expect, it } from "vitest";
import type {
  AiDecisionInput,
  LegalAction,
  PlayerView,
  VisibleCard,
} from "@netgrid/shared";
import { runnerHqSuccessWindowSetupAssessment } from "./runner-start-run-score";

describe("runnerHqSuccessWindowSetupAssessment", () => {
  it("values an HQ run that opens an affordable conditional ICE-trash window", () => {
    const input = aiInput({ opponentHandCount: 4 });
    input.playerView.own.gripOrHq = [
      {
        instanceId: "jettison",
        definitionId: 292,
        title: "Jettison Ice",
        owner: "runner",
        controller: "runner",
        type: "event",
        known: true,
      },
    ];
    input.playerView.servers.push({
      id: "rd",
      label: "R&D",
      ice: [
        {
          instanceId: "rezzed-ice",
          definitionId: syntheticCardDefinitionId("rezzed-ice"),
          title: "Rezzed ICE",
          owner: "corp",
          controller: "corp",
          type: "ice",
          known: true,
          rezzed: true,
          rezCost: 2,
        },
      ],
      root: [],
    });

    expect(
      runnerHqSuccessWindowSetupAssessment(input, startRun("hq"), "hq"),
    ).toMatchObject({
      sourceDefinitionId: 292,
      minimumIceTrashCost: 2,
    });
  });
});

function startRun(serverId: string): LegalAction {
  return {
    actionId: `runner.start_run.${serverId}`,
    side: "runner",
    type: "start_run",
    label: `Run auf ${serverId}`,
    source: "basic_action",
    timingPoint: "runner_action.main",
    costs: [],
    targetRequirements: [],
    visibility: "public",
    expiresAtStateVersion: 2,
    payload: { serverId },
  };
}

function aiInput(params: { opponentHandCount: number }): AiDecisionInput {
  const playerView: PlayerView = {
    stateVersion: 1,
    side: "runner",
    activeSide: "runner",
    phase: "runner_action_phase",
    timingPoint: "runner_action.main",
    own: {
      identity: visibleIdentity("runner"),
      credits: 3,
      clicks: 3,
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
      handCount: params.opponentHandCount,
      maxHandSize: 5,
      deckCount: 20,
      discardCount: 0,
      scoreArea: [],
    },
    servers: [{ id: "hq", label: "HQ", ice: [], root: [] }],
    publicEvents: [],
    legalActions: [],
    winner: null,
    agendaPointsToWin: 7,
  };
  return {
    side: "runner",
    playerView,
    eventTail: [],
    legalActions: [],
    difficulty: "normal",
    seed: "runner-start-run-score-test",
    decisionId: "runner-start-run-score-test",
    actionNumber: 1,
    profileId: "runner-start-run-score-test",
  };
}

function visibleIdentity(side: "runner" | "corp"): VisibleCard {
  return {
    instanceId: `${side}-identity`,
    definitionId: syntheticCardDefinitionId(side + "-identity"),
    title: `${side} identity`,
    owner: side,
    controller: side,
    type: "identity",
    known: true,
  };
}
