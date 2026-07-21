import { applyAction, hashGameState } from "@netgrid/engine";
import { describe, expect, it } from "vitest";

import deadFirstSeed002Json from "../../../../../data/scenarios/ai-decision-checkpoints/cp-renticon-code-rot-c1-01-dead-first-ice-seed002-d5.json";
import deadFirstSeed004Json from "../../../../../data/scenarios/ai-decision-checkpoints/cp-renticon-code-rot-c1-02-dead-first-ice-seed004-d17.json";
import scorelineSeed003D208Json from "../../../../../data/scenarios/ai-decision-checkpoints/cp-renticon-code-rot-c1-03-scoreline-seed003-d208.json";
import scorelineSeed003D219Json from "../../../../../data/scenarios/ai-decision-checkpoints/cp-renticon-code-rot-c1-04-scoreline-seed003-d219.json";
import scorelineSeed004D55Json from "../../../../../data/scenarios/ai-decision-checkpoints/cp-renticon-code-rot-c1-05-scoreline-seed004-d55.json";
import scorelineSeed004D65Json from "../../../../../data/scenarios/ai-decision-checkpoints/cp-renticon-code-rot-c1-06-scoreline-seed004-d65.json";
import scorelineSeed004D247Json from "../../../../../data/scenarios/ai-decision-checkpoints/cp-renticon-code-rot-c1-07-scoreline-seed004-d247.json";
import matchpointSeed004Json from "../../../../../data/scenarios/ai-decision-checkpoints/cp-renticon-code-rot-c1-08-matchpoint-central-seed004-d295.json";
import nestedChoiceSeed001Json from "../../../../../data/scenarios/ai-decision-checkpoints/cp-renticon-code-rot-c1-09-nested-choice-seed001-d246.json";
import nestedChoiceSeed005Json from "../../../../../data/scenarios/ai-decision-checkpoints/cp-renticon-code-rot-c1-10-nested-choice-seed005-d193.json";
import type { AiDecisionCheckpointV1 } from "./checkpoint-types";
import { runAiDecisionCheckpoint } from "./checkpoint-runner";

const BEHAVIOR_FIXTURES = [
  ["defers dead first positional ICE in Seed 002", deadFirstSeed002Json],
  [
    "defers unfunded dead first positional ICE in Seed 004",
    deadFirstSeed004Json,
  ],
  [
    "continues the protected Seed 003 scoreline at d208",
    scorelineSeed003D208Json,
  ],
  [
    "stops overbuilding the protected Seed 003 scoreline at d219",
    scorelineSeed003D219Json,
  ],
  ["continues the Seed 004 scoreline at d55", scorelineSeed004D55Json],
  ["continues the Seed 004 scoreline at d65", scorelineSeed004D65Json],
  ["continues the late Seed 004 scoreline at d247", scorelineSeed004D247Json],
  [
    "protects the exposed central at Seed 004 matchpoint",
    matchpointSeed004Json,
  ],
] as const;

