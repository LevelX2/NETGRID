import { hashGameState } from "@netgrid/engine";
import { describe, expect, it } from "vitest";

import cp01Json from "../../../../../data/scenarios/ai-decision-checkpoints/cp-f450-10311-01.json";
import cp02Json from "../../../../../data/scenarios/ai-decision-checkpoints/cp-f450-10311-02.json";
import cp03Json from "../../../../../data/scenarios/ai-decision-checkpoints/cp-f450-10311-03.json";
import cp03ControlJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-f450-10311-03-control.json";
import cp04Json from "../../../../../data/scenarios/ai-decision-checkpoints/cp-f450-10311-04.json";
import { bindHistoricalRunEventCadence } from "./checkpoint-cadence-fixture.test-support";
import type { AiDecisionCheckpointV1 } from "./checkpoint-types";
import { runAiDecisionCheckpoint } from "./checkpoint-runner";
import { withCurrentF450DamageZoneExpectation } from "./f450-damage-zone-fixture.test-support";
import { runnerDamageThreatAssessment } from "../../runner-damage-threat-assessment";

describe("F450 and 10311 exact decision checkpoints", () => {
  it.each([
    ["reachable movement path is continued", cp01Json],
    [
      "guaranteed score conversion precedes later matchpoint pressure",
      cp02Json,
    ],
    ["comfortable Streetware bank is not overfilled", cp03Json],
  ])("satisfies %s", (_label, json) => {
    const result = runAiDecisionCheckpoint(fixture(json));

    expect(result.ok, `${result.code}: ${result.message}`).toBe(true);
  });

  it("does not turn historical Archives damage into an active R&D hand floor", () => {
    const result = runAiDecisionCheckpoint(
      withCurrentF450DamageZoneExpectation(fixture(cp04Json)),
    );
    expect(result.ok, `${result.code}: ${result.message}`).toBe(true);
    expect(runnerDamageThreatAssessment(result.input).flatlineRisk).toMatchObject({
      level: "suspected", recommendedHandFloor: 2, activeDamageSourceCount: 1,
    });
  });

  it("still scores an installed agenda without opponent matchpoint", () => {
    const noMatchpoint = mutateFixture(cp02Json, (checkpoint) => {
      const state = checkpoint.engine.testOnlyGameState;
      const agendaId = state.corp.scoreArea.at(-1);
      if (!agendaId) throw new Error("Missing scored Corp agenda");
      state.corp.scoreArea = state.corp.scoreArea.filter(
        (cardId) => cardId !== agendaId,
      );
      state.corp.rd.push(agendaId);
      state.cardInstances[agendaId] = {
        ...state.cardInstances[agendaId]!,
        zone: { side: "corp", zone: "rd" },
        faceup: false,
        rezzed: false,
      };
      checkpoint.expectation = {
        acceptableActions: [
          {
            type: "activated_card_ability",
            sourceDefinitionId: "onr_classic_004_theorem-proof",
          },
        ],
      };
    });

    expectCheckpointToPass(noMatchpoint);
  });

  it("may load Streetware in the historical low-credit control", () => {
    expectCheckpointToPass(fixture(cp03ControlJson));
  });

  it("does not let rich credits override a genuine public core-damage hand floor", () => {
    const stillSafe = mutateFixture(cp04Json, (checkpoint) => {
      checkpoint.source.kind = "synthetic_companion";
      checkpoint.source.findingId = "F450-10311-04-CORE-DAMAGE-CONTROL";
      checkpoint.engine.testOnlyGameState.runner.credits = 10;
      checkpoint.engine.testOnlyGameState.runner.coreDamage = 2;
      checkpoint.expectation = {
        acceptableActions: [{ type: "start_run", targetServerId: "hq" }],
        planExecution: {
          acceptablePlanKinds: ["runner.pressure_central"],
          acceptableCapabilities: ["pressure_hq_information"],
        },
        runTargets: [
          {
            targetServerId: "rd",
            pathPassability: "blocked_by_visible_damage_hand_buffer",
            recommendation: "draw_for_damage_buffer",
          },
        ],
      };
    });

    expectCheckpointToPass(stillSafe);
  });
});

function fixture(value: unknown): AiDecisionCheckpointV1 {
  const checkpoint = bindHistoricalRunEventCadence(
    structuredClone(value) as AiDecisionCheckpointV1,
    ["cp-f450-10311-funded-cybermodem"],
  );
  return checkpoint;
}

function mutateFixture(
  value: unknown,
  mutation: (fixture: AiDecisionCheckpointV1) => void,
): AiDecisionCheckpointV1 {
  const result = fixture(value);
  mutation(result);
  result.engine.stateHash = hashGameState(result.engine.testOnlyGameState);
  return result;
}

function expectCheckpointToPass(checkpoint: AiDecisionCheckpointV1): void {
  const result = runAiDecisionCheckpoint(checkpoint);
  expect(result.ok, `${result.code}: ${result.message}`).toBe(true);
}
