import { readFileSync } from "node:fs";
import { afterEach, expect, it } from "vitest";
import type { AiDecisionInput } from "@netgrid/shared";
import { buildAiDecisionInputDto } from "../input-dto";
import { chooseAiAction } from "../ai-runtime-public-entrypoints";
import { restoreAiRuntimeCheckpoint } from "../evaluation/decision-checkpoints/runtime-checkpoint";
import { resetResidentPlanPortfolioMemory } from "../plans/resident-plan-portfolio-memory";
import { evaluateRunnerRunTargets } from "../runner-run-target-evaluation";
afterEach(resetResidentPlanPortfolioMemory);
it.each([
  [4, 178, "hq"],
  [34, 203, "remote_1"],
] as const)(
  "preserves the real unbreakable path at G%i D%i",
  (g, d, server) => {
    const cp = JSON.parse(
      readFileSync(
        new URL(
          `../../../../data/scenarios/ai-decision-checkpoints/cp-meta-459-g${g}-d${d}.json`,
          import.meta.url,
        ),
        "utf8",
      ),
    );
    expect(Object.values(cp.validation).every((v) => v === true)).toBe(true);
    const input: AiDecisionInput = {
      ...cp.input,
      ...buildAiDecisionInputDto(cp.input),
    };
    expect(input.playerView.opponent).not.toHaveProperty("gripOrHq");
    const target = evaluateRunnerRunTargets({ input }).find(
      (x) => x.actionId === `runner.start_run.${server}`,
    )!;
    expect(target.routeQuote!.reachability).toBe("no_access");
    expect(target.pathPassability).not.toBe("reachable");
    restoreAiRuntimeCheckpoint(
      input,
      cp.input.ownDeckSnapshot.deckSnapshotId,
      cp.runtime,
    );
    const result = chooseAiAction(input);
    expect(result.fallbackUsed).toBe(false);
    expect(result.actionId).not.toBe(target.actionId);
    expect(input.legalActions.some((a) => a.actionId === result.actionId)).toBe(
      true,
    );
    expect(result.evidence!.some((e) => e.startsWith("plan_step_id:"))).toBe(
      true,
    );
  },
);
