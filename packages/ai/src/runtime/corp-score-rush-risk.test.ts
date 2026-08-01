import { describe, expect, it } from "vitest";

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
    const target = server("remote_1", [
      visibleCard("wall", "corp", "ice", {
        definitionId: "onr_v1_279_wall-of-static",
        rezzed: false,
        strength: 2,
        subtypes: ["wall"],
      }),
    ]);

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
    const target = server("remote_1", [
      visibleCard("wall", "corp", "ice", {
        definitionId: "onr_v1_279_wall-of-static",
        rezzed: false,
        strength: 2,
        subtypes: ["wall"],
      }),
    ]);

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
