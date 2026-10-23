import { readFileSync } from "node:fs";
import { beforeEach, describe, expect, it } from "vitest";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { buildAiDecisionInputDto } from "../../input-dto";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import {
  runnerEncounterCreditBudgetForInput,
  runnerEncounterPaymentForAction,
} from "../../runtime/runner-encounter-credit-budget";
import {
  runnerRunPathCreditBudgetAfterEncounter,
  normalizeRunnerRunPathCreditBudget,
  runnerGeneralCreditsAfterCompletedPath,
} from "../../run-analysis/visible-run-credit-budget";
import { assessKnownRezzedIcePath } from "../../visible-run-analysis";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";
function capture(key: string) {
  const f = JSON.parse(
    readFileSync(
      new URL(
        "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta552-shock-run-credit-continuation.json",
        import.meta.url,
      ),
      "utf8",
    ),
  ).states[key] as {
    input: AiDecisionInputWithDeckCapabilities;
    runtime: AiRuntimeCheckpointV1;
    validation: Record<string, boolean>;
  };
  return { ...f, input: { ...f.input, ...buildAiDecisionInputDto(f.input) } };
}
describe("native paid Shock.r mitigation retains its future run pool", () => {
  beforeEach(resetResidentPlanPortfolioMemory);
  it.each(["direct", "afterPump"])(
    "breaks the lock before the funded inner ICE in %s",
    (key) => {
      const f = capture(key),
        i = f.input;
      expect(Object.keys(f.validation)).toHaveLength(9);
      expect(Object.values(f.validation).every(Boolean)).toBe(true);
      const before = JSON.stringify({
        view: i.playerView,
        actions: i.legalActions,
        events: i.eventTail,
      });
      const a = i.legalActions.find((a) => a.type === "break_subroutine")!;
      expect(a).toBeDefined();
      restoreAiRuntimeCheckpoint(
        i,
        i.ownDeckSnapshot!.deckSnapshotId,
        f.runtime,
      );
      const d = chooseAiAction(i);
      expect(d.actionId).toBe(a.actionId);
      expect(d.fallbackUsed).toBe(false);
      expect(d.timeoutUsed).toBe(false);
      const p = d.decisionDebug!.planFirstDecision!;
      expect(p.rootPlanInstanceId).toBe(
        "plan:runner.pressure_central:central%3Ard",
      );
      expect(p.selectedPlan!.moduleId).toBe("runner.convert_run_window");
      expect(p.route).toMatchObject({
        actionId: a.actionId,
        stateVersion: i.playerView.stateVersion,
        planInstanceId: p.leafExecutorInstanceId,
      });
      expect(p.selectedStep!.planInstanceId).toBe(p.leafExecutorInstanceId);
      const payment = runnerEncounterPaymentForAction(i, a);
      expect(payment).toMatchObject({
        affordable: true,
        cashCost: 0,
        creditsAfterPayment: 3,
      });
      expect(payment.budget.runOnlyCredits).toBe(
        (key === "direct" ? 9 : 8) - payment.totalCost,
      );
      expect(
        JSON.stringify({
          view: i.playerView,
          actions: i.legalActions,
          events: i.eventTail,
        }),
      ).toBe(before);
    },
  );
});

describe("explicit encounter to path credit boundary", () => {
  it.each(["direct", "afterPump"])(
    "finances the inner path without making run money Trace eligible: %s",
    (key) => {
      const { input: i } = capture(key),
        a = i.legalActions.find((a) => a.type === "break_subroutine")!,
        payment = runnerEncounterPaymentForAction(i, a),
        pathBudget = runnerRunPathCreditBudgetAfterEncounter(payment.budget);
      expect(pathBudget).not.toHaveProperty("runOnlyCredits");
      expect(pathBudget).toMatchObject({
        credits: 3 + payment.budget.runOnlyCredits,
        traceEligibleCredits: 3,
      });
      const server = i.playerView.servers.find((s) => s.id === "rd")!;
      const path = assessKnownRezzedIcePath(
        server.ice.slice(0, 2),
        i.playerView.own.rig ?? [],
        pathBudget,
        server.root,
        i.playerView.opponent.credits,
      );
      expect(path.canReachAccess).toBe(true);
      expect(path.creditBudgetAfterPath).toMatchObject({
        credits: key === "direct" ? 6 : 5,
        traceEligibleCredits: 3,
      });
    },
  );
  it("rejects an unconverted encounter budget instead of silently dropping its pool", () => {
    const budget = runnerEncounterCreditBudgetForInput(capture("direct").input);
    expect(() => {
      // @ts-expect-error Encounter cash and path total credits have different units.
      return normalizeRunnerRunPathCreditBudget(budget);
    }).toThrow("encounter_budget_requires_run_path_projection");
  });
  it("fails closed when the two current pools overflow the integer ledger", () => {
    expect(() =>
      runnerRunPathCreditBudgetAfterEncounter({
        credits: Number.MAX_SAFE_INTEGER,
        runOnlyCredits: 1,
      }),
    ).toThrow("encounter_path_projection_invalid_credit_pool");
  });
});

it("retains only actual general cash after a later Trace payment", () => {
  const t = JSON.parse(
    readFileSync(
      new URL(
        "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta552-trace-eligible-run-credits.json",
        import.meta.url,
      ),
      "utf8",
    ),
  ).states.start.input as AiDecisionInputWithDeckCapabilities;
  const ice = t.playerView.servers.find((s) => s.id === "hq")!.ice;
  const path = assessKnownRezzedIcePath(
    ice,
    [],
    { credits: 15, traceEligibleCredits: 7 },
    [],
    0,
  );
  expect(path.canReachAccess).toBe(true);
  expect(path.creditBudgetAfterPath).toMatchObject({
    credits: 9,
    traceEligibleCredits: 1,
  });
  expect(
    runnerGeneralCreditsAfterCompletedPath(path.creditBudgetAfterPath),
  ).toBe(1);
});
it("rejects a completed path without its actual general ledger", () => {
  expect(() => runnerGeneralCreditsAfterCompletedPath({ credits: 9 })).toThrow(
    "completed_path_missing_valid_general_credit_ledger",
  );
});
