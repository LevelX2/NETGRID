import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it } from "vitest";
import { chooseAiAction } from "../ai-runtime-public-entrypoints";
import { restoreAiRuntimeCheckpoint } from "../evaluation/decision-checkpoints/runtime-checkpoint";
import {
  resetResidentPlanPortfolioMemory,
  residentPlanPortfolioSnapshot,
} from "../plans/resident-plan-portfolio-memory";
import { buildAiDecisionInputDto } from "../input-dto";

afterEach(resetResidentPlanPortfolioMemory);
describe("current and future encounter share their break budget", () => {
  it.each([6, 8])("reserves the remaining route with %i credits", (credits) => {
    const cp = JSON.parse(
      readFileSync(
        new URL(
          "../../../../data/scenarios/ai-decision-checkpoints/cp-meta-434-r10-remaining-run-budget.json",
          import.meta.url,
        ),
        "utf8",
      ),
    );
    // The old capture predates this Engine field. The separate Engine view
    // regression proves this quote for Krash's four encounter-only pumps.
    cp.input.playerView.own.rig.find(
      (c: { definitionId: string }) => c.definitionId === "onr_v1_039_krash",
    ).strengthAfterEncounter = 0;
    const input = { ...cp.input, ...buildAiDecisionInputDto(cp.input) };
    input.playerView.own.credits = credits;
    restoreAiRuntimeCheckpoint(
      input,
      input.ownDeckSnapshot.deckSnapshotId,
      cp.runtime,
    );
    const decision = chooseAiAction(input);
    expect(decision.actionId).toContain(
      credits === 6
        ? "printed_subroutines_prohibit_break_next_ice"
        : "printed_subroutines_damage_net",
    );
    expect(decision.fallbackUsed).toBe(false);
    expect(
      decision.decisionDebug?.planFirstDecision?.rootPlanInstanceId,
    ).toContain("runner.contest_remote");
    const owner = residentPlanPortfolioSnapshot(input)!.instances.find(
      (i) => i.moduleId === "runner.convert_run_window",
    )!;
    expect(owner.moduleState).toMatchObject({
      signal: {
        rootPlanInstanceId: expect.stringContaining("runner.contest_remote"),
      },
    });
  });
});
