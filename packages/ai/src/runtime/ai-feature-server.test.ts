import { describe, expect, it } from "vitest";
import type { AiDecisionInput, VisibleCard } from "@netgrid/shared";
import { visibleCitySurveillanceSourceCount } from "./ai-feature-server";

describe("visibleCitySurveillanceSourceCount", () => {
  it("counts known rezzed root tag sources by ontology profile", () => {
    expect(
      visibleCitySurveillanceSourceCount(
        inputWithRemoteRoot([
          rootCard("onr_v1_333_omniscience-foundation", { rezzed: true }),
        ]),
      ),
    ).toBe(1);
  });

  it("ignores unknown, unrezzed, or non-tag-source roots", () => {
    expect(
      visibleCitySurveillanceSourceCount(
        inputWithRemoteRoot([
          rootCard("onr_v1_333_omniscience-foundation", {
            known: false,
            rezzed: true,
          }),
          rootCard("onr_v1_333_omniscience-foundation", { rezzed: false }),
          rootCard("custom-blank-asset", { rezzed: true }),
        ]),
      ),
    ).toBe(0);
  });
});

function inputWithRemoteRoot(root: VisibleCard[]): AiDecisionInput {
  return {
    side: "runner",
    playerView: {
      side: "runner",
      stateVersion: 1,
      timingPoint: "runner_action.main",
      activeSide: "runner",
      phase: "runner_action_phase",
      own: {
        identity: rootCard("runner-identity"),
        credits: 5,
        clicks: 4,
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
        identity: rootCard("corp-identity"),
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
      servers: [
        {
          id: "remote_1",
          label: "Remote 1",
          ice: [],
          root,
        },
      ],
      publicEvents: [],
      legalActions: [],
      winner: null,
      agendaPointsToWin: 7,
    },
    eventTail: [],
    legalActions: [],
    difficulty: "normal",
    seed: "ai-feature-server-test",
    decisionId: "ai-feature-server-test",
    actionNumber: 1,
    profileId: "ai-feature-server-test",
  } as AiDecisionInput;
}

function rootCard(
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
