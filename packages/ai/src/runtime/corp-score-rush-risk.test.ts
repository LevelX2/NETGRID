import { describe, expect, it } from "vitest";
import type { AiDecisionInput, VisibleCard } from "@netgrid/shared";

import {
  aiInput,
  server,
  visibleCard,
} from "../semantic-ai-runtime-cutover.test-support";
import { assessCorpScoreRushRisk } from "./corp-score-rush-risk";

describe("assessCorpScoreRushRisk", () => {
  it("rejects an economically reachable agenda when its steal would end the game", () => {
    const input = aiInput("corp", []);
    input.playerView.opponent.agendaPoints = 6;
    input.playerView.opponent.credits = 8;
    input.playerView.opponent.rig = [
      visibleCard("dwarf", "runner", "program", {
        definitionId: "onr_v1_021_dwarf",
        strength: 2,
        subtypes: ["icebreaker", "worm"],
      }),
    ];
    const target = fixedPostRezWallServer(input, "wall");

    expect(
      assessCorpScoreRushRisk({
        input,
        server: target,
        agendaPoints: 1,
        remainingAdvancementClicks: 2,
      }),
    ).toMatchObject({
      admission: "rejected",
      reason: "terminal_steal_risk",
    });
  });

  it("accepts exact protection when the visible Runner cannot reach before score", () => {
    const input = aiInput("corp", []);
    input.playerView.opponent.agendaPoints = 0;
    input.playerView.opponent.credits = 2;
    input.playerView.opponent.rig = [];
    const target = fixedPostRezWallServer(input, "wall");

    expect(
      assessCorpScoreRushRisk({
        input,
        server: target,
        agendaPoints: 2,
        remainingAdvancementClicks: 3,
      }),
    ).toMatchObject({
      admission: "accepted",
      reason: "runner_cannot_reach_before_score",
    });
  });
});

function fixedPostRezWallServer(input: AiDecisionInput, cardId: string) {
  const definitionId = "onr_v1_279_wall-of-static";
  const runQuote: NonNullable<VisibleCard["effectiveRunQuote"]> = {
    iceInstanceId: cardId,
    iceDefinitionId: definitionId,
    effectiveStrength: 2,
    subroutines: [
      {
        id: `${cardId}-etr`,
        type: "end_the_run",
        sourceDefinitionId: definitionId,
        sourceTitle: "Wall of Static",
      },
    ],
  };
  const wall = visibleCard(cardId, "corp", "ice", {
    definitionId,
    rezzed: false,
    strength: 2,
    subtypes: ["wall"],
    effectiveRezCostQuote: {
      context: "installed",
      complete: true,
      cardId,
      targetServerId: "remote_1",
      projectedServerId: "remote_1",
      expiresAtStateVersion: input.playerView.stateVersion,
      baseCredits: 3,
      finalCredits: 3,
      costKind: "fixed",
      mandatoryAdditionalCosts: { agendaPoints: 0 },
    },
    effectivePostRezRunQuote: {
      context: "installed_post_rez",
      complete: true,
      cardId,
      iceDefinitionId: definitionId,
      targetServerId: "remote_1",
      projectedServerId: "remote_1",
      expiresAtStateVersion: input.playerView.stateVersion,
      effectiveRunQuote: runQuote,
    },
  });
  const target = server("remote_1", [wall]);
  input.playerView.servers = [
    ...input.playerView.servers.filter(
      (candidate) => candidate.id !== "remote_1",
    ),
    target,
  ];
  return target;
}
