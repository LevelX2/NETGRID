import { expect, it } from "vitest";
import captureJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-pairing-432-weather-d25.json";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";
import { evaluateRunnerRunTargets } from "../../runner-run-target-evaluation";

it("preserves normal HQ access over fixed denial against an empty Corp pool", () => {
  const capture = structuredClone(captureJson) as {
    input: AiDecisionInputWithDeckCapabilities;
    runtime: AiRuntimeCheckpointV1;
  };
  resetResidentPlanPortfolioMemory();
  restoreAiRuntimeCheckpoint(
    capture.input,
    capture.input.ownDeckSnapshot!.deckSnapshotId,
    capture.runtime,
  );
  const d = chooseAiAction(capture.input);
  expect(d.actionId).toBe("runner.start_run.hq");
  expect(d.decisionDebug?.planFirstDecision).toMatchObject({
    rootPlanInstanceId: "plan:runner.pressure_central:central%3Ahq",
    leafExecutorInstanceId: "plan:runner.pressure_central:central%3Ahq",
  });
  expect(d.fallbackUsed).toBe(false);
});
it.each([0, 2, 9])(
  "distinguishes fixed, variable and conditional replacement at %i Corp credits",
  (credits) => {
    const input = structuredClone(
      captureJson.input,
    ) as AiDecisionInputWithDeckCapabilities;
    input.playerView.opponent.credits = credits;
    input.playerView.own.agendaPoints = 6;
    const e = evaluateRunnerRunTargets({ input });
    const weather = e.find((x) => x.actionId.includes("weather-to-finance"))!;
    const manifests = e.find((x) => x.actionId.includes("edited-shipping"))!;
    const basic = e.find((x) => x.actionId === "runner.start_run.hq")!;
    expect(weather.runActionProjection.accessReplacement).toBe(
      "corp_lose_credits",
    );
    expect(weather.runActionProjection.accessReplacementCreditLoss).toBe(4);
    expect(
      manifests.runActionProjection.accessReplacementRequiresCorpCredits,
    ).toBe(true);
    expect(weather.evidence).toContain(
      `central_access_replacement_visible_denial_upper_bound:${Math.min(credits, 4)}`,
    );
    expect(weather.evidence).toContain(
      "runner_matchpoint_central_access:false",
    );
    expect(manifests.evidence).toContain(
      `runner_matchpoint_central_access:${credits === 0}`,
    );
    if (credits === 0) {
      expect(weather.knownAccessState).toBe("known_no_current_payoff");
      expect(manifests.knownAccessState).toBe(basic.knownAccessState);
    }
  },
);
