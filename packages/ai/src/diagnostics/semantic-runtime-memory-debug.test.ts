import {
  type ActionType,
  type AiDecisionInput,
  type AiDifficulty,
  type LegalAction,
  type PlayerView,
  type Side,
  type VisibleCard,
} from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import { semanticRuntimeMemoryDebug } from "./semantic-runtime-memory-debug";

describe("semanticRuntimeMemoryDebug", () => {
  it("projects runner memory diagnostics without exposing own hand titles", () => {
    const handCard = visibleCard("runner-card", "runner", "program");
    const input = aiInput("runner", [
      legalAction("install-runner-card", "runner", handCard),
    ]);

    const debug = semanticRuntimeMemoryDebug(input);

    expect(debug.memoryVersion).toMatch(/^belief-v1\.4\.2:/);
    expect(debug.items).toContain("own_hand_count:1");
    expect(debug.items).toContain("own_hand_current_legal_actions:1");
    expect(debug.items).toContain(
      "own_hand_content_visibility:preview_private_section",
    );
    expect(debug.items).toContain("hq_known:0/5");
    expect(debug.facts.join("|")).not.toContain("runner-card");
    expect(debug.opponentModel).toEqual(
      expect.objectContaining({
        corpCreditReserveInterpretation: "low",
        hqHandMemory: expect.objectContaining({
          handCount: 5,
          knownCount: 0,
        }),
      }),
    );
  });

  it("projects corp opponent pressure memory items separately", () => {
    const debug = semanticRuntimeMemoryDebug(aiInput("corp", []));

    expect(debug.memoryVersion).toMatch(/^belief-v1\.4\.2:/);
    expect(debug.items).toContain("runner_runs:0");
    expect(debug.items).toContain("runner_remote_runs:0");
    expect(debug.items).toContain("runner_central_runs:0");
    expect(debug.opponentModel).toEqual(
      expect.objectContaining({
        runnerAggressionMemory: expect.objectContaining({
          runEvents: 0,
          remoteRuns: 0,
          centralRuns: 0,
        }),
      }),
    );
  });
});

function aiInput(side: Side, legalActions: LegalAction[]): AiDecisionInput {
  return {
    side,
    playerView: playerView(side, legalActions),
    eventTail: [],
    legalActions,
    difficulty: "normal" satisfies AiDifficulty,
    seed: "semantic-runtime-memory-debug-test",
    decisionId: `semantic-runtime-memory-debug:${side}`,
    actionNumber: 1,
    profileId: `${side}-semantic-runtime-memory-debug-test`,
  };
}

function playerView(side: Side, legalActions: LegalAction[]): PlayerView {
  const ownSide = side;
  const opponentSide = side === "runner" ? "corp" : "runner";
  return {
    stateVersion: 1,
    side,
    activeSide: side,
    phase: side === "runner" ? "runner_action_phase" : "corp_action_phase",
    timingPoint: side === "runner" ? "runner_action.main" : "corp_action.main",
    own: {
      identity: visibleCard(`${ownSide}-identity`, ownSide, "identity"),
      credits: 4,
      clicks: 3,
      agendaPoints: 0,
      gripOrHq:
        side === "runner" ? [visibleCard("runner-card", side, "program")] : [],
      stackOrRdCount: 0,
      heapOrArchives: [],
      scoreArea: [],
      maxHandSize: 5,
      tags: 0,
    },
    opponent: {
      identity: visibleCard(
        `${opponentSide}-identity`,
        opponentSide,
        "identity",
      ),
      credits: 4,
      clicks: 3,
      agendaPoints: 0,
      tags: 0,
      handCount: 5,
      maxHandSize: 5,
      deckCount: 0,
      discardCount: 0,
      scoreArea: [],
    },
    servers: [],
    publicEvents: [],
    legalActions,
    winner: null,
    agendaPointsToWin: 7,
  };
}

function legalAction(
  actionId: string,
  side: Side,
  sourceCard: VisibleCard,
): LegalAction {
  return {
    actionId,
    side,
    type: "install_card" satisfies ActionType,
    label: actionId,
    source: sourceCard.instanceId,
    timingPoint: "runner_action.main",
    costs: [],
    targetRequirements: [],
    visibility: "private_to_actor",
    expiresAtStateVersion: 1,
  };
}

function visibleCard(
  definitionId: string,
  owner: Side,
  type: NonNullable<VisibleCard["type"]>,
): VisibleCard {
  return {
    instanceId: `${definitionId}-instance`,
    definitionId,
    title: definitionId,
    type,
    known: true,
    owner,
    controller: owner,
  };
}
