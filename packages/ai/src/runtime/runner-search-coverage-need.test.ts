import type { AiDecisionInput, VisibleCard } from "@netgrid/shared";
import { describe, expect, it } from "vitest";

import { runnerVisibleSearchCoverageNeed } from "./runner-search-coverage-need";

describe("runnerVisibleSearchCoverageNeed", () => {
  it("ignores already reachable wall ICE and reports the actual missing code-gate coverage", () => {
    const need = runnerVisibleSearchCoverageNeed(
      decisionInput({
        rig: [
          visibleCard({
            instanceId: "pile-driver",
            definitionId: "onr_v1_047_pile-driver",
            title: "Pile Driver",
            type: "program",
            subtypes: ["icebreaker", "fracter", "noisy"],
            strength: 7,
          }),
        ],
        servers: [
          server("remote_1", [
            visibleCard({
              instanceId: "shotgun-wire",
              definitionId: "onr_v1_269_shotgun-wire",
              title: "Shotgun Wire",
              type: "ice",
              subtypes: ["wall"],
              strength: 5,
            }),
          ]),
          server("rd", [
            visibleCard({
              instanceId: "keeper",
              definitionId: "onr_v1_252_keeper",
              title: "Keeper",
              type: "ice",
              subtypes: ["code_gate"],
              strength: 4,
            }),
          ]),
        ],
      }),
    );

    expect(need).toMatchObject({
      requiredCoverage: "breaker_code_gate",
      serverId: "rd",
    });
  });
});

function decisionInput(params: {
  rig: VisibleCard[];
  servers: AiDecisionInput["playerView"]["servers"];
}): AiDecisionInput {
  return {
    side: "runner",
    eventTail: [],
    legalActions: [],
    difficulty: "normal",
    seed: "runner-search-coverage-need-test",
    decisionId: "runner-search-coverage-need-test",
    actionNumber: 1,
    profileId: "test-profile",
    playerView: {
      side: "runner",
      activeSide: "runner",
      stateVersion: 7,
      phase: "runner_action_phase",
      timingPoint: "runner_action.main",
      own: {
        identity: { instanceId: "runner-identity", known: true },
        credits: 8,
        clicks: 4,
        agendaPoints: 0,
        gripOrHq: [],
        stackOrRdCount: 0,
        heapOrArchives: [],
        scoreArea: [],
        rig: params.rig,
        maxHandSize: 5,
        tags: 0,
      },
      opponent: {
        identity: { instanceId: "corp-identity", known: true },
        credits: 5,
        clicks: 3,
        agendaPoints: 0,
        tags: 0,
        handCount: 5,
        maxHandSize: 5,
        deckCount: 0,
        discardCount: 0,
        scoreArea: [],
      },
      servers: params.servers,
      publicEvents: [],
      legalActions: [],
      winner: null,
      agendaPointsToWin: 7,
    },
  } as AiDecisionInput;
}

function server(
  id: AiDecisionInput["playerView"]["servers"][number]["id"],
  ice: VisibleCard[],
): AiDecisionInput["playerView"]["servers"][number] {
  return {
    id,
    label: id,
    ice,
    root: [],
  };
}

function visibleCard(overrides: Partial<VisibleCard>): VisibleCard {
  return {
    instanceId: "card",
    known: true,
    faceup: true,
    rezzed: true,
    ...overrides,
  } as VisibleCard;
}
