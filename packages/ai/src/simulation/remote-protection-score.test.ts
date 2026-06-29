import { describe, expect, it } from "vitest";
import type { AiDecisionInput, GameState, VisibleCard } from "@netgrid/shared";

import { runnerContestRiskForSimulation } from "./remote-protection-score";

describe("runnerContestRiskForSimulation", () => {
  it("counts only real runtime icebreakers for remote contest risk", () => {
    expect(contestRiskWithRunnerRig([runnerCard("simple_decoder")])).toBe(
      "high",
    );
    expect(contestRiskWithRunnerRig([runnerCard("local_icebreakerish_noise")]))
      .toBe("low");
  });
});

function contestRiskWithRunnerRig(rig: VisibleCard[]): string {
  return runnerContestRiskForSimulation(gameState(), aiInput(rig), "remote_1");
}

function gameState(): GameState {
  return {
    corp: {
      credits: 4,
      servers: [
        {
          id: "remote_1",
          ice: ["remote-ice-instance"],
          root: [],
        },
      ],
    },
    cardInstances: {
      "remote-ice-instance": {
        definitionId: "simple_barrier_ice",
        rezzed: false,
      },
    },
  } as unknown as GameState;
}

function aiInput(rig: VisibleCard[]): AiDecisionInput {
  return {
    playerView: {
      opponent: {
        credits: 6,
        rig,
      },
      servers: [
        {
          id: "remote_1",
          ice: [
            {
              instanceId: "remote-ice-instance",
              definitionId: "simple_barrier_ice",
              known: true,
              rezzed: false,
            },
          ],
          root: [],
        },
      ],
    },
  } as unknown as AiDecisionInput;
}

function runnerCard(definitionId: string): VisibleCard {
  return {
    instanceId: `${definitionId}-instance`,
    definitionId,
    known: true,
    type: "program",
    owner: "runner",
    controller: "runner",
  } as VisibleCard;
}
