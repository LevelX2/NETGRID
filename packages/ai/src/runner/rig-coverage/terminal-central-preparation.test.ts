import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { buildAiDecisionInputDto } from "../../input-dto";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { restoreAiRuntimeCheckpoint } from "../../evaluation/decision-checkpoints/runtime-checkpoint";
import { evaluateRunnerRunTargets } from "../../runner-run-target-evaluation";

describe("terminal central access preserves its quoted preparation", () => {
  it("binds the native SP-026 last-chance subtype change before starting R&D", () => {
    const checkpoint = JSON.parse(
      readFileSync(
        new URL(
          "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-531-r2-g39-d422-preparation.json",
          import.meta.url,
        ),
        "utf8",
      ),
    );
    expect(Object.values(checkpoint.validation)).toEqual(Array(9).fill(true));
    const input = {
      ...checkpoint.input,
      ...buildAiDecisionInputDto(checkpoint.input),
    };
    const rd = evaluateRunnerRunTargets({ input }).find(
      (target) => target.actionId === "runner.start_run.rd",
    )!;
    expect(rd.recommendation).toBe("gain_credits_first");
    expect(rd.routeQuote).toMatchObject({
      reachability: "guaranteed_access",
      knownCost: 5,
      preRunPreparation: {
        credits: 1,
        clicks: 1,
        subtypeChanges: [{ selectedSubtype: "code_gate" }],
      },
    });
    const preparationAction = input.legalActions.find(
      (action: { type: string; payload?: Record<string, unknown> }) =>
        action.type === "trigger_ability" &&
        action.payload?.runnerAbility === "change_icebreaker_subtype" &&
        action.payload.selectedSubtype === "code_gate",
    )!;
    expect(preparationAction).toBeDefined();
    restoreAiRuntimeCheckpoint(
      input,
      input.ownDeckSnapshot.deckSnapshotId,
      checkpoint.runtime,
    );
    const decision = chooseAiAction(input);
    const plan = decision.decisionDebug?.planFirstDecision;
    const root = "plan:runner.pressure_central:central%3Ard";
    expect(decision.actionId).toBe(preparationAction.actionId);
    expect(decision.fallbackUsed).toBe(false);
    expect(plan?.rootPlanInstanceId).toBe(root);
    expect(plan?.leafExecutorInstanceId).toMatch(
      /^plan:runner\.rig_and_coverage:/,
    );
    expect(plan?.selectedStep).toMatchObject({
      parentInstanceId: root,
      stepId: expect.stringMatching(/:prepare:breaker_code_gate$/),
    });
    expect(plan?.route).toMatchObject({
      actionId: preparationAction.actionId,
      stateVersion: checkpoint.stateVersion,
    });
    expect(plan?.executionOrigin).toMatchObject({
      rootPlanInstanceId: root,
      leafPlanInstanceId: plan?.leafExecutorInstanceId,
      side: "runner",
      stateVersion: checkpoint.stateVersion,
    });
  });
});
