import { describe, expect, it } from "vitest";
import checkpointJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-403-known-etr-core-d195.json";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { evaluateRunnerRunTargets } from "../../runner-run-target-evaluation";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";

describe("meta 403 known ETR plus core damage", () => {
  it("keeps an unbreakable ETR binding when a terminal contest waives only the damage floor", () => {
    const capture = structuredClone(checkpointJson) as unknown as {
      input: AiDecisionInputWithDeckCapabilities;
      runtime: AiRuntimeCheckpointV1;
    };
    resetResidentPlanPortfolioMemory();
    restoreAiRuntimeCheckpoint(
      capture.input,
      capture.input.ownDeckSnapshot!.deckSnapshotId,
      capture.runtime,
    );
    const target = evaluateRunnerRunTargets({ input: capture.input }).find(
      (e) => e.actionId === "runner.start_run.remote_1",
    );
    expect(target).toMatchObject({
      pathPassability: "blocked_by_visible_damage_hand_buffer",
      routeQuote: {
        reachability: "no_access",
        noAccessReason: "missing_breaker_coverage",
      },
    });
    const decision = chooseAiAction(capture.input);
    expect(decision.actionId).not.toBe("runner.start_run.remote_1");
    expect(decision.fallbackUsed).toBe(false);
    expect(
      capture.input.legalActions.some((a) => a.actionId === decision.actionId),
    ).toBe(true);
    expect(decision.decisionDebug?.planFirstDecision?.dispositions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          actionId: "runner.start_run.remote_1",
          ownerModuleId: "runner.contest_remote",
          disposition: "explicitly_nonproductive",
        }),
      ]),
    );
  });
});
