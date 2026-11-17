import { readFileSync } from "node:fs";
import { afterEach, expect, it } from "vitest";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { evaluateRunnerRunTargets } from "../../runner-run-target-evaluation";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";

function fixture() {
  return JSON.parse(
    readFileSync(
      new URL(
        "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-434-r22-g19-d192.json",
        import.meta.url,
      ),
      "utf8",
    ),
  ) as {
    input: AiDecisionInputWithDeckCapabilities;
    runtime: AiRuntimeCheckpointV1;
  };
}
afterEach(resetResidentPlanPortfolioMemory);

it("preserves the current run capability's successful-run self tag in the existing risk assessment", () => {
  const { input } = fixture();
  const event = input.legalActions.find((a) => a.type === "play_event")!;
  const target = evaluateRunnerRunTargets({ input }).find(
    (t) => t.actionId === event.actionId,
  )!;
  expect(target.runActionProjection.riskSignals).toContain(
    "tag_self:successful_run",
  );
  expect(target.runActionPayoff.riskPenalty).toBe(25);
  expect(target.runActionPayoff.economyValue).toBe(80);
  expect(target.runActionPayoff.scoreBonus).toBe(55);
});

it("does not transfer the held event's self tag to basic runs", () => {
  const { input } = fixture();
  const target = evaluateRunnerRunTargets({ input }).find(
    (t) => t.actionId === "runner.start_run.hq",
  )!;
  expect(target.runActionProjection.riskSignals).not.toContain(
    "tag_self:successful_run",
  );
  expect(target.runActionPayoff.riskPenalty).toBe(0);
});

it("excludes the paid HQ information route at its central-pressure owner", () => {
  const { input, runtime } = fixture();
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot!.deckSnapshotId,
    runtime,
  );
  const decision = chooseAiAction(input);
  const action = input.legalActions.find(
    (a) => a.actionId === decision.actionId,
  )!;
  expect(action.expiresAtStateVersion).toBe(input.playerView.stateVersion);
  expect(decision.fallbackUsed).toBe(false);
  const event = input.legalActions.find(
    (legalAction) => legalAction.type === "play_event" && legalAction.payload?.serverId === "hq",
  )!;
  expect(decision.decisionDebug?.actionAlternatives).toContainEqual(
    expect.objectContaining({
      actionId: event.actionId,
      whyNot: expect.arrayContaining([
        "explicitly_nonproductive:runner.pressure_central:runner_central_information_probe_known_path_not_admitted:hq",
      ]),
    }),
  );
});
