import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { costProfileForAction } from "../../actions/action-cost-timing";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";

const checkpoint = JSON.parse(
  readFileSync(
    new URL(
      "../../../../../data/scenarios/ai-decision-checkpoints/cp-deep626-corp-alternate-rez-d91.json",
      import.meta.url,
    ),
    "utf8",
  ),
) as {
  input: AiDecisionInputWithDeckCapabilities;
  runtime: AiRuntimeCheckpointV1;
  validation: Record<string, boolean>;
};

describe("native exact alternate-subtype rez costs", () => {
  it.each([0, 1])("keeps selected variant %i fully priced", (value) => {
    const action = checkpoint.input.legalActions.find(
      (a) =>
        a.type === "rez_ice" && a.payload?.variableRezValue === value,
    )!;
    expect(action.payload?.rezCostPaid).toBe(6 + value);
    expect(costProfileForAction(action)).toMatchObject({
      creditCost: 6 + value,
      clickCost: 0,
      costKnownStatus: "known",
      additionalCosts: [],
    });
  });

  it("selects the bound Defense rez without losing the current route head", () => {
    expect(Object.keys(checkpoint.validation)).toHaveLength(9);
    expect(Object.values(checkpoint.validation).every(Boolean)).toBe(true);
    const { input, runtime } = structuredClone(checkpoint);
    const before = JSON.stringify(input.playerView);
    resetResidentPlanPortfolioMemory();
    restoreAiRuntimeCheckpoint(
      input,
      input.ownDeckSnapshot!.deckSnapshotId,
      runtime,
    );
    const decision = chooseAiAction(input);
    const action = input.legalActions.find(
      (candidate) => candidate.actionId === decision.actionId,
    )!;
    expect(decision.fallbackUsed).toBe(false);
    expect(decision.timeoutUsed).toBe(false);
    expect(JSON.stringify(input.playerView)).toBe(before);
    expect(action.type).toBe("rez_ice");
    expect(action.payload?.variableRezKind).toBe("alternate_subtype");
    const plan = decision.decisionDebug?.planFirstDecision;
    expect(plan?.rootPlanInstanceId).toBe(
      "plan:corp.defend_servers:server-defense-portfolio",
    );
    expect(plan?.leafExecutorInstanceId).toBe(plan?.rootPlanInstanceId);
    expect(plan?.route?.actionId).toBe(action.actionId);
    expect(plan?.route?.stateVersion).toBe(90);
  });
});
