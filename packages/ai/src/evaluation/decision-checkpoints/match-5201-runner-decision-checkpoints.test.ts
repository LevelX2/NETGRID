import { describe, expect, it } from "vitest";
import { applyAction, hashGameState } from "@netgrid/engine";
import { residentPlanPortfolioSnapshot } from "../../plans/resident-plan-portfolio-memory";
import { runnerDamageThreatAssessment } from "../../runner-damage-threat-assessment";

import preserveWallBreakerJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-5201-02-preserve-wall-breaker-d98.json";
import initialHqInformationRunJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-5201-01-no-repeat-hq-run-d118.json";
import type { AiDecisionCheckpointV1 } from "./checkpoint-types";
import { runAiDecisionCheckpoint } from "./checkpoint-runner";

describe("match 5201 runner decision checkpoints", () => {
  it.each([3, 10])(
    "builds the required fourth hand card before development or coverage at C%i",
    (credits) => {
      const cp = fixture(initialHqInformationRunJson);
      if (credits === 10) {
        cp.engine.testOnlyGameState.runner.credits = credits;
        cp.engine.stateHash = hashGameState(cp.engine.testOnlyGameState);
        cp.source.kind = "synthetic_companion";
      }
      cp.expectation = {
        ...cp.expectation,
        acceptableActions: [{ actionId: "runner.draw_card" }],
        planExecution: {
          acceptablePlanKinds: ["runner.defense_and_recovery"],
          acceptableCapabilities: ["build_required_hand_buffer"],
        },
      };
      const result = runAiDecisionCheckpoint(cp);
      expect(result.ok, result.message).toBe(true);
      expect(
        runnerDamageThreatAssessment(result.input).flatlineRisk,
      ).toMatchObject({
        level: "critical",
        handCount: 3,
        effectiveMaxHandSize: 4,
        recommendedHandFloor: 4,
      });
      const portfolio = residentPlanPortfolioSnapshot(result.input)!;
      expect(
        portfolio.instances.some(
          (instance) =>
            instance.instanceId ===
            "plan:runner.rig_and_coverage:coverage%3Abreaker_wall%3Arun%3Arunner.start_run.remote_1",
        ),
      ).toBe(true);
      const state = structuredClone(cp.engine.testOnlyGameState);
      state.eventLog = structuredClone(cp.engine.eventPrefix);
      const applied = applyAction(state, {
        matchId: state.matchId,
        side: "runner",
        actionId: result.decision!.actionId!,
        clientKnownStateVersion: state.stateVersion,
      });
      expect(applied.ok).toBe(true);
      if (!applied.ok) throw new Error("Native hand-buffer draw was rejected");
      expect(applied.state.runner.grip).toHaveLength(4);
      expect(applied.state.runner.credits).toBe(credits);
      expect(applied.state.runner.coreDamage).toBe(state.runner.coreDamage);
      expect(applied.state.runner.rig).toEqual(state.runner.rig);
    },
  );

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
