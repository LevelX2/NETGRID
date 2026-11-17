import { describe, expect, it } from "vitest";
import type { AiDecisionInput, VisibleCard } from "@netgrid/shared";
import { visibleRunnerDrawTaxSourceCount } from "./ai-feature-server";

describe("visibleRunnerDrawTaxSourceCount", () => {
  it("ignores a discarded rezzed tax while retaining a separate installed tax", () => {
    const input = inputWithRemoteRoot([
      rootCard(525, { rezzed: true }),
    ]);
    input.playerView.servers.push({
      id: "archives",
      label: "Archives",
      ice: [],
      root: [rootCard(525, { rezzed: true })],
    });
    expect(visibleRunnerDrawTaxSourceCount(input)).toBe(1);
    input.playerView.servers[0]!.root = [];
    expect(visibleRunnerDrawTaxSourceCount(input)).toBe(0);
  });
  it("counts a known rezzed draw-linked tag source by ontology profile", () => {
    expect(
      visibleRunnerDrawTaxSourceCount(
        inputWithRemoteRoot([
          rootCard(525, { rezzed: true }),
        ]),
      ),
    ).toBe(1);
  });

  it("ignores unknown, unrezzed, non-tag-source, or non-draw tag-source roots", () => {
    expect(
      visibleRunnerDrawTaxSourceCount(
        inputWithRemoteRoot([
          rootCard(525, {
            known: false,
            rezzed: true,
          }),
          rootCard(525, { rezzed: false }),
          rootCard(545, { rezzed: true }),
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
  definitionId: number,
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
