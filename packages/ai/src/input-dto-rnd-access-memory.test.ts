import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it } from "vitest";
import type { AiDecisionInputWithDeckCapabilities } from "./runtime/ai-decision-input";
import { buildAiDecisionInputDto } from "./input-dto";
import { reconstructBeliefState } from "./belief-state";
import { evaluateKnownCentralAccessPayoff } from "./known-central-access-payoff";
import { chooseAiAction } from "./ai-runtime-public-entrypoints";
import { resetResidentPlanPortfolioMemory } from "./plans/resident-plan-portfolio-memory";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./evaluation/decision-checkpoints/runtime-checkpoint";

function checkpoint() {
  return JSON.parse(
    readFileSync(
      new URL(
        "./evaluation/decision-checkpoints/fixtures/meta497-g35-d14-access-memory.json",
        import.meta.url,
      ),
      "utf8",
    ),
  ) as { input: AiDecisionInputWithDeckCapabilities; runtime: AiRuntimeCheckpointV1 };
}
function inputFor(input: AiDecisionInputWithDeckCapabilities) {
  return { ...input, ...buildAiDecisionInputDto(input) };
}
afterEach(resetResidentPlanPortfolioMemory);
describe("native R&D access/removal binding through the AI input DTO", () => {
  it("removes the actually stolen top without inventing the next hidden card", () => {
    const cp = checkpoint();
    const input = inputFor(cp.input);
    for (const events of [input.playerView.publicEvents, input.eventTail]) {
      expect(
        events.find((e) => e.eventId === "evt_12")?.publicPayload,
      ).toMatchObject({
        accessIndex: 0,
        effectiveAccessCount: 1,
        baseAccessCount: 1,
      });
      expect(
        events.find((e) => e.eventId === "evt_13")?.publicPayload,
      ).toHaveProperty("accessIndex", 0);
    }
    const belief = reconstructBeliefState(input);
    expect(belief.runnerOpponentModel?.rndTopFreshness).toMatchObject({
      freshness: "fresh_after_top_removed",
      freshenedByRunnerAccess: true,
    });
    expect(
      belief.runnerOpponentModel?.rndTopFreshness?.knownTopDefinitionId,
    ).toBeUndefined();
    expect(evaluateKnownCentralAccessPayoff(input, "rd", belief)).toMatchObject(
      { payoff: "fresh", accessFacts: { knownTargetDefinitionIds: [] } },
    );
    restoreAiRuntimeCheckpoint(
      input,
      input.ownDeckSnapshot!.deckSnapshotId,
      cp.runtime,
    );
    const decision = chooseAiAction(input);
    expect(input.legalActions.map((a) => a.actionId)).toContain(
      decision.actionId,
    );
    expect(decision.fallbackUsed).toBe(false);
    expect(decision.decisionDebug?.planFirstDecision).toMatchObject({
      rootPlanInstanceId: "plan:runner.pressure_central:central%3Ard",
      leafExecutorInstanceId: "plan:runner.pressure_central:central%3Ard",
      selectedStep: {
        planInstanceId: "plan:runner.pressure_central:central%3Ard",
        stepId: "plan:runner.pressure_central:central%3Ard:pressure:rd",
      },
      route: {
        actionId: "runner.start_run.rd",
        stateVersion: 13,
        capabilityId: "pressure_rd_access",
      },
      selectedRunQuote: { purpose: "information", score: 300 },
    });
    expect(
      JSON.stringify(decision.decisionDebug!.planFirstDecision),
    ).not.toContain("rnd_known_top_definition:onr_proteus_004_fetal-ai");
  });
  it("retains the observed agenda when no removal has happened", () => {
    const cp = checkpoint();
    cp.input.playerView.publicEvents = cp.input.playerView.publicEvents.filter(
      (e) => e.eventId !== "evt_13",
    );
    cp.input.eventTail = cp.input.eventTail.filter(
      (e) => e.eventId !== "evt_13",
    );
    const input = inputFor(cp.input);
    expect(
      reconstructBeliefState(input).runnerOpponentModel?.rndTopFreshness,
    ).toMatchObject({
      freshness: "stale_known_same_top",
      knownTopDefinitionId: "onr_proteus_004_fetal-ai",
    });
    expect(evaluateKnownCentralAccessPayoff(input, "rd").payoff).toBe("agenda");
  });
  it("does not pass unrelated hidden queue data alongside the public index", () => {
    const cp = checkpoint();
    for (const events of [
      cp.input.playerView.publicEvents,
      cp.input.eventTail,
    ]) {
      const payload = events.find((e) => e.eventId === "evt_12")!.publicPayload;
      payload.hiddenBreachQueue = ["hidden-next-card"];
      payload.unapprovedAccessAlias = 0;
    }
    const input = inputFor(cp.input);
    expect(
      input.eventTail.find((e) => e.eventId === "evt_12")?.publicPayload,
    ).not.toHaveProperty("hiddenBreachQueue");
    expect(
      input.eventTail.find((e) => e.eventId === "evt_12")?.publicPayload,
    ).not.toHaveProperty("unapprovedAccessAlias");
  });
});
