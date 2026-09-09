import { describe, expect, it } from "vitest";
import fixture from "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-411-conditional-damage-continuation-d447.json";
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

describe("meta 411 conditional damage continuation", () => {
  it("continues the paid full-break route under the existing contest owner", () => {
    const { input, runtime } = capture();
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
      leafExecutorInstanceId: "plan:runner.convert_run_window:run%3Arun_445",
    });
  });

  it.each([
    "unknown",
    "unrezzed",
    "missing_quote",
    "wrong_quote",
    "unaffordable",
    "break_locked",
  ])("retains the damage guard when the full break is %s", (kind) => {
    const { input } = capture();
    const ice = input.playerView.servers.find((s) => s.id === "remote_1")!
      .ice[0]!;
    if (kind === "unknown") ice.known = false;
    if (kind === "unrezzed") ice.rezzed = false;
    if (kind === "missing_quote") delete ice.effectiveRunQuote;
    if (kind === "wrong_quote")
      ice.effectiveRunQuote!.iceInstanceId = "other-ice";
    if (kind === "unaffordable") input.playerView.own.credits = 5;
    if (kind === "break_locked")
      input.playerView.run!.nextEncounterNoBreakSubroutines = true;
    expect(runnerFutureEncounterDamageJackOutAssessment(input)).toBeDefined();
  });

  it("uses the exact full-break cost, including quoted additional costs", () => {
    const { input } = capture();
    input.playerView.own.credits = 6;
    expect(runnerFutureEncounterDamageJackOutAssessment(input)).toBeUndefined();
    input.playerView.servers.find(
      (s) => s.id === "remote_1",
    )!.ice[0]!.effectiveRunQuote!.breakSubroutineAdditionalCostPerSubroutine =
      1;
    expect(runnerFutureEncounterDamageJackOutAssessment(input)).toBeDefined();
  });
});
