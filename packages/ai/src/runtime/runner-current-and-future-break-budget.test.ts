import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it } from "vitest";
import { chooseAiAction } from "../ai-runtime-public-entrypoints";
import { restoreAiRuntimeCheckpoint } from "../evaluation/decision-checkpoints/runtime-checkpoint";
import {
  resetResidentPlanPortfolioMemory,
  residentPlanPortfolioSnapshot,
} from "../plans/resident-plan-portfolio-memory";
import { buildAiDecisionInputDto } from "../input-dto";
import type { AiDecisionInputWithDeckCapabilities } from "./ai-decision-input";

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
      (c: { definitionId: number }) => c.definitionId === 251,
    ).strengthAfterEncounter = 0;
    const input: AiDecisionInputWithDeckCapabilities = {
      ...cp.input,
      ...buildAiDecisionInputDto(cp.input),
    };
    input.playerView.own.credits = credits;
    restoreAiRuntimeCheckpoint(
      input,
      input.ownDeckSnapshot!.deckSnapshotId,
      cp.runtime,
    );
    const decision = chooseAiAction(input);
    expect(
      input.legalActions.find(
        (action) => action.actionId === decision.actionId,
      ),
    ).toMatchObject({
      type: "break_subroutine",
      payload: { subroutineIndex: credits === 6 ? 1 : 0 },
    });
    expect(decision.fallbackUsed).toBe(false);
    expect(
      decision.decisionDebug?.planFirstDecision?.portfolio.find(
        (instance) =>
          instance.instanceId ===
          decision.decisionDebug?.planFirstDecision?.rootPlanInstanceId,
      )?.moduleId,
    ).toBe("runner.contest_remote");
    const owner = residentPlanPortfolioSnapshot(input)!.instances.find(
      (i) => i.moduleId === "runner.convert_run_window",
    )!;
    expect(owner.moduleState).toMatchObject({
      signal: {
        rootPlanInstanceId:
          decision.decisionDebug!.planFirstDecision!.rootPlanInstanceId,
      },
    });
  });
});
