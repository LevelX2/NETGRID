import { syntheticCardDefinitionId } from "@netgrid/engine/test-fixtures/synthetic-card-definition-id";
import { describe, expect, it } from "vitest";
import {
  applyAction,
  createGameAfterSetup,
  getLegalActions,
  getPlayerView,
} from "@netgrid/engine";
import { DEMO_DECKS } from "@netgrid/shared";
import { RealEngineFixtureBuilder } from "../evaluation/real-engine-fixture-builder";
import type { AiDecisionInput, GameState, VisibleCard } from "@netgrid/shared";

import {
  remoteProtectionScoreForSimulation,
  runnerContestRiskForSimulation,
} from "./remote-protection-score";

it("distinguishes active, payable and unfundable root protection in a native remote", () => {
  const redHerrings = 578;
  const corpDeck = {
    ...DEMO_DECKS.demo_corp_001,
    cards: [
      ...DEMO_DECKS.demo_corp_001.cards,
      { id: redHerrings, quantity: 1 },
    ],
  };
  const start = createGameAfterSetup({
    seed: "root-protection-metric",
    corpDeck,
  });
  const draw = getLegalActions(start, "corp").find(
    (action) => action.type === "mandatory_draw",
  )!;
  const applied = applyAction(start, {
    matchId: start.matchId,
    side: "corp",
    actionId: draw.actionId,
    clientKnownStateVersion: start.stateVersion,
  });
  if (!applied.ok) throw new Error(applied.error.message);
  const current = applied.state;
  RealEngineFixtureBuilder.forState(current)
    .withCorpCredits(0)
    .withCorpRemoteRoot("remote_1", redHerrings, 0);
  const root = current.corp.servers.find((server) => server.id === "remote_1")!
    .root[0]!;
  const protection = (state: GameState, creditCost = 0) =>
    remoteProtectionScoreForSimulation(
      state,
      { playerView: getPlayerView(state, "corp") } as AiDecisionInput,
      "remote_1",
      creditCost,
    );
  expect(protection(current)).toBe(-45);
  expect(protection(current, -1)).toBe(-17);
  current.corp.credits = 1;
  const rez = getLegalActions(current, "corp").find(
    (action) => action.type === "rez_card" && action.source === root,
  )!;
  expect(protection(current)).toBe(-17);
  const rezzed = applyAction(current, {
    matchId: current.matchId,
    side: "corp",
    actionId: rez.actionId,
    clientKnownStateVersion: current.stateVersion,
  });
  if (!rezzed.ok) throw new Error(rezzed.error.message);
  expect(protection(rezzed.state)).toBe(-10);
});

describe("runnerContestRiskForSimulation", () => {
  it("counts only real runtime icebreakers for remote contest risk", () => {
    expect(contestRiskWithRunnerRig([runnerCard(591)])).toBe(
      "high",
    );
    expect(
      contestRiskWithRunnerRig([runnerCard(syntheticCardDefinitionId("local_icebreakerish_noise"))]),
    ).toBe("low");
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
        definitionId: 589,
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
              definitionId: 589,
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

function runnerCard(definitionId: number): VisibleCard {
  return {
    instanceId: `${definitionId}-instance`,
    definitionId,
    known: true,
    type: "program",
    owner: "runner",
    controller: "runner",
  } as VisibleCard;
}
