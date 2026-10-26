import { readFileSync } from "node:fs";
import { beforeEach, describe, expect, it } from "vitest";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { buildAiDecisionInputDto } from "../../input-dto";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import { buildPlanningStateIdentity } from "../../plans/turn-planning-contracts";
import { restoreAiRuntimeCheckpoint } from "./runtime-checkpoint";

beforeEach(resetResidentPlanPortfolioMemory);
describe("pairing 560: current Defense draw-plus-credit head", () => {
  for (const stem of ["r2-g1-d145-failed", "r2-g5-d89-failed"]) {
    it.each([false, true])(
      stem + " keeps its exact legal Defense route through DTO=%s",
      (dto) => {
        const native = JSON.parse(
          readFileSync(
            new URL(
              "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta560-" +
                stem +
                ".json",
              import.meta.url,
            ),
            "utf8",
          ),
        );
        expect(Object.values(native.validation)).toEqual(Array(9).fill(true));
        const input = dto
          ? { ...native.input, ...buildAiDecisionInputDto(native.input) }
          : structuredClone(native.input);
        input.planningStateIdentity = buildPlanningStateIdentity(input);
        restoreAiRuntimeCheckpoint(
          input,
          input.ownDeckSnapshot.deckSnapshotId,
          native.runtime,
        );
        const before = JSON.stringify(input),
          result = chooseAiAction(input);
        expect(JSON.stringify(input)).toBe(before);
        expect(result.fallbackUsed).toBe(false);
        expect(result.timeoutUsed).toBe(false);
        const action = input.legalActions.find(
          (a: any) => a.actionId === result.actionId,
        );
        expect(action).toBeDefined();
        expect(action.source).toContain("silicon-saloon");
        expect(action.payload).toMatchObject({
          gainCreditsAmount: 1,
          drawCardsAmount: 1,
        });
        const plan = result.decisionDebug!.planFirstDecision!;
        expect(plan.selectedPlan?.moduleId).toBe("runner.defense_and_recovery");
        expect(plan.selectedPlan?.phase).toBe("build_hand_buffer");
        expect(plan.route).toMatchObject({
          actionId: action.actionId,
          stateVersion: native.stateVersion,
          planInstanceId: plan.leafExecutorInstanceId,
        });
      },
    );
  }
});
