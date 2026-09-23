import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it } from "vitest";
import type { AiDecisionInput } from "@netgrid/shared";
import { buildAiDecisionInputDto } from "../input-dto";
import { chooseAiAction } from "../ai-runtime-public-entrypoints";
import { restoreAiRuntimeCheckpoint } from "../evaluation/decision-checkpoints/runtime-checkpoint";
import { resetResidentPlanPortfolioMemory } from "../plans/resident-plan-portfolio-memory";
import { evaluateRunnerRunTargets } from "../runner-run-target-evaluation";
import { runnerSameTurnAccessPreparationFitsTarget } from "../run-analysis/runner-run-preparation";

afterEach(resetResidentPlanPortfolioMemory);

describe("real preparation admission in meta 461", () => {
  it("preserves the exact funding boundary, access requirement and remaining click", () => {
    const cp = JSON.parse(
      readFileSync(
        new URL(
          "../../../../data/scenarios/ai-decision-checkpoints/cp-meta-461-g9-d244.json",
          import.meta.url,
        ),
        "utf8",
      ),
    );
    const input: AiDecisionInput = {
      ...cp.input,
      ...buildAiDecisionInputDto(cp.input),
    };
    const preparation = input.legalActions.find(
      (a) => a.type === "play_event" && a.source?.includes("promises-promises"),
    )!;
    const targets = evaluateRunnerRunTargets({ input });
    const target = targets.find((r) => r.actionId === "runner.start_run.hq")!;
    expect(
      runnerSameTurnAccessPreparationFitsTarget(
        input,
        preparation.actionId,
        target,
      ),
    ).toBe(false);
    const funded = structuredClone(input);
    funded.playerView.own.credits += 2;
    const fundedTarget = evaluateRunnerRunTargets({ input: funded }).find(
      (r) => r.actionId === target.actionId,
    )!;
    expect(
      runnerSameTurnAccessPreparationFitsTarget(
        funded,
        preparation.actionId,
        fundedTarget,
      ),
    ).toBe(true);
    funded.playerView.own.clicks = 1;
    expect(
      runnerSameTurnAccessPreparationFitsTarget(
        funded,
        preparation.actionId,
        fundedTarget,
      ),
    ).toBe(false);
    const information = targets.find(
      (r) => r.runActionProjection.accessReplacement,
    )!;
    expect(
      runnerSameTurnAccessPreparationFitsTarget(
        input,
        preparation.actionId,
        information,
      ),
    ).toBe(false);
    funded.playerView.own.clicks = 4;
    funded.playerView.own.credits = 40;
    const replacingEvent = evaluateRunnerRunTargets({ input: funded }).find(
      (r) =>
        r.runActionProjection.sourceCardId ===
        "onr_classic_038_gypsytm-schedule-analyzer",
    )!;
    expect(replacingEvent).toBeDefined();
    expect(
      runnerSameTurnAccessPreparationFitsTarget(
        funded,
        preparation.actionId,
        replacingEvent,
      ),
    ).toBe(false);
  });
  it.each([
    [9, 203],
    [9, 244],
    [19, 164],
  ])("rejects the unconvertible preparation in G%i D%i", (game, index) => {
    const checkpoint = JSON.parse(
      readFileSync(
        new URL(
          `../../../../data/scenarios/ai-decision-checkpoints/cp-meta-461-g${game}-d${index}.json`,
          import.meta.url,
        ),
        "utf8",
      ),
    );
    const input: AiDecisionInput = {
      ...checkpoint.input,
      ...buildAiDecisionInputDto(checkpoint.input),
    };
    const rejected = input.legalActions.find((a) =>
      game === 19
        ? a.type === "install_card" &&
          a.source === "runner_onr_v1_123_bodyweight-data-creche_1"
        : a.type === "play_event" && a.source?.includes("promises-promises"),
    );
    expect(rejected).toBeDefined();
    restoreAiRuntimeCheckpoint(
      input,
      checkpoint.input.ownDeckSnapshot.deckSnapshotId,
      checkpoint.runtime,
    );
    const decision = chooseAiAction(input);
    expect(decision.actionId).not.toBe(rejected!.actionId);
    expect(
      input.legalActions.some((a) => a.actionId === decision.actionId),
    ).toBe(true);
    expect(decision.fallbackUsed).toBe(false);
    expect(decision.evidence).toContain("plan_first_runtime:true");
    expect(decision.evidence!.some((e) => e.startsWith("plan_step_id:"))).toBe(
      true,
    );
    expect(
      decision.evidence!.some((e) => e.startsWith("plan_scheduler:route:")),
    ).toBe(true);
  });
});
