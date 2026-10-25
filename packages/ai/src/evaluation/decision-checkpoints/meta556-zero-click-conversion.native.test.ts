import { readFileSync } from "node:fs";
import { beforeEach, describe, expect, it } from "vitest";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { buildAiDecisionInputDto } from "../../input-dto";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import { restoreAiRuntimeCheckpoint } from "./runtime-checkpoint";
const recorded = JSON.parse(
  readFileSync(
    new URL(
      "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta556-zero-click-conversion.json",
      import.meta.url,
    ),
    "utf8",
  ),
);
beforeEach(resetResidentPlanPortfolioMemory);
describe("pairing 556 zero-click accumulated-pressure conversion", () => {
  it.each([
    [false, false],
    [false, true],
    [true, false],
    [true, true],
  ])(
    "binds the exact free conversion with DTO=%s and resident=%s",
    (dto, resident) => {
      const cp = structuredClone(recorded);
      expect(Object.keys(cp.validation)).toHaveLength(9);
      expect(Object.values(cp.validation).every(Boolean)).toBe(true);
      expect(cp.input.playerView.own.clicks).toBe(0);
      if (dto) cp.input = { ...cp.input, ...buildAiDecisionInputDto(cp.input) };
      if (resident)
        restoreAiRuntimeCheckpoint(
          cp.input,
          cp.input.ownDeckSnapshot.deckSnapshotId,
          cp.runtime,
        );
      const before = JSON.stringify(cp.input),
        result = chooseAiAction(cp.input),
        pf = result.decisionDebug?.planFirstDecision;
      const action = cp.input.legalActions.find(
        (a: any) => a.actionId === result.actionId,
      );
      expect(action).toMatchObject({
        type: "activated_card_ability",
        costs: [],
        payload: {
          cardImplementationAbilityKey: "convert_socket_set_to_pipe_counter",
        },
      });
      expect(result.fallbackUsed).toBe(false);
      expect(result.timeoutUsed).toBe(false);
      expect(pf?.selectedPlan?.moduleId).toBe("runner.pressure_central");
      expect(pf?.rootPlanInstanceId).toBe(
        "plan:runner.pressure_central:central%3Aarchives",
      );
      expect(pf?.leafExecutorInstanceId).toBe(pf?.rootPlanInstanceId);
      expect(pf?.route).toMatchObject({
        actionId: result.actionId,
        stateVersion: 32,
        planInstanceId: pf?.rootPlanInstanceId,
      });
      expect(pf?.turnPlanning?.coverage).toMatchObject({
        status: "pass",
        coveragePercent: 100,
        missingActionCount: 0,
        conflictingActionCount: 0,
      });
      expect(JSON.stringify(cp.input)).toBe(before);
    },
  );
  it("does not materialize an old conversion when its current LegalAction is absent", () => {
    const cp = structuredClone(recorded);
    cp.input.legalActions = cp.input.legalActions.filter(
      (a: any) => a.type === "end_turn",
    );
    restoreAiRuntimeCheckpoint(
      cp.input,
      cp.input.ownDeckSnapshot.deckSnapshotId,
      cp.runtime,
    );
    expect(chooseAiAction(cp.input).actionId).toBe(
      cp.input.legalActions[0].actionId,
    );
  });
});