describe("Rent-I-Con versus CODE ROT five-game remediation checkpoints", () => {
  it.each(BEHAVIOR_FIXTURES)("%s", (_label, json) => {
    const result = runAiDecisionCheckpoint(fixture(json));
    expect(result.ok, `${result.code}: ${result.message}`).toBe(true);
  });

  it.each([
    ["Seed 001", nestedChoiceSeed001Json],
    ["Seed 005", nestedChoiceSeed005Json],
  ] as const)(
    "resolves the nested target choice in %s without an invariant",
    (_label, json) => {
      const checkpoint = fixture(json);
      const decisionResult = runAiDecisionCheckpoint(checkpoint);
      expect(
        decisionResult.ok,
        `${decisionResult.code}: ${decisionResult.message}`,
      ).toBe(true);
      expect(decisionResult.selectedAction).toBeDefined();
      const engineResult = applyAction(
        structuredClone(checkpoint.engine.testOnlyGameState),
        {
          matchId: checkpoint.source.matchId!,
          side: checkpoint.actor,
          actionId: decisionResult.selectedAction!.actionId,
          clientKnownStateVersion: checkpoint.engine.stateVersion,
          ...(decisionResult.decision?.selectedChoices
            ? { selectedChoices: decisionResult.decision.selectedChoices }
            : {}),
          idempotencyKey: `checkpoint-${checkpoint.checkpointId}`,
        },
      );
      expect(
        engineResult.ok,
        engineResult.ok
          ? "nested choice applied"
          : `${engineResult.error.code}: ${engineResult.error.message}`,
      ).toBe(true);
    },
  );

  it("still installs positional outer ICE when a funded inner layer exists", () => {
    const checkpoint = mutateFixture(deadFirstSeed004Json, (candidate) => {
      const state = candidate.engine.testOnlyGameState;
      const innerIceId = state.corp.servers.find((server) => server.id === "hq")
        ?.ice[0];
      if (!innerIceId) throw new Error("Missing inner ICE for control");
      const hq = state.corp.servers.find((server) => server.id === "hq")!;
      hq.ice = hq.ice.filter((cardId) => cardId !== innerIceId);
      state.corp.servers.push({
        id: "remote_1",
        kind: "remote",
        label: "Remote 1",
        ice: [innerIceId],
        root: [],
      });
      state.cardInstances[innerIceId] = {
        ...state.cardInstances[innerIceId]!,
        zone: { side: "corp", zone: "serverIce", serverId: "remote_1" },
      };
      state.corp.credits = 12;
      candidate.expectation = {
        acceptableActions: [
          {
            type: "install_card",
            sourceDefinitionId: "onr_v1_251_jack-attack",
            targetServerId: "remote_1",
          },
        ],
      };
    });

    expectCheckpointToPass(checkpoint);
  });

  it("does not force advancement while a rich runner can contest it", () => {
    const checkpoint = mutateFixture(scorelineSeed004D55Json, (candidate) => {
      candidate.engine.testOnlyGameState.runner.credits = 30;
      candidate.expectation = {
        acceptableActions: [
          {
            type: "play_operation",
            sourceDefinitionId: "onr_v1_290_efficiency-experts",
          },
        ],
        forbiddenActions: [{ type: "advance_card" }],
      };
    });

    expectCheckpointToPass(checkpoint);
  });

  it("does not force central protection below runner matchpoint", () => {
    const checkpoint = mutateFixture(matchpointSeed004Json, (candidate) => {
      const state = candidate.engine.testOnlyGameState;
      const scoredCards = [...state.runner.scoreArea];
      state.runner.scoreArea = [];
      state.runner.heap.push(...scoredCards);
      for (const cardId of scoredCards) {
        state.cardInstances[cardId] = {
          ...state.cardInstances[cardId]!,
          zone: { side: "runner", zone: "heap" },
          faceup: true,
          rezzed: false,
        };
      }
      candidate.expectation = {
        acceptableActions: [
          {
            type: "install_card",
            sourceDefinitionId: "onr_v1_251_jack-attack",
            targetServerId: "remote_1",
          },
        ],
      };
    });

    expectCheckpointToPass(checkpoint);
  });
});

function fixture(value: unknown): AiDecisionCheckpointV1 {
  return structuredClone(value) as AiDecisionCheckpointV1;
}

function mutateFixture(
  value: unknown,
  mutation: (fixture: AiDecisionCheckpointV1) => void,
): AiDecisionCheckpointV1 {
  const result = fixture(value);
  mutation(result);
  result.source.kind = "synthetic_companion";
  result.source.findingId = `${result.source.findingId}-control`;
  result.engine.stateHash = hashGameState(result.engine.testOnlyGameState);
  return result;
}

function expectCheckpointToPass(checkpoint: AiDecisionCheckpointV1): void {
  const result = runAiDecisionCheckpoint(checkpoint);
  expect(result.ok, `${result.code}: ${result.message}`).toBe(true);
}
