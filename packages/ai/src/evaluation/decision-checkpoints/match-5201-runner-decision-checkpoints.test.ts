import { describe, expect, it } from "vitest";
import { applyAction, hashGameState } from "@netgrid/engine";
import { residentPlanPortfolioSnapshot } from "../../plans/resident-plan-portfolio-memory";

import preserveWallBreakerJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-5201-02-preserve-wall-breaker-d98.json";
import initialHqInformationRunJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-5201-01-no-repeat-hq-run-d118.json";
import type { AiDecisionCheckpointV1 } from "./checkpoint-types";
import { runAiDecisionCheckpoint } from "./checkpoint-runner";

describe("match 5201 runner decision checkpoints", () => {
  it("funds the currently admitted Portastation development", () => {
    const cp = fixture(initialHqInformationRunJson);
    cp.expectation = {
      ...cp.expectation,
      acceptableActions: [{ actionId: "runner.gain_credit" }],
      planExecution: {
        acceptablePlanKinds: ["runner.economy"],
        acceptableCapabilities: ["gain_general_liquid_credits"],
      },
    };
    const result = runAiDecisionCheckpoint(cp);
    expect(result.ok, result.message).toBe(true);
    const portfolio = residentPlanPortfolioSnapshot(result.input)!;
    expect(
      portfolio.instances.find(
        (instance) => instance.instanceId === portfolio.executorInstanceId,
      )?.moduleState,
    ).toMatchObject({
      need: {
        targetCredits: 5,
        currentCreditsAtRevalidation: 3,
        gap: 2,
        parentPlanInstanceId:
          "plan:runner.develop_board_and_hand:card%3Arunner_onr_classic_052_zetatech-portastation_1",
      },
    });
  });

  it("retains the original wall-coverage draw after current development funding is satisfied", () => {
    const cp = fixture(initialHqInformationRunJson);
    cp.engine.testOnlyGameState.runner.credits = 10;
    cp.engine.stateHash = hashGameState(cp.engine.testOnlyGameState);
    cp.source.kind = "synthetic_companion";
    expectCheckpointToPass(cp);
  });

  it("preserves the only visible wall breaker against self-inflicted core damage", () => {
    const checkpoint = fixture(preserveWallBreakerJson);
    const result = runAiDecisionCheckpoint(checkpoint);
    expect(result.ok, `${result.code}: ${result.message}`).toBe(true);
    expect(result.decision?.fallbackUsed).toBe(false);
    const state = structuredClone(checkpoint.engine.testOnlyGameState);
    state.eventLog = structuredClone(checkpoint.engine.eventPrefix);
    expect(state.runner).toMatchObject({ credits: 0, clicks: 2, tags: 2 });
    expect(state.runner.grip).toHaveLength(3);
    const applied = applyAction(state, {
      matchId: state.matchId,
      side: "runner",
      actionId: result.decision!.actionId!,
      clientKnownStateVersion: state.stateVersion,
    });
    expect(applied.ok).toBe(true);
    if (!applied.ok) throw new Error("Native checkpoint draw was rejected");
    expect(applied.state.runner.grip).toHaveLength(4);
    expect(applied.state.runner.grip).toContain(
      "runner_onr_classic_027_early-worm_2",
    );
    expect(applied.state.runner.coreDamage).toBe(state.runner.coreDamage);
    expect(applied.state.runner.rig).toEqual(state.runner.rig);
    expect(applied.state.runner.tags).toBe(2);
  });
});

function fixture(value: unknown): AiDecisionCheckpointV1 {
  return structuredClone(value) as AiDecisionCheckpointV1;
}

function expectCheckpointToPass(checkpoint: AiDecisionCheckpointV1): void {
  const result = runAiDecisionCheckpoint(checkpoint);
  expect(result.ok, `${result.code}: ${result.message}`).toBe(true);
}
