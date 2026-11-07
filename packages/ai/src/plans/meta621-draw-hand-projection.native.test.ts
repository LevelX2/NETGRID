import { readFileSync } from "node:fs";
import { afterEach, expect, it } from "vitest";
import { chooseAiAction } from "../ai-runtime-public-entrypoints";
import { buildAiDecisionInputDto } from "../input-dto";
import { restoreAiRuntimeCheckpoint } from "../evaluation/decision-checkpoints/runtime-checkpoint";
import { resetResidentPlanPortfolioMemory } from "./resident-plan-portfolio-memory";

afterEach(resetResidentPlanPortfolioMemory);

it("projects the known hand gain before the private defense-draw boundary", () => {
  const cp = JSON.parse(
    readFileSync(
      new URL(
        "../../../../data/scenarios/ai-decision-checkpoints/cp-meta621-corp-draw-hand-count.json",
        import.meta.url,
      ),
      "utf8",
    ),
  );
  expect(Object.values(cp.validation).every(Boolean)).toBe(true);
  const input = { ...cp.input, ...buildAiDecisionInputDto(cp.input) };
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot.deckSnapshotId,
    cp.runtime,
  );
  const before = JSON.stringify(input.playerView);
  const decision = chooseAiAction(input);
  expect(decision.actionId).toBe("corp.draw_card");
  const plan = decision.decisionDebug!.planFirstDecision!;
  expect(plan.rootPlanInstanceId).toBe(
    "plan:corp.defend_servers:server-defense-portfolio",
  );
  expect(plan.leafExecutorInstanceId).toBe(plan.rootPlanInstanceId);
  expect(plan.route).toMatchObject({
    actionId: decision.actionId,
    stateVersion: 83,
  });
  const line = plan.turnPlanning!.consideredLines!.find(
    (line) => line.firstActionId === decision.actionId,
  )!;
  expect(line.stopReason).toBe("observation_boundary");
  expect(line.stepCount).toBe(1);
  expect(line.projectedEndState).toMatchObject({
    creditMinimum: 1,
    creditMaximum: 1,
    unrestrictedActionMinimum: 2,
    unrestrictedActionMaximum: 2,
    handMinimum: cp.actualNextHandCount,
    handMaximum: cp.actualNextHandCount,
    pendingBoundaryKind: "private_observation",
  });
  expect(JSON.stringify(input.playerView)).toBe(before);
  expect(input.playerView.opponent).not.toHaveProperty("gripOrHq");
  expect(decision.fallbackUsed).toBe(false);
  expect(decision.timeoutUsed).toBe(false);
});
