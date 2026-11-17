import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it } from "vitest";

import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";

function capture() {
  return JSON.parse(
    readFileSync(
      new URL(
        "../../../../../data/scenarios/ai-decision-checkpoints/cp-678d-d50-post-break-trash.json",
        import.meta.url,
      ),
      "utf8",
    ),
  ) as {
    input: AiDecisionInputWithDeckCapabilities;
    runtime: AiRuntimeCheckpointV1;
    validation: Record<string, boolean>;
  };
}

afterEach(resetResidentPlanPortfolioMemory);

describe("match 678d D50 central opening", () => {
  it("starts the affordable post-break removal plan before generic draw", () => {
    const { input, runtime, validation } = capture();
    expect(Object.values(validation).every(Boolean)).toBe(true);
    expect(input.playerView.opponent).not.toHaveProperty("gripOrHq");
    restoreAiRuntimeCheckpoint(
      input,
      input.ownDeckSnapshot!.deckSnapshotId,
      runtime,
    );

    const decision = chooseAiAction(input);
    expect(decision.actionId).toBe(
      "runner.install_card.c1q9.c1q9",
    );
    const plan = decision.decisionDebug?.planFirstDecision;
    expect(plan?.route).toMatchObject({
      planInstanceId: expect.stringMatching(
        /^plan:runner\.pressure_central:central%3A(hq|rd)$/,
      ),
      capabilityId: "develop_280",
    });
    expect(plan?.portfolio).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          instanceId: "plan:runner.pressure_central:central%3Ard",
          viability: "ready",
          phase: "develop_payoff",
        }),
      ]),
    );
    expect(decision.fallbackUsed).toBe(false);
  });
});
