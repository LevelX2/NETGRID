import { describe, expect, it } from "vitest";
import fixture from "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-411-run-boundary-d166.json";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import { runnerFutureEncounterDamageJackOutAssessment } from "../../runner-damage-threat-assessment";

function capture() {
  return structuredClone(fixture) as unknown as {
    input: AiDecisionInputWithDeckCapabilities;
    runtime: AiRuntimeCheckpointV1;
  };
}

describe("meta 411 future damage belongs to the creating run", () => {
  it("continues the real event-started contest after bypassing the source", () => {
    const { input, runtime } = capture();
    expect(input.playerView.run?.runId).toBe("run_165");
    expect(runnerFutureEncounterDamageJackOutAssessment(input)).toBeUndefined();
    resetResidentPlanPortfolioMemory();
    restoreAiRuntimeCheckpoint(
      input,
      input.ownDeckSnapshot!.deckSnapshotId,
      runtime,
    );
    const result = chooseAiAction(input, { runnerTurnPlannerMode: "cutover" });
    expect(result.actionId).toBe("runner.continue_run");
    expect(result.fallbackUsed).toBe(false);
    expect(input.legalActions.some((a) => a.actionId === result.actionId)).toBe(
      true,
    );
    expect(result.decisionDebug?.planFirstDecision).toMatchObject({
      rootPlanInstanceId: "plan:runner.contest_remote:remote%3Aremote_1",
      leafExecutorInstanceId: "plan:runner.convert_run_window:run%3Arun_165",
    });
  });

  it.each([
    "start_run",
    "play_event",
    "activated_card_ability",
    "trigger_ability",
  ])("uses the Engine run identity for a %s origin", (type) => {
    const { input } = capture();
    for (const events of [input.eventTail, input.playerView.publicEvents]) {
      const origin = events.find((e) => e.stateVersionAfter === 165)!;
      origin.type = type;
      origin.publicPayload!.actionType = type;
    }
    expect(runnerFutureEncounterDamageJackOutAssessment(input)).toBeUndefined();
  });

  it("does not let an unrelated event erase a current-run threat", () => {
    const { input } = capture();
    input.playerView.run!.runId = "run_1";
    expect(runnerFutureEncounterDamageJackOutAssessment(input)).toBeDefined();
  });

  it("still guards a source resolved after the new run started", () => {
    const { input } = capture();
    const original = input.eventTail.find(
      (e) =>
        e.type === "continue_run" &&
        e.publicPayload?.sourceDefinitionId === "onr_v1_242_fatal-attractor" &&
        e.publicPayload?.resolvedEffects?.some(
          (x) => x.kind === "resolve_subroutine",
        ),
    )!;
    const current = structuredClone(original);
    current.eventId = "current-run-source";
    current.stateVersionBefore = 165;
    current.stateVersionAfter = 166;
    input.playerView.stateVersion = 166;
    input.eventTail.push(current);
    expect(runnerFutureEncounterDamageJackOutAssessment(input)).toMatchObject({
      sourceDefinitionId: "onr_v1_242_fatal-attractor",
      projectedDamage: 3,
    });
  });
});
